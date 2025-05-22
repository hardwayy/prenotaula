// frontend/src/components/RegistrationPage.tsx
import React, {useState, useEffect, type FormEvent, type JSX} from 'react';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

interface MateriaOption {
    idMateria: number; // Deve corrispondere al JSON inviato dal backend (MateriaApi.id_materia)
    nomeMateria: string; // Deve corrispondere a MateriaApi.nome_materia
}

// Interfaccia per la risposta di errore/successo generica dal backend
interface ApiResponse {
    status: string;
    message: string;
    id_professore?: number; // Opzionale, in caso di successo nella registrazione
}

const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px', paddingBottom: '50px', minHeight: '90vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4' },
    form: { backgroundColor: '#fff', padding: '30px 40px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '650px' }, // Aumentata maxWidth
    title: { textAlign: 'center', marginBottom: '25px', color: '#333', fontSize: '1.8em' },
    inputGroup: { marginBottom: '18px' },
    label: { display: 'block', marginBottom: '6px', fontWeight: '500', color: '#555' },
    input: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '1em' },
    materieContainer: {
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        marginBottom: '20px',
        display: 'grid', // Usiamo grid per le checkbox
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // Colonne responsive
        gap: '10px',
    },
    materiaCheckboxLabel: {
        display: 'flex',
        alignItems: 'center',
        padding: '5px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    materiaCheckboxInput: { marginRight: '10px', cursor: 'pointer', transform: 'scale(1.2)' },
    button: { width: '100%', padding: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1.1em', marginTop: '10px', transition: 'background-color 0.3s' },
    errorMessage: { color: 'red', textAlign: 'center', marginBottom: '15px', minHeight: '1.2em' }, // Aggiunto minHeight
    successMessage: { color: 'green', textAlign: 'center', marginBottom: '15px' },
};

function RegistrationPage(): JSX.Element {
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confermaPassword, setConfermaPassword] = useState('');
    const [materieDisponibili, setMaterieDisponibili] = useState<MateriaOption[]>([]);
    const [materieSelezionate, setMaterieSelezionate] = useState<number[]>([]); // Array di Id_Materia

    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    // Carica le materie al mount del componente
    useEffect(() => {
        const fetchMaterie = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get<MateriaOption[]>('http://localhost:8000/api/materie');
                setMaterieDisponibili(response.data || []);
            } catch (err) {
                console.error("Errore nel caricare le materie:", err);
                setError("Impossibile caricare l'elenco delle materie.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchMaterie();
    }, []);

    const handleMateriaChange = (materiaId: number) => {
        setMaterieSelezionate(prevSelected =>
            prevSelected.includes(materiaId)
                ? prevSelected.filter(id => id !== materiaId)
                : [...prevSelected, materiaId]
        );
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confermaPassword) {
            setError("Le password non coincidono.");
            return;
        }
        if (materieSelezionate.length === 0) {
            setError("Seleziona almeno una materia insegnata.");
            return;
        }
        if (password.length < 8) { // Esempio di validazione password
            setError("La password deve essere di almeno 8 caratteri.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                nome,
                cognome,
                email,
                password,
                materie_ids: materieSelezionate,
            };

            const response = await axios.post<ApiResponse>('http://localhost:8000/api/auth/register', payload);

            setIsLoading(false);
            setSuccessMessage(response.data.message || "Registrazione avvenuta con successo! Sarai reindirizzato al login.");

            // Svuota il form
            setNome('');
            setCognome('');
            setEmail('');
            setPassword('');
            setConfermaPassword('');
            setMaterieSelezionate([]);

            setTimeout(() => {
                navigate('/login');
            }, 2500); // Reindirizza dopo 2.5 secondi

        } catch (err) {
            setIsLoading(false);
            console.error('Errore di registrazione:', err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<ApiResponse>; // Usa ApiResponse per il tipo di errore
                setError(axiosError.response?.data?.message || "Errore durante la registrazione. Riprova.");
            } else {
                setError('Si è verificato un errore imprevisto durante la registrazione.');
            }
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.title}>Registrazione Nuovo Professore</h2>
                {error && <p style={styles.errorMessage}>{error}</p>}
                {successMessage && <p style={styles.successMessage}>{successMessage}</p>}

                <div style={styles.inputGroup}>
                    <label htmlFor="nome" style={styles.label}>Nome:</label>
                    <input type="text" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required style={styles.input} disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="cognome" style={styles.label}>Cognome:</label>
                    <input type="text" id="cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} required style={styles.input} disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="email" style={styles.label}>Email (per il login):</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="password" style={styles.label}>Password:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={styles.input} disabled={isLoading} />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="confermaPassword" style={styles.label}>Conferma Password:</label>
                    <input type="password" id="confermaPassword" value={confermaPassword} onChange={(e) => setConfermaPassword(e.target.value)} required style={styles.input} disabled={isLoading} />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Materie Insegnate (seleziona una o più):</label>
                    {materieDisponibili.length === 0 && !isLoading && <p>Nessuna materia disponibile o errore nel caricamento.</p>}
                    <div style={styles.materieContainer}>
                        {materieDisponibili.map(materia => (
                            <label key={materia.idMateria} style={styles.materiaCheckboxLabel}
                                   onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                                   onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                                <input
                                    type="checkbox"
                                    style={styles.materiaCheckboxInput}
                                    checked={materieSelezionate.includes(materia.idMateria)}
                                    onChange={() => handleMateriaChange(materia.idMateria)}
                                    disabled={isLoading}
                                />
                                {materia.nomeMateria}
                            </label>
                        ))}
                    </div>
                </div>

                <button type="submit" style={styles.button} disabled={isLoading}>
                    {isLoading ? 'Registrazione in corso...' : 'Registra Professore'}
                </button>
            </form>
        </div>
    );
}

export default RegistrationPage;