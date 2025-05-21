// frontend/src/components/HomePage.tsx
import React, {useState, useEffect, type JSX} from 'react'; // Rimuovi type JSX se non usato
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import SideNavigationMenu from './SideNavigationMenu';
import CalendarView from "./CalendarView";

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

};

function HomePage(): JSX.Element {
    const [userName, setUserName] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
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
            <SideNavigationMenu
                isOpen={isMenuOpen}
                onCloseMenu={closeMenu}
            />
            <main style={styles.mainContentArea}>
                <CalendarView />
                {/* Altri contenuti specifici per la HomePage possono andare qui */}
            </main>
        </div>
    );
}

export default HomePage;