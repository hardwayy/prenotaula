// frontend/src/components/CalendarView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import itLocale from '@fullcalendar/core/locales/it';
import { type EventClickArg, type EventInput } from '@fullcalendar/core'; // Importa EventInput per i nuovi eventi
import axios from 'axios';
// Import CSS (assicurati che i percorsi siano corretti per la tua versione di FullCalendar)
// Esempio per v6+ (Vite spesso gestisce questo automaticamente se i pacchetti sono installati)
// import '@fullcalendar/common/main.css'; // O '@fullcalendar/core/main.css'
// import '@fullcalendar/daygrid/main.css';
// import '@fullcalendar/timegrid/main.css';
// import '@fullcalendar/list/main.css';

import './CalendarView.css'; // I tuoi stili custom

// L'interfaccia CalendarEvent rimane la stessa
interface CalendarEvent extends EventInput { // Estende EventInput per compatibilità con FullCalendar
    id: string; // FullCalendar usa id di tipo stringa
    title: string;
    start: string; // Formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
    end?: string;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    // Potresti aggiungere altri campi specifici dell'applicazione
    // extendedProps?: {
    //   professore?: string;
    //   aula?: string;
    //   // altri dettagli...
    // };
}

const styles: { [key: string]: React.CSSProperties } = {
    calendarContainer: {
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        height: 'calc(100vh - 60px - 20px - 20px - 2px)', // Esempio di altezza
        minHeight: '650px',
        display: 'flex',
        flexDirection: 'column',
    },
};

const CalendarView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Funzione per caricare le prenotazioni dal backend
    const fetchEvents = useCallback(async () => {
        setLoadingError(null);
        try {
            const response = await axios.get<CalendarEvent[]>('http://localhost:8000/api/prenotazioni');
             setEvents(response.data);

            // Per ora, usiamo mock data per il debug degli handler
            console.log("Caricamento eventi (usando mock data per ora)...");


        } catch (error) {
            console.error("Errore nel caricare le prenotazioni:", error);
            setLoadingError('Impossibile caricare le prenotazioni dal server.');
        }
    }, []); // La dipendenza vuota significa che fetchEvents non cambia mai, quindi useEffect lo chiama solo una volta

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]); // Chiama fetchEvents quando il componente monta (e se fetchEvents cambiasse)

    // Gestore per quando si clicca su una data o uno slot temporale
    // @ts-ignore
    const handleDateClick = useCallback((clickInfo: DateClickArg) => {
        const title = prompt('Inserisci il titolo per la nuova prenotazione:', 'Nuova Prenotazione');
        if (title) {
            const newEvent: CalendarEvent = {
                id: String(Date.now()), // ID univoco temporaneo
                title: title,
                start: clickInfo.dateStr, // Data cliccata (se allDay) o data+ora
                allDay: clickInfo.allDay,
                // Potresti voler impostare un colore di default per i nuovi eventi
                backgroundColor: '#6c757d', // Grigio
                borderColor: '#6c757d'
            };

            setEvents(prevEvents => [...prevEvents, newEvent]);

            alert(`Nuova prenotazione "${title}" aggiunta (solo localmente) per ${clickInfo.dateStr}.
Dovresti inviare questo al backend per salvarlo nel database.`);
            // TODO: Qui faresti una chiamata API POST al backend per creare la prenotazione
            // Esempio:
            // axios.post('/api/prenotazioni', { title: newEvent.title, start: newEvent.start, end: newEvent.end, allDay: newEvent.allDay, id_aula: ..., id_professore: ... })
            //   .then(response => {
            //     // Aggiorna l'evento con l'ID dal database o ricarica tutti gli eventi
            //     console.log("Prenotazione salvata:", response.data);
            //     fetchEvents(); // Ricarica gli eventi per includere quello nuovo dal DB
            //   })
            //   .catch(error => console.error("Errore nel salvare la prenotazione:", error));
        }
    }, [/* fetchEvents */]); // Rimuovi fetchEvents dalle dipendenze se non lo chiami qui dentro per evitare loop
    // Se chiami fetchEvents, allora includilo.

    // Gestore per quando si clicca su un evento esistente
    // @ts-ignore
    const handleEventClick = useCallback((clickInfo: EventClickArg) => {
        const event = clickInfo.event;
        const eventDetails = `
      Titolo: ${event.title}
      Inizio: ${event.start ? new Date(event.startStr).toLocaleString('it-IT') : 'N/A'}
      Fine: ${event.end ? new Date(event.endStr).toLocaleString('it-IT') : 'N/A'}
      Tutto il giorno: ${event.allDay ? 'Sì' : 'No'}
      ID: ${event.id}
    `;

        if (confirm(`Dettagli Prenotazione:\n${eventDetails}\n\nVuoi eliminare questa prenotazione (solo visualizzazione locale)?`)) {
            setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
            alert(`Prenotazione "${event.title}" rimossa (solo localmente).
Dovresti inviare una richiesta DELETE al backend per eliminarla dal database.`);
            // TODO: Qui faresti una chiamata API DELETE al backend
            // Esempio:
            // axios.delete(`/api/prenotazioni/${event.id}`)
            //   .then(() => {
            //     console.log("Prenotazione eliminata con successo dal DB");
            //     // Non c'è bisogno di chiamare fetchEvents se l'hai già rimossa localmente,
            //     // a meno che tu non voglia una conferma dal server.
            //   })
            //   .catch(error => console.error("Errore nell'eliminare la prenotazione:", error));
        }
    }, []);

    return (
        <div style={styles.calendarContainer}>
            {loadingError && <p style={{ color: 'red', textAlign: 'center' }}>{loadingError}</p>}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                events={events}
                locale={itLocale}
                editable={true} // Permette il drag-and-drop e il resize (se gestiti)
                selectable={true} // Permette la selezione di date/slot
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                //dateClick={handleDateClick}
                //eventClick={handleEventClick}
                // eventDrop={(info) => { /* Gestisci il drag & drop, chiama API per aggiornare */ }}
                // eventResize={(info) => { /* Gestisci il resize, chiama API per aggiornare */ }}
                height="100%"
                buttonText={{
                    today:    'Oggi',
                    month:    'Mese',
                    week:     'Settimana',
                    day:      'Giorno',
                    list:     'Elenco'
                }}
                firstDay={1}
                navLinks={true}
                nowIndicator={true}
            />
        </div>
    );
};

export default CalendarView;