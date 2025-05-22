// frontend/src/components/BookingFormModal.tsx
import React, { useState, useEffect, useMemo, type FormEvent } from 'react'; // Rimosso 'type JSX' se non strettamente necessario
// @ts-ignore
import axios, { AxiosError } from 'axios';
// @ts-ignore // Ricorda di investigare questo @ts-ignore
import { MODULI_ORARI, type ModuloOrario } from './utils/orariScolastici';

// @ts-ignore
interface ApiErrorData { status: string; message: string; }
interface AulaInfo { Id_Aula: number; Numero: number; Tipo_Aula: string; }

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookingCreated: () => void;
    initialDate: Date | null;
}

const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, overflowY: 'auto', padding: '20px 0' },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative', margin: 'auto' },
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#888' },
    inputGroup: { marginBottom: '18px' }, // Leggermente aggiustato
    label: { display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9em', color: '#333' }, // Aggiustato
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.95em' },
    select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white', fontSize: '0.95em' },
    button: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', marginRight: '10px' },
    cancelButton: { backgroundColor: '#6c757d' },
    errorMessage: { color: 'red', marginTop: '10px', fontSize: '0.85em', textAlign: 'center' },
    // Stili per l'interruttore (toggle switch)
    switchContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between', // Per spaziare le etichette
        marginBottom: '20px',
        padding: '5px 0',
    },
    switchLabel: {
        // marginRight: '10px', // Non più necessario se usiamo space-between
        fontSize: '0.95em',
        color: '#555',
        cursor: 'pointer', // Rende l'etichetta cliccabile per il toggle
    },
    switch: { // Questo è il <label> che avvolge il checkbox e lo slider
        position: 'relative',
        display: 'inline-block',
        width: '50px', // Ridotto leggermente
        height: '28px', // Ridotto leggermente
    },
    switchInput: {
        opacity: 0,
        width: 0,
        height: 0,
    },
    slider: { // Lo sfondo dell'interruttore
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ccc',
        transition: '.3s',
        borderRadius: '28px',
    },
    sliderBefore: { // Il pallino dell'interruttore
        position: 'absolute',
        content: '""', // Necessario per ::before in CSS puro, ma qui è uno span
        height: '20px', // Ridotto
        width: '20px',  // Ridotto
        left: '4px',
        bottom: '4px',
        backgroundColor: 'white',
        transition: '.3s',
        borderRadius: '50%',
    },
};

// @ts-ignore
const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onBookingCreated, initialDate }) => {
    const [tipoAula, setTipoAula] = useState<string>('A');
    const [idAulaSelezionata, setIdAulaSelezionata] = useState<string>('');
    const [auleDisponibili, setAuleDisponibili] = useState<AulaInfo[]>([]);

    const formatDateForDateInput = (date: Date | null): string => {
        if (!date) return new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    const [giornoPrenotazione, setGiornoPrenotazione] = useState<string>(formatDateForDateInput(initialDate));
    const [moduloInizioId, setModuloInizioId] = useState<string>(MODULI_ORARI[0]?.id || '');

    type MetodoFine = 'moduloFine' | 'durataModuli';
    const [metodoFine, setMetodoFine] = useState<MetodoFine>('moduloFine');
    const [moduloFineId, setModuloFineId] = useState<string>(MODULI_ORARI[0]?.id || '');
    const [durataModuli, setDurataModuli] = useState<number>(1);

    const [error, setError] = useState<string>('');
    // @ts-ignore
    const [isLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!isOpen || !tipoAula) {
            setAuleDisponibili([]);
            setIdAulaSelezionata('');
            return;
        }
        const fetchAule = async () => {
            try {
                const response = await axios.get<AulaInfo[]>(`http://localhost:8000/api/aulas?tipo=${tipoAula}`);
                const auleFiltrate = response.data; // Assumendo che l'API filtri o restituisca un array
                setAuleDisponibili(Array.isArray(auleFiltrate) ? auleFiltrate : []); // Fallback a array vuoto
                if (Array.isArray(auleFiltrate) && auleFiltrate.length > 0) {
                    setIdAulaSelezionata(auleFiltrate[0].Id_Aula.toString());
                } else {
                    setIdAulaSelezionata('');
                }
            } catch (err) {
                console.error("Errore nel caricare le aule:", err);
                setError("Impossibile caricare l'elenco delle aule.");
                setAuleDisponibili([]); // Resetta in caso di errore
            }
        };
        fetchAule();
    }, [isOpen, tipoAula]);

    useEffect(() => {
        setGiornoPrenotazione(formatDateForDateInput(initialDate));
        if (MODULI_ORARI.length > 0) { // Verifica che MODULI_ORARI non sia vuoto
            setModuloInizioId(MODULI_ORARI[0].id);
            setModuloFineId(MODULI_ORARI[0].id);
        }
        setDurataModuli(1);
    }, [initialDate]);

    // @ts-ignore
    const { dataInizioISO, dataFineISO, isValidSelection, validationMessage } = useMemo(() => {
        if (!giornoPrenotazione || !moduloInizioId) return { dataInizioISO: '', dataFineISO: '', isValidSelection: false, validationMessage: "Seleziona giorno e modulo di inizio." };
        const moduloInizioObj = MODULI_ORARI.find((m: { id: string; }) => m.id === moduloInizioId);
        if (!moduloInizioObj) return { dataInizioISO: '', dataFineISO: '', isValidSelection: false, validationMessage: "Modulo di inizio non valido." };

        const dataInizioCompleta = new Date(`${giornoPrenotazione}T${moduloInizioObj.startTime}:00`);
        let dataFineCompleta: Date | null = null;
        let currentValidationMessage = "";
        const indexInizio = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === moduloInizioId);

        if (metodoFine === 'moduloFine') {
            const moduloFineObj = MODULI_ORARI.find((m: { id: string; }) => m.id === moduloFineId);
            if (moduloFineObj) {
                const indexFine = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === moduloFineId);
                if (indexFine < indexInizio) {
                    currentValidationMessage = "Il modulo di fine non può precedere quello di inizio.";
                } else {
                    dataFineCompleta = new Date(`${giornoPrenotazione}T${moduloFineObj.endTime}:00`);
                }
            } else { currentValidationMessage = "Seleziona un modulo di fine valido."; }
        } else {
            if (durataModuli < 1) {
                currentValidationMessage = "La durata deve essere di almeno 1 modulo.";
            } else if (indexInizio === -1 || (indexInizio + durataModuli - 1) >= MODULI_ORARI.length) { // Aggiunto check indexInizio !== -1
                currentValidationMessage = "La durata selezionata supera i moduli disponibili o l'inizio non è valido.";
            } else {
                const moduloFineCalcolato = MODULI_ORARI[indexInizio + durataModuli - 1];
                dataFineCompleta = new Date(`${giornoPrenotazione}T${moduloFineCalcolato.endTime}:00`);
            }
        }

        const currentIsValid = !!dataFineCompleta && dataFineCompleta > dataInizioCompleta && currentValidationMessage === "";
        if (!currentIsValid && currentValidationMessage === "" && dataFineCompleta && dataFineCompleta <= dataInizioCompleta) {
            currentValidationMessage = "L'orario di fine deve essere successivo all'inizio.";
        }

        return {
            dataInizioISO: dataInizioCompleta.toISOString(),
            dataFineISO: dataFineCompleta ? dataFineCompleta.toISOString() : '',
            isValidSelection: currentIsValid,
            validationMessage: currentValidationMessage
        };
    }, [giornoPrenotazione, moduloInizioId, metodoFine, moduloFineId, durataModuli]);

    // @ts-ignore
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => { /* ... come prima ... */ };

    const opzioniModuloFine = useMemo(() => {
        const indexInizio = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === moduloInizioId);
        if (indexInizio === -1) return [];
        return MODULI_ORARI.slice(indexInizio);
    }, [moduloInizioId]);

    const maxDurataModuli = useMemo(() => {
        const indexInizio = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === moduloInizioId);
        if (indexInizio === -1) return 1;
        return MODULI_ORARI.length - indexInizio;
    }, [moduloInizioId]);

    const handleMetodoFineChange = () => {
        setMetodoFine(prev => prev === 'moduloFine' ? 'durataModuli' : 'moduloFine');
    };

    if (!isOpen) return null;

    const sliderCheckedStyle: React.CSSProperties = metodoFine === 'durataModuli' ? { backgroundColor: '#007bff' } : {}; // Blu quando acceso
    const sliderBeforeCheckedStyle: React.CSSProperties = metodoFine === 'durataModuli' ? { transform: 'translateX(22px)' } : {}; // Adattato alla nuova larghezza


    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} style={modalStyles.closeButton} aria-label="Chiudi">×</button>
                <h2>Nuova Prenotazione</h2>
                {(error && <p style={modalStyles.errorMessage}>{error}</p>)}
                {(!isValidSelection && validationMessage) && <p style={modalStyles.errorMessage}>{validationMessage}</p>}

                <form onSubmit={handleSubmit}>
                    {/* Sezione e Numero Aula */}
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="tipoAula" style={modalStyles.label}>Sezione Aula:</label>
                        <select id="tipoAula" value={tipoAula} onChange={(e) => setTipoAula(e.target.value)} style={modalStyles.select} disabled={isLoading}>
                            <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="P">P</option>
                        </select>
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="numeroAula" style={modalStyles.label}>Numero Aula:</label>
                        <select id="numeroAula" value={idAulaSelezionata} onChange={(e) => setIdAulaSelezionata(e.target.value)} required style={modalStyles.select} disabled={isLoading || auleDisponibili.length === 0}>
                            <option value="" disabled>Seleziona...</option>
                            {auleDisponibili.map((aula) => (
                                <option key={aula.Id_Aula} value={aula.Id_Aula.toString()}>
                                    {String(aula.Numero).padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        {auleDisponibili.length === 0 && tipoAula && <small>Nessuna aula per {tipoAula}.</small>}
                    </div>

                    {/* Giorno Prenotazione */}
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="giornoPrenotazione" style={modalStyles.label}>Giorno:</label>
                        <input type="date" id="giornoPrenotazione" value={giornoPrenotazione} onChange={(e) => setGiornoPrenotazione(e.target.value)} required style={modalStyles.input} disabled={isLoading} />
                    </div>

                    {/* Modulo Inizio */}
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="moduloInizio" style={modalStyles.label}>Modulo Inizio:</label>
                        <select id="moduloInizio" value={moduloInizioId}
                                onChange={(e) => {
                                    setModuloInizioId(e.target.value);
                                    const currentIndexInizio = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === e.target.value);
                                    const currentIndexFine = MODULI_ORARI.findIndex((m: { id: string; }) => m.id === moduloFineId);
                                    if (currentIndexInizio > -1 && currentIndexFine < currentIndexInizio ) {
                                        setModuloFineId(MODULI_ORARI[currentIndexInizio].id);
                                    } else if (currentIndexInizio > -1 && opzioniModuloFine.length > 0 && !opzioniModuloFine.find((m: { id: string; }) => m.id === moduloFineId)) {
                                        setModuloFineId(MODULI_ORARI[currentIndexInizio].id);
                                    }
                                }}
                                required style={modalStyles.select} disabled={isLoading}>
                            {MODULI_ORARI.map((mod: ModuloOrario) =>
                                <option key={mod.id} value={mod.id}>{mod.label}</option>
                            )}
                        </select>
                    </div>

                    {/* Interruttore per Modalità Fine Prenotazione */}
                    <div style={modalStyles.inputGroup}>
                        <label style={modalStyles.label}>Definisci Fine Prenotazione Tramite:</label>
                        <div style={modalStyles.switchContainer}>
                            <span style={modalStyles.switchLabel} onClick={() => setMetodoFine('moduloFine')}>Modulo Fine</span>
                            <label style={modalStyles.switch}>
                                <input
                                    type="checkbox"
                                    style={modalStyles.switchInput}
                                    checked={metodoFine === 'durataModuli'}
                                    onChange={handleMetodoFineChange}
                                    disabled={isLoading}
                                />
                                <span style={{...modalStyles.slider, ...sliderCheckedStyle}}>
                                    <span style={{...modalStyles.sliderBefore, ...sliderBeforeCheckedStyle}}></span>
                                </span>
                            </label>
                            <span style={{...modalStyles.switchLabel, marginLeft: '10px'}} onClick={() => setMetodoFine('durataModuli')}>Durata (n. Moduli)</span>
                        </div>
                    </div>

                    {metodoFine === 'moduloFine' && (
                        <div style={modalStyles.inputGroup}>
                            <label htmlFor="moduloFine" style={modalStyles.label}>Seleziona Modulo Fine:</label>
                            <select id="moduloFine" value={moduloFineId} onChange={(e) => setModuloFineId(e.target.value)} required={metodoFine === 'moduloFine'} style={modalStyles.select} disabled={isLoading}>
                                {opzioniModuloFine.map((mod: ModuloOrario) =>
                                    <option key={mod.id} value={mod.id}>{mod.label}</option>
                                )}
                            </select>
                        </div>
                    )}

                    {metodoFine === 'durataModuli' && (
                        <div style={modalStyles.inputGroup}>
                            <label htmlFor="durataModuli" style={modalStyles.label}>Durata (numero moduli):</label>
                            <input type="number" id="durataModuli" value={durataModuli}
                                   onChange={(e) => setDurataModuli(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                   min="1" max={maxDurataModuli}
                                   required={metodoFine === 'durataModuli'}
                                   style={modalStyles.input} disabled={isLoading} />
                        </div>
                    )}

                    <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{...modalStyles.button, ...modalStyles.cancelButton}} disabled={isLoading}>Annulla</button>
                        <button type="submit" style={modalStyles.button} disabled={isLoading || !isValidSelection}>
                            {isLoading ? 'Salvataggio...' : 'Salva Prenotazione'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingFormModal;