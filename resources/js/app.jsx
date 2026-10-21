import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

/*
|--------------------------------------------------------------------------
| Super Admin Imports
|--------------------------------------------------------------------------
*/

import SuperAdminHeader    from './components/super-admin/Header';
import SuperAdminSidebar   from './components/super-admin/Sidebar';
import SuperAdminBreadcrumb from './components/super-admin/Breadcrumb';
import SuperAdminFooter    from './components/super-admin/Footer';

import Dashboard         from './pages/super-admin/Dashboard';
import Login             from './pages/super-admin/auth/Login';
import ForgotPassword    from './pages/super-admin/auth/ForgotPassword';
import Profile           from './pages/super-admin/auth/Profile';
import SystemSettings    from './pages/super-admin/SystemSettings';
import GeneralSettings   from "./pages/super-admin/settings/GeneralSettings";
import DateTimeSettings  from "./pages/super-admin/settings/DateTimeSettings";
import EmailSMTP         from "./pages/super-admin/settings/EmailSMTP";
import FileStorage       from "./pages/super-admin/settings/FileStorage";
import SecuritySettings  from "./pages/super-admin/settings/SecuritySettings";
import ResetPassword     from "./pages/super-admin/auth/ResetPassword";
import Maintenance       from './pages/super-admin/settings/Maintenance';
import EmailDraftFormat  from './pages/super-admin/settings/EmailDraftFormat';
import CreateCompany     from './pages/super-admin/company/CreateCompany';
import EditCompany       from './pages/super-admin/company/EditCompany';
import Companies         from './pages/super-admin/company/Companies';
import CreateAdmin       from './pages/super-admin/admins/CreateAdmin';
import Admins            from './pages/super-admin/admins/Admins';
import EditAdmin         from './pages/super-admin/admins/EditAdmin';
import './pages/super-admin/settings/SettingsVisualConsistency.css';

/*
|--------------------------------------------------------------------------
| Company Real Estate Admin Imports
|--------------------------------------------------------------------------
*/

import CompanyHeader    from './components/company-realEstate/Header';
import CompanySidebar   from './components/company-realEstate/Sidebar';
import CompanyBreadcrumb from './components/company-realEstate/Breadcrumb';
import CompanyFooter    from './components/company-realEstate/Footer';
import CompanyDashboard from './pages/company-realEstate/Dashboard';
import CompanyProfile   from './pages/company-realEstate/admins/Profile';
import Branches         from './pages/company-realEstate/branches/Branches';
import CreateBranch     from './pages/company-realEstate/branches/CreateBranch';
import ViewBranch       from './pages/company-realEstate/branches/ViewBranch';
import SubAdmins        from './pages/company-realEstate/sub-admins/SubAdmins';
import CreateSubAdmin   from './pages/company-realEstate/sub-admins/CreateSubAdmin';
import ViewSubAdmin     from './pages/company-realEstate/sub-admins/ViewSubAdmin';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Read the stored user_type from storage.
 * Returns 'super_admin' | 'admin' | null
 */
function getStoredUserType() {
    try {
        const raw =
            localStorage.getItem('user') ||
            sessionStorage.getItem('user');
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (!user?.user_type) return null;
        return String(user.user_type).toLowerCase().replace(/\s+/g, '_');
    } catch {
        return null;
    }
}

/**
 * Read active company from storage.
 */
function getStoredCompany() {
    try {
        const raw =
            localStorage.getItem('active_company') ||
            sessionStorage.getItem('active_company');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

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

    const [userType, setUserType] = useState(getStoredUserType);


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
    | After login the Login page stores the user object in storage.
    | We read user_type to decide which layout to use.
    */

    const handleLogin = (user, company) => {

        setIsAuthenticated(true);

        const rawType = user?.user_type || getStoredUserType();
        const type = rawType
            ? String(rawType).toLowerCase().replace(/\s+/g, '_')
            : null;

        setUserType(type);

        if (type === 'admin') {
            navigateTo('/company/dashboard');
        } else {
            navigateTo('/dashboard');
        }
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
        sessionStorage.removeItem('user');

        localStorage.removeItem('active_company');
        sessionStorage.removeItem('active_company');

        setIsAuthenticated(false);
        setUserType(null);

        navigateTo('/');
    };


    /*
    |--------------------------------------------------------------------------
    | Public Pages (shared for both admin types)
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
    | Company Admin Pages
    |--------------------------------------------------------------------------
    */

    const isCompanyAppPage =
        currentPath === '/company/dashboard' ||
        currentPath.startsWith('/company/');

    /*
    |--------------------------------------------------------------------------
    | Super Admin Protected Pages
    |--------------------------------------------------------------------------
    */

    const editAdminMatch = currentPath.match(
        /^\/administrators\/(\d+)\/edit$/
    );
    const isAdministratorPage =
        currentPath === '/administrators' ||
        currentPath === '/administrators/create' ||
        Boolean(editAdminMatch);
    const isSuperAdminAppPage = [
        '/dashboard',
        '/profile',
        '/profile/projects',
    ].includes(currentPath) || currentPath.startsWith('/system-settings')
    || currentPath === '/companies'
    || currentPath === '/companies/create'
    || currentPath.startsWith('/companies/')
    || isAdministratorPage;
    const editCompanyMatch = currentPath.match(
        /^\/companies\/(\d+)\/edit$/
    );

    const isAppPage = isSuperAdminAppPage || isCompanyAppPage;


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
    | Sidebar Toggle Handler (shared)
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
    | Company Real Estate Admin Layout
    |--------------------------------------------------------------------------
    */

    if (isCompanyAppPage || userType === 'admin') {

        const storedUser = JSON.parse(
            localStorage.getItem('user') ||
            sessionStorage.getItem('user') ||
            '{}'
        );

        const storedCompany = getStoredCompany();

        return (

            <div
                className={`company-re-app ${
                    sidebarCollapsed
                        ? 'company-re-app--sidebar-collapsed'
                        : ''
                }`}
            >

                {/* HEADER */}

                <CompanyHeader
                    onMenuClick={handleMenuClick}
                    onProfileClick={() => navigateTo('/company/profile')}
                    onLogout={handleLogout}
                    adminName={storedUser.name || 'Company Admin'}
                    adminRole={storedCompany?.name || 'Administrator'}
                />


                {/* SIDEBAR */}

                <CompanySidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onClose={handleSidebarClose}
                    onNavigate={navigateTo}
                    currentPath={currentPath}
                    company={storedCompany}
                />


                {/* MAIN */}

                <main className="company-re-main">

                    {(() => {
                        const editBranchMatch = currentPath.match(/^\/company\/branches\/(\d+)\/edit$/);
                        const isBranchEdit = Boolean(editBranchMatch);
                        const viewBranchMatch = currentPath.match(/^\/company\/branches\/(\d+)(\/view)?$/);
                        const isBranchView = Boolean(viewBranchMatch) && !isBranchEdit;
                        const isBranchCreate = currentPath === '/company/branches/create';
                        const isBranchList = currentPath === '/company/branches';

                        const editSubAdminMatch = currentPath.match(/^\/company\/sub-admins\/(\d+)\/edit$/);
                        const isSubAdminEdit = Boolean(editSubAdminMatch);
                        const viewSubAdminMatch = currentPath.match(/^\/company\/sub-admins\/(\d+)(\/view)?$/);
                        const isSubAdminView = Boolean(viewSubAdminMatch) && !isSubAdminEdit;
                        const isSubAdminCreate = currentPath === '/company/sub-admins/create';
                        const isSubAdminList = currentPath === '/company/sub-admins';

                        let breadcrumbTitle = storedCompany?.name
                            ? `${storedCompany.name} Dashboard`
                            : "Company Dashboard";
                        let breadcrumbItems = [
                            { label: 'Dashboard', path: '/company/dashboard' },
                        ];

                        if (currentPath.startsWith('/company/profile')) {
                            breadcrumbTitle = "My Profile";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Profile', path: '/company/profile' },
                            ];
                        } else if (isBranchCreate) {
                            breadcrumbTitle = "Create Branch";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Branches', path: '/company/branches' },
                                { label: 'Create', path: '/company/branches/create' },
                            ];
                        } else if (isBranchEdit) {
                            breadcrumbTitle = "Edit Branch";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Branches', path: '/company/branches' },
                                { label: 'Edit', path: currentPath },
                            ];
                        } else if (isBranchView) {
                            breadcrumbTitle = "Branch Details";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Branches', path: '/company/branches' },
                                { label: 'Details', path: currentPath },
                            ];
                        } else if (isBranchList) {
                            breadcrumbTitle = "Branches";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Branches', path: '/company/branches' },
                            ];
                        } else if (isSubAdminCreate) {
                            breadcrumbTitle = "Create Sub Admin";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Sub Admins', path: '/company/sub-admins' },
                                { label: 'Create', path: '/company/sub-admins/create' },
                            ];
                        } else if (isSubAdminEdit) {
                            breadcrumbTitle = "Edit Sub Admin";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Sub Admins', path: '/company/sub-admins' },
                                { label: 'Edit', path: currentPath },
                            ];
                        } else if (isSubAdminView) {
                            breadcrumbTitle = "Sub Admin Details";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Sub Admins', path: '/company/sub-admins' },
                                { label: 'Details', path: currentPath },
                            ];
                        } else if (isSubAdminList) {
                            breadcrumbTitle = "Sub Admins";
                            breadcrumbItems = [
                                { label: 'Dashboard', path: '/company/dashboard' },
                                { label: 'Sub Admins', path: '/company/sub-admins' },
                            ];
                        }

                        return (
                            <>
                                <CompanyBreadcrumb
                                    title={breadcrumbTitle}
                                    items={breadcrumbItems}
                                />

                                <div className="company-re-page">
                                    {currentPath.startsWith('/company/profile') ? (
                                        <CompanyProfile
                                            currentPath={currentPath}
                                            onNavigate={navigateTo}
                                        />
                                    ) : isBranchCreate ? (
                                        <CreateBranch
                                            navigateTo={navigateTo}
                                            mode="create"
                                            company={storedCompany}
                                        />
                                    ) : isBranchEdit ? (
                                        <CreateBranch
                                            navigateTo={navigateTo}
                                            mode="edit"
                                            branchId={editBranchMatch[1]}
                                            company={storedCompany}
                                        />
                                    ) : isBranchView ? (
                                        <ViewBranch
                                            navigateTo={navigateTo}
                                            branchId={viewBranchMatch[1]}
                                            company={storedCompany}
                                        />
                                    ) : isBranchList ? (
                                        <Branches
                                            navigateTo={navigateTo}
                                            company={storedCompany}
                                        />
                                    ) : isSubAdminCreate ? (
                                        <CreateSubAdmin
                                            navigateTo={navigateTo}
                                            mode="create"
                                            company={storedCompany}
                                        />
                                    ) : isSubAdminEdit ? (
                                        <CreateSubAdmin
                                            navigateTo={navigateTo}
                                            mode="edit"
                                            subAdminId={editSubAdminMatch[1]}
                                            company={storedCompany}
                                        />
                                    ) : isSubAdminView ? (
                                        <ViewSubAdmin
                                            navigateTo={navigateTo}
                                            subAdminId={viewSubAdminMatch[1]}
                                            company={storedCompany}
                                        />
                                    ) : isSubAdminList ? (
                                        <SubAdmins
                                            navigateTo={navigateTo}
                                            company={storedCompany}
                                        />
                                    ) : (
                                        <CompanyDashboard company={storedCompany} />
                                    )}
                                </div>
                            </>
                        );
                    })()}

                </main>


                {/* FOOTER */}

                <CompanyFooter />

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Super Admin Layout
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

            <SuperAdminHeader
                onMenuClick={handleMenuClick}
                onProfileClick={() => navigateTo('/profile')}
                onLogout={handleLogout}
                adminName="Super Admin"
                adminRole="Administrator"
            />


            {/* SIDEBAR */}

            <SuperAdminSidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                onClose={handleSidebarClose}
                onNavigate={navigateTo}
                currentPath={currentPath}
            />


            {/* MAIN */}

            <main className="super-admin-main">

                <SuperAdminBreadcrumb
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

                    ) : currentPath === '/administrators/create' ? (

                        <CreateAdmin
                            onBack={() => navigateTo('/administrators')}
                        />

                    ) : currentPath === '/administrators' ? (

                        <Admins navigateTo={navigateTo} />

                    ) : editAdminMatch ? (

                        <EditAdmin
                            adminId={editAdminMatch[1]}
                            navigateTo={navigateTo}
                        />

                    ): (

                        <Dashboard />

                    )}

                </div>

            </main>


            {/* FOOTER */}

            <SuperAdminFooter />

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