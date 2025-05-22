// src/auth_utils.rs
use argon2::{
    password_hash::{
        rand_core::OsRng, // Per generare il sale
        PasswordHasher, SaltString
    },
    Argon2
};

// Funzione per hashare la password
pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng); // Genera un sale unico per ogni password
    let argon2 = Argon2::default(); // Usa i parametri di default di Argon2 (generalmente sicuri)

    // Hasha la password e restituisci la stringa dell'hash (che include algoritmo, sale, parametri e hash)
    Ok(argon2.hash_password(password.as_bytes(), &salt)?.to_string())
}