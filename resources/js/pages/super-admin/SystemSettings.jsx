import React from "react";
import {
    Settings,
    CalendarClock,
    Mail,
    Database,
    ShieldCheck,
    Wrench,
    FilePenLine,
    ArrowRight,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";

import "./SystemSettings.css";

const settingsItems = [
    {
        id: "general",
        title: "General Settings",
        description:
            "Manage application name, logo, favicon, support contact and basic system information.",
        icon: Settings,
        className: "settings-card--blue",
        path: "/system-settings/general",
    },
    {
        id: "datetime",
        title: "Date & Time",
        description:
            "Set timezone, date format and time format for the entire system.",
        icon: CalendarClock,
        className: "settings-card--purple",
        path: "/system-settings/date-time",
    },
    {
        id: "email",
        title: "Email / SMTP",
        description:
            "Configure SMTP settings and manage email credentials for system emails.",
        icon: Mail,
        className: "settings-card--green",
        path: "/system-settings/email-smtp",
    },
    {
        id: "storage",
        title: "File & Storage",
        description:
            "Manage file upload settings, storage driver, allowed file types and limits.",
        icon: Database,
        className: "settings-card--sky",
        path: "/system-settings/file-storage",
    },
    {
        id: "security",
        title: "Security",
        description:
            "Set password policy, login attempts, account lockout and security settings.",
        icon: ShieldCheck,
        className: "settings-card--violet",
        path: "/system-settings/security",
    },
    {
        id: "maintenance",
        title: "Maintenance",
        description:
            "Manage system maintenance mode, clear cache and perform system cleanup.",
        icon: Wrench,
        className: "settings-card--orange",
        path: "/system-settings/maintenance",
    },
    {
        id: "email-drafts",
        title: "Email Draft Format",
        description:
            "Design and manage email templates used for admin notifications and system messages.",
        icon: FilePenLine,
        className: "settings-card--teal",
        path: "/system-settings/email-drafts",
    },
];

function SystemSettings({ onNavigate }) {

    const handleOpenSetting = (path) => {
        if (onNavigate) {
            onNavigate(path);
            return;
        }

        window.history.pushState({}, "", path);

        window.dispatchEvent(new PopStateEvent("popstate"));
    };

    return (
        <div className="system-settings-page">

            {/* PAGE HEADER */}
            <div className="system-settings-header">

                <div className="system-settings-heading">

                    <div className="system-settings-title-icon">
                        <Settings size={28} strokeWidth={2.2} />
                    </div>

                    <div>
                        <h1>System Settings</h1>

                        <p>
                            Configure and manage your Maxus CRM system settings
                            from here.
                        </p>
                    </div>

                </div>

                <div className="system-settings-breadcrumb">
                    <span>Dashboard</span>
                    <ChevronRight size={15} />
                    <strong>System Settings</strong>
                </div>

            </div>


            {/* SETTINGS CONTENT */}
            <div className="system-settings-layout">

                <section className="system-settings-main">

                    <div className="system-settings-grid">

                        {settingsItems.map((item) => {

                            const Icon = item.icon;

                            return (
                                <article
                                    key={item.id}
                                    className={`settings-card ${item.className}`}
                                    onClick={() =>
                                        handleOpenSetting(item.path)
                                    }
                                >

                                    <div className="settings-card-top">

                                        <div className="settings-card-icon">
                                            <Icon
                                                size={25}
                                                strokeWidth={2}
                                            />
                                        </div>

                                        <ArrowRight
                                            className="settings-card-arrow"
                                            size={20}
                                        />

                                    </div>


                                    <div className="settings-card-content">

                                        <h2>{item.title}</h2>

                                        <p>
                                            {item.description}
                                        </p>

                                    </div>


                                    <div className="settings-card-footer">

                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleOpenSetting(item.path);
                                            }}
                                        >
                                            Configure

                                            <ArrowRight
                                                size={15}
                                            />
                                        </button>

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                </section>


                {/* RIGHT SIDE */}
                <aside className="system-settings-sidebar">

                    {/* SYSTEM STATUS */}
                    <div className="settings-side-card">

                        <div className="settings-side-header">

                            <div className="settings-side-icon">
                                <CheckCircle2 size={19} />
                            </div>

                            <h3>System Status</h3>

                        </div>


                        <div className="system-status">

                            <span className="status-dot"></span>

                            <div>
                                <strong>System Online</strong>
                                <small>
                                    All services are running normally.
                                </small>
                            </div>

                        </div>

                    </div>


                    {/* QUICK INFORMATION */}
                    <div className="settings-side-card">

                        <div className="settings-side-header">

                            <div className="settings-side-icon">
                                <Settings size={19} />
                            </div>

                            <h3>Quick Information</h3>

                        </div>


                        <div className="quick-info-list">

                            <div>
                                <span>Application</span>
                                <strong>Maxus CRM</strong>
                            </div>

                            <div>
                                <span>Environment</span>
                                <strong>Local</strong>
                            </div>

                            <div>
                                <span>Database</span>
                                <strong>MySQL</strong>
                            </div>

                            <div>
                                <span>Timezone</span>
                                <strong>Asia/Kolkata</strong>
                            </div>

                        </div>

                    </div>


                    {/* IMPORTANT NOTICE */}
                    <div className="settings-notice">

                        <div className="settings-notice-icon">
                            <Settings size={18} />
                        </div>

                        <div>
                            <strong>System-wide settings</strong>

                            <p>
                                Changes made here can affect the entire
                                Maxus CRM platform.
                            </p>
                        </div>

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default SystemSettings;