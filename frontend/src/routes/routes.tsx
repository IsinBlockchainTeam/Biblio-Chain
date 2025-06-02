
import HomePage from '../pages/HomePage.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import ProfilePage from '../pages/ProfilePage.tsx';
import CatalogPage from "../pages/CatalogPage.tsx";
import EarnPage from "../pages/EarnPage.tsx";
import {RouteConfig} from "../types/interfaces.ts";

export const routes: RouteConfig[] = [
    {
        path: '/',
        component: <HomePage />,
        label: 'Home',
        showInNavbar: true,
    },
    {
        path: '/catalog',
        component: <CatalogPage />,
        label: 'Catalog',
        showInNavbar: true,
    },
    {
        path: '/earn',
        component: <EarnPage />,
        label: 'Earn',
        showInNavbar: true,
        protected: true
    },
    {
        path: '/profile',
        component: <ProfilePage />,
        label: 'Profile',
        showInNavbar: true,
        protected: true,
    },
    {
        path: '/login',
        component: <LoginPage />,
        label: 'Login',
        showInNavbar: true,
    },
];