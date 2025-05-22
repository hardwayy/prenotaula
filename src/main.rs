mod models;
#[macro_use]
extern crate rocket;
use rocket::fs::{FileServer, NamedFile};
use std::path::{Path, PathBuf};
use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHasher, SaltString
    },
    Argon2
};
use chrono_tz::Europe::Rome;
use rocket::State;
use rocket::serde::json::{Json, Value as JsonValue, json}; // json! macro per risposte d'errore
use rocket::serde::{Deserialize, Serialize}; // Rocket riesporta Serialize/Deserialize da Serde
use sqlx::mysql::MySqlPool; // O MySqlPoolOptions, se configuri il pool manualmente
use argon2::{password_hash::{
    PasswordHash, PasswordVerifier // SaltString e PasswordHasher sarebbero per generare l'hash
},};
use jsonwebtoken::{encode, Header, EncodingKey}; // decode e DecodingKey sarebbero per verificare i token
use chrono::{Utc, Duration, DateTime, TimeZone}; // Per gestire le date e le scadenze dei token
#[derive(serde::Serialize)]
#[serde(crate = "rocket::serde")]
struct ApiResponse {
    message: String,
}
#[get("/hello")]
fn hello_api() -> rocket::serde::json::Json<ApiResponse> {
    rocket::serde::json::Json(ApiResponse {
        message: "Ciao dal backend Rocket!".to_string(),
    })
}
fn configure_cors() -> rocket_cors::Cors {
    let allowed_origins = rocket_cors::AllowedOrigins::some_regex(&[
        r"^http://localhost:[\d]+$",
        r"^http://127.0.0.1:[\d]+$"
    ]);
    rocket_cors::CorsOptions {
        allowed_origins,
        allow_credentials: true,
        ..Default::default()
    }
        .to_cors()
        .expect("Errore nella creazione della configurazione CORS.")
}

#[derive(Debug, Deserialize)]
#[serde(crate = "rocket::serde")]
struct LoginCredentials<'r> {
    email: &'r str,
    password: &'r str,
}
#[get("/prenotazioni")]
async fn get_prenotazioni(
    db_pool: &State<MySqlPool>
) -> Result<Json<Vec<models::CalendarEventApi>>, Json<JsonValue>> {

    // FullCalendar potrebbe inviare parametri start e end per filtrare la vista corrente.
    // Per ora, recuperiamo tutte le prenotazioni.
    // TODO: In futuro, potresti voler accettare parametri query ?start=...&end=...
    //       per caricare solo gli eventi visibili nel range del calendario.

    let query_result = sqlx::query_as!(
        models::PrenotazioneDb, // La struct che mappa il risultato della query
        r#"
        SELECT
            p.Id_Prenotazione,
            p.Data_Inizio,
            p.Data_Fine,
            a.Tipo_Aula,
            a.Numero AS Numero_Aula,
            pr.Nome AS Nome_Professore,
            pr.Cognome AS Cognome_Professore
        FROM
            prenotazione p
        JOIN
            aula a ON p.Id_Aula = a.Id_Aula
        JOIN
            professore pr ON p.Id_Professore = pr.Id_Professore
        ORDER BY p.Data_Inizio ASC
        "#
        // Se avessi parametri: , start_date_param, end_date_param
    )
        .fetch_all(db_pool.inner())
        .await;

    match query_result {
        Ok(prenotazioni_db) => {
            let calendar_events: Vec<models::CalendarEventApi> = prenotazioni_db
                .into_iter()
                .map(|p_db| {
                    // Costruisci il titolo dell'evento
                    let nome_aula_completo = format!("Aula {} {:02}", p_db.Tipo_Aula, p_db.Numero_Aula); // Es. "Aula A 01"
                    let nome_prof_completo = format!("{} {}",
                                                     p_db.Nome_Professore.as_deref().unwrap_or("N/D"), // Gestisce Nome NULL
                                                     p_db.Cognome_Professore
                    );
                    let local_data_inizio = Rome.from_local_datetime(&p_db.Data_Inizio).unwrap();
                    let local_data_fine = Rome.from_local_datetime(&p_db.Data_Fine).unwrap();
                    // .unwrap() qui è per semplicità; in produzione dovresti gestire il caso ambiguo o non esistente.

                    // PASSO 2: Converti l'orario locale in UTC
                    let data_inizio_utc: DateTime<Utc> = local_data_inizio.with_timezone(&Utc);
                    let data_fine_utc: DateTime<Utc> = local_data_fine.with_timezone(&Utc);
                    models::CalendarEventApi {
                        id: p_db.Id_Prenotazione.to_string(),
                        title: format!("{} - {}", nome_aula_completo, nome_prof_completo),
                        // Formatta le date in stringhe ISO 8601
                        // DateTime<Utc>.to_rfc3339() produce il formato corretto con 'Z' per UTC.
                        // Se sqlx restituisce NaiveDateTime, converti prima a DateTime<Utc>.
                        // Esempio se p_db.Data_Inizio è NaiveDateTime:
                        start: data_inizio_utc.to_rfc3339_opts(chrono::SecondsFormat::Secs, true), // Invia UTC con 'Z'
                        end: data_fine_utc.to_rfc3339_opts(chrono::SecondsFormat::Secs, true),   // Invia UTC con 'Z'

                        allDay: false, // Assumiamo che le tue prenotazioni abbiano sempre un orario.
                        // Potresti derivarlo se Data_Inizio e Data_Fine coprono un giorno intero
                        // o se hai un campo specifico nel DB.
                    }
                })
                .collect();

            Ok(Json(calendar_events))
        }
        Err(e) => {
            eprintln!("Errore nel recuperare le prenotazioni dal DB: {}", e);
            Err(Json(json!({ "status": "errore", "message": "Impossibile caricare le prenotazioni." })))
        }
    }
}
#[derive(Debug, Serialize)]
#[serde(crate = "rocket::serde")]
struct LoginSuccessResponse {
    message: String,
    token: String,
    user_id: i32, // Assumendo che Id_Professore sia i32
    user_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(crate = "rocket::serde")]
struct Claims {
    sub: String, // Subject (Id_Professore come stringa)
    name: String,
    exp: usize,  // Expiration timestamp (secondi da epoch)
}

// Ora la tua funzione login_professore:

#[post("/auth/login", format = "json", data = "<login_attempt>")] // Rinominato data per chiarezza
async fn login_professore(
    db_pool: &State<MySqlPool>,
    login_attempt: Json<LoginCredentials<'_>>,
) -> Result<Json<LoginSuccessResponse>, Json<JsonValue>> { // Usiamo JsonValue per errori JSON

    // 1. Cerca le credenziali basate sull'email nella tabella Credenziali
    let cred_record = match sqlx::query!(
        "SELECT Id_Professore_Cred, password_hash FROM Credenziali WHERE email = ?",
        login_attempt.email
    )
        .fetch_optional(db_pool.inner()) // db_pool.inner() per accedere al pool
        .await
    {
        Ok(Some(record)) => record,
        Ok(None) => {
            // Email non trovata nella tabella Credenziali
            // Per sicurezza, restituisci un messaggio generico
            return Err(Json(json!({ "status": "fallito", "message": "Email o password non corretta." })));
        }
        Err(e) => {
            eprintln!("Errore database durante la ricerca delle credenziali: {}", e);
            return Err(Json(json!({ "status": "errore", "message": "Errore interno del server." })));
        }
    };

    // 2. Verifica la password fornita contro l'hash memorizzato
    let is_password_valid = match PasswordHash::new(&cred_record.password_hash) {
        Ok(parsed_hash) => Argon2::default()
            .verify_password(login_attempt.password.as_bytes(), &parsed_hash)
            .is_ok(),
        Err(_) => {
            // L'hash memorizzato non è valido (problema di sicurezza o corruzione dati)
            eprintln!("Hash password corrotto o non valido per l'email: {}", login_attempt.email);
            false // Tratta come password non valida per sicurezza
        }
    };

    if !is_password_valid {
        // Password errata
        return Err(Json(json!({ "status": "fallito", "message": "Email o password non corretta." })));
    }

    // 3. Password corretta. Ora recupera Nome e Cognome dalla tabella Professore
    //    usando Id_Professore_Cred (che è l'Id_Professore)
    let professor_id = cred_record.Id_Professore_Cred;

    let professor_details = match sqlx::query!(
        "SELECT Nome, Cognome FROM Professore WHERE Id_Professore = ?",
        professor_id
    )
        .fetch_one(db_pool.inner()) // Ci aspettiamo che esista sempre se le credenziali esistono
        .await
    {
        Ok(record) => record,
        Err(e) => {
            // Questo sarebbe strano se le credenziali esistono ma il professore no (violazione FK?)
            // O un errore di connessione
            eprintln!("Errore database nel recuperare i dettagli del professore (ID: {}): {}", professor_id, e);
            return Err(Json(json!({ "status": "errore", "message": "Errore interno del server (dati utente)." })));
        }
    };

    let nome_completo = format!("{:?} {:?}", professor_details.Nome, professor_details.Cognome);

    // 4. Genera il token JWT
    let now = Utc::now();
    let expiration = now + Duration::days(7); // Token valido per 7 giorni (o la durata che preferisci)

    let claims = Claims {
        sub: professor_id.to_string(), // Id_Professore come stringa nel subject del token
        name: nome_completo.clone(),   // Nome completo per comodità (es. da mostrare nel frontend)
        exp: expiration.timestamp() as usize,
    };

    // ATTENZIONE: Carica la tua chiave segreta JWT da una variabile d'ambiente o file di config!
    // NON hardcodarla qui per produzione.
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "LA_TUA_CHIAVE_SEGRETA_DEFAULT_PER_SVILUPPO_MOLTO_LUNGA_E_SICURA".to_string());

    let token = match encode(&Header::default(), &claims, &EncodingKey::from_secret(jwt_secret.as_ref())) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Errore nella generazione del token JWT: {}", e);
            return Err(Json(json!({ "status": "errore", "message": "Errore interno del server (generazione token)." })));
        }
    };

    // 5. Restituisci la risposta di successo con il token e i dati dell'utente
    Ok(Json(LoginSuccessResponse {
        message: "Login effettuato con successo!".to_string(),
        token,
        user_id: professor_id,
        user_name: nome_completo,
    }))
}
#[get("/<path..>", rank = 10)] // Manteniamo il rank per coerenza con la catch-all
async fn frontend_catch_all(path: PathBuf) -> Option<NamedFile> {
    println!("Catch-all (NamedFile) per path: {:?}", path); // Opzionale, per vedere cosa cattura e usare 'path'
    // Assicurati che questo percorso sia corretto!
    NamedFile::open(Path::new("frontend/dist/index.html")).await.ok()
}
#[launch]
async fn rocket() -> _ { // Aggiunto async perché MySqlPool::connect è async
    // 1. Definisci il tuo DATABASE_URL
    //    È meglio caricarlo da variabili d'ambiente o da un file .env per sicurezza
    let password_da_hashare = "ciao"; // La tua password
    let password_bytes = password_da_hashare.as_bytes();

    // Genera un sale casuale
    let salt = SaltString::generate(&mut OsRng);

    // Crea un'istanza di Argon2 con i parametri di default
    let argon2 = Argon2::default();

    // Hasha la password
    match argon2.hash_password(password_bytes, &salt) {
        Ok(password_hash_object) => {
            let password_hash_string = password_hash_object.to_string();
            println!("Password originale: {}", password_da_hashare);
            println!("Hash da memorizzare nel database: {}", password_hash_string);
            // Esempio di output: Hash da memorizzare nel database: $argon2id$v=19$m=65536,t=3,p=4$tuo_sale_generato$tuo_hash_generato
        }
        Err(e) => {
            eprintln!("Errore durante l'hashing della password: {}", e);
        }
    }
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| {
            // Fornisci un URL di default per lo sviluppo se vuoi, ma avvisa
            println!("ATTENZIONE: DATABASE_URL non impostata, uso default per sviluppo!");
            "mysql://admin:admin@localhost:3306/planner".to_string()
        });

    // 2. Crea il pool di connessioni SQLx
    let db_pool = match MySqlPool::connect(&database_url).await {
        Ok(pool) => {
            println!("✅ Connessione al database stabilita con successo!");
            pool
        }
        Err(e) => {
            eprintln!("❌ Impossibile connettersi al database: {:?}", e);
            // In un'applicazione reale, potresti voler terminare o gestire l'errore diversamente
            // Per ora, terminiamo se non possiamo connetterci.
            std::process::exit(1);
        }
    };

    // La funzione configure_cors() deve essere definita come nelle risposte precedenti
    // o il fairing CORS creato direttamente qui.
    let cors = rocket_cors::CorsOptions::default()
        .allowed_origins(rocket_cors::AllowedOrigins::some_regex(&[
            r"^http://localhost:[\d]+$",
            r"^http://127.0.0.1:[\d]+$"
        ]))
        .allow_credentials(true)
        .to_cors()
        .expect("Errore nella creazione della configurazione CORS.");

    println!("🚀 Avvio del server Rocket...");
    println!("Le API saranno disponibili sotto /api");
    println!("Il frontend (in produzione) sarà servito dalla root /");
    println!("Assicurati di aver eseguito 'npm run build' nella cartella 'frontend'");
    println!("E che la build del frontend sia in 'frontend/dist/' relativa alla CWD del backend");


    rocket::build()
        .manage(db_pool) // <--- ECCO IL PASSAGGIO FONDAMENTALE!
        .attach(cors)
        .mount("/api", routes![
            hello_api, // Assicurati che questa route sia definita
            login_professore, // E anche questa, e che ora possa usare &State<MySqlPool>
            get_prenotazioni
        ])
        .mount("/", FileServer::from("frontend/dist").rank(5)) // Assicurati che il percorso sia corretto
        .mount("/", routes![frontend_catch_all]) // Assicurati che questa route sia definita
}