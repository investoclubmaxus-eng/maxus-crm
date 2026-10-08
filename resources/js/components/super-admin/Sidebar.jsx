import React, { useEffect, useState } from "react";


import {
    LayoutDashboard,
    Building2,
    Users,
    ShieldCheck,
    BarChart3,
    Settings,
    Activity,
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
}) {
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
            dashboard: "/dashboard",

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
                    className="super-admin-sidebar-overlay"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}

            <aside
                className={`
                    super-admin-sidebar
                    ${isOpen ? "super-admin-sidebar--open" : ""}
                    ${
                        effectiveCollapsed
                            ? "super-admin-sidebar--collapsed"
                            : ""
                    }
                `}
            >
                {/* =====================================================
                    SIDEBAR HEADER
                ====================================================== */}

                <div className="super-admin-sidebar__header">
                    <div className="super-admin-sidebar__brand">
    
                        {/* =====================================================
                            EXPANDED SIDEBAR
                            Show application logo
                        ====================================================== */}
                        {!effectiveCollapsed  ? (
                            <div className="super-admin-sidebar__brand-logo super-admin-sidebar__brand-logo--image">
                            </div>
                        ) : (
                            /* =================================================
                            COLLAPSED SIDEBAR
                            Show only M
                            ================================================== */
                            <div className="super-admin-sidebar__brand-logo super-admin-sidebar__brand-logo--collapsed">
                                <span>M</span>
                            </div>
                        )}

                        {/* =====================================================
                            APPLICATION NAME
                            Only visible when sidebar is expanded
                        ====================================================== */}
                        {!effectiveCollapsed && (
                            <div className="super-admin-sidebar__brand-text">
                                <strong>
                                    <img
                                        src={generalSettings.logoUrl}
                                        alt={
                                            generalSettings.applicationName ||
                                            "Maxus CRM"
                                        }
                                        className="super-admin-sidebar__logo-image"
                                    />
                                </strong>

                                <span>
                                    {generalSettings.applicationName || "Maxus CRM"}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mobile Close Button */}

                    <button
                        type="button"
                        className="super-admin-sidebar__close"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* =====================================================
                    SIDEBAR NAVIGATION
                ====================================================== */}

                <nav className="super-admin-sidebar__nav">

                    {/* =================================================
                        DASHBOARD
                    ================================================== */}

                    <button
                        type="button"
                        className={`
                            super-admin-sidebar__item
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
    COMPANIES
================================================== */}

<div className="super-admin-sidebar__menu-group">

    <button
        type="button"
        className={`super-admin-sidebar__item super-admin-sidebar__item--parent ${
            currentPath?.startsWith("/companies") ? "active" : ""
        }`}
        onClick={() => toggleMenu("companies")}
    >
        <Building2 size={19} />

        {!effectiveCollapsed && (
            <>
                <span>Companies</span>

                {openMenus.companies ? (
                    <ChevronDown
                        size={17}
                        className="menu-arrow"
                    />
                ) : (
                    <ChevronRight
                        size={17}
                        className="menu-arrow"
                    />
                )}
            </>
        )}
    </button>

    {!effectiveCollapsed && openMenus.companies && (
        <div className="super-admin-sidebar__submenu">

            {/* All Companies */}

            <button
                type="button"
                className={`super-admin-sidebar__submenu-item ${
                    currentPath === "/companies" ? "active" : ""
                }`}
                onClick={() => handleNavigation("companies")}
            >
                All Companies
            </button>

            {/* Add Company */}

            <button
                type="button"
                className={`super-admin-sidebar__submenu-item ${
                    currentPath === "/companies/create" ||
                    /^\/companies\/\d+\/edit$/.test(currentPath || "")
                        ? "active"
                        : ""
                }`}
                onClick={() => {
                    onNavigate?.("/companies/create");

                    if (window.innerWidth <= 768 && onClose) {
                        onClose();
                    }
                }}
            >
                Add Company
            </button>

        </div>
    )}

</div>
                    {/* =================================================
                        ADMINISTRATORS
                    ================================================== */}

                    {/* <div className="super-admin-sidebar__menu-group">

                        <button
                            type="button"
                            className="super-admin-sidebar__item super-admin-sidebar__item--parent"
                            onClick={() =>
                                toggleMenu("administrators")
                            }
                        >
                            <Users size={19} />

                            {!effectiveCollapsed && (
                                <>
                                    <span>Administrators</span>

                                    {openMenus.administrators ? (
                                        <ChevronDown
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    ) : (
                                        <ChevronRight
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    )}
                                </>
                            )}
                        </button>

                        {!effectiveCollapsed &&
                            openMenus.administrators && (
                                <div className="super-admin-sidebar__submenu">

                                    <button
                                        type="button"
                                        className="super-admin-sidebar__submenu-item"
                                        onClick={() =>
                                            handleNavigation(
                                                "administrators"
                                            )
                                        }
                                    >
                                        All Administrators
                                    </button>

                                    <button
                                        type="button"
                                        className="super-admin-sidebar__submenu-item"
                                        onClick={() =>
                                            handleNavigation(
                                                "administrators"
                                            )
                                        }
                                    >
                                        Add Administrator
                                    </button>

                                </div>
                            )}
                    </div> */}

                    {/* =================================================
                        ACCESS / SECURITY
                    ================================================== */}

                    {/* <button
                        type="button"
                        className={`
                            super-admin-sidebar__item
                            ${
                                activeItem === "access"
                                    ? "active"
                                    : ""
                            }
                        `}
                        onClick={() =>
                            setActiveItem("access")
                        }
                    >
                        <ShieldCheck size={19} />

                        {!effectiveCollapsed && (
                            <span>Access Control</span>
                        )}
                    </button> */}

                    {/* =================================================
                        REPORTS
                    ================================================== */}

                    {/* <div className="super-admin-sidebar__menu-group">

                        <button
                            type="button"
                            className="super-admin-sidebar__item super-admin-sidebar__item--parent"
                            onClick={() =>
                                toggleMenu("reports")
                            }
                        >
                            <BarChart3 size={19} />

                            {!effectiveCollapsed && (
                                <>
                                    <span>Reports</span>

                                    {openMenus.reports ? (
                                        <ChevronDown
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    ) : (
                                        <ChevronRight
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    )}
                                </>
                            )}
                        </button>

                        {!effectiveCollapsed &&
                            openMenus.reports && (
                                <div className="super-admin-sidebar__submenu">

                                    <button
                                        type="button"
                                        className="super-admin-sidebar__submenu-item"
                                        onClick={() =>
                                            handleNavigation(
                                                "reports"
                                            )
                                        }
                                    >
                                        System Reports
                                    </button>

                                    <button
                                        type="button"
                                        className="super-admin-sidebar__submenu-item"
                                        onClick={() =>
                                            handleNavigation(
                                                "reports"
                                            )
                                        }
                                    >
                                        Usage Reports
                                    </button>

                                </div>
                            )}
                    </div> */}

                    {/* =================================================
                        ACTIVITY LOG
                    ================================================== */}

                    {/* <button
                        type="button"
                        className={`
                            super-admin-sidebar__item
                            ${
                                activeItem === "activity"
                                    ? "active"
                                    : ""
                            }
                        `}
                        onClick={() =>
                            handleNavigation("activity")
                        }
                    >
                        <Activity size={19} />

                        {!effectiveCollapsed && (
                            <span>Activity Logs</span>
                        )}
                    </button> */}

                    {/* =================================================
                        SYSTEM SETTINGS
                    ================================================== */}

                    <div className="super-admin-sidebar__menu-group">

                        <button
                            type="button"
                            className={`super-admin-sidebar__item super-admin-sidebar__item--parent ${
                                activeItem === "settings" ? "active" : ""
                            }`}
                            onClick={handleSystemSettingsClick}
                        >
                            <Settings size={19} />

                            {!effectiveCollapsed && (
                                <>
                                    <span>System Settings</span>

                                    {openMenus.systemSettings ? (
                                        <ChevronDown
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    ) : (
                                        <ChevronRight
                                            size={17}
                                            className="menu-arrow"
                                        />
                                    )}
                                </>
                            )}
                        </button>

                        {/* System Settings Submenu */}

                        {!effectiveCollapsed &&
                            openMenus.systemSettings && (
                                <div className="super-admin-sidebar__submenu">

                                    {/* General */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "general-settings"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "general-settings"
                                            )
                                        }
                                    >
                                        General Settings
                                    </button>

                                    {/* Date & Time */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "date-time"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "date-time"
                                            )
                                        }
                                    >
                                        Date & Time
                                    </button>

                                    {/* Email / SMTP */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "email-smtp"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "email-smtp"
                                            )
                                        }
                                    >
                                        Email / SMTP
                                    </button>

                                    {/* File / Storage */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "file-storage"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "file-storage"
                                            )
                                        }
                                    >
                                        File / Storage
                                    </button>

                                    {/* Maintenance */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "maintenance"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "maintenance"
                                            )
                                        }
                                    >
                                        Maintenance
                                    </button>

                                    {/* Security */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "security"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "security"
                                            )
                                        }
                                    >
                                        Security
                                    </button>

                                    {/* Email Draft Format */}

                                    <button
                                        type="button"
                                        className={`
                                            super-admin-sidebar__submenu-item
                                            ${
                                                activeItem ===
                                                "email-draft-format"
                                                    ? "active"
                                                    : ""
                                            }
                                        `}
                                        onClick={() =>
                                            handleNavigation(
                                                "email-draft-format"
                                            )
                                        }
                                    >
                                        Email Draft Format
                                    </button>
                                </div>
                            )}
                    </div>
                </nav>
            </aside>
        </>
    );
}