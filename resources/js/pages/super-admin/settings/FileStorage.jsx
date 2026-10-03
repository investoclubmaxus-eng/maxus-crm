import React, { useEffect, useState } from "react";
import {
    HardDrive,
    Database,
    Upload,
    File,
    FolderOpen,
    ShieldCheck,
    Save,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import "./FileStorage.css";
import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";

function FileStorage() {
    const [settings, setSettings] = useState({
        driver: "local",
        maxUploadSize: "10",
        maxFiles: "10",
        allowedTypes:
            "jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, csv",
        retentionDays: "30",
        tempCleanup: true,
    });

    const [storageStatus, setStorageStatus] = useState("");
    const [storagePath, setStoragePath] = useState("");

    const [storageUsage, setStorageUsage] = useState({
        crmUsed: "0 B",
        serverTotal: "0 B",
        serverUsed: "0 B",
        serverAvailable: "0 B",
        serverPercentage: 0,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingStorage, setTestingStorage] = useState(false);

    useEffect(() => {
        loadFileStorageSettings();
    }, []);

    /**
     * Check the actual configured storage connection.
     *
     * This calls the backend storage test endpoint.
     * It does NOT assume that the storage is connected
     * just because the settings API succeeded.
     */
    const checkStorageStatus = async () => {
        try {
            setStorageStatus("testing");

            const response = await api.post(
                "/superadmin/settings/file-storage/test"
            );

            const data = response.data;

            setStorageStatus(
                data.status === "connected"
                    ? "connected"
                    : "unavailable"
            );

            return data;
        } catch (error) {
            console.error(
                "Storage status check failed:",
                error
            );

            setStorageStatus("unavailable");

            return null;
        }
    };

    /**
     * Load File & Storage settings.
     */
    const loadFileStorageSettings = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/superadmin/settings/file-storage"
            );

            const data = response.data;

            const backendSettings = data.settings;

            setSettings({
                driver: backendSettings.driver ?? "local",

                maxUploadSize: String(
                    backendSettings.max_upload_size ?? 10
                ),

                maxFiles: String(
                    backendSettings.max_files ?? 10
                ),

                allowedTypes:
                    backendSettings.allowed_file_types ?? "",

                retentionDays: String(
                    backendSettings.retention_days ?? 30
                ),

                tempCleanup:
                    Boolean(
                        backendSettings.automatic_cleanup
                    ),
            });

            setStoragePath(
                data.storage_path ?? ""
            );

            const usage = data.storage_usage;

            setStorageUsage({
                crmUsed: usage?.crm_used ?? "0 B",
                serverTotal: usage?.server_total ?? "0 B",
                serverUsed: usage?.server_used ?? "0 B",
                serverAvailable: usage?.server_available ?? "0 B",
                serverPercentage: usage?.server_percentage ?? 0,
            });

            /*
             * Important:
             *
             * Do NOT use:
             *
             * setStorageStatus("connected");
             *
             * here.
             *
             * GET /file-storage only means that the
             * settings were successfully retrieved.
             *
             * We need to actually test the configured
             * storage connection.
             */
            await checkStorageStatus();

        } catch (error) {
            console.error(
                "Failed to load file storage settings:",
                error
            );

            setStorageStatus("unavailable");

        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle settings field changes.
     */
    const handleChange = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /**
     * Save File & Storage settings.
     */
    const handleSave = async () => {
        try {
            setSaving(true);

            const payload = {
                driver: settings.driver,

                max_upload_size:
                    Number(settings.maxUploadSize),

                max_files:
                    Number(settings.maxFiles),

                allowed_file_types:
                    settings.allowedTypes,

                retention_days:
                    Number(settings.retentionDays),

                automatic_cleanup:
                    settings.tempCleanup,
            };

            const response = await api.put(
                "/superadmin/settings/file-storage-update",
                payload
            );

            const data = response.data;

            /*
             * Update frontend settings using
             * the values returned by backend.
             */
            if (data.settings) {
                setSettings({
                    driver:
                        data.settings.driver,

                    maxUploadSize:
                        String(
                            data.settings.max_upload_size
                        ),

                    maxFiles:
                        String(
                            data.settings.max_files
                        ),

                    allowedTypes:
                        data.settings
                            .allowed_file_types ?? "",

                    retentionDays:
                        String(
                            data.settings.retention_days
                        ),

                    tempCleanup:
                        Boolean(
                            data.settings
                                .automatic_cleanup
                        ),
                });
            }

            /*
             * Update storage path returned by backend.
             */
            setStoragePath(
                data.storage_path ?? ""
            );

            /*
             * Update storage usage returned by backend.
             */
            if (data.storage_usage) {
                const usage = data.storage_usage;

                setStorageUsage({
                    crmUsed: usage.crm_used ?? "0 B",
                    serverTotal: usage.server_total ?? "0 B",
                    serverUsed: usage.server_used ?? "0 B",
                    serverAvailable: usage.server_available ?? "0 B",
                    serverPercentage: usage.server_percentage ?? 0,
                });
            }

            /*
             * Important:
             *
             * Do NOT directly set:
             *
             * setStorageStatus("connected");
             *
             * Saving the configuration does not mean
             * that the storage connection is working.
             *
             * Test the actual storage after saving.
             */
            await checkStorageStatus();

            sweetAlert.success(
                data.message ||
                    "File storage settings updated successfully."
            );

        } catch (error) {
            console.error(
                "Failed to update file storage settings:",
                error
            );

            sweetAlert.error(
                error.response?.data?.message ||
                    "Failed to update file storage settings."
            );

        } finally {
            setSaving(false);
        }
    };

    /**
     * Reset form values to default values.
     *
     * This only resets the frontend form.
     * It does not update the database until
     * Save Changes is clicked.
     */
    // const handleReset = () => {
    //     console.log("Resetting file storage settings to default values.");
    //     setSettings({
    //         driver: "local",
    //         maxUploadSize: "10",
    //         maxFiles: "10",
    //         allowedTypes:
    //             "jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, csv",
    //         retentionDays: "30",
    //         tempCleanup: true,
    //     });
    // };

const handleReset = async () => {
    const result = await sweetAlert.confirm(
        "Reset the file storage settings to their default values?",
        {
            title: "Reset File Storage Settings?",
            confirmText: "Yes, Reset",
            cancelText: "Cancel",
        }
    );

    if (!result.isConfirmed) {
        return;
    }

    setSettings({
        driver: "local",
        maxUploadSize: "10",
        maxFiles: "10",
        allowedTypes:
            "jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, csv",
        retentionDays: "30",
        tempCleanup: true,
    });

    await sweetAlert.success(
        "File storage settings reset to default values."
    );
};
    
    /**
     * Manually test configured storage.
     */
    /* =========================================================
   TEST STORAGE CONNECTION
========================================================= */

const handleTestStorage = async () => {
    try {
        setTestingStorage(true);
        setStorageStatus("testing");

        const response = await api.post(
            "/superadmin/settings/file-storage/test"
        );

        const data = response.data;

        /* =====================================================
           STORAGE CONNECTED
        ====================================================== */

        if (data.status === "connected") {
            setStorageStatus("connected");

            await sweetAlert.success(
                data.message ||
                "Storage connection is working successfully."
            );

            return;
        }

        /* =====================================================
           STORAGE UNAVAILABLE
        ====================================================== */

        setStorageStatus("unavailable");

        await sweetAlert.error(
            data.message ||
            "Unable to connect to the configured storage."
        );

    } catch (error) {

        console.error(
            "Storage test failed:",
            error
        );

        setStorageStatus("unavailable");

        await sweetAlert.error(
            error.response?.data?.message ||
            "Unable to test the storage connection."
        );

    } finally {
        setTestingStorage(false);
    }
};

    return (
        <div className="file-storage-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="file-storage-header">

                <div className="file-storage-heading">

                    <div className="file-storage-heading-icon">
                        <HardDrive size={27} />
                    </div>

                    <div>

                        <h1>
                            File & Storage
                        </h1>

                        <p>
                            Manage file uploads, storage settings and
                            file retention for the entire CRM.
                        </p>

                    </div>

                </div>

            </div>


            {/* =====================================================
                ONE MAIN CONTAINER
            ====================================================== */}

            <div className="file-storage-main-card">


                {/* =================================================
                    STORAGE STATUS
                ================================================== */}

                <section className="storage-section storage-status-section">

                    <div className="storage-status-card">

                        <div className="storage-status-left">

                            <div className="storage-status-icon">
                                <Database size={22} />
                            </div>

                            <div>

                                <h3>
                                    Storage Status
                                </h3>

                                <p>
                                    {storageStatus === "testing"
                                        ? "Testing the configured CRM storage."
                                        : storageStatus === "connected"
                                        ? "Your CRM storage is currently connected and available."
                                        : storageStatus === "unavailable"
                                        ? "Your CRM storage is currently unavailable."
                                        : "Checking the configured CRM storage..."
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="storage-status-right">

                            {storageStatus === "connected" && (
                                <span className="storage-status-badge success">

                                    <CheckCircle2 size={15} />

                                    Connected

                                </span>
                            )}


                            {storageStatus === "testing" && (
                                <span className="storage-status-badge testing">

                                    <RefreshCw
                                        size={15}
                                        className="storage-spin"
                                    />

                                    Testing...

                                </span>
                            )}


                            {storageStatus === "unavailable" && (
                                <span className="storage-status-badge error">

                                    <AlertCircle size={15} />

                                    Unavailable

                                </span>
                            )}


                            <button
                                type="button"
                                className="storage-test-btn"
                                onClick={handleTestStorage}
                                disabled={testingStorage}
                            >
                                <RefreshCw
                                    size={14}
                                    className={
                                        testingStorage
                                            ? "storage-spin"
                                            : ""
                                    }
                                />

                                {testingStorage
                                    ? "Testing..."
                                    : "Test Storage"}
                            </button>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    STORAGE USAGE
                ================================================== */}

                <section className="storage-section">

                    <div className="storage-usage-card">

                        <div className="storage-usage-header">

                            <div>

                                <h2>
                                    Storage Usage
                                </h2>

                                <p>
                                    Current storage usage for the CRM.
                                </p>

                            </div>

                            <HardDrive size={23} />

                        </div>


                        <div className="storage-usage-values">

                            <div>

                                <span>
                                    Total Server Storage
                                </span>

                                <strong>
                                    {storageUsage.serverTotal}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Used
                                </span>

                                <strong>
                                    {storageUsage.serverUsed}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Available
                                </span>

                                <strong>
                                    {storageUsage.serverAvailable}
                                </strong>

                            </div>

                        </div>


                        <div className="storage-progress">

                            <div className="storage-progress-bar">

                                <div
                                    className="storage-progress-value"
                                    style={{
                                        width: `${storageUsage.serverPercentage}%`,
                                    }}
                                />

                            </div>

                            <span>
                                {storageUsage.serverPercentage}% server disk used
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    STORAGE CONFIGURATION
                ================================================== */}

                <section className="storage-section">

                    <div className="storage-card">

                        <div className="storage-card-header">

                            <div className="storage-card-icon blue">
                                <Database size={21} />
                            </div>

                            <div>

                                <h2>
                                    Storage Configuration
                                </h2>

                                <p>
                                    Configure where CRM files are stored.
                                </p>

                            </div>

                        </div>


                        <div className="storage-form-group">

                            <label>
                                Storage Driver
                            </label>

                            <select
                                value={settings.driver}
                                onChange={(e) =>
                                    handleChange(
                                        "driver",
                                        e.target.value
                                    )
                                }
                            >

                                <option value="local">
                                    Local Storage
                                </option>

                                <option value="public">
                                    Public Storage
                                </option>

                                <option value="s3">
                                    Amazon S3
                                </option>

                            </select>

                            <small>
                                Select the storage system used by the CRM.
                            </small>

                        </div>


                        <div className="storage-form-group">

                            <label>
                                Storage Path
                            </label>

                            <div className="storage-input-icon">

                                <FolderOpen size={17} />

                                <input
                                    type="text"
                                    value={storagePath}
                                    readOnly
                                />

                            </div>

                            <small>
                                Current application storage location.
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    UPLOAD SETTINGS
                ================================================== */}

                <section className="storage-section">

                    <div className="storage-card">

                        <div className="storage-card-header">

                            <div className="storage-card-icon purple">
                                <Upload size={21} />
                            </div>

                            <div>

                                <h2>
                                    Upload Settings
                                </h2>

                                <p>
                                    Control file upload limits.
                                </p>

                            </div>

                        </div>


                        <div className="storage-two-columns">

                            <div className="storage-form-group">

                                <label>
                                    Maximum File Size
                                </label>

                                <div className="input-with-unit">

                                    <input
                                        type="number"
                                        min="1"
                                        value={
                                            settings.maxUploadSize
                                        }
                                        onChange={(e) =>
                                            handleChange(
                                                "maxUploadSize",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span>
                                        MB
                                    </span>

                                </div>

                            </div>


                            <div className="storage-form-group">

                                <label>
                                    Maximum Files
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        settings.maxFiles
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "maxFiles",
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        <div className="storage-form-group">

                            <label>
                                Allowed File Types
                            </label>

                            <textarea
                                rows="4"
                                value={
                                    settings.allowedTypes
                                }
                                onChange={(e) =>
                                    handleChange(
                                        "allowedTypes",
                                        e.target.value
                                    )
                                }
                            />

                            <small>
                                Separate file extensions using commas.
                            </small>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FILE RETENTION
                ================================================== */}

                <section className="storage-section">

                    <div className="storage-card">

                        <div className="storage-card-header">

                            <div className="storage-card-icon orange">
                                <File size={21} />
                            </div>

                            <div>

                                <h2>
                                    File Retention
                                </h2>

                                <p>
                                    Manage temporary and unused files.
                                </p>

                            </div>

                        </div>


                        <div className="storage-form-group">

                            <label>
                                Temporary File Retention
                            </label>

                            <div className="input-with-unit">

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        settings.retentionDays
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "retentionDays",
                                            e.target.value
                                        )
                                    }
                                />

                                <span>
                                    Days
                                </span>

                            </div>

                            <small>
                                Temporary files older than this period
                                can be removed during cleanup.
                            </small>

                        </div>


                        <div className="storage-switch-row">

                            <div>

                                <strong>
                                    Automatic Cleanup
                                </strong>

                                <p>
                                    Automatically clean temporary files.
                                </p>

                            </div>


                            <label className="storage-switch">

                                <input
                                    type="checkbox"
                                    checked={
                                        settings.tempCleanup
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "tempCleanup",
                                            e.target.checked
                                        )
                                    }
                                />

                                <span />

                            </label>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    FILE SECURITY
                ================================================== */}

                <section className="storage-section">

                    <div className="storage-card">

                        <div className="storage-card-header">

                            <div className="storage-card-icon green">
                                <ShieldCheck size={21} />
                            </div>

                            <div>

                                <h2>
                                    File Security
                                </h2>

                                <p>
                                    Basic protection for uploaded files.
                                </p>

                            </div>

                        </div>


                        <div className="storage-security-list">

                            <div className="security-item">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        File Type Validation
                                    </strong>

                                    <p>
                                        Only configured file extensions
                                        can be uploaded.
                                    </p>

                                </div>

                            </div>


                            <div className="security-item">

                                <CheckCircle2 size={18} />

                                <div>

                                    <strong>
                                        Upload Size Validation
                                    </strong>

                                    <p>
                                        Files exceeding the configured
                                        size limit are rejected.
                                    </p>

                                </div>

                            </div>


                            <div className="security-item">

                                <AlertCircle size={18} />

                                <div>

                                    <strong>
                                        Storage Access
                                    </strong>

                                    <p>
                                        Keep sensitive CRM files outside
                                        directly accessible public paths
                                        where appropriate.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    INFORMATION
                ================================================== */}

                <section className="storage-section storage-information-section">

                    <div className="storage-information">

                        <div className="storage-information-icon">
                            <ShieldCheck size={20} />
                        </div>

                        <div>

                            <strong>
                                System-wide storage settings
                            </strong>

                            <p>
                                These settings apply across the Maxus CRM.
                                Company-specific file rules can be managed
                                separately inside the respective company panel.
                            </p>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    ACTION BAR
                ================================================== */}

                <div className="storage-actions">

                    <button
                        type="button"
                        className="storage-reset-btn"
                        onClick={handleReset}
                    >

                        <RotateCcw size={17} />

                        Reset

                    </button>


                    <button
                        type="button"
                        className="storage-save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >

                        <Save size={17} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"
                        }

                    </button>

                </div>

            </div>

        </div>
    );
}

export default FileStorage;