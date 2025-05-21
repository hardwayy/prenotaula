import React, {useState, type FormEvent, type JSX} from 'react';
import axios, { AxiosError } from 'axios'; // Importa AxiosError per una migliore gestione degli errori
// Se usi React Router per il redirect, importa useNavigate
// @ts-ignore
import {useNavigate} from 'react-router-dom';

// Interfaccia per la risposta di successo dal backend
interface LoginSuccessData {
    message: string;
    token: string;
    user_id: number; // o string, a seconda del tipo del tuo Id_Professore
    user_name: string;
}

// Interfaccia per la risposta di errore dal backend (struttura comune)
interface ApiErrorData {
    status: string;
    message: string;
}

// Stili (puoi metterli in un file .css o .module.css separato e importarli)
const styles: { [key: string]: React.CSSProperties } = { // Tipizzazione per l'oggetto styles
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', fontFamily: 'Arial, sans-serif', padding: '20px' },
    form: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '400px' },
    title: { marginBottom: '20px', color: '#333', textAlign: 'center' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', color: '#555', fontWeight: 'bold' },
    input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
    button: { padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
    errorMessage: { color: 'red', marginBottom: '15px', textAlign: 'center' },
    successMessage: { color: 'green', marginBottom: '15px', textAlign: 'center' }
};

function LoginPage(): JSX.Element {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const navigate = useNavigate(); // Per React Router v6+
    const navigate = useNavigate();
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const loginUrl = 'http://localhost:8000/api/auth/login'; // Assicurati che porta e URL siano corretti

            // Specifichiamo i tipi per la richiesta e la risposta attesa
            const response = await axios.post<LoginSuccessData>(loginUrl, {
                email: email,
                password: password,
            });

            console.log('Risposta dal server:', response.data);
            setSuccessMessage(response.data.message || 'Login effettuato con successo!');
            setIsLoading(false);

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('userName', response.data.user_name); // SALVA L'USERNAME
                localStorage.setItem('userId', response.data.user_id.toString()); // SALVA ANCHE L'ID UTENTE

                alert(`Login Riuscito! Benvenuto ${response.data.user_name}. Token ricevuto. Ora saresti reindirizzato.`);
                navigate(`/home`);
            }

        } catch (err) {
            console.error('Errore di login:', err);
            setIsLoading(false);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<ApiErrorData>; // Type assertion
                if (axiosError.response && axiosError.response.data) {
                    setError(axiosError.response.data.message || 'Errore durante il login. Riprova.');
                } else {
                    setError('Errore di connessione o risposta non valida dal server.');
                }
            } else {
                setError('Si è verificato un errore imprevisto.');
            }
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Login Professore</h2>
                {error && <p style={styles.errorMessage}>{error}</p>}
                {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

                <div style={styles.inputGroup}>
                    <label htmlFor="email" style={styles.label}>Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                        style={styles.input}
                        disabled={isLoading}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="password" style={styles.label}>Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        style={styles.input}
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" style={styles.button} disabled={isLoading}>
                    {isLoading ? 'Login in corso...' : 'Login'}
                </button>
            </form>
        </div>
    );
}

export default LoginPage;