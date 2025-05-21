// frontend/src/components/NotFoundPage.tsx
import React, {type JSX} from 'react';
import { Link } from 'react-router-dom'; // Opzionale, per linkare alla home

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
    },
    title: {
        fontSize: '3em',
        color: '#555',
    },
    text: {
        fontSize: '1.2em',
        color: '#777',
    },
    link: {
        marginTop: '20px',
        color: '#007bff',
        textDecoration: 'none',
    }
};

function NotFoundPage(): JSX.Element {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>404</h1>
            <p style={styles.text}>Oops! Pagina Non Trovata.</p>
            <p style={styles.text}>La risorsa che stai cercando potrebbe essere stata rimossa o non è mai esistita.</p>
            <Link to="/" style={styles.link}>Torna alla pagina principale</Link>
        </div>
    );
}

export default NotFoundPage;