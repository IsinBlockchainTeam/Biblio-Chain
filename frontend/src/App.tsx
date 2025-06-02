import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import NavBar from './components/layout/NavBar.tsx';
import Footer from './components/layout/Footer.tsx';
import {routes} from './routes/routes';
import './App.css';
import './i18n';
import {ReactNode} from "react";
import {AuthProvider, useAuth} from "./contexts/AuthContext.tsx";
import {LibraryProvider} from "./contexts/LibraryContext.tsx";
import {EarnProvider} from "./contexts/EarnContext.tsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <LibraryProvider>
                    <EarnProvider>
                        <AppContent />
                    </EarnProvider>
                </LibraryProvider>
            </BrowserRouter>
        </AuthProvider>
    );
}

function AppContent() {
    const { isBanned } = useAuth();

    // If user is banned, don't render the app content
    if (isBanned) {
        return null; // BannedUserOverlay is rendered by AuthProvider
    }

    return (
        <div className="app">
            <NavBar routes={routes}/>
            <main>
                <Routes>
                    {routes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                route.protected
                                    ? <ProtectedRoute>{route.component}</ProtectedRoute>
                                    : route.component
                            }
                        />
                    ))}
                </Routes>
            </main>
            <Footer/>
        </div>
    );
}

function ProtectedRoute({children}: { children: ReactNode }) {
    const { isConnected } = useAuth();
    return isConnected ? children : <Navigate to="/login" />;
}

export default App;