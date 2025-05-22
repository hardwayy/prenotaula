// frontend/src/App.tsx
import {type JSX} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// @ts-ignore
import LoginPage from './components/LoginPage';
import NotFoundPage from './components/NotFoundPage';
import HomePage from "./components/HomePage.tsx"; // Importa la pagina 404
import RegistrationPage from './components/RegistrationPage';

// Funzione helper per verificare l'autenticazione
const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('authToken'); // Controlla se il token esiste
};

// Componente wrapper per le route protette
interface ProtectedRouteProps {
    children: JSX.Element;
}

function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
    if (!isAuthenticated()) {
        // Se l'utente non è autenticato, reindirizza alla pagina di login
        // passando lo stato `from` per un eventuale redirect indietro dopo il login.
        return <Navigate to="/login" replace />;
    }
    // Se autenticato, renderizza il componente figlio (la pagina protetta)
    return children;
}


function App(): JSX.Element {
    return (
        <Router>
            <Routes>
                {/* 1. Route per la pagina di Login */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated() ? <Navigate to="/home" replace /> : <LoginPage />
                        // Se l'utente è già loggato e prova ad andare a /login,
                        // lo reindirizziamo alla homepage. Altrimenti, mostra LoginPage.
                    }
                />

                {/* 2. Route per la Homepage (o dashboard/calendario) - Protetta */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    }
                />
                {/* Esempio di altra route protetta:
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        */}{/* 2. AGGIUNGI LA ROUTE PER LA REGISTRAZIONE */}
                {/* Questa route è pubblica; se un utente già loggato ci va, potrebbe essere reindirizzato */}
                <Route
                    path="/register"
                    element={isAuthenticated() ? <Navigate to="/home" /> : <RegistrationPage />}
                />

                {/* 3. Route per la Radice ("/") */}
                <Route
                    path="/"
                    element={
                        isAuthenticated() ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
                        // Se l'utente è loggato, va alla homepage.
                        // Se NON è loggato, lo mandiamo alla pagina di login.
                        // (Se volessi una landing page pubblica per "/", la metteresti qui al posto del Navigate to /login)
                    }
                />

                {/* 4. Route di Fallback per Pagina Non Trovata (404) */}
                {/* Questa route matcha qualsiasi percorso non gestito dalle route precedenti. */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Router>
    );
}

export default App;