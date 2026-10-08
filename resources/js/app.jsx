import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import Header from './components/super-admin/Header';
import Sidebar from './components/super-admin/Sidebar';
import Breadcrumb from './components/super-admin/Breadcrumb';
import Footer from './components/super-admin/Footer';

import Dashboard from './pages/super-admin/Dashboard';
import Login from './pages/super-admin/auth/Login';
import ForgotPassword from './pages/super-admin/auth/ForgotPassword';
import Profile from './pages/super-admin/auth/Profile';
import SystemSettings from './pages/super-admin/SystemSettings';
import GeneralSettings from "./pages/super-admin/settings/GeneralSettings";
import DateTimeSettings from "./pages/super-admin/settings/DateTimeSettings";
import EmailSMTP from "./pages/super-admin/settings/EmailSMTP";
import FileStorage from "./pages/super-admin/settings/FileStorage";
import SecuritySettings from "./pages/super-admin/settings/SecuritySettings";
import ResetPassword from "./pages/super-admin/auth/ResetPassword";
import Maintenance from './pages/super-admin/settings/Maintenance';
import EmailDraftFormat from './pages/super-admin/settings/EmailDraftFormat';
import CreateCompany from './pages/super-admin/company/CreateCompany';
import EditCompany from './pages/super-admin/company/EditCompany';
import Companies from './pages/super-admin/company/Companies';

function App() {

    const [currentPath, setCurrentPath] = useState(
        window.location.pathname
    );

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('auth_token') ||
        !!sessionStorage.getItem('auth_token')
    );


    /*
    |--------------------------------------------------------------------------
    | Browser Back / Forward
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const navigateTo = (path) => {

        window.history.pushState({}, '', path);

        setCurrentPath(path);

    };


    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    const handleLogin = () => {

        setIsAuthenticated(true);

        navigateTo('/dashboard');
    };


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    const handleLogout = () => {

        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');

        localStorage.removeItem('user');

        setIsAuthenticated(false);

        navigateTo('/');
    };


    /*
|--------------------------------------------------------------------------
| Public Pages
|--------------------------------------------------------------------------
*/

if (currentPath === '/forgot-password') {

    return (
        <ForgotPassword
            onBackToLogin={() => navigateTo('/')}
        />
    );
}

if (currentPath === '/reset-password') {

    return (
        <ResetPassword
            navigateTo={navigateTo}
        />
    );
}


    /*
    |--------------------------------------------------------------------------
    | Protected Pages
    |--------------------------------------------------------------------------
    */

    const isAppPage = [
        '/dashboard',
        '/profile',
        '/profile/projects',
    ].includes(currentPath) || currentPath.startsWith('/system-settings')
    || currentPath === '/companies'
    || currentPath === '/companies/create'
    || currentPath.startsWith('/companies/');
    const editCompanyMatch = currentPath.match(
        /^\/companies\/(\d+)\/edit$/
    );


    /*
    |--------------------------------------------------------------------------
    | Protect Application Pages
    |--------------------------------------------------------------------------
    */

    if (isAppPage && !isAuthenticated) {

        navigateTo('/');

        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | Login Page
    |--------------------------------------------------------------------------
    */

    if (!isAppPage) {

        return (
            <Login
                onLogin={handleLogin}
                onForgotPassword={() =>
                    navigateTo('/forgot-password')
                }
            />
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Sidebar
    |--------------------------------------------------------------------------
    */

    const handleMenuClick = () => {

        if (window.innerWidth <= 768) {

            setSidebarOpen((isOpen) => !isOpen);

            return;
        }

        setSidebarCollapsed((isCollapsed) => !isCollapsed);
    };


    const handleSidebarClose = () => {

        setSidebarOpen(false);
    };


    /*
    |--------------------------------------------------------------------------
    | Protected Application Layout
    |--------------------------------------------------------------------------
    */

    return (

        <div
            className={`super-admin-app ${
                sidebarCollapsed
                    ? 'super-admin-app--sidebar-collapsed'
                    : ''
            }`}
        >

            {/* HEADER */}

            <Header
                onMenuClick={handleMenuClick}
                onProfileClick={() => navigateTo('/profile')}
                onLogout={handleLogout}
                adminName="Super Admin"
                adminRole="Administrator"
            />


            {/* SIDEBAR */}

            <Sidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={handleSidebarClose}
                onNavigate={navigateTo}
                currentPath={currentPath}
            />


            {/* MAIN */}

            <main className="super-admin-main">

                <Breadcrumb
                    title={
                        currentPath.startsWith('/profile')
                            ? 'My Profile'
                            : currentPath.startsWith('/system-settings')
                                ? 'System Settings'
                            : 'Super Admin Dashboard'
                    }
                    items={[
                        {
                            label:
                                currentPath.startsWith('/profile')
                                    ? 'Profile'
                                    : currentPath.startsWith('/system-settings')
                                        ? 'System Settings'
                                    : 'Dashboard',

                            path:
                                currentPath.startsWith('/profile')
                                    ? '/profile'
                                    : currentPath.startsWith('/system-settings')
                                        ? '/system-settings'
                                    : '/dashboard',
                        },
                        ...(currentPath === '/system-settings/general'
                            ? [
                                {
                                    label: 'General Settings',
                                    path: '/system-settings/general',
                                },
                            ]
                            : currentPath === '/system-settings/date-time'
                                ? [
                                    {
                                        label: 'Date & Time',
                                        path: '/system-settings/date-time',
                                    },
                                ]
                            : currentPath === '/system-settings/email-smtp'
                                ? [
                                    {
                                        label: 'Email / SMTP',
                                        path: '/system-settings/email-smtp',
                                    },
                                ]
                            : currentPath === '/system-settings/file-storage'
                                ? [
                                    {
                                        label: 'File & Storage',
                                        path: '/system-settings/file-storage',
                                    },
                                ]
                            : currentPath === '/system-settings/security'
                                ? [
                                    {
                                        label: 'Security',
                                        path: '/system-settings/security',
                                    },
                                ]
                            : []),
                    ]}
                />


                <div className="super-admin-page">

                    {currentPath.startsWith('/profile') ? (

                        <Profile
                            currentPath={currentPath}
                            onNavigate={navigateTo}
                        />

                     ) : currentPath === '/system-settings/general' ? (

                        <GeneralSettings
                            onNavigate={navigateTo}
                        />

                    ) : currentPath === '/system-settings/date-time' ? (

                        <DateTimeSettings
                            onNavigate={navigateTo}
                        />

                    ) : currentPath === '/system-settings/email-smtp' ? (

                        <EmailSMTP
                            onNavigate={navigateTo}
                        />

                    ) : currentPath === '/system-settings/file-storage' ? (

                        <FileStorage />

                    ) : currentPath === '/system-settings/security' ? (

                        <SecuritySettings />

                    ) :  currentPath === '/system-settings/maintenance' ? (

                        <Maintenance />

                    ) : currentPath === '/system-settings/email-drafts' ? (

                        <EmailDraftFormat />

                    ) :currentPath === '/system-settings' ? (

                        <SystemSettings
                            onNavigate={navigateTo}
                        />


                    ): currentPath === '/companies' ? (   
                         <Companies
                            navigateTo={navigateTo}
                        />

                    )  : currentPath === '/companies/create' ? (

                        <CreateCompany
                            navigateTo={navigateTo}
                        />

                    ) : editCompanyMatch ? (

                        <EditCompany
                            companyId={editCompanyMatch[1]}
                            navigateTo={navigateTo}
                        />

                    ): (

                        <Dashboard />

                    )}

                </div>

            </main>


            {/* FOOTER */}

            <Footer />

        </div>
    );
}


const rootElement = document.getElementById('app');

if (rootElement) {

    createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

}