import React, { useEffect, useState } from "react";
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
    ShieldCheck
    


} from "lucide-react";

import "./EmailSMTP.css";
import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";

function EmailSMTP({ onNavigate }) {
    const [showPassword, setShowPassword] = useState(false);

    const [testingConnection, setTestingConnection] =
        useState(false);

    const [connectionStatus, setConnectionStatus] =
        useState("not-tested");

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

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

    /*
    |--------------------------------------------------------------------------
    | Password exists in backend
    |--------------------------------------------------------------------------
    |
    | We never fetch the real SMTP password from the backend.
    | The backend only returns has_password = true/false.
    |
    */
    const [hasExistingPassword, setHasExistingPassword] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | Error message helper
    |--------------------------------------------------------------------------
    */

    const getErrorMessage = (
        error,
        fallbackMessage
    ) => {
        const validationErrors =
            error.response?.data?.errors;

        if (validationErrors) {
            const firstError = Object.values(
                validationErrors
            )
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


    /*
    |--------------------------------------------------------------------------
    | Handle form changes
    |--------------------------------------------------------------------------
    */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        /*
         * Whenever SMTP configuration changes,
         * previous connection status is no longer reliable.
         */
        if (connectionStatus !== "not-tested") {
            setConnectionStatus("not-tested");
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Load SMTP Settings
    |--------------------------------------------------------------------------
    */

    const loadEmailSmtpSettings = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/superadmin/settings/email-smtp"
            );

            const data = response.data;

            const settings = data.settings || {};

            setFormData((previous) => ({
                ...previous,

                mail_driver:
                    settings.mail_driver ||
                    "smtp",

                smtp_host:
                    settings.smtp_host ||
                    "",

                smtp_port:
                    String(
                        settings.smtp_port ??
                        587
                    ),

                encryption:
                    settings.encryption ??
                    "tls",

                username:
                    settings.username ||
                    "",

                /*
                 * IMPORTANT:
                 *
                 * Do not put the backend password here.
                 * Backend only returns has_password.
                 */
                password: "",

                from_address:
                    settings.from_address ||
                    "",

                from_name:
                    settings.from_name ||
                    "Maxus CRM",

                reply_to:
                    settings.reply_to ||
                    "",
            }));

            setHasExistingPassword(
                Boolean(settings.has_password)
            );

        } catch (error) {
            console.error(
                "Failed to load SMTP settings:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Failed to load email SMTP settings."
                )
            );

        } finally {
            setLoading(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Load settings when page opens
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadEmailSmtpSettings();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Test SMTP Connection
    |--------------------------------------------------------------------------
    */

    const handleTestConnection = async () => {
        /*
         * Test email is required because the backend
         * sends an actual test email.
         */
        if (!formData.test_email) {
            await sweetAlert.error(
                "Please enter the email address where the test email should be sent."
            );

            return;
        }

        /*
         * Basic frontend email validation.
         * Backend will also validate it.
         */
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(formData.test_email)) {
            await sweetAlert.error(
                "Please enter a valid test email address."
            );

            return;
        }

        /*
         * SMTP host is necessary before testing.
         */
        if (!formData.smtp_host) {
            await sweetAlert.error(
                "Please enter the SMTP host before testing the connection."
            );

            return;
        }

        /*
         * Username is required.
         */
        if (!formData.username) {
            await sweetAlert.error(
                "Please enter the SMTP username before testing the connection."
            );

            return;
        }

        /*
         * If there is no saved password,
         * user must enter one.
         */
        if (
            !hasExistingPassword &&
            !formData.password
        ) {
            await sweetAlert.error(
                "Please enter the SMTP password before testing the connection."
            );

            return;
        }

        try {
            setTestingConnection(true);

            setConnectionStatus("testing");

            /*
             * Test connection API.
             *
             * The test endpoint uses the SMTP
             * configuration already saved in DB.
             */
            const response = await api.post(
                "/superadmin/settings/email-smtp/test",
                {
                    recipient:
                        formData.test_email,
                }
            );

            const data = response.data;

            if (
                data.status ===
                "connected"
            ) {
                setConnectionStatus(
                    "success"
                );

                await sweetAlert.success(
                    data.message ||
                        "SMTP connection is working and the test email was sent successfully."
                );

                return;
            }

            setConnectionStatus(
                "not-tested"
            );

            await sweetAlert.error(
                data.message ||
                    "Unable to connect to the configured SMTP server."
            );

        } catch (error) {
            console.error(
                "SMTP connection test failed:",
                error
            );

            setConnectionStatus(
                "not-tested"
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to connect to the configured SMTP server."
                )
            );

        } finally {
            setTestingConnection(
                false
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Save SMTP Settings
    |--------------------------------------------------------------------------
    */

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            /*
             * Prepare backend payload.
             */
            const payload = {
                mail_driver:
                    formData.mail_driver,

                smtp_host:
                    formData.smtp_host.trim(),

                smtp_port:
                    Number(
                        formData.smtp_port
                    ),

                username:
                    formData.username.trim(),

                /*
                 * If password is empty and an existing
                 * password is already stored, the backend
                 * will keep the existing password.
                 */
                password:
                    formData.password,

                encryption:
                    formData.encryption ||
                    null,

                from_address:
                    formData.from_address.trim(),

                from_name:
                    formData.from_name.trim(),

                reply_to:
                    formData.reply_to.trim() ||
                    null,
            };

            const response = await api.put(
                "/superadmin/settings/email-smtp-update",
                payload
            );

            const data = response.data;

            const settings =
                data.settings || {};

            /*
             * Update frontend values from backend.
             */
            setFormData((previous) => ({
                ...previous,

                mail_driver:
                    settings.mail_driver ||
                    previous.mail_driver,

                smtp_host:
                    settings.smtp_host ||
                    "",

                smtp_port:
                    String(
                        settings.smtp_port ??
                        587
                    ),

                encryption:
                    settings.encryption ??
                    "tls",

                username:
                    settings.username ||
                    "",

                /*
                 * Never place real password
                 * into frontend state.
                 */
                password: "",

                from_address:
                    settings.from_address ||
                    "",

                from_name:
                    settings.from_name ||
                    "Maxus CRM",

                reply_to:
                    settings.reply_to ||
                    "",
            }));

            setHasExistingPassword(
                Boolean(
                    settings.has_password
                )
            );

            /*
             * Saving configuration does not mean
             * SMTP is actually working.
             *
             * Reset connection status.
             */
            setConnectionStatus(
                "not-tested"
            );

            await sweetAlert.success(
                data.message ||
                    "Email SMTP settings updated successfully."
            );

        } catch (error) {
            console.error(
                "Failed to save SMTP settings:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Failed to update email SMTP settings."
                )
            );

        } finally {
            setSaving(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {
        if (onNavigate) {
            onNavigate(
                "/system-settings"
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {
        return (
            <div className="smtp-page">

                <div className="smtp-main-card">

                    <div
                        style={{
                            padding: "40px",
                            textAlign: "center",
                        }}
                    >
                        Loading email SMTP settings...
                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="smtp-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="smtp-page-header">

                <div className="smtp-title-section">

                    <div className="smtp-title-icon">
                        <Mail
                            size={28}
                            strokeWidth={2}
                        />
                    </div>

                    <div>

                        <h1>
                            Email / SMTP Settings
                        </h1>

                        <p>
                            Configure your email service
                            provider (SMTP) settings to
                            send emails from the system.
                        </p>

                    </div>

                </div>


                <div className="smtp-breadcrumb">

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate(
                                "/dashboard"
                            )
                        }
                    >
                        Dashboard
                    </span>

                    <span>›</span>

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate(
                                "/system-settings"
                            )
                        }
                    >
                        System Settings
                    </span>

                    <span>›</span>

                    <strong>
                        Email / SMTP
                    </strong>

                </div>

            </div>


            {/* =====================================================
                MAIN FORM
            ====================================================== */}

            <form onSubmit={handleSave}>

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

                                <h2>
                                    SMTP Configuration
                                </h2>

                                <p>
                                    Configure the SMTP settings
                                    for your email service
                                    provider.
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

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Mail size={17} />

                                        <select
                                            name="mail_driver"
                                            value={
                                                formData.mail_driver
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        >

                                            <option value="smtp">
                                                SMTP
                                            </option>

                                            {/*
                                             * These drivers are not
                                             * supported by the current
                                             * EmailSmtpSettingRequest/
                                             * Service implementation.
                                             */}

                                            <option
                                                value="sendmail"
                                                disabled
                                            >
                                                Sendmail
                                            </option>

                                            <option
                                                value="mailgun"
                                                disabled
                                            >
                                                Mailgun
                                            </option>

                                            <option
                                                value="ses"
                                                disabled
                                            >
                                                Amazon SES
                                            </option>

                                        </select>

                                        <ChevronDown
                                        className="smtp-select-chevron"
                                            size={16}
                                        />

                                    </div>

                                    <small>
                                        SMTP is currently supported
                                        by the Maxus CRM email
                                        configuration.
                                    </small>

                                </div>


                                {/* SMTP Port */}

                                <div className="smtp-field">

                                    <label>
                                        SMTP Port
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Server size={17} />

                                        <input
                                            type="number"
                                            name="smtp_port"
                                            value={
                                                formData.smtp_port
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="587"
                                        />

                                    </div>

                                    <small>
                                        Common ports: 587, 465
                                        or 25.
                                    </small>

                                </div>


                                {/* SMTP Host */}

                                <div className="smtp-field">

                                    <label>
                                        SMTP Host
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Server size={17} />

                                        <input
                                            type="text"
                                            name="smtp_host"
                                            value={
                                                formData.smtp_host
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="smtp.example.com"
                                        />

                                    </div>

                                    <small>
                                        Enter your SMTP server
                                        hostname.
                                    </small>

                                </div>


                                {/* Username */}

                                <div className="smtp-field">

                                    <label>
                                        Username
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <User size={17} />

                                        <input
                                            type="email"
                                            name="username"
                                            value={
                                                formData.username
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="email@example.com"
                                        />

                                    </div>

                                    <small>
                                        Usually your email
                                        address.
                                    </small>

                                </div>


                                {/* Encryption */}

                                <div className="smtp-field">

                                    <label>
                                        Encryption
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Lock size={17} />

                                        <select
                                            name="encryption"
                                            value={
                                                formData.encryption
                                            }
                                            onChange={
                                                handleChange
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

                                        <ChevronDown
                                        className="smtp-select-chevron"
                                            size={16}
                                        />

                                    </div>

                                    <small>
                                        Select TLS or SSL
                                        according to your
                                        SMTP provider.
                                    </small>

                                </div>


                                {/* Password */}

                                <div className="smtp-field">

                                    <label>
                                        Password
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Lock size={17} />

                                        <input
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            name="password"
                                            value={
                                                formData.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder={
                                                hasExistingPassword
                                                    ? "Leave blank to keep existing password"
                                                    : "Enter SMTP password"
                                            }
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
                                                <EyeOff
                                                    size={17}
                                                />
                                            ) : (
                                                <Eye
                                                    size={17}
                                                />
                                            )}
                                        </button>

                                    </div>

                                    <small>
                                        {hasExistingPassword
                                            ? "An SMTP password is already configured. Leave blank to keep it unchanged."
                                            : "Your SMTP account password or application password."}
                                    </small>

                                </div>


                                {/* From Address */}

                                <div className="smtp-field">

                                    <label>
                                        From Address
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <Mail size={17} />

                                        <input
                                            type="email"
                                            name="from_address"
                                            value={
                                                formData.from_address
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="noreply@example.com"
                                        />

                                    </div>

                                    <small>
                                        Default email address
                                        used for outgoing
                                        emails.
                                    </small>

                                </div>


                                {/* From Name */}

                                <div className="smtp-field">

                                    <label>
                                        From Name
                                        <span>*</span>
                                    </label>

                                    <div className="smtp-input-wrapper smtp-select-wrapper">

                                        <User size={17} />

                                        <input
                                            type="text"
                                            name="from_name"
                                            value={
                                                formData.from_name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Maxus CRM"
                                        />

                                    </div>

                                    <small>
                                        Name displayed in
                                        received emails.
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
                                        Verify that your SMTP
                                        configuration is
                                        working correctly.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="smtp-test-button"
                                    onClick={
                                        handleTestConnection
                                    }
                                    disabled={
                                        testingConnection
                                    }
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

                                    {connectionStatus ===
                                    "success" ? (
                                        <>
                                            <CheckCircle
                                                size={20}
                                            />

                                            <div>

                                                <strong>
                                                    Connection
                                                    Successful
                                                </strong>

                                                <span>
                                                    SMTP connection
                                                    is working
                                                    correctly and
                                                    the test email
                                                    was sent.
                                                </span>

                                            </div>
                                        </>
                                    ) : connectionStatus ===
                                      "testing" ? (
                                        <>
                                            <div className="smtp-spinner" />

                                            <div>

                                                <strong>
                                                    Testing
                                                    Connection
                                                </strong>

                                                <span>
                                                    Please wait...
                                                </span>

                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Info
                                                size={20}
                                            />

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

                                <h2>
                                    Additional Settings
                                </h2>

                                <p>
                                    Configure additional email
                                    delivery settings.
                                </p>

                            </div>

                        </div>


                        <div className="smtp-additional-grid">

                            {/* Reply To */}

                            <div className="smtp-field">

                                <label>
                                    Reply To Address
                                </label>

                                <div className="smtp-input-wrapper smtp-select-wrapper">

                                    <Mail size={17} />

                                    <input
                                        type="email"
                                        name="reply_to"
                                        value={
                                            formData.reply_to
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="support@example.com"
                                    />

                                </div>

                                <small>
                                    Email address that
                                    receives replies.
                                </small>

                            </div>


                            {/* Mail Encryption */}

                            <div className="smtp-field">

                                <label>
                                    Mail Encryption
                                </label>

                                <div className="smtp-input-wrapper smtp-select-wrapper">

                                    <Lock size={17} />

                                    <select
                                        name="encryption"
                                        value={
                                            formData.encryption
                                        }
                                        onChange={
                                            handleChange
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

                                    <ChevronDown
                                    className="smtp-select-chevron"
                                        size={16}
                                    />

                                </div>

                                <small>
                                    Encryption method used
                                    for the SMTP connection.
                                </small>

                            </div>


                            {/* Test Email */}

                            <div className="smtp-field">

                                <label>
                                    Send Test Email To
                                </label>

                                <div className="smtp-input-wrapper smtp-select-wrapper">

                                    <Send size={17} />

                                    <input
                                        type="email"
                                        name="test_email"
                                        value={
                                            formData.test_email
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="admin@example.com"
                                    />

                                </div>

                                <small>
                                    Email address where test
                                    emails will be delivered.
                                </small>

                            </div>

                        </div>


                        {/* INFORMATION */}

                        <div className="smtp-information">

                            <Info size={18} />

                            <span>
                                Make sure your SMTP
                                credentials are correct
                                and your server allows
                                outgoing connections on
                                the configured port.
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
                            onClick={
                                handleCancel
                            }
                            disabled={saving}
                        >

                            <X size={17} />

                            Cancel

                        </button>


                        <button
                            type="submit"
                            className="smtp-save-button"
                            disabled={saving}
                        >

                            <Save size={17} />

                            {saving
                                ? "Saving..."
                                : "Save Changes"}

                        </button>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default EmailSMTP;