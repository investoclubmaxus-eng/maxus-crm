import React, { useState } from "react";
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

    const [storageStatus, setStorageStatus] = useState("connected");
    const [saving, setSaving] = useState(false);

    const handleChange = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = () => {
        setSaving(true);

        setTimeout(() => {
            setSaving(false);
        }, 800);
    };

    const handleReset = () => {
        setSettings({
            driver: "local",
            maxUploadSize: "10",
            maxFiles: "10",
            allowedTypes:
                "jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx, csv",
            retentionDays: "30",
            tempCleanup: true,
        });
    };

    const handleTestStorage = () => {
        setStorageStatus("testing");

        setTimeout(() => {
            setStorageStatus("connected");
        }, 1000);
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
                        <h1>File & Storage</h1>

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
                                <h3>Storage Status</h3>

                                <p>
                                    Your CRM storage is currently connected
                                    and available.
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

                            <button
                                type="button"
                                className="storage-test-btn"
                                onClick={handleTestStorage}
                            >
                                Test Storage
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
                                <h2>Storage Usage</h2>

                                <p>
                                    Current storage usage for the CRM.
                                </p>
                            </div>

                            <HardDrive size={23} />

                        </div>


                        <div className="storage-usage-values">

                            <div>
                                <span>Total Storage</span>
                                <strong>100 GB</strong>
                            </div>

                            <div>
                                <span>Used</span>
                                <strong>24.6 GB</strong>
                            </div>

                            <div>
                                <span>Available</span>
                                <strong>75.4 GB</strong>
                            </div>

                        </div>


                        <div className="storage-progress">

                            <div className="storage-progress-bar">

                                <div
                                    className="storage-progress-value"
                                    style={{ width: "24.6%" }}
                                />

                            </div>

                            <span>24.6% used</span>

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
                                <h2>Storage Configuration</h2>

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
                                    value="storage/app/public"
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
                                <h2>Upload Settings</h2>

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
                                        value={settings.maxUploadSize}
                                        onChange={(e) =>
                                            handleChange(
                                                "maxUploadSize",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <span>MB</span>

                                </div>

                            </div>


                            <div className="storage-form-group">

                                <label>
                                    Maximum Files
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    value={settings.maxFiles}
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
                                value={settings.allowedTypes}
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
                                <h2>File Retention</h2>

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
                                    value={settings.retentionDays}
                                    onChange={(e) =>
                                        handleChange(
                                            "retentionDays",
                                            e.target.value
                                        )
                                    }
                                />

                                <span>Days</span>

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
                                    checked={settings.tempCleanup}
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
                                <h2>File Security</h2>

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
                            : "Save Changes"}
                    </button>

                </div>

            </div>

        </div>
    );
}

export default FileStorage;