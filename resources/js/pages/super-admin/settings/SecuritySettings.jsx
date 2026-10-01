import React, { useEffect, useState } from "react";

import "./SecuritySettings.css";

import {
    ShieldCheck,
    UserRound,
    Clock3,
    Smartphone,
    RotateCcw,
    Save,
    CheckCircle2,
    Info,
    Lightbulb,
    History,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";


const defaultSettings = {
    loginAttemptProtection: true,
    maxFailedAttempts: "5",
    lockoutDuration: "15",
    sessionTimeout: "30",
    rememberMe: true,
    logoutAfterPasswordChange: true,
    requireTwoFactor: false,
    allowUserTwoFactor: true,
};


const SecuritySettings = () => {

    const [settings, setSettings] =
        useState(defaultSettings);

    const [saved, setSaved] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [originalSettings, setOriginalSettings] =
        useState(defaultSettings);


    /*
    |--------------------------------------------------------------------------
    | Load Security Settings
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadSettings = async () => {

            try {

                setLoading(true);

                const response = await api.get(
                    "/superadmin/settings/security"
                );

                const data =
                    response.data?.data;

                if (data) {

                    const loadedSettings = {
                        loginAttemptProtection:
                            Boolean(
                                data.login_attempt_protection
                            ),

                        maxFailedAttempts:
                            String(
                                data.max_failed_attempts ?? 5
                            ),

                        lockoutDuration:
                            String(
                                data.lockout_duration ?? 15
                            ),

                        sessionTimeout:
                            String(
                                data.session_timeout ?? 30
                            ),

                        rememberMe:
                            Boolean(
                                data.remember_me
                            ),

                        logoutAfterPasswordChange:
                            Boolean(
                                data.logout_sessions_after_password_change
                            ),

                        requireTwoFactor:
                            Boolean(
                                data.require_two_factor
                            ),

                        allowUserTwoFactor:
                            Boolean(
                                data.allow_user_two_factor
                            ),
                    };

                    setSettings(
                        loadedSettings
                    );

                    setOriginalSettings(
                        loadedSettings
                    );
                }

            } catch (error) {

                console.error(
                    "Unable to load Security settings:",
                    error
                );

                await sweetAlert.error(
                    error.response?.data?.message ||
                    "Unable to load Security settings."
                );

            } finally {

                setLoading(false);
            }
        };


        loadSettings();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | Handle Field Change
    |--------------------------------------------------------------------------
    */

    const handleChange = (
        field,
        value
    ) => {

        setSettings((previous) => ({
            ...previous,
            [field]: value,
        }));

        setSaved(false);
    };


    /*
    |--------------------------------------------------------------------------
    | Reset
    |--------------------------------------------------------------------------
    */

    const handleReset = async () => {

        const result =
            await sweetAlert.confirm(
                "Reset the security settings to their default values?",
                {
                    title: "Reset Security Settings?",
                    confirmText: "Yes, Reset",
                    cancelText: "Cancel",
                }
            );

        if (!result.isConfirmed) {
            return;
        }

        setSettings({
            ...defaultSettings,
        });

        setSaved(false);

        await sweetAlert.success(
            "Security settings reset to default values."
        );
    };


    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {

        try {

            setSaving(true);

            setSaved(false);

            const payload = {
                login_attempt_protection:
                    settings.loginAttemptProtection,

                max_failed_attempts:
                    Number(
                        settings.maxFailedAttempts
                    ),

                lockout_duration:
                    Number(
                        settings.lockoutDuration
                    ),

                session_timeout:
                    Number(
                        settings.sessionTimeout
                    ),

                remember_me:
                    settings.rememberMe,

                logout_sessions_after_password_change:
                    settings.logoutAfterPasswordChange,

                require_two_factor:
                    settings.requireTwoFactor,

                allow_user_two_factor:
                    settings.allowUserTwoFactor,
            };


            const response =
                await api.put(
                    "/superadmin/settings/security-update",
                    payload
                );


            const data =
                response.data?.data;


            if (data) {

                const updatedSettings = {
                    loginAttemptProtection:
                        Boolean(
                            data.login_attempt_protection
                        ),

                    maxFailedAttempts:
                        String(
                            data.max_failed_attempts
                        ),

                    lockoutDuration:
                        String(
                            data.lockout_duration
                        ),

                    sessionTimeout:
                        String(
                            data.session_timeout
                        ),

                    rememberMe:
                        Boolean(
                            data.remember_me
                        ),

                    logoutAfterPasswordChange:
                        Boolean(
                            data.logout_sessions_after_password_change
                        ),

                    requireTwoFactor:
                        Boolean(
                            data.require_two_factor
                        ),

                    allowUserTwoFactor:
                        Boolean(
                            data.allow_user_two_factor
                        ),
                };

                setSettings(
                    updatedSettings
                );

                setOriginalSettings(
                    updatedSettings
                );
            }


            setSaved(true);


            await sweetAlert.success(
                response.data?.message ||
                "Security settings saved successfully."
            );


        } catch (error) {

            console.error(
                "Unable to save Security settings:",
                error
            );


            const validationErrors =
                error.response?.data?.errors;


            if (validationErrors) {

                const firstError =
                    Object.values(
                        validationErrors
                    )
                        .flat()
                        .find(Boolean);


                await sweetAlert.error(
                    firstError ||
                    "Please check the security settings."
                );

            } else {

                await sweetAlert.error(
                    error.response?.data?.message ||
                    "Unable to save Security settings."
                );
            }

        } finally {

            setSaving(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <div className="security-settings-page">

                <div
                    className="security-loading"
                    style={{
                        padding: "40px",
                        textAlign: "center",
                    }}
                >
                    Loading Security Settings...
                </div>

            </div>
        );
    }


    return (
        <div className="security-settings-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="security-page-header">

                <div className="security-page-heading">

                    <div className="security-page-icon">

                        <ShieldCheck
                            size={28}
                            strokeWidth={2}
                        />

                    </div>

                    <div>

                        <h1>
                            Security Settings
                        </h1>

                        <p>
                            Manage security and authentication controls
                            for the entire Maxus CRM system.
                        </p>

                    </div>

                </div>

            </div>


            {/* =====================================================
                MAIN SETTINGS CONTAINER
            ====================================================== */}

            <div className="security-settings-card">


                {/* =================================================
                    LOGIN SECURITY
                ================================================== */}

                <section className="security-section">

                    <div className="security-section-header">

                        <div className="security-section-icon security-blue">

                            <UserRound size={22} />

                        </div>

                        <div>

                            <h2>
                                Login Security
                            </h2>

                            <p>
                                Protect the CRM from repeated failed
                                login attempts.
                            </p>

                        </div>

                    </div>


                    <div className="security-section-body">


                        <div className="security-setting-row">

                            <div className="security-setting-content">

                                <h3>
                                    Login Attempt Protection
                                </h3>

                                <p>
                                    Automatically lock an account after
                                    multiple failed login attempts.
                                </p>

                            </div>


                            <ToggleSwitch
                                checked={
                                    settings.loginAttemptProtection
                                }
                                onChange={(value) =>
                                    handleChange(
                                        "loginAttemptProtection",
                                        value
                                    )
                                }
                            />

                        </div>


                        <div className="security-fields-grid">

                            <div className="security-field">

                                <label>
                                    Maximum Failed Attempts
                                </label>

                                <select
                                    value={
                                        settings.maxFailedAttempts
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "maxFailedAttempts",
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        !settings.loginAttemptProtection
                                    }
                                >

                                    <option value="3">
                                        3 Attempts
                                    </option>

                                    <option value="5">
                                        5 Attempts
                                    </option>

                                    <option value="7">
                                        7 Attempts
                                    </option>

                                    <option value="10">
                                        10 Attempts
                                    </option>

                                </select>

                            </div>


                            <div className="security-field">

                                <label>
                                    Lockout Duration
                                </label>

                                <select
                                    value={
                                        settings.lockoutDuration
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "lockoutDuration",
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        !settings.loginAttemptProtection
                                    }
                                >

                                    <option value="5">
                                        5 Minutes
                                    </option>

                                    <option value="15">
                                        15 Minutes
                                    </option>

                                    <option value="30">
                                        30 Minutes
                                    </option>

                                    <option value="60">
                                        60 Minutes
                                    </option>

                                </select>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SESSION SECURITY
                ================================================== */}

                <section className="security-section">

                    <div className="security-section-header">

                        <div className="security-section-icon security-orange">

                            <Clock3 size={22} />

                        </div>

                        <div>

                            <h2>
                                Session Security
                            </h2>

                            <p>
                                Control how long users remain
                                authenticated.
                            </p>

                        </div>

                    </div>


                    <div className="security-section-body">


                        <div className="security-full-field">

                            <div className="security-field">

                                <label>
                                    Session Timeout
                                </label>

                                <select
                                    value={
                                        settings.sessionTimeout
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            "sessionTimeout",
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="15">
                                        15 Minutes
                                    </option>

                                    <option value="30">
                                        30 Minutes
                                    </option>

                                    <option value="60">
                                        60 Minutes
                                    </option>

                                    <option value="120">
                                        2 Hours
                                    </option>

                                    <option value="240">
                                        4 Hours
                                    </option>

                                </select>

                                <small>
                                    Users will be logged out automatically
                                    after inactivity.
                                </small>

                            </div>

                        </div>


                        <div className="security-setting-row">

                            <div className="security-setting-content">

                                <h3>
                                    Remember Me
                                </h3>

                                <p>
                                    Allow users to remain signed in on
                                    trusted devices.
                                </p>

                            </div>


                            <ToggleSwitch
                                checked={
                                    settings.rememberMe
                                }
                                onChange={(value) =>
                                    handleChange(
                                        "rememberMe",
                                        value
                                    )
                                }
                            />

                        </div>


                        <div className="security-setting-row">

                            <div className="security-setting-content">

                                <h3>
                                    Logout Sessions After Password Change
                                </h3>

                                <p>
                                    Automatically invalidate existing
                                    sessions when a password is changed.
                                </p>

                            </div>


                            <ToggleSwitch
                                checked={
                                    settings.logoutAfterPasswordChange
                                }
                                onChange={(value) =>
                                    handleChange(
                                        "logoutAfterPasswordChange",
                                        value
                                    )
                                }
                            />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    TWO FACTOR AUTHENTICATION
                ================================================== */}

                <section className="security-section">

                    <div className="security-section-header">

                        <div className="security-section-icon security-purple">

                            <Smartphone size={22} />

                        </div>

                        <div>

                            <h2>
                                Two-Factor Authentication
                            </h2>

                            <p>
                                Add an additional authentication layer
                                to CRM accounts.
                            </p>

                        </div>

                    </div>


                    <div className="security-section-body">


                        <div className="security-setting-row">

                            <div className="security-setting-content">

                                <h3>
                                    Require Two-Factor Authentication
                                </h3>

                                <p>
                                    Require supported users to verify
                                    their identity using a second factor.
                                </p>

                            </div>


                            <ToggleSwitch
                                checked={
                                    settings.requireTwoFactor
                                }
                                onChange={(value) =>
                                    handleChange(
                                        "requireTwoFactor",
                                        value
                                    )
                                }
                            />

                        </div>


                        <div className="security-setting-row">

                            <div className="security-setting-content">

                                <h3>
                                    Allow User 2FA
                                </h3>

                                <p>
                                    Allow individual users to configure
                                    two-factor authentication.
                                </p>

                            </div>


                            <ToggleSwitch
                                checked={
                                    settings.allowUserTwoFactor
                                }
                                onChange={(value) =>
                                    handleChange(
                                        "allowUserTwoFactor",
                                        value
                                    )
                                }
                            />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SECURITY OVERVIEW
                ================================================== */}

                <section className="security-overview-section">

                    <div className="security-overview-grid">


                        <div className="security-overview-card">

                            <div className="security-overview-title">

                                <div className="overview-icon green">

                                    <ShieldCheck size={19} />

                                </div>

                                <h3>
                                    Security Status
                                </h3>

                            </div>


                            <div className="security-status-list">

                                <StatusRow
                                    label="Login Protection"
                                    status={
                                        settings.loginAttemptProtection
                                            ? "Enabled"
                                            : "Disabled"
                                    }
                                    enabled={
                                        settings.loginAttemptProtection
                                    }
                                />


                                <StatusRow
                                    label="Session Protection"
                                    status="Enabled"
                                    enabled={true}
                                />


                                <StatusRow
                                    label="2FA"
                                    status={
                                        settings.requireTwoFactor
                                            ? "Required"
                                            : "Optional"
                                    }
                                    enabled={
                                        settings.requireTwoFactor
                                    }
                                    optional={
                                        !settings.requireTwoFactor
                                    }
                                />

                            </div>

                        </div>


                        <div className="security-overview-card">

                            <div className="security-overview-title">

                                <div className="overview-icon blue">

                                    <Lightbulb size={19} />

                                </div>

                                <h3>
                                    Security Tips
                                </h3>

                            </div>


                            <ul className="security-tips">

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Keep login attempt protection enabled.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Use session timeout for inactive users.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Enable two-factor authentication when required.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Review security settings regularly.
                                    </span>
                                </li>

                            </ul>

                        </div>


                        <div className="security-overview-card">

                            <div className="security-overview-title">

                                <div className="overview-icon purple">

                                    <History size={19} />

                                </div>

                                <h3>
                                    Last Updated
                                </h3>

                            </div>


                            <div className="security-last-updated">

                                <strong>
                                    {originalSettings.updatedAt
                                        ? originalSettings.updatedAt
                                        : "Configured"}
                                </strong>

                                <p>
                                    Security configuration is stored
                                    system-wide.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SYSTEM NOTICE
                ================================================== */}

                <div className="security-system-notice">

                    <div className="security-system-notice-icon">

                        <Info size={19} />

                    </div>

                    <div>

                        <strong>
                            System-wide security settings
                        </strong>

                        <p>
                            These settings apply across the Maxus CRM
                            platform. Company-specific security rules
                            can be managed separately inside the
                            respective company panel.
                        </p>

                    </div>

                </div>


                {/* =================================================
                    ACTION BAR
                ================================================== */}

                <div className="security-actions">

                    <div className="security-action-message">

                        {saved && (
                            <>
                                <CheckCircle2 size={17} />

                                <span>
                                    Security settings saved successfully.
                                </span>
                            </>
                        )}

                    </div>


                    <div className="security-action-buttons">

                        <button
                            type="button"
                            className="security-reset-btn"
                            onClick={handleReset}
                            disabled={saving}
                        >

                            <RotateCcw size={17} />

                            Reset

                        </button>


                        <button
                            type="button"
                            className="security-save-btn"
                            onClick={handleSave}
                            disabled={saving}
                        >

                            <Save size={17} />

                            {saving
                                ? "Saving..."
                                : saved
                                    ? "Saved"
                                    : "Save Changes"}

                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};


/*
|--------------------------------------------------------------------------
| Toggle Component
|--------------------------------------------------------------------------
*/

const ToggleSwitch = ({
    checked,
    onChange
}) => {

    return (
        <button
            type="button"
            className={`security-toggle ${
                checked ? "is-active" : ""
            }`}
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
        >
            <span />
        </button>
    );
};


/*
|--------------------------------------------------------------------------
| Status Row
|--------------------------------------------------------------------------
*/

const StatusRow = ({
    label,
    status,
    enabled,
    optional = false,
}) => {

    return (
        <div className="security-status-row">

            <span>
                {label}
            </span>

            <strong
                className={
                    enabled
                        ? "status-enabled"
                        : optional
                            ? "status-optional"
                            : "status-disabled"
                }
            >
                {status}
            </strong>

        </div>
    );
};


export default SecuritySettings;