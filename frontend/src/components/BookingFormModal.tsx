// frontend/src/components/BookingFormModal.tsx
import React, { useState, useEffect, useMemo, type FormEvent } from 'react'; // Aggiunto useMemo
import axios, { AxiosError } from 'axios';
// @ts-ignore
import { MODULI_ORARI, type ModuloOrario } from './utils/orariScolastici'; // Importa i moduli

interface ApiErrorData { status: string; message: string; }
interface AulaInfo { Id_Aula: number; Numero: number; Tipo_Aula: string; }

interface BookingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookingCreated: () => void;
    initialDate: Date | null;
}

const modalStyles: { [key: string]: React.CSSProperties } = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, overflowY: 'auto', padding: '20px 0' }, // Aggiunto overflowY e padding
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative', margin: 'auto' }, // Aggiunto margin auto
    closeButton: { position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '1.5em', cursor: 'pointer' },
    inputGroup: { marginBottom: '15px' },
    label: { display: 'block', marginBottom: '5px', fontWeight: '500' },
    input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: 'white' },
    button: { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em', marginRight: '10px' },
    cancelButton: { backgroundColor: '#6c757d' },
    errorMessage: { color: 'red', marginTop: '10px', fontSize: '0.9em' }, // Ridotto font size
    radioGroup: { display: 'flex', gap: '15px', marginBottom: '10px' } // Per i radio button
};

const BookingFormModal: React.FC<BookingFormModalProps> = ({ isOpen, onClose, onBookingCreated, initialDate }) => {
    const [tipoAula, setTipoAula] = useState<string>('A');
    const [idAulaSelezionata, setIdAulaSelezionata] = useState<string>('');
    const [auleDisponibili, setAuleDisponibili] = useState<AulaInfo[]>([]);

    const formatDateForDateInput = (date: Date | null): string => {
        if (!date) return new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]; // Default a oggi se null
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    const [giornoPrenotazione, setGiornoPrenotazione] = useState<string>(formatDateForDateInput(initialDate));
    const [moduloInizioId, setModuloInizioId] = useState<string>(MODULI_ORARI[0].id);

    type MetodoFine = 'moduloFine' | 'durataModuli';
    const [metodoFine, setMetodoFine] = useState<MetodoFine>('moduloFine');
    const [moduloFineId, setModuloFineId] = useState<string>(MODULI_ORARI[0].id);
    const [durataModuli, setDurataModuli] = useState<number>(1);

    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!isOpen || !tipoAula) {
            setAuleDisponibili([]);
            setIdAulaSelezionata('');
            return;
        }
        const fetchAule = async () => {
            try {
                const response = await axios.get<AulaInfo[]>(`http://localhost:8000/api/aulas?tipo=${tipoAula}`); // Assumendo che l'API filtri
                const auleFiltrate = response.data;
                setAuleDisponibili(auleFiltrate);
                if (auleFiltrate.length > 0) {
                    setIdAulaSelezionata(auleFiltrate[0].Id_Aula.toString());
                } else {
                    setIdAulaSelezionata('');
                }
            } catch (err) {
                console.error("Errore nel caricare le aule:", err);
                setError("Impossibile caricare l'elenco delle aule.");
            }
        };
        fetchAule();
    }, [isOpen, tipoAula]);

    useEffect(() => {
        setGiornoPrenotazione(formatDateForDateInput(initialDate));
        // Quando cambia initialDate, resetta anche i moduli di inizio/fine al primo modulo
        setModuloInizioId(MODULI_ORARI[0].id);
        setModuloFineId(MODULI_ORARI[0].id);
        setDurataModuli(1);
    }, [initialDate]);

    const { dataInizioISO, dataFineISO, isValidSelection, validationMessage } = useMemo(() => {
        if (!giornoPrenotazione || !moduloInizioId) return { dataInizioISO: '', dataFineISO: '', isValidSelection: false, validationMessage: "Seleziona giorno e modulo di inizio." };

        const moduloInizioObj = MODULI_ORARI.find((m: { id: string; }) => m.id === moduloInizioId);
        if (!moduloInizioObj) return { dataInizioISO: '', dataFineISO: '', isValidSelection: false, validationMessage: "Modulo di inizio non valido." };

        // @ts-ignore
        const [startH, startM] = moduloInizioObj.startTime.split(':').map(Number);
        // Crea la data di inizio nel fuso orario locale del browser
        const dataInizioCompleta = new Date(`${giornoPrenotazione}T${moduloInizioObj.startTime}:00`);


        let dataFineCompleta: Date | null = null;
        let currentValidationMessage = "";

        const indexInizio = MODULI_ORARI.findIndex(m => m.id === moduloInizioId);

        if (metodoFine === 'moduloFine') {
            const moduloFineObj = MODULI_ORARI.find(m => m.id === moduloFineId);
            if (moduloFineObj) {
                const indexFine = MODULI_ORARI.findIndex(m => m.id === moduloFineId);
                if (indexFine < indexInizio) {
                    currentValidationMessage = "Il modulo di fine non può precedere quello di inizio.";
                } else {
                    dataFineCompleta = new Date(`${giornoPrenotazione}T${moduloFineObj.endTime}:00`);
                }
            } else {
                currentValidationMessage = "Seleziona un modulo di fine valido.";
            }
        } else { // metodoFine === 'durataModuli'
            if (durataModuli < 1) {
                currentValidationMessage = "La durata deve essere di almeno 1 modulo.";
            } else if ((indexInizio + durataModuli - 1) >= MODULI_ORARI.length) {
                currentValidationMessage = "La durata selezionata supera i moduli disponibili.";
            } else {
                const moduloFineCalcolato = MODULI_ORARI[indexInizio + durataModuli - 1];
                dataFineCompleta = new Date(`${giornoPrenotazione}T${moduloFineCalcolato.endTime}:00`);
            }
        }

        const currentIsValid = !!dataFineCompleta && dataFineCompleta > dataInizioCompleta && currentValidationMessage === "";
        if (!currentIsValid && currentValidationMessage === "" && dataFineCompleta && dataFineCompleta <= dataInizioCompleta) {
            currentValidationMessage = "L'orario di fine deve essere successivo all'orario di inizio.";
        }


        return {
            dataInizioISO: dataInizioCompleta.toISOString(), // Converte in UTC per l'invio
            dataFineISO: dataFineCompleta ? dataFineCompleta.toISOString() : '', // Converte in UTC
            isValidSelection: currentIsValid,
            validationMessage: currentValidationMessage
        };
    }, [giornoPrenotazione, moduloInizioId, metodoFine, moduloFineId, durataModuli]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (!isValidSelection) {
            setError(validationMessage || "Selezione orario non valida.");
            return;
        }
        if (!idAulaSelezionata) {
            setError("Seleziona un'aula.");
            return;
        }
        if (!userId) {
            setError("Utente non identificato. Effettua nuovamente il login.");
            return;
        }

        setIsLoading(true);
        try {
            const prenotazioneData = {
                Id_Professore: parseInt(userId, 10),
                Id_Aula: parseInt(idAulaSelezionata, 10),
                Data_Inizio: dataInizioISO,
                Data_Fine: dataFineISO,
            };
            console.log("Invio prenotazione:", prenotazioneData);
            await axios.post('http://localhost:8000/api/prenotazioni', prenotazioneData);
            setIsLoading(false);
            // alert('Prenotazione creata con successo!'); // Meglio usare un feedback non bloccante
            onBookingCreated();
        } catch (err) {
            console.error('Errore nella creazione della prenotazione:', err);
            setIsLoading(false);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<ApiErrorData>;
                setError(axiosError.response?.data?.message || "Errore durante la creazione della prenotazione.");
            } else {
                setError('Si è verificato un errore imprevisto.');
            }
        }
    };

    if (!isOpen) return null;

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

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} style={modalStyles.closeButton} aria-label="Chiudi">×</button>
                <h2>Nuova Prenotazione</h2>
                {(error || validationMessage) && <p style={modalStyles.errorMessage}>{error || validationMessage}</p>}
                <form onSubmit={handleSubmit}>
                    {/* ... (select per tipoAula e numeroAula come prima) ... */}
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
                            {auleDisponibili.map((aula) => ( // aula è AulaInfo
                                <option key={aula.Id_Aula} value={aula.Id_Aula.toString()}>
                                    {String(aula.Numero).padStart(2, '0')}
                                </option>
                            ))}
                        </select>
                        {auleDisponibili.length === 0 && tipoAula && <small>Nessuna aula per {tipoAula}.</small>}
                    </div>
                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="giornoPrenotazione" style={modalStyles.label}>Giorno:</label>
                        <input type="date" id="giornoPrenotazione" value={giornoPrenotazione} onChange={(e) => setGiornoPrenotazione(e.target.value)} required style={modalStyles.input} disabled={isLoading} />
                    </div>


                    <div style={modalStyles.inputGroup}>
                        <label htmlFor="moduloInizio" style={modalStyles.label}>Modulo Inizio:</label>
                        <select id="moduloInizio" value={moduloInizioId}
                                onChange={(e) => {
                                    setModuloInizioId(e.target.value);
                                    const currentIndexInizio = MODULI_ORARI.findIndex(m => m.id === e.target.value);
                                    const currentIndexFine = MODULI_ORARI.findIndex(m => m.id === moduloFineId);
                                    if (currentIndexFine < currentIndexInizio && MODULI_ORARI[currentIndexInizio]) { // Aggiunto check MODULI_ORARI[currentIndexInizio]
                                        setModuloFineId(MODULI_ORARI[currentIndexInizio].id); // Imposta al nuovo inizio se fine è precedente
                                    } else if (opzioniModuloFine.length > 0 && !opzioniModuloFine.find(m => m.id === moduloFineId) && MODULI_ORARI[currentIndexInizio]) {
                                        // Se il modulo fine precedentemente selezionato non è più valido, imposta al primo valido
                                        setModuloFineId(MODULI_ORARI[currentIndexInizio].id);
                                    }
                                }}
                                required style={modalStyles.select} disabled={isLoading}>
                            {/* Tipizza mod come ModuloOrario */}
                            {MODULI_ORARI.map((mod: ModuloOrario) =>
                                <option key={mod.id} value={mod.id}>{mod.label}</option>
                            )}
                        </select>
                    </div>

                    <div style={modalStyles.inputGroup}>
                        <label style={modalStyles.label}>Modalità Fine Prenotazione:</label>
                        <div style={modalStyles.radioGroup}>
                            {/* ... (radio buttons come prima) ... */}
                            <label style={{ marginRight: '15px' }}>
                                <input type="radio" name="metodoFine" value="moduloFine" checked={metodoFine === 'moduloFine'} onChange={() => setMetodoFine('moduloFine')} disabled={isLoading} />
                                Seleziona Modulo Fine
                            </label>
                            <label>
                                <input type="radio" name="metodoFine" value="durataModuli" checked={metodoFine === 'durataModuli'} onChange={() => setMetodoFine('durataModuli')} disabled={isLoading} />
                                Specifica Durata (n. moduli)
                            </label>
                        </div>
                    </div>

                    {metodoFine === 'moduloFine' && (
                        <div style={modalStyles.inputGroup}>
                            <label htmlFor="moduloFine" style={modalStyles.label}>Modulo Fine:</label>
                            <select id="moduloFine" value={moduloFineId} onChange={(e) => setModuloFineId(e.target.value)} required={metodoFine === 'moduloFine'} style={modalStyles.select} disabled={isLoading}>
                                {/* Tipizza mod come ModuloOrario */}
                                {opzioniModuloFine.map((mod: ModuloOrario) =>
                                    <option key={mod.id} value={mod.id}>{mod.label}</option>
                                )}
                            </select>
                        </div>
                    )}

                    {/* ... (input durataModuli e pulsanti come prima) ... */}
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