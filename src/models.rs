// In main.rs o in un modulo dedicato (es. models.rs o DTOs.rs)

use chrono::{ NaiveDateTime}; // Per gestire e formattare le date
use rocket::serde::{Serialize}; // Serialize per la risposta

// Struct per i dati letti dalla query al database
#[derive(sqlx::FromRow, Debug)] // FromRow per sqlx, Debug per la stampa
pub struct PrenotazioneDb {
    pub Id_Prenotazione: i32,
    pub Data_Inizio: NaiveDateTime,
    pub Data_Fine:NaiveDateTime,
    pub Tipo_Aula: String,
    pub Numero_Aula: i32,
    pub Nome_Professore: Option<String>,
    pub Cognome_Professore: String,
}

// Struct per la risposta API, che corrisponde a ciò che FullCalendar si aspetta
#[derive(Serialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct CalendarEventApi {
    pub(crate) id: String,
    pub(crate) title: String,
    pub(crate) start: String,
    pub(crate) end: String,
    pub(crate) allDay: bool,
    // Puoi aggiungere altri campi come backgroundColor, borderColor se vuoi
}