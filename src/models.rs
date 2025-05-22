// In main.rs o in un modulo dedicato (es. models.rs o DTOs.rs)

use chrono::{ NaiveDateTime}; // Per gestire e formattare le date
use rocket::serde::{Serialize};
use serde::Deserialize;
use sqlx::FromRow;
// Serialize per la risposta

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
#[derive(Deserialize, Debug)]
#[serde(crate = "rocket::serde")]
pub struct NuovaPrenotazionePayload {
    #[serde(rename = "Id_Professore")] // Per matchare il case del JSON dal frontend
    pub(crate) id_professore: i32,
    #[serde(rename = "Id_Aula")]
    pub(crate) id_aula: i32,
    #[serde(rename = "Data_Inizio")]
    pub(crate) data_inizio: String, // Riceviamo come stringa ISO 8601 dal frontend
    #[serde(rename = "Data_Fine")]
    pub(crate) data_fine: String,   // Riceviamo come stringa ISO 8601 dal frontend
}
#[derive(Serialize, FromRow, Debug)] // FromRow per sqlx, Serialize per la risposta JSON
#[serde(crate = "rocket::serde")]
pub struct AulaApi { // Nome diverso da Aula del DB se i campi sono diversi
    #[sqlx(rename = "Id_Aula")] // Se il nome della colonna nel DB è Id_Aula
    pub Id_Aula: i32,           // Corrisponde a AulaInfo.Id_Aula nel frontend
    #[sqlx(rename = "Tipo_Aula")]
    pub Tipo_Aula: String,      // Corrisponde a AulaInfo.Tipo_Aula
    #[sqlx(rename = "Numero")]
    pub Numero: i32,            // Corrisponde a AulaInfo.Numero
    // Aggiungi qui il campo Nome_Aula se lo hai aggiunto alla tabella Aula
    // pub Nome_Aula: Option<String>, // Esempio
}