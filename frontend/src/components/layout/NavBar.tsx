import { Link, useLocation } from 'react-router-dom';
import Button from '../common/Button.tsx';
import styles from './styles/Navbar.module.css';
import AppTitle from "../common/AppTitle.tsx";
import { useAuth } from '../../contexts/AuthContext.tsx';
import {RouteConfig} from "../../types/interfaces.ts";

interface NavBarProps {
    routes: RouteConfig[];
}
/**
 * NavBar component that displays the application title and navigation links
 * Conditionally renders routes and logout button based on auth state
 */
function NavBar({ routes }: NavBarProps) {

    const { isConnected, disconnect } = useAuth();
    const location = useLocation();

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {/*Logo with home link*/}
                <Link to="/" className={styles.logo}>
                    <AppTitle />
                </Link>

                {/* other pages (right alignment)*/}
                <div className={styles.nav}>
                    {routes
                        .filter(route => {
                            {/* do not show  */}
                            if (route.path === '/profile' && !isConnected) {
                                return false;
                            }

                            return route.showInNavbar;
                        })
                        .map(route => (
                            route.path === '/login' ?
                                isConnected ? (
                                    //if user is authenticated, show logout instead of login
                                    <Button
                                        key="logout-button"
                                        variant="border"
                                        onClick={disconnect}
                                    >
                                        Logout
                                    </Button>
                                ) : (
                                    //if not authenticated login
                                    <Link to={route.path} key={route.path}>
                                        <Button variant="border">
                                            {route.label}
                                        </Button>
                                    </Link>
                                ) :
                                <Link
                                    key={route.path}
                                    to={route.path}
                                    className={`${styles.navLink} ${location.pathname === route.path ? styles.active : ''}`}
                                >
                                    {route.label}
                                </Link>
                        ))}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;