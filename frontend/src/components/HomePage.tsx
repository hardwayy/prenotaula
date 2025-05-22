// frontend/src/components/HomePage.tsx
import React, {useState, useEffect, type JSX} from 'react'; // Rimuovi type JSX se non usato
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import SideNavigationMenu from './SideNavigationMenu';
import CalendarView from "./CalendarView";
import BookingFormModal from './BookingFormModal';
import {FaPlus} from "react-icons/fa"; // Creeremo questo componente
const NAVBAR_HEIGHT_VALUE = 60; // in pixel

const styles: { [key: string]: React.CSSProperties } = {
    homePageContainer: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    mainContentArea: {
        flexGrow: 1,
        paddingTop: `${NAVBAR_HEIGHT_VALUE}px`,
        width: '100%',
        overflowY: 'auto',
        backgroundColor: '#e9ecef',
        display: 'flex',        // <-- Questo è importante
        flexDirection: 'column',// <-- Questo è importante
        alignItems: 'center',   // <-- Questo dovrebbe centrare CalendarView.tsx (il suo div 'container')
        padding: '20px',
    },
    fab: { // Stile per il Floating Action Button
        position: 'fixed',     // <-- Chiave per farlo flottare rispetto alla viewport
        bottom: '30px',        // Distanza dal basso
        right: '30px',         // Distanza da destra
        width: '60px',         // Larghezza
        height: '60px',        // Altezza (uguale alla larghezza per un cerchio)
        borderRadius: '50%',   // <-- Chiave per renderlo rotondo
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex',       // Per centrare l'icona '+'
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',      // Dimensione dell'icona '+'
        cursor: 'pointer',
        zIndex: 1050,          // Assicura che sia sopra la maggior parte degli altri elementi
    },

};

function HomePage(): JSX.Element {
    const [userName, setUserName] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isBookingFormOpen, setIsBookingFormOpen] = useState<boolean>(false); // Stato per il modale
    const [selectedDateForBooking, setSelectedDateForBooking] = useState<Date | null>(null); // Per pre-compilare
    const navigate = useNavigate();

    useEffect(() => {
        const storedUserName = localStorage.getItem('userName');
        setUserName(storedUserName);
        // Se non c'è authToken, ProtectedRoute dovrebbe già aver reindirizzato.
        // Ma un controllo aggiuntivo qui o il recupero dei dati utente da un endpoint /me
        // potrebbe essere utile.
        if (!localStorage.getItem('authToken')) {
            navigate('/login'); // Reindirizzamento di sicurezza aggiuntivo
        }
    }, [navigate]); // Aggiungi navigate alle dipendenze di useEffect se usato all'interno
    const handleOpenBookingForm = (date?: Date) => {
        setSelectedDateForBooking(date || null); // Se una data è passata (es. da CalendarView), usala
        setIsBookingFormOpen(true);
    };

    const handleCloseBookingForm = () => {
        setIsBookingFormOpen(false);
        setSelectedDateForBooking(null); // Resetta la data selezionata
        // TODO: Qui dovresti anche ricaricare gli eventi del calendario se una prenotazione è stata creata
        // Potresti passare una callback a BookingFormModal per triggerare fetchEvents in CalendarView
        // o usare una gestione di stato globale.
    };
    const handleBookingCreated = () => {
        // Qui potresti triggerare un refresh degli eventi in CalendarView
        // Il modo più semplice (ma non ideale per performance se CalendarView non è ottimizzato)
        // è forzare un re-render che faccia rieseguire useEffect in CalendarView,
        // oppure CalendarView potrebbe esporre una funzione di refresh.
        // Per ora, chiudiamo solo il modale.
        console.log("Prenotazione creata, il calendario dovrebbe aggiornarsi.");
        handleCloseBookingForm();
    };
    const openMenu = () => setIsMenuOpen(true);
    const closeMenu = () => setIsMenuOpen(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        window.location.reload();
        navigate('/login');
    };

    return (
        <div style={styles.homePageContainer}>
            <Navbar
                userName={userName}
                onOpenMenu={openMenu}
                onLogout={handleLogout}
            />
            <SideNavigationMenu isOpen={isMenuOpen} onCloseMenu={closeMenu} />

            <main style={styles.mainContentArea}>
                {/* Passa handleOpenBookingForm a CalendarView se vuoi che il click su una data apra il form */}
                <CalendarView
                    // onDateClickForBooking={handleOpenBookingForm} // Prop personalizzata da implementare in CalendarView
                />
            </main>

            <button onClick={() => handleOpenBookingForm()} style={styles.fab} title="Aggiungi Prenotazione">
                <FaPlus />
            </button>

            {isBookingFormOpen && (
                <BookingFormModal
                    isOpen={isBookingFormOpen}
                    onClose={handleCloseBookingForm}
                    onBookingCreated={handleBookingCreated} // Passa la callback
                    initialDate={selectedDateForBooking} // Passa la data selezionata
                />
            )}
        </div>
    );
}

export default HomePage;