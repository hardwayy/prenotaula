// frontend/src/components/Navbar.tsx
import React from 'react';
import { FaUserCircle, FaBars } from 'react-icons/fa'; // Solo FaBars per aprire

interface NavbarProps {
    userName: string | null;
    onOpenMenu: () => void; // Cambiato nome per chiarezza, ora solo apre
    onLogout: () => void;
}
const NAVBAR_HEIGHT = '60px';
const styles: { [key: string]: React.CSSProperties } = {
    navbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0px 20px', // Padding orizzontale
        height: NAVBAR_HEIGHT, // Usa la costante definita sopra o un valore fisso
        backgroundColor: '#007bff',
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'sticky', // Rende la navbar fissa in cima durante lo scroll
        top: 0,
        zIndex: 1000, // z-index per la navbar (il menu overlay sarà sopra se necessario, o gestito diversamente)
                      // Se il menu deve scorrere SOPRA la navbar, lo z-index del menu deve essere > 1000
                      // Ma se la X è nel menu, e il menu ha padding-top, questo va bene.
    },
    menuButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '1.5em',
        cursor: 'pointer',
        position: 'relative', // Necessario se vuoi che z-index abbia effetto certo qui
        zIndex: 1011,
    },
    brand: { // Opzionale: se vuoi un titolo/logo a sinistra del pulsante menu
        fontSize: '1.5em',
        fontWeight: 'bold',
        marginLeft: '10px',
    },
    userDetails: {
        display: 'flex',
        alignItems: 'center',
    },
    userName: {
        margin: '0 10px',
        fontWeight: '500',
    },
    userIcon: {
        fontSize: '1.8em',
    },
    logoutButton: {
        marginLeft: '15px',
        padding: '8px 12px',
        backgroundColor: '#dc3545', // Rosso per logout
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
    }
};
// Riassegna NAVBAR_HEIGHT se non è definita globalmente (meglio se importata da un file di costanti)


const Navbar: React.FC<NavbarProps> = ({ userName, onOpenMenu, onLogout }) => {
    return (
        <nav style={styles.navbar}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={onOpenMenu} style={styles.menuButton} aria-label="Apri menu">
                    <FaBars /> {/* Se FaBars non è importata, qui ci sarà un errore o non si vedrà nulla */}
                </button>
                {/* Nome dell'app o logo qui se vuoi */}
            </div>
            <div style={styles.userDetails}>
                <FaUserCircle style={styles.userIcon} /> {/* Se FaUserCircle non è importata... */}
                <span style={styles.userName}>{userName || 'Utente'}</span>
                <button onClick={onLogout} style={styles.logoutButton}>
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;