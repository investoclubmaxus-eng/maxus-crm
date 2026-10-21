import React, { useEffect, useState } from "react";


import {
    LayoutDashboard,
    Building2,
    Users,
    ShieldCheck,
    BarChart3,
    Settings,
    Activity,
    GitBranch,
    ChevronDown,
    ChevronRight,
    X,
} from "lucide-react";

import api from "../../services/api";

import "./Sidebar.css";

export default function Sidebar({
    isOpen,
    isCollapsed,
    onClose,
    onNavigate,
    currentPath,
    company,
}) {
    const activeCompany = company || (() => {
        try {
            const raw =
                localStorage.getItem("active_company") ||
                sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const getCompanyLogoUrl = (rawPath) => {
        if (!rawPath || typeof rawPath !== "string") return null;
        const path = rawPath.trim();
        if (!path) return null;
        if (/^https?:\/\//i.test(path)) return path;
        if (path.startsWith("/")) return path;
        return `/storage/${path}`;
    };

    const companyLogo = getCompanyLogoUrl(
        activeCompany?.logo_url || activeCompany?.logo_path
    );
    const companyName =
        activeCompany?.name || "Company";
    const companyInitial =
        companyName.trim().charAt(0).toUpperCase() || "C";
    /*
    |--------------------------------------------------------------------------
    | General Settings
    |--------------------------------------------------------------------------
    */

    const [generalSettings, setGeneralSettings] = useState({
        applicationName: "MAXUS",
        logoUrl: null,
    });

    const [isMobile, setIsMobile] = useState(
        window.innerWidth <= 768
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    /*
|--------------------------------------------------------------------------
| Sidebar Collapse Behaviour
|--------------------------------------------------------------------------
|
| Desktop / Laptop / Tablet:
|    effectiveCollapsed controls the sidebar.
|
| Mobile:
|    Sidebar is always expanded.
|
*/

const effectiveCollapsed = isMobile
    ? false
    : isCollapsed;

    /*
    |--------------------------------------------------------------------------
    | Load General Settings
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        let isMounted = true;

        const loadGeneralSettings = async () => {
            try {
                const response = await api.get(
                    "/superadmin/settings/general"
                );

                const data = response.data?.data;

                if (!data || !isMounted) {
                    return;
                }

                setGeneralSettings({
                    applicationName:
                        data.application_name || "MAXUS",

                    logoUrl:
                        data.logo_url || null,
                });
            } catch (error) {
                console.error(
                    "Unable to load general settings for sidebar:",
                    error
                );
            }
        };

        loadGeneralSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Open Menus
    |--------------------------------------------------------------------------
    */

    const [openMenus, setOpenMenus] = useState({
        companies: false,
        administrators: false,
        reports: false,
        systemSettings: false,
    });

    /*
    |--------------------------------------------------------------------------
    | Active Menu
    |--------------------------------------------------------------------------
    */

    const [activeItem, setActiveItem] = useState("dashboard");

    useEffect(() => {
        if (currentPath?.startsWith("/company/branches")) {
            setActiveItem("branches");
            return;
        }

        if (currentPath?.startsWith("/company/sub-admins")) {
            setActiveItem("sub-admins");
            return;
        }

        if (currentPath === "/company/dashboard") {
            setActiveItem("dashboard");
            return;
        }

        if (!currentPath?.startsWith("/companies")) {
            return;
        }

        setActiveItem("companies");
        setOpenMenus((previous) => ({
            ...previous,
            companies: true,
        }));
    }, [currentPath]);

    useEffect(() => {
        if (!currentPath?.startsWith("/administrators")) {
            return;
        }

        setOpenMenus((previous) => ({
            ...previous,
            administrators: true,
        }));
    }, [currentPath]);

    useEffect(() => {
        const systemSettingKeys = [
            "general-settings",
            "date-time",
            "email-smtp",
            "file-storage",
            "maintenance",
            "security",
            "email-draft-format",
            "settings",
            'system-settings'
        ];

        // If the active item belongs to system settings, open the menu. Otherwise, close it.
        if (systemSettingKeys.includes(activeItem)) {
            setOpenMenus(prev => ({ ...prev, systemSettings: true }));
        } else {
            setOpenMenus(prev => ({ ...prev, systemSettings: false }));
        }
    }, [activeItem]);

    const handleSystemSettingsClick = () => {
        setActiveItem("settings");

        // Always open System Settings submenu
        setOpenMenus((previous) => ({
            ...previous,
            systemSettings: true,
        }));

        // Navigate to main System Settings page
        onNavigate?.("/system-settings");

        // Close sidebar on mobile
        if (window.innerWidth <= 768 && onClose) {
            onClose();
        }
    };
            

    /*
    |--------------------------------------------------------------------------
    | Toggle Menu
    |--------------------------------------------------------------------------
    */

    const toggleMenu = (menu) => {
        setOpenMenus((previous) => ({
            ...previous,
            [menu]: !previous[menu],
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Navigation
    |--------------------------------------------------------------------------
    */

    const handleNavigation = (item) => {
        setActiveItem(item);

        const paths = {
            dashboard: "/company/dashboard",
            branches: "/company/branches",
            "sub-admins": "/company/sub-admins",

            companies: "/companies",
            administrators: "/administrators",
            reports: "/reports",
            activity: "/activity-logs",

            settings: "/system-settings",

            "general-settings":
                "/system-settings/general",

            "date-time":
                "/system-settings/date-time",

            "email-smtp":
                "/system-settings/email-smtp",

            "file-storage":
                "/system-settings/file-storage",

            maintenance:
                "/system-settings/maintenance",

            security:
                "/system-settings/security",

            "email-draft-format":
                "/system-settings/email-drafts",
        };

        if (paths[item]) {
            onNavigate?.(paths[item]);
        }

        /*
        |--------------------------------------------------------------------------
        | Close mobile sidebar
        |--------------------------------------------------------------------------
        */

        if (window.innerWidth <= 768 && onClose) {
            onClose();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <>
            {/* Mobile Overlay */}

            {isOpen && (
                <div
                    className="company-re-sidebar-overlay"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}

            <aside
                className={`
                    company-re-sidebar
                    ${isOpen ? "company-re-sidebar--open" : ""}
                    ${
                        effectiveCollapsed
                            ? "company-re-sidebar--collapsed"
                            : ""
                    }
                `}
            >
                {/* =====================================================
                    SIDEBAR HEADER
                ====================================================== */}

                <div className="company-re-sidebar__header">
                    <div className="company-re-sidebar__brand">

                        {/* =====================================================
                            EXPANDED / COLLAPSED BRAND
                        ====================================================== */}
                        {!effectiveCollapsed ? (
                            <>
                                <div className="company-re-sidebar__brand-logo company-re-sidebar__brand-logo--image">
                                    {companyLogo ? (
                                        <img
                                            src={companyLogo}
                                            alt={companyName}
                                            className="company-re-sidebar__logo-image"
                                        />
                                    ) : (
                                        <div className="company-re-sidebar__fallback-logo">
                                            {companyInitial}
                                        </div>
                                    )}
                                </div>

                                <div className="company-re-sidebar__brand-text">
                                    <strong>{companyName}</strong>
                                    <span>{activeCompany?.industry || "Real Estate"}</span>
                                </div>
                            </>
                        ) : (
                            /* =================================================
                            COLLAPSED SIDEBAR
                            ================================================== */
                            <div className="company-re-sidebar__brand-logo company-re-sidebar__brand-logo--collapsed">
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt={companyName}
                                        className="company-re-sidebar__logo-image"
                                    />
                                ) : (
                                    <span>{companyInitial}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button */}

                    <button
                        type="button"
                        className="company-re-sidebar__close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* =====================================================
                    SIDEBAR NAVIGATION
                ====================================================== */}

                <nav className="company-re-sidebar__nav">

                    {/* =================================================
                        DASHBOARD
                    ================================================== */}

                    <button
                        type="button"
                        className={`
                            company-re-sidebar__item
                            ${
                                activeItem === "dashboard"
                                    ? "active"
                                    : ""
                            }
                        `}
                        onClick={() =>
                            handleNavigation("dashboard")
                        }
                    >
                        <LayoutDashboard size={19} />

                        {!effectiveCollapsed && (
                            <span>Dashboard</span>
                        )}
                    </button>

                    {/* =================================================
                        BRANCHES
                    ================================================== */}

                    <button
                        type="button"
                        className={`
                            company-re-sidebar__item
                            ${
                                activeItem === "branches"
                                    ? "active"
                                    : ""
                            }
                        `}
                        onClick={() =>
                            handleNavigation("branches")
                        }
                    >
                        <GitBranch size={19} />

                        {!effectiveCollapsed && (
                            <span>Branches</span>
                        )}
                    </button>

                    {/* =================================================
                        SUB ADMINS
                    ================================================== */}

                    <button
                        type="button"
                        className={`
                            company-re-sidebar__item
                            ${
                                activeItem === "sub-admins"
                                    ? "active"
                                    : ""
                            }
                        `}
                        onClick={() =>
                            handleNavigation("sub-admins")
                        }
                    >
                        <Users size={19} />

                        {!effectiveCollapsed && (
                            <span>Sub Admins</span>
                        )}
                    </button>

                   {/* =================================================
    COMPANIES
================================================== */}


                    {/* =================================================
                        ADMINISTRATORS
                    ================================================== */}

                   

                    {/* =================================================
                        ACCESS / SECURITY
                    ================================================== */}

                   

                    {/* =================================================
                        REPORTS
                    ================================================== */}

                    

                    {/* =================================================
                        ACTIVITY LOG
                    ================================================== */}

                   

                    {/* =================================================
                        SYSTEM SETTINGS
                    ================================================== */}

                    
                </nav>
            </aside>
        </>
    );
}
