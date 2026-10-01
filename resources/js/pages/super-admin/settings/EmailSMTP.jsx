import React, { useState } from "react";
import {
    Mail,
    Server,
    Lock,
    User,
    Send,
    Eye,
    EyeOff,
    Save,
    X,
    CheckCircle,
    Info,
    ChevronDown,
    Settings,
} from "lucide-react";

import "./EmailSMTP.css";

function EmailSMTP({ onNavigate }) {
    const [showPassword, setShowPassword] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("not-tested");

    const [formData, setFormData] = useState({
        mail_driver: "smtp",
        smtp_host: "",
        smtp_port: "587",
        encryption: "tls",
        username: "",
        password: "",
        from_address: "",
        from_name: "Maxus CRM",
        reply_to: "",
        test_email: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (connectionStatus !== "not-tested") {
            setConnectionStatus("not-tested");
        }
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setConnectionStatus("testing");

        /*
         * Later connect this to Laravel API:
         *
         * POST /api/superadmin/settings/email/test
         */

        setTimeout(() => {
            setTestingConnection(false);
            setConnectionStatus("success");
        }, 1500);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        /*
         * Later:
         *
         * PUT /api/superadmin/settings/email
         */

        console.log("SMTP Settings:", formData);
    };

    const handleCancel = () => {
        if (onNavigate) {
            onNavigate("/system-settings");
        }
    };

    return (
        <div className="smtp-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="smtp-page-header">

                <div className="smtp-title-section">

                    <div className="smtp-title-icon">
                        <Mail size={28} strokeWidth={2} />
                    </div>

                    <div>
                        <h1>Email / SMTP Settings</h1>

                        <p>
                            Configure your email service provider (SMTP)
                            settings to send emails from the system.
                        </p>
                    </div>

                </div>


                <div className="smtp-breadcrumb">

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate("/dashboard")
                        }
                    >
                        Dashboard
                    </span>

                    <span>›</span>

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate("/system-settings")
                        }
                    >
                        System Settings
                    </span>

                    <span>›</span>

                    <strong>Email / SMTP</strong>

                </div>

            </div>


            {/* =====================================================
                MAIN FORM
            ====================================================== */}

            <form onSubmit={handleSave}>

                {/* =================================================
                    ONE MAIN CONTAINER
                ================================================== */}

                <div className="smtp-main-card">

                    {/* =================================================
                        SMTP CONFIGURATION
                    ================================================== */}

                    <section className="smtp-section">

                        <div className="smtp-section-header">

                            <div className="smtp-section-icon">
                                <Mail size={22} />
                            </div>

                            <div>
                                <h2>SMTP Configuration</h2>

                                <p>
                                    Configure the SMTP settings for your
                                    email service provider.
                                </p>
                            </div>

                        </div>


                        <div className="smtp-config-layout">

                            {/* =====================================
                                SMTP FIELDS
                            ====================================== */}

                            <div className="smtp-fields-grid">

                                {/* Mail Driver */}

                                <div className="smtp-field">

                                    <label>
                                        Mail Driver
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Mail size={17} />

                                        <select
                                            name="mail_driver"
                                            value={formData.mail_driver}
                                            onChange={handleChange}
                                        >
                                            <option value="smtp">
                                                SMTP
                                            </option>

                                            <option value="sendmail">
                                                Sendmail
                                            </option>

                                            <option value="mailgun">
                                                Mailgun
                                            </option>

                                            <option value="ses">
                                                Amazon SES
                                            </option>
                                        </select>

                                        <ChevronDown size={16} />

                                    </div>

                                    <small>
                                        Select the mail driver to use
                                        for sending emails.
                                    </small>

                                </div>


                                {/* SMTP Port */}

                                <div className="smtp-field">

                                    <label>
                                        SMTP Port
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Server size={17} />

                                        <input
                                            type="number"
                                            name="smtp_port"
                                            value={formData.smtp_port}
                                            onChange={handleChange}
                                            placeholder="587"
                                        />

                                    </div>

                                    <small>
                                        Common ports: 587, 465 or 25.
                                    </small>

                                </div>


                                {/* SMTP Host */}

                                <div className="smtp-field">

                                    <label>
                                        SMTP Host
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Server size={17} />

                                        <input
                                            type="text"
                                            name="smtp_host"
                                            value={formData.smtp_host}
                                            onChange={handleChange}
                                            placeholder="smtp.example.com"
                                        />

                                    </div>

                                    <small>
                                        Enter your SMTP server hostname.
                                    </small>

                                </div>


                                {/* Username */}

                                <div className="smtp-field">

                                    <label>
                                        Username
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <User size={17} />

                                        <input
                                            type="email"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                        />

                                    </div>

                                    <small>
                                        Usually your email address.
                                    </small>

                                </div>


                                {/* Encryption */}

                                <div className="smtp-field">

                                    <label>
                                        Encryption
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Lock size={17} />

                                        <select
                                            name="encryption"
                                            value={formData.encryption}
                                            onChange={handleChange}
                                        >
                                            <option value="tls">
                                                TLS
                                            </option>

                                            <option value="ssl">
                                                SSL
                                            </option>

                                            <option value="">
                                                None
                                            </option>
                                        </select>

                                        <ChevronDown size={16} />

                                    </div>

                                    <small>
                                        Select TLS or SSL according to
                                        your SMTP provider.
                                    </small>

                                </div>


                                {/* Password */}

                                <div className="smtp-field">

                                    <label>
                                        Password
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Lock size={17} />

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter SMTP password"
                                        />

                                        <button
                                            type="button"
                                            className="smtp-password-toggle"
                                            onClick={() =>
                                                setShowPassword(
                                                    !showPassword
                                                )
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={17} />
                                            ) : (
                                                <Eye size={17} />
                                            )}
                                        </button>

                                    </div>

                                    <small>
                                        Your SMTP account password or
                                        application password.
                                    </small>

                                </div>


                                {/* From Address */}

                                <div className="smtp-field">

                                    <label>
                                        From Address
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <Mail size={17} />

                                        <input
                                            type="email"
                                            name="from_address"
                                            value={formData.from_address}
                                            onChange={handleChange}
                                            placeholder="noreply@example.com"
                                        />

                                    </div>

                                    <small>
                                        Default email address used for
                                        outgoing emails.
                                    </small>

                                </div>


                                {/* From Name */}

                                <div className="smtp-field">

                                    <label>
                                        From Name
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper">

                                        <User size={17} />

                                        <input
                                            type="text"
                                            name="from_name"
                                            value={formData.from_name}
                                            onChange={handleChange}
                                            placeholder="Maxus CRM"
                                        />

                                    </div>

                                    <small>
                                        Name displayed in received emails.
                                    </small>

                                </div>

                            </div>


                            {/* =====================================
                                TEST CONNECTION
                            ====================================== */}

                            <div className="smtp-test-card">

                                <div className="smtp-test-icon">
                                    <Send size={24} />
                                </div>

                                <div className="smtp-test-content">

                                    <h3>
                                        Test Connection
                                    </h3>

                                    <p>
                                        Verify that your SMTP configuration
                                        is working correctly.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="smtp-test-button"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection}
                                >
                                    <Send size={17} />

                                    {testingConnection
                                        ? "Testing..."
                                        : "Test Connection"}
                                </button>


                                <div
                                    className={`smtp-status ${
                                        connectionStatus
                                    }`}
                                >

                                    {connectionStatus === "success" ? (
                                        <>
                                            <CheckCircle size={20} />

                                            <div>
                                                <strong>
                                                    Connection Successful
                                                </strong>

                                                <span>
                                                    SMTP connection is
                                                    working correctly.
                                                </span>
                                            </div>
                                        </>
                                    ) : connectionStatus === "testing" ? (
                                        <>
                                            <div className="smtp-spinner" />

                                            <div>
                                                <strong>
                                                    Testing Connection
                                                </strong>

                                                <span>
                                                    Please wait...
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Info size={20} />

                                            <div>
                                                <strong>
                                                    Not Tested
                                                </strong>

                                                <span>
                                                    Test your SMTP
                                                    configuration.
                                                </span>
                                            </div>
                                        </>
                                    )}

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        ADDITIONAL SETTINGS
                    ================================================== */}

                    <section className="smtp-section">

                        <div className="smtp-section-header">

                            <div className="smtp-section-icon">
                                <Settings size={22} />
                            </div>

                            <div>
                                <h2>Additional Settings</h2>

                                <p>
                                    Configure additional email delivery
                                    settings.
                                </p>
                            </div>

                        </div>


                        <div className="smtp-additional-grid">

                            {/* Reply To */}

                            <div className="smtp-field">

                                <label>
                                    Reply To Address
                                </label>

                                <div className="smtp-input-wrapper">

                                    <Mail size={17} />

                                    <input
                                        type="email"
                                        name="reply_to"
                                        value={formData.reply_to}
                                        onChange={handleChange}
                                        placeholder="support@example.com"
                                    />

                                </div>

                                <small>
                                    Email address that receives replies.
                                </small>

                            </div>


                            {/* Mail Encryption */}

                            <div className="smtp-field">

                                <label>
                                    Mail Encryption
                                </label>

                                <div className="smtp-input-wrapper">

                                    <Lock size={17} />

                                    <select
                                        value={formData.encryption}
                                        onChange={(e) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                encryption:
                                                    e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="tls">
                                            TLS
                                        </option>

                                        <option value="ssl">
                                            SSL
                                        </option>

                                        <option value="">
                                            None
                                        </option>
                                    </select>

                                    <ChevronDown size={16} />

                                </div>

                                <small>
                                    Encryption method used for the
                                    SMTP connection.
                                </small>

                            </div>


                            {/* Test Email */}

                            <div className="smtp-field">

                                <label>
                                    Send Test Email To
                                </label>

                                <div className="smtp-input-wrapper">

                                    <Send size={17} />

                                    <input
                                        type="email"
                                        name="test_email"
                                        value={formData.test_email}
                                        onChange={handleChange}
                                        placeholder="admin@example.com"
                                    />

                                </div>

                                <small>
                                    Email address where test emails
                                    will be delivered.
                                </small>

                            </div>

                        </div>


                        {/* INFORMATION */}

                        <div className="smtp-information">

                            <Info size={18} />

                            <span>
                                Make sure your SMTP credentials are
                                correct and your server allows outgoing
                                connections on the configured port.
                            </span>

                        </div>

                    </section>


                    {/* =================================================
                        ACTION BAR
                    ================================================== */}

                    <div className="smtp-actions">

                        <button
                            type="button"
                            className="smtp-cancel-button"
                            onClick={handleCancel}
                        >
                            <X size={17} />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="smtp-save-button"
                        >
                            <Save size={17} />
                            Save Changes
                        </button>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default EmailSMTP;