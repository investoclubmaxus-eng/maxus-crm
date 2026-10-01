import React, { useEffect, useState } from "react";

import {
    Settings,
    Wrench,
    Database,
    Trash2,
    Folder,
    FileText,
    BriefcaseBusiness,
    Activity,
    HardDrive,
    ListChecks,
    Clock3,
    Save,
    RefreshCw,
    CheckCircle2,
    CircleAlert,
    Link2,
    Cog,
    Archive,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";

import "./Maintenance.css";

function Maintenance({ onNavigate }) {
    /* =========================================================
       MAINTENANCE SETTINGS
    ========================================================= */

    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const [maintenanceMessage, setMaintenanceMessage] = useState(
        "We are currently performing system maintenance.\nPlease try again later."
    );

    const [allowSuperAdmin, setAllowSuperAdmin] = useState(true);

    const [logRetentionDays, setLogRetentionDays] = useState(30);

    const [loading, setLoading] = useState(true);
    const [savingMaintenance, setSavingMaintenance] = useState(false);

    /* =========================================================
       CACHE STATE
    ========================================================= */

    const [cacheStatus, setCacheStatus] = useState({
        application: true,
        configuration: true,
        route: true,
    });

    const [cacheLastCleared, setCacheLastCleared] = useState({
        application: null,
        configuration: null,
        route: null,
    });

    const [cacheLoading, setCacheLoading] = useState("");

    /* =========================================================
       CLEANUP STATE
    ========================================================= */

    const [cleanupLoading, setCleanupLoading] = useState("");

    /* =========================================================
       SYSTEM HEALTH
    ========================================================= */

    const [systemChecking, setSystemChecking] = useState(false);

    const [systemHealth, setSystemHealth] = useState({
        application: {
            status: "unknown",
            label: "Checking...",
        },
        database: {
            status: "unknown",
            label: "Checking...",
        },
        storage: {
            status: "unknown",
            label: "Checking...",
        },
        queue: {
            status: "unknown",
            label: "Checking...",
        },
        scheduler: {
            status: "unknown",
            label: "Checking...",
        },
    });

    const [lastSystemCheck, setLastSystemCheck] = useState(null);

    /* =========================================================
       LOAD MAINTENANCE SETTINGS
    ========================================================= */

    useEffect(() => {
        loadMaintenanceSettings();
    }, []);

    const loadMaintenanceSettings = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/superadmin/settings/maintenance"
            );

            const data = response.data?.data;

            if (data) {
                setMaintenanceMode(
                    Boolean(data.maintenance_mode)
                );

                setMaintenanceMessage(
                    data.maintenance_message ||
                    "We are currently performing system maintenance.\nPlease try again later."
                );

                setAllowSuperAdmin(
                    Boolean(data.allow_super_admin_access)
                );

                setLogRetentionDays(
                    Number(data.log_retention_days || 30)
                );
            }

            await loadSystemHealth();

        } catch (error) {
            console.error(
                "Unable to load Maintenance settings:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to load Maintenance settings."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       ERROR MESSAGE HELPER
    ========================================================= */

    const getErrorMessage = (
        error,
        fallbackMessage
    ) => {
        const validationErrors =
            error.response?.data?.errors;

        if (validationErrors) {
            const firstError =
                Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

            if (firstError) {
                return firstError;
            }
        }

        return (
            error.response?.data?.message ||
            fallbackMessage
        );
    };

    /* =========================================================
       FORMAT DATE/TIME
    ========================================================= */

    const formatDateTime = (dateValue) => {
        if (!dateValue) {
            return "Not available";
        }

        try {
            return new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }).format(new Date(dateValue));
        } catch {
            return "Not available";
        }
    };

    /* =========================================================
       SAVE MAINTENANCE SETTINGS
    ========================================================= */

    const handleSaveMaintenance = async () => {
        try {
            setSavingMaintenance(true);

            const payload = {
                maintenance_mode: maintenanceMode,
                maintenance_message: maintenanceMessage,
                allow_super_admin_access: allowSuperAdmin,
                log_retention_days: logRetentionDays,
            };

            const response = await api.put(
                "/superadmin/settings/maintenance-update",
                payload
            );

            const data = response.data?.data;

            if (data) {
                setMaintenanceMode(
                    Boolean(data.maintenance_mode)
                );

                setMaintenanceMessage(
                    data.maintenance_message || ""
                );

                setAllowSuperAdmin(
                    Boolean(data.allow_super_admin_access)
                );

                setLogRetentionDays(
                    Number(data.log_retention_days || 30)
                );
            }

            await sweetAlert.success(
                response.data?.message ||
                "Maintenance settings saved successfully."
            );

        } catch (error) {
            console.error(
                "Unable to save Maintenance settings:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to save Maintenance settings."
                )
            );
        } finally {
            setSavingMaintenance(false);
        }
    };

    /* =========================================================
       CLEAR APPLICATION CACHE
    ========================================================= */

    const handleClearCache = async (cacheType) => {
        const cacheNames = {
            application: "Application Cache",
            configuration: "Configuration Cache",
            route: "Route / View Cache",
        };

        const cacheName =
            cacheNames[cacheType] || "Cache";

        const result = await sweetAlert.confirm(
            `Are you sure you want to clear ${cacheName}?`,
            {
                title: `Clear ${cacheName}?`,
                confirmText: "Yes, Clear",
                cancelText: "Cancel",
            }
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            setCacheLoading(cacheType);

            let endpoint = "";

            if (cacheType === "application") {
                endpoint =
                    "/superadmin/settings/maintenance/cache/application";
            }

            if (cacheType === "configuration") {
                endpoint =
                    "/superadmin/settings/maintenance/cache/configuration";
            }

            if (cacheType === "route") {
                endpoint =
                    "/superadmin/settings/maintenance/cache/route-view";
            }

            const response = await api.post(endpoint);

            setCacheStatus((prev) => ({
                ...prev,
                [cacheType]: false,
            }));

            setCacheLastCleared((prev) => ({
                ...prev,
                [cacheType]: new Date(),
            }));

            await sweetAlert.success(
                response.data?.message ||
                `${cacheName} cleared successfully.`
            );

        } catch (error) {
            console.error(
                `Unable to clear ${cacheName}:`,
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    `Unable to clear ${cacheName}.`
                )
            );
        } finally {
            setCacheLoading("");
        }
    };

    /* =========================================================
       CLEAR ALL CACHE
    ========================================================= */

    const handleClearAllCache = async () => {
        const result = await sweetAlert.confirm(
            "This will clear application, configuration, route and view caches.",
            {
                title: "Clear All Cache?",
                confirmText: "Yes, Clear All",
                cancelText: "Cancel",
            }
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            setCacheLoading("all");

            const response = await api.post(
                "/superadmin/settings/maintenance/cache/all"
            );

            const now = new Date();

            setCacheStatus({
                application: false,
                configuration: false,
                route: false,
            });

            setCacheLastCleared({
                application: now,
                configuration: now,
                route: now,
            });

            await sweetAlert.success(
                response.data?.message ||
                "All application caches cleared successfully."
            );

        } catch (error) {
            console.error(
                "Unable to clear all cache:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to clear all application caches."
                )
            );
        } finally {
            setCacheLoading("");
        }
    };

    /* =========================================================
       SYSTEM CLEANUP
    ========================================================= */

    const handleCleanup = async (cleanupType) => {
        /*
         * temporary_files does not have a backend API yet.
         */
        if (cleanupType === "temporary_files") {
            await sweetAlert.error(
                "Temporary file cleanup API has not been implemented yet."
            );

            return;
        }

        let endpoint = "";
        let actionName = "";

        if (cleanupType === "old_logs") {
            endpoint =
                "/superadmin/settings/maintenance/cleanup/logs";

            actionName = "old application logs";
        }

        if (cleanupType === "failed_jobs") {
            endpoint =
                "/superadmin/settings/maintenance/cleanup/failed-jobs";

            actionName = "failed jobs";
        }

        const result = await sweetAlert.confirm(
            `Are you sure you want to clear ${actionName}?`,
            {
                title: `Clear ${actionName}?`,
                confirmText: "Yes, Continue",
                cancelText: "Cancel",
            }
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            setCleanupLoading(cleanupType);

            const response = await api.post(endpoint);

            const deletedCount =
                response.data?.deleted_count;

            let message =
                response.data?.message ||
                `${actionName} cleaned successfully.`;

            if (
                deletedCount !== undefined &&
                deletedCount !== null
            ) {
                message += ` (${deletedCount} item${
                    deletedCount === 1 ? "" : "s"
                } processed.)`;
            }

            await sweetAlert.success(message);

        } catch (error) {
            console.error(
                `Unable to clean ${cleanupType}:`,
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    `Unable to clean ${actionName}.`
                )
            );
        } finally {
            setCleanupLoading("");
        }
    };

    /* =========================================================
       SYSTEM HEALTH
    ========================================================= */

    const loadSystemHealth = async () => {
        try {
            const response = await api.get(
                "/superadmin/settings/maintenance/health"
            );

            const data = response.data?.data;

            if (data) {
                setSystemHealth({
                    application:
                        data.application || {
                            status: "unknown",
                            label: "Unknown",
                        },

                    database:
                        data.database || {
                            status: "unknown",
                            label: "Unknown",
                        },

                    storage:
                        data.storage || {
                            status: "unknown",
                            label: "Unknown",
                        },

                    queue:
                        data.queue || {
                            status: "unknown",
                            label: "Unknown",
                        },

                    scheduler:
                        data.scheduler || {
                            status: "unknown",
                            label: "Unknown",
                        },
                });

                if (data.checked_at) {
                    setLastSystemCheck(
                        formatDateTime(data.checked_at)
                    );
                }
            }

            return true;

        } catch (error) {
            console.error(
                "Unable to load system health:",
                error
            );

            return false;
        }
    };

    /* =========================================================
       RUN SYSTEM CHECK
    ========================================================= */

    const handleSystemCheck = async () => {
        try {
            setSystemChecking(true);

            const success =
                await loadSystemHealth();

            if (success) {
                await sweetAlert.success(
                    "System health check completed successfully."
                );
            } else {
                await sweetAlert.error(
                    "Unable to complete system health check."
                );
            }

        } catch (error) {
            console.error(
                "System health check failed:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to complete system health check."
                )
            );
        } finally {
            setSystemChecking(false);
        }
    };

    /* =========================================================
       CANCEL
    ========================================================= */

    const handleBack = () => {
        if (onNavigate) {
            onNavigate("/system-settings");
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="maintenance-page">
                <div className="maintenance-loading">
                    Loading Maintenance settings...
                </div>
            </div>
        );
    }

    /* =========================================================
       HEALTH STATUS HELPER
    ========================================================= */

    const isHealthGood = (item) => {
        if (!item) {
            return false;
        }

        return [
            "operational",
            "connected",
            "available",
            "running",
            "configured",
        ].includes(
            String(item.status).toLowerCase()
        );
    };

    const allSystemsHealthy =
        isHealthGood(systemHealth.application) &&
        isHealthGood(systemHealth.database) &&
        isHealthGood(systemHealth.storage) &&
        isHealthGood(systemHealth.queue) &&
        isHealthGood(systemHealth.scheduler);

    return (
        <div className="maintenance-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="maintenance-page-header">

                <div className="maintenance-title-area">

                    <div className="maintenance-title-icon">
                        <Settings size={28} />
                    </div>

                    <div>
                        <h1>Maintenance</h1>

                        <p>
                            Manage system maintenance mode, cache and
                            system cleanup.
                        </p>
                    </div>

                </div>

                <div className="maintenance-breadcrumb">

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate("/dashboard")
                        }
                    >
                        Dashboard
                    </span>

                    <span className="breadcrumb-arrow">
                        ›
                    </span>

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate("/system-settings")
                        }
                    >
                        System Settings
                    </span>

                    <span className="breadcrumb-arrow">
                        ›
                    </span>

                    <strong>Maintenance</strong>

                </div>

            </div>


            {/* =====================================================
                MAIN CONTAINER
            ====================================================== */}

            <div className="maintenance-main-container">

                {/* =================================================
                    LEFT CONTENT
                ================================================== */}

                <div className="maintenance-left-content">

                    {/* =================================================
                        MAINTENANCE MODE
                    ================================================== */}

                    <section className="maintenance-section">

                        <div className="maintenance-section-header">

                            <div className="maintenance-section-icon">
                                <Wrench size={21} />
                            </div>

                            <div>

                                <h2>
                                    Maintenance Mode
                                </h2>

                                <p>
                                    Temporarily restrict access to Maxus
                                    CRM while system maintenance or
                                    updates are being performed.
                                </p>

                            </div>

                            <div
                                className={`system-online-badge ${
                                    maintenanceMode
                                        ? "maintenance-active"
                                        : ""
                                }`}
                            >
                                <span></span>

                                {maintenanceMode
                                    ? "Maintenance Active"
                                    : "System Online"}
                            </div>

                        </div>


                        <div className="maintenance-mode-content">

                            <div className="maintenance-mode-form">

                                {/* TOGGLE */}

                                <div className="setting-row">

                                    <div className="setting-label">

                                        <strong>
                                            Maintenance Mode
                                        </strong>

                                    </div>

                                    <div className="setting-control">

                                        <button
                                            type="button"
                                            className={`switch ${
                                                maintenanceMode
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setMaintenanceMode(
                                                    !maintenanceMode
                                                )
                                            }
                                            aria-label="Toggle maintenance mode"
                                        >
                                            <span></span>
                                        </button>

                                        <span className="switch-text">
                                            {maintenanceMode
                                                ? "Enabled"
                                                : "Disabled"}
                                        </span>

                                    </div>

                                </div>


                                {/* MESSAGE */}

                                <div className="maintenance-field">

                                    <label>
                                        Maintenance Message
                                    </label>

                                    <textarea
                                        value={
                                            maintenanceMessage
                                        }
                                        onChange={(e) =>
                                            setMaintenanceMessage(
                                                e.target.value
                                            )
                                        }
                                        maxLength={200}
                                        placeholder="Enter maintenance message..."
                                    />

                                    <div className="character-count">
                                        {
                                            maintenanceMessage
                                                .length
                                        }
                                        /200
                                    </div>

                                </div>


                                {/* SUPER ADMIN ACCESS */}

                                <div className="setting-row">

                                    <div>

                                        <div className="setting-label">

                                            <strong>
                                                Allow Super Admin Access
                                            </strong>

                                        </div>

                                        <p className="setting-description">
                                            Super Admin can continue
                                            accessing the system during
                                            maintenance mode.
                                        </p>

                                    </div>

                                    <div className="setting-control">

                                        <button
                                            type="button"
                                            className={`switch ${
                                                allowSuperAdmin
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setAllowSuperAdmin(
                                                    !allowSuperAdmin
                                                )
                                            }
                                            aria-label="Toggle Super Admin access"
                                        >
                                            <span></span>
                                        </button>

                                    </div>

                                </div>


                                {/* SAVE */}

                                <div className="maintenance-save-wrapper">

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={
                                            handleSaveMaintenance
                                        }
                                        disabled={
                                            savingMaintenance
                                        }
                                    >
                                        <Save size={16} />

                                        {savingMaintenance
                                            ? "Saving..."
                                            : "Save Changes"}
                                    </button>

                                </div>

                            </div>


                            {/* PREVIEW */}

                            <div className="maintenance-preview">

                                <div className="maintenance-preview-icon">

                                    <Settings size={42} />

                                    <CircleAlert size={28} />

                                </div>

                                <h3>
                                    Maintenance Mode
                                </h3>

                                <p>
                                    {maintenanceMode
                                        ? maintenanceMessage
                                        : "The system is currently online."}
                                </p>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        CACHE MANAGEMENT
                    ================================================== */}

                    <section className="maintenance-section">

                        <div className="maintenance-section-header">

                            <div className="maintenance-section-icon">
                                <Database size={21} />
                            </div>

                            <div>

                                <h2>
                                    Cache Management
                                </h2>

                                <p>
                                    Clear cached application data when
                                    configuration or system changes
                                    require the application cache to be
                                    refreshed.
                                </p>

                            </div>

                        </div>


                        <div className="cache-grid">

                            {/* APPLICATION */}

                            <div className="cache-card">

                                <div className="cache-card-icon">
                                    <Database size={19} />
                                </div>

                                <h3>
                                    Application Cache
                                </h3>

                                <div className="cache-status">

                                    <span></span>

                                    {cacheStatus.application
                                        ? "Cached"
                                        : "Cleared"}

                                </div>

                                <p>
                                    Last cleared:
                                    <br />

                                    <strong>
                                        {cacheLastCleared.application
                                            ? formatDateTime(
                                                cacheLastCleared.application
                                            )
                                            : "Not available"}
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    className="outline-button"
                                    onClick={() =>
                                        handleClearCache(
                                            "application"
                                        )
                                    }
                                    disabled={
                                        cacheLoading ===
                                        "application"
                                    }
                                >

                                    <Trash2 size={15} />

                                    {cacheLoading ===
                                    "application"
                                        ? "Clearing..."
                                        : "Clear Cache"}

                                </button>

                            </div>


                            {/* CONFIGURATION */}

                            <div className="cache-card">

                                <div className="cache-card-icon">
                                    <Cog size={19} />
                                </div>

                                <h3>
                                    Configuration Cache
                                </h3>

                                <div className="cache-status">

                                    <span></span>

                                    {cacheStatus.configuration
                                        ? "Cached"
                                        : "Cleared"}

                                </div>

                                <p>
                                    Last cleared:
                                    <br />

                                    <strong>
                                        {cacheLastCleared.configuration
                                            ? formatDateTime(
                                                cacheLastCleared.configuration
                                            )
                                            : "Not available"}
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    className="outline-button"
                                    onClick={() =>
                                        handleClearCache(
                                            "configuration"
                                        )
                                    }
                                    disabled={
                                        cacheLoading ===
                                        "configuration"
                                    }
                                >

                                    <Trash2 size={15} />

                                    {cacheLoading ===
                                    "configuration"
                                        ? "Clearing..."
                                        : "Clear Cache"}

                                </button>

                            </div>


                            {/* ROUTE / VIEW */}

                            <div className="cache-card">

                                <div className="cache-card-icon">
                                    <Link2 size={19} />
                                </div>

                                <h3>
                                    Route / View Cache
                                </h3>

                                <div className="cache-status">

                                    <span></span>

                                    {cacheStatus.route
                                        ? "Cached"
                                        : "Cleared"}

                                </div>

                                <p>
                                    Last cleared:
                                    <br />

                                    <strong>
                                        {cacheLastCleared.route
                                            ? formatDateTime(
                                                cacheLastCleared.route
                                            )
                                            : "Not available"}
                                    </strong>
                                </p>

                                <button
                                    type="button"
                                    className="outline-button"
                                    onClick={() =>
                                        handleClearCache(
                                            "route"
                                        )
                                    }
                                    disabled={
                                        cacheLoading ===
                                        "route"
                                    }
                                >

                                    <Trash2 size={15} />

                                    {cacheLoading === "route"
                                        ? "Clearing..."
                                        : "Clear Cache"}

                                </button>

                            </div>


                            {/* ALL */}

                            <div className="cache-card clear-all-card">

                                <div className="cache-card-icon">
                                    <Archive size={19} />
                                </div>

                                <h3>
                                    Clear All Cache
                                </h3>

                                <p>
                                    Clear all cached data at once.
                                </p>

                                <button
                                    type="button"
                                    className="primary-button full-button"
                                    onClick={
                                        handleClearAllCache
                                    }
                                    disabled={
                                        cacheLoading === "all"
                                    }
                                >

                                    <Trash2 size={15} />

                                    {cacheLoading === "all"
                                        ? "Clearing..."
                                        : "Clear All Cache"}

                                </button>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        SYSTEM CLEANUP
                    ================================================== */}

                    <section className="maintenance-section">

                        <div className="maintenance-section-header">

                            <div className="maintenance-section-icon">
                                <Trash2 size={21} />
                            </div>

                            <div>

                                <h2>
                                    System Cleanup
                                </h2>

                                <p>
                                    Remove temporary system files and
                                    old records that are no longer
                                    required.
                                </p>

                            </div>

                        </div>


                        <div className="cleanup-grid">

                            {/* TEMPORARY FILES */}

                            <div className="cleanup-card">

                                <div className="cleanup-icon">
                                    <Folder size={19} />
                                </div>

                                <div className="cleanup-content">

                                    <h3>
                                        Temporary Files
                                    </h3>

                                    <p>
                                        Remove temporary files
                                        generated by the application.
                                    </p>

                                    <button
                                        type="button"
                                        className="outline-button small-button"
                                        onClick={() =>
                                            handleCleanup(
                                                "temporary_files"
                                            )
                                        }
                                        disabled={
                                            cleanupLoading ===
                                            "temporary_files"
                                        }
                                    >

                                        <Trash2 size={14} />

                                        {cleanupLoading ===
                                        "temporary_files"
                                            ? "Clearing..."
                                            : "Clear"}

                                    </button>

                                </div>

                            </div>


                            {/* OLD LOGS */}

                            <div className="cleanup-card">

                                <div className="cleanup-icon">
                                    <FileText size={19} />
                                </div>

                                <div className="cleanup-content">

                                    <h3>
                                        Old Application Logs
                                    </h3>

                                    <p>
                                        Remove logs older than the
                                        configured retention period.
                                    </p>

                                    <button
                                        type="button"
                                        className="outline-button small-button"
                                        onClick={() =>
                                            handleCleanup(
                                                "old_logs"
                                            )
                                        }
                                        disabled={
                                            cleanupLoading ===
                                            "old_logs"
                                        }
                                    >

                                        <Trash2 size={14} />

                                        {cleanupLoading ===
                                        "old_logs"
                                            ? "Cleaning..."
                                            : "Clean Up"}

                                    </button>

                                </div>

                            </div>


                            {/* FAILED JOBS */}

                            <div className="cleanup-card">

                                <div className="cleanup-icon">
                                    <BriefcaseBusiness size={19} />
                                </div>

                                <div className="cleanup-content">

                                    <h3>
                                        Failed Jobs
                                    </h3>

                                    <p>
                                        Remove failed background jobs
                                        after reviewing them.
                                    </p>

                                    <button
                                        type="button"
                                        className="outline-button small-button"
                                        onClick={() =>
                                            handleCleanup(
                                                "failed_jobs"
                                            )
                                        }
                                        disabled={
                                            cleanupLoading ===
                                            "failed_jobs"
                                        }
                                    >

                                        <Trash2 size={14} />

                                        {cleanupLoading ===
                                        "failed_jobs"
                                            ? "Clearing..."
                                            : "Clear"}

                                    </button>

                                </div>

                            </div>

                        </div>

                    </section>

                </div>


                {/* =================================================
                    SYSTEM HEALTH
                ================================================== */}

                <aside className="system-health-panel">

                    <div className="health-header">

                        <div className="health-icon">
                            <Activity size={22} />
                        </div>

                        <div>

                            <h2>
                                System Health
                            </h2>

                            <p>
                                Check the status of important system
                                services and components.
                            </p>

                        </div>

                    </div>


                    {/* HEALTH SUCCESS */}

                    <div
                        className={`health-success ${
                            !allSystemsHealthy
                                ? "health-error"
                                : ""
                        }`}
                    >

                        {allSystemsHealthy ? (
                            <CheckCircle2 size={19} />
                        ) : (
                            <CircleAlert size={19} />
                        )}

                        <span>
                            {allSystemsHealthy
                                ? "All systems are running normally."
                                : "One or more systems require attention."}
                        </span>

                    </div>


                    {/* HEALTH ITEMS */}

                    <div className="health-list">

                        <div className="health-item">

                            <div className="health-item-name">

                                <Settings size={17} />

                                <span>
                                    Application
                                </span>

                            </div>

                            <span className="health-status">

                                <i></i>

                                {systemHealth.application.label}

                            </span>

                        </div>


                        <div className="health-item">

                            <div className="health-item-name">

                                <Database size={17} />

                                <span>
                                    Database
                                </span>

                            </div>

                            <span className="health-status">

                                <i></i>

                                {systemHealth.database.label}

                            </span>

                        </div>


                        <div className="health-item">

                            <div className="health-item-name">

                                <HardDrive size={17} />

                                <span>
                                    Storage
                                </span>

                            </div>

                            <span className="health-status">

                                <i></i>

                                {systemHealth.storage.label}

                            </span>

                        </div>


                        <div className="health-item">

                            <div className="health-item-name">

                                <ListChecks size={17} />

                                <span>
                                    Queue
                                </span>

                            </div>

                            <span className="health-status">

                                <i></i>

                                {systemHealth.queue.label}

                            </span>

                        </div>


                        <div className="health-item">

                            <div className="health-item-name">

                                <Clock3 size={17} />

                                <span>
                                    Scheduler
                                </span>

                            </div>

                            <span className="health-status">

                                <i></i>

                                {systemHealth.scheduler.label}

                            </span>

                        </div>

                    </div>


                    {/* LAST CHECK */}

                    <div className="last-check">

                        <Clock3 size={16} />

                        <div>

                            <span>
                                Last system check:
                            </span>

                            <strong>
                                {lastSystemCheck ||
                                    "Not checked yet"}
                            </strong>

                        </div>

                    </div>


                    {/* RUN CHECK */}

                    <button
                        type="button"
                        className="health-check-button"
                        onClick={handleSystemCheck}
                        disabled={systemChecking}
                    >

                        <RefreshCw
                            size={16}
                            className={
                                systemChecking
                                    ? "spin"
                                    : ""
                            }
                        />

                        {systemChecking
                            ? "Checking System..."
                            : "Run System Check"}

                    </button>

                </aside>

            </div>


            {/* =====================================================
                BOTTOM ACTION BAR
            ====================================================== */}

            <div className="maintenance-bottom-bar">

                <button
                    type="button"
                    className="secondary-button"
                    onClick={handleBack}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    className="primary-button"
                    onClick={handleSaveMaintenance}
                    disabled={savingMaintenance}
                >

                    <Save size={16} />

                    {savingMaintenance
                        ? "Saving..."
                        : "Save Changes"}

                </button>

            </div>

        </div>
    );
}

export default Maintenance;