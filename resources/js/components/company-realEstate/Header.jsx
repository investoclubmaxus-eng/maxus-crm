import React, { useEffect, useRef, useState } from "react";
import {
    Menu,
    Search,
    Bell,
    Sun,
    Moon,
    Globe,
    ChevronDown,
    User,
    Lock,
    LogOut,
    CheckCircle,
    Building2,
    ShieldCheck,
    Settings,
    X,
} from "lucide-react";

import useTheme from "../../hooks/useTheme";
import api from "../../services/api";
import "./Header.css";

const getUserInitials = (name) => {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);

    if (nameParts.length === 0) {
        return "NA";
    }

    if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
    }

    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
};

export default function Header({
    onMenuClick,
    onProfileClick,
    onLogout,
    adminName = "Super Admin",
    adminRole = "Administrator",
}) {
    const { isDark, toggleTheme } = useTheme();

    const [search, setSearch] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showLanguage, setShowLanguage] = useState(false);
    const [mobileSearch, setMobileSearch] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [headerUser, setHeaderUser] = useState({
        name: adminName,
        userType: adminRole,
        avatar: "",
    });

    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const languageRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        const fetchHeaderUser = async () => {
            try {
                const response = await api.get("/user");
                const user = response.data.user;

                setHeaderUser({
                    name: user.name || adminName,
                    userType: user.user_type || adminRole,
                    avatar: user.avatar || "",
                });
            } catch {
                setHeaderUser({
                    name: adminName,
                    userType: adminRole,
                    avatar: "",
                });
            }
        };

        fetchHeaderUser();
    }, [adminName, adminRole]);

    const headerInitials = getUserInitials(headerUser.name);


    

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    const notifications = [
        {
            id: 1,
            title: "New Company Registered",
            message: "A new company has been added to the platform.",
            time: "2 min ago",
            icon: Building2,
            type: "blue",
        },
        {
            id: 2,
            title: "Admin Added",
            message: "A new administrator has been created.",
            time: "15 min ago",
            icon: User,
            type: "green",
        },
        {
            id: 3,
            title: "System Update",
            message: "New system features are available.",
            time: "1 hour ago",
            icon: Settings,
            type: "orange",
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Search Shortcut
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleKeyboardShortcut = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();

                searchRef.current?.focus();
            }

            if (event.key === "Escape") {
                setShowNotifications(false);
                setShowProfile(false);
                setShowLanguage(false);
                setMobileSearch(false);
            }
        };

        document.addEventListener("keydown", handleKeyboardShortcut);

        return () => {
            document.removeEventListener("keydown", handleKeyboardShortcut);
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Close Dropdowns When Clicking Outside
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setShowProfile(false);
            }

            if (
                languageRef.current &&
                !languageRef.current.contains(event.target)
            ) {
                setShowLanguage(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const handleSearch = (event) => {
        event.preventDefault();

        const value = search.trim();

        if (!value) {
            return;
        }

        console.log("Super Admin Search:", value);

        // Later:
        // navigate(`/super-admin/search?q=${encodeURIComponent(value)}`);
    };

    // time date set to here  section 
   /*
|--------------------------------------------------------------------------
| Dynamic Date & Time Settings
|--------------------------------------------------------------------------
*/

const [currentDateTime, setCurrentDateTime] = useState(new Date());

const [dateTimeSettings, setDateTimeSettings] = useState({
    timezone: "Asia/Kolkata",
    dateFormat: "d M Y",
    timeFormat: "12",
});

useEffect(() => {
    const loadDateTimeSettings = async () => {
        try {
            const response = await api.get(
                "/superadmin/settings/date-time"
            );

            const data = response.data?.data;

            if (data) {
                setDateTimeSettings({
                    timezone:
                        data.timezone || "Asia/Kolkata",

                    dateFormat:
                        data.date_format || "d M Y",

                    timeFormat:
                        String(data.time_format || "12"),
                });
            }
        } catch (error) {
            console.error(
                "Unable to load Date & Time settings:",
                error
            );
        }
    };

    loadDateTimeSettings();
}, []);


/*
|--------------------------------------------------------------------------
| Live Clock
|--------------------------------------------------------------------------
*/

useEffect(() => {
    const timer = setInterval(() => {
        setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
}, []);


/*
|--------------------------------------------------------------------------
| Format Date According To CRM Setting
|--------------------------------------------------------------------------
*/

const formatHeaderDate = () => {
    const timezone = dateTimeSettings.timezone;

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).formatToParts(currentDateTime);

    const day =
        parts.find((item) => item.type === "day")?.value || "";

    const month =
        parts.find((item) => item.type === "month")?.value || "";

    const year =
        parts.find((item) => item.type === "year")?.value || "";

    const numericParts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).formatToParts(currentDateTime);

    const numericDay =
        numericParts.find(
            (item) => item.type === "day"
        )?.value || "";

    const numericMonth =
        numericParts.find(
            (item) => item.type === "month"
        )?.value || "";

    switch (dateTimeSettings.dateFormat) {
        case "d M Y":
            return `${day} ${month} ${year}`;

        case "d/m/Y":
            return `${numericDay}/${numericMonth}/${year}`;

        case "m/d/Y":
            return `${numericMonth}/${numericDay}/${year}`;

        case "Y-m-d":
            return `${year}-${numericMonth}-${numericDay}`;

        case "d-m-Y":
            return `${numericDay}-${numericMonth}-${year}`;

        default:
            return `${day} ${month} ${year}`;
    }
};


/*
|--------------------------------------------------------------------------
| Format Time According To CRM Setting
|--------------------------------------------------------------------------
*/

const formatHeaderTime = () => {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: dateTimeSettings.timezone,

        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",

        hour12:
            dateTimeSettings.timeFormat === "12",
    }).format(currentDateTime);
};


/*
|--------------------------------------------------------------------------
| Header Date & Time
|--------------------------------------------------------------------------
*/

const headerDateTime =
    `${formatHeaderDate()}, ${formatHeaderTime()}`;

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            await api.post("/logout");
        } finally {
            localStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_token");
            setIsLoggingOut(false);
            onLogout();
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <header className="super-admin-header">

            {/* -------------------------------------------------------------
                Mobile Search Overlay
            -------------------------------------------------------------- */}

            {mobileSearch && (
                <div className="mobile-search-wrapper">
                    <form
                        className="mobile-search-form"
                        onSubmit={handleSearch}
                    >
                        <Search size={19} />

                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search anything..."
                            autoFocus
                        />

                        <button
                            type="button"
                            className="mobile-search-close"
                            onClick={() => setMobileSearch(false)}
                        >
                            <X size={20} />
                        </button>
                    </form>
                </div>
            )}

            {/* -------------------------------------------------------------
                Left Section
            -------------------------------------------------------------- */}

            <div className="header-left">

                <button
                    type="button"
                    className="header-menu-button"
                    onClick={onMenuClick}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={22} />
                </button>

                
                <div className="header-datetime">
                    <span style={{ fontWeight: 700 }}>
                        {headerDateTime}
                    </span>

                    <small>
                        {dateTimeSettings.timezone}
                    </small>
                </div>

            </div>

            {/* -------------------------------------------------------------
                Desktop Search
            -------------------------------------------------------------- */}

            <div className="header-search-container">

                <form
                    className="header-search"
                    onSubmit={handleSearch}
                >
                    <Search
                        size={19}
                        className="header-search-icon"
                    />

                    <input
                        ref={searchRef}
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search anything..."
                    />

                    <span className="search-shortcut">
                        Ctrl K
                    </span>
                </form>

            </div>

            {/* -------------------------------------------------------------
                Right Section
            -------------------------------------------------------------- */}

            <div className="header-right">

                {/* Mobile Search */}

                <button
                    type="button"
                    className="header-icon-button mobile-search-button"
                    onClick={() => setMobileSearch(true)}
                    aria-label="Search"
                >
                    <Search size={20} />
                </button>

                {/* ---------------------------------------------------------
                    Notifications
                ---------------------------------------------------------- */}

                <div
                    className="header-dropdown-wrapper"
                    ref={notificationRef}
                >
                    <button
                        type="button"
                        className={`header-icon-button ${
                            showNotifications ? "active" : ""
                        }`}
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfile(false);
                            setShowLanguage(false);
                        }}
                        aria-label="Notifications"
                    >
                        <Bell size={20} />

                        <span className="notification-badge">
                            3
                        </span>
                    </button>

                    {showNotifications && (
                        <div className="header-dropdown notification-dropdown">

                            <div className="dropdown-header">
                                <div className="profile-dropdown-information">
                                    <h3>Notifications</h3>
                                    <span>3 unread notifications</span>
                                </div>

                                <div className="notification-header-actions">
                                    <button type="button">
                                        View All
                                    </button>

                                    <button
                                        type="button"
                                        className="notification-close-button"
                                        onClick={() => setShowNotifications(false)}
                                        aria-label="Close notifications"
                                        title="Close"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="notification-list">

                                {notifications.map((notification) => {
                                    const Icon = notification.icon;

                                    return (
                                        <button
                                            type="button"
                                            className="notification-item"
                                            key={notification.id}
                                        >
                                            <div
                                                className={`notification-icon ${notification.type}`}
                                            >
                                                <Icon size={17} />
                                            </div>

                                            <div className="notification-content">
                                                <strong>
                                                    {notification.title}
                                                </strong>

                                                <p>
                                                    {notification.message}
                                                </p>

                                                <span>
                                                    {notification.time}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}

                            </div>

                            <div className="notification-footer">
                                <button type="button">
                                    Mark all as read
                                </button>
                            </div>

                        </div>
                    )}
                </div>

                {/* ---------------------------------------------------------
                    Theme
                ---------------------------------------------------------- */}

                <button
                    type="button"
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    title={
                        isDark
                            ? "Switch to light mode"
                            : "Switch to dark mode"
                    }
                >
                    <span
                        className={
                            !isDark
                                ? "theme-option active"
                                : "theme-option"
                        }
                    >
                        <Sun size={16} />
                    </span>

                    <span
                        className={
                            isDark
                                ? "theme-option active"
                                : "theme-option"
                        }
                    >
                        <Moon size={16} />
                    </span>
                </button>

                {/* ---------------------------------------------------------
                    Language
                ---------------------------------------------------------- */}

               
                <div
                        className="header-dropdown-wrapper language-wrapper"
                        ref={languageRef}
                    >
                        <button
                            type="button"
                            className={`language-button ${
                                showLanguage ? "active" : ""
                            }`}
                            onClick={() => {
                                setShowLanguage(!showLanguage);
                                setShowNotifications(false);
                                setShowProfile(false);
                            }}
                        >
                            <Globe size={18} />

                            <span>English</span>

                            <ChevronDown size={15} />
                        </button>

                        {showLanguage && (
                            <div className="header-dropdown language-dropdown">

                                {/* POPUP HEADER */}
                                <div className="language-dropdown-header">

                                    <span>Select Language</span>

                                    <button
                                        type="button"
                                        className="language-close-button"
                                        onClick={() => setShowLanguage(false)}
                                        aria-label="Close language menu"
                                    >
                                        <X size={16} />
                                    </button>

                                </div>

                                {/* LANGUAGES */}
                                <div className="language-options">

                                    <button
                                        type="button"
                                        className="language-option active"
                                        onClick={() => setShowLanguage(false)}
                                    >
                                        <span>English</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="language-option"
                                        onClick={() => setShowLanguage(false)}
                                    >
                                        <span>Hindi</span>
                                    </button>

                                </div>

                            </div>
                        )}
                </div>

                {/* ---------------------------------------------------------
                    Profile
                ---------------------------------------------------------- */}

                <div
                    className="header-dropdown-wrapper"
                    ref={profileRef}
                >
                    <button
                        type="button"
                        className={`profile-button ${
                            showProfile ? "active" : ""
                        }`}
                        onClick={() => {
                            setShowProfile(!showProfile);
                            setShowNotifications(false);
                            setShowLanguage(false);
                        }}
                    >

                        <div className="profile-avatar">
                            {headerUser.avatar ? (
                                <img
                                    src={headerUser.avatar}
                                    alt={`${headerUser.name} profile`}
                                />
                            ) : (
                                headerInitials
                            )}
                        </div>

                        <div className="profile-information">
                            <strong>
                                {headerUser.name}
                            </strong>

                            <span>
                                {headerUser.userType}
                            </span>
                        </div>

                        <ChevronDown size={16} />

                    </button>

                    {showProfile && (
                        <div className="header-dropdown profile-dropdown">

                            <div className="profile-dropdown-heading">
                                <div className="profile-avatar large">
                                    {headerUser.avatar ? (
                                        <img
                                            src={headerUser.avatar}
                                            alt={`${headerUser.name} profile`}
                                        />
                                    ) : (
                                        headerInitials
                                    )}
                                </div>

                                <div className="profile-dropdown-information">
                                    <strong>
                                        {headerUser.name}
                                    </strong>

                                    <span>
                                        {headerUser.userType}
                                    </span>
                                </div>

                                 {/* CLOSE BUTTON */}
                             
                                <button
                                    type="button"
                                    className="profile-dropdown-close"
                                    onClick={() => setShowProfile(false)}
                                    aria-label="Close profile menu"
                                >
                                    <X size={17} />
                                </button>
                            

                            </div>

                            <div className="dropdown-divider" />

                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfile(false);
                                    onProfileClick();
                                }}
                            >
                                <User size={17} />
                                <span>Profile</span>
                            </button>


                            <div className="dropdown-divider" />

                            <button
                                type="button"
                                className="logout-button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                            >
                                <LogOut size={17} />
                                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                            </button>

                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}