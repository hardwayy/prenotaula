// frontend/src/components/CalendarView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, {type DateClickArg } from '@fullcalendar/interaction'; // Per dateClick
import listPlugin from '@fullcalendar/list'; // Per la vista a lista
import itLocale from '@fullcalendar/core/locales/it'; // Importa la localizzazione italiana

// Importa i CSS di FullCalendar (molto importante!)
// Questi sono per FullCalendar v5/v6. Controlla la documentazione se usi una versione diversa.

//import './CalendarView.css';

// Interfaccia per gli eventi del calendario (le tue prenotazioni)
interface CalendarEvent {
    id: string; // o number, l'ID della prenotazione
    title: string; // Es. "Aula A01 - Prof. Rossi" o "Laboratorio Info - Lezione TPSI"
    start: string; // Formato ISO 8601: "2025-05-22T10:00:00"
    end?: string;   // Formato ISO 8601: "2025-05-22T12:00:00" (opzionale se l'evento non ha durata)
    allDay?: boolean; // Se l'evento dura tutto il giorno
    // Puoi aggiungere altri campi custom qui (backgroundColor, borderColor, extendedProps, ecc.)
    // backgroundColor?: string;
    // borderColor?: string;
    // extendedProps?: Record<string, any>;
}

const styles: { [key: string]: React.CSSProperties } = {
    calendarContainer: {
        width: '100%',
        maxWidth: '1100px', // Puoi aggiustare la larghezza massima
        margin: '0 auto',   // Per centrare se maxWidth è impostato
        padding: '15px',    // Un po' di padding attorno al calendario
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
        height: 'calc(100vh - 60px - 40px - 40px)', // Esempio: altezza viewport - navbar - padding-top di mainContent - padding-bottom di mainContent
        // Dovrai aggiustarla per farla entrare bene
        minHeight: '600px', // Altezza minima
    },
};

const CalendarView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    // const [selectedDateInfo, setSelectedDateInfo] = useState<DateClickArg | null>(null);

    // TODO: Caricare le prenotazioni/eventi dal backend
    useEffect(() => {
        // Simula il caricamento degli eventi
        // In una vera applicazione, faresti una chiamata API al tuo backend Rust
        // per recuperare le prenotazioni e mapparle nel formato CalendarEvent.
        // Esempio: axios.get('/api/prenotazioni?start=...&end=...').then(response => setEvents(mapToCalendarEvents(response.data)));
        const mockEvents: CalendarEvent[] = [
            { id: '1', title: 'Lezione TPSI - Aula A01', start: '2025-05-22T10:00:00', end: '2025-05-22T12:00:00' },
            { id: '2', title: 'Riunione Dipartimento - Aula Magna', start: '2025-05-23T14:00:00', end: '2025-05-23T15:30:00',  },
            {
                id: '3', title: 'Prenotazione Carrello PC01', allDay: true,
                start: ''
            } // Esempio evento tutto il giorno
        ];
        setEvents(mockEvents);
    }, []);

    // Gestore per quando si clicca su una data o uno slot temporale
    const handleDateClick = useCallback((clickInfo: DateClickArg) => {
        // clickInfo.dateStr contiene la data/ora cliccata in formato ISO
        // clickInfo.allDay indica se è stato cliccato uno slot "tutto il giorno"
        alert('Data cliccata: ' + clickInfo.dateStr + '\nPotresti aprire un modale qui per creare una nuova prenotazione.');
        // setSelectedDateInfo(clickInfo);
        // Qui potresti aprire un modale per creare una nuova prenotazione per clickInfo.date
    }, []);

    // Gestore per quando si clicca su un evento esistente
    const handleEventClick = useCallback((clickInfo: any /* EventClickArg */) => {
        alert('Evento cliccato: ' + clickInfo.event.title + '\nID Prenotazione: ' + clickInfo.event.id + '\nPotresti aprire un modale per visualizzare/modificare i dettagli.');
        // clickInfo.event contiene l'oggetto evento
    }, []);

    return (
        <div style={styles.calendarContainer}>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth" // Vista iniziale
                headerToolbar={{ // Configurazione dell'header
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' // Opzioni di vista
                }}
                events={events} // Array di eventi da visualizzare
                locale={itLocale} // Imposta la localizzazione italiana (nomi mesi, giorni, formato ora)
                editable={true} // Permette il drag & drop e il resize degli eventi (se implementi gli handler)
                selectable={true} // Permette di selezionare date/slot temporali
                selectMirror={true}
                dayMaxEvents={true} // Mostra "+more" se ci sono troppi eventi in un giorno
                weekends={true} // Mostra i weekend
                dateClick={handleDateClick} // Chiamata quando si clicca su una data/ora
                eventClick={handleEventClick} // Chiamata quando si clicca su un evento
                // eventDrop={(info) => alert(info.event.title + " è stato spostato.")} // Esempio per drag & drop
                // eventResize={(info) => alert(info.event.title + " è stato ridimensionato.")} // Esempio per resize

                // Per l'altezza, FullCalendar ha diverse opzioni:
                height="100%" // Prova a fargli occupare l'altezza del contenitore (calendarContainer)
                // contentHeight="auto"
                // aspectRatio={1.8} // Oppure usa un aspect ratio

                // Nomi dei pulsanti personalizzati se vuoi
                buttonText={{
                    today:    'Oggi',
                    month:    'Mese',
                    week:     'Settimana',
                    day:      'Giorno',
                    list:     'Elenco'
                }}
                firstDay={1} // Imposta Lunedì come primo giorno della settimana (0=Dom, 1=Lun, ...)
                navLinks={true} // Permette di cliccare sui nomi dei giorni/settimane per navigare
                nowIndicator={true} // Mostra un indicatore per l'ora corrente nelle viste giornaliere/settimanali
            />
            {/* {selectedDateInfo && (
        <div>
          <h3>Info Data Cliccata:</h3>
          <p>Data: {selectedDateInfo.dateStr}</p>
          <p>Tutto il giorno: {selectedDateInfo.allDay ? 'Sì' : 'No'}</p>
        </div>
      )} */}
        </div>
    );
};

export default CalendarView;