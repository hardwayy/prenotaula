// frontend/src/components/SideNavigationMenu.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa'; // Icona per chiudere

interface SideNavigationMenuProps {
    isOpen: boolean;
    onCloseMenu: () => void; // Callback per chiudere il menu
}

// Assumiamo che la tua Navbar abbia un'altezza, ad es. 60px
const NAVBAR_HEIGHT = '60px'; // Puoi rendere questo più dinamico se necessario

const styles: { [key: string]: React.CSSProperties } = {
    menu: {
        position: 'fixed',
        top: 0, // Parte dall'alto dello schermo
        left: 0,
        width: '280px', // Un po' più largo forse?
        height: '100vh',
        backgroundColor: '#2c3e50', // Un colore scuro diverso per il menu
        paddingTop: `calc(${NAVBAR_HEIGHT} + 15px)`, // Padding per non andare sotto la navbar + spazio per la X
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '20px',
        boxSizing: 'border-box', // Importante per il padding
        boxShadow: '3px 0px 10px rgba(0,0,0,0.2)',
        transform: 'translateX(-100%)', // Nascosto di default
        transition: 'transform 0.3s ease-out',
        zIndex: 1005, // Deve essere alto, potenzialmente sopra la navbar se la navbar non è trasparente
        // o se la navbar è sticky e il menu deve scorrere sopra il contenuto ma sotto la X.
        // Se la X è nel menu, il menu intero può avere uno z-index alto.
    },
    menuOpen: {
        transform: 'translateX(0)', // Visibile
    },
    closeButton: {
        position: 'absolute',
        top: `calc(${NAVBAR_HEIGHT} - 45px)`, // Posiziona la X appena sotto la navbar (o dove preferisci)
        // Oppure un valore fisso se il paddingTop del menu è sufficiente: es. top: '15px'
        // Se il paddingTop del menu è calc(NAVBAR_HEIGHT + 15px),
        // allora top: '15px' posizionerà la X nel padding.
        right: '15px',
        background: 'none',
        border: 'none',
        color: '#ecf0f1', // Colore chiaro per la X
        fontSize: '1.8em', // Più grande
        cursor: 'pointer',
    },
    navLink: {
        display: 'block',
        color: '#ecf0f1', // Testo più chiaro
        padding: '12px 0',
        textDecoration: 'none',
        fontSize: '1.1em',
        borderBottom: '1px solid #34495e', // Separatore più scuro
    },
    navLinkLast: { // Per rimuovere il bordo dell'ultimo link
        borderBottom: 'none',
    }
};

const SideNavigationMenu: React.FC<SideNavigationMenuProps> = ({ isOpen, onCloseMenu }) => {
    return (
        <div style={{ ...styles.menu, ...(isOpen && styles.menuOpen) }}>
            <button
                onClick={onCloseMenu}
                style={styles.closeButton}
                aria-label="Chiudi menu"
            >
                <FaTimes />
            </button>
            <nav>
                <Link to="/home" style={styles.navLink} onClick={onCloseMenu}>
                    Home (Calendario)
                </Link>
                <Link to="/le-mie-prenotazioni" style={styles.navLink} onClick={onCloseMenu}>
                    Le Mie Prenotazioni
                </Link>
                <Link to="/profilo" style={{...styles.navLink, ...styles.navLinkLast}} onClick={onCloseMenu}>
                    Profilo
                </Link>
                {/* Aggiungi altri link se necessario */}
            </nav>
        </div>
    );
};

export default SideNavigationMenu;