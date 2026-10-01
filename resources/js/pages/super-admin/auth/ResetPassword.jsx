import React, { useEffect, useMemo, useState } from "react";
import {
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Mail,
    CircleAlert,
} from "lucide-react";

import api from "../../../services/api";
import "./ResetPassword.css";

const ResetPassword = ({ navigateTo }) => {
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [validationErrors, setValidationErrors] = useState({});

    const [generalSettings, setGeneralSettings] = useState({
        applicationName: "MAXUS CRM",
        loginImageUrl: null,
    });
    useEffect(() => {
        const loadGeneralSettings = async () => {
            try {
                const response = await api.get(
                    "/superadmin/settings/general"
                );

                console.log(
                    "RESET PASSWORD GENERAL SETTINGS:",
                    response.data
                );

                const data = response.data?.data;

                if (!data) {
                    return;
                }

                setGeneralSettings({
                    applicationName:
                        data.application_name || "MAXUS CRM",

                    loginImageUrl:
                        data.login_logo_url || null,
                });
            } catch (error) {
                console.error(
                    "Unable to load general settings for reset password:",
                    error
                );
            }
        };

        loadGeneralSettings();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Get token + email from reset URL
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const params = new URLSearchParams(
            window.location.search
        );

        setToken(params.get("token") || "");
        setEmail(params.get("email") || "");
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Password validation
    |--------------------------------------------------------------------------
    */

    const passwordChecks = useMemo(() => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
        };
    }, [password]);

    const isPasswordStrong =
        passwordChecks.length &&
        passwordChecks.uppercase &&
        passwordChecks.lowercase &&
        passwordChecks.number;

    /*
    |--------------------------------------------------------------------------
    | Navigate to Login
    |--------------------------------------------------------------------------
    */

    const goToLogin = () => {
        if (navigateTo) {
            navigateTo("/");
            return;
        }

        window.history.pushState({}, "", "/");
        window.dispatchEvent(
            new PopStateEvent("popstate")
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setValidationErrors({});

        if (!token || !email) {
            setError(
                "This password reset link is invalid or incomplete. Please request a new reset link."
            );
            return;
        }

        if (!password) {
            setError("Please enter your new password.");
            return;
        }

        if (!isPasswordStrong) {
            setError(
                "Please choose a password that meets all the requirements."
            );
            return;
        }

        if (!passwordConfirmation) {
            setError(
                "Please confirm your new password."
            );
            return;
        }

        if (password !== passwordConfirmation) {
            setError("The passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/reset-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },

                    body: JSON.stringify({
                        token,
                        email,
                        password,
                        password_confirmation:
                            passwordConfirmation,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setValidationErrors(data.errors);
                }

                setError(
                    data.message ||
                        "Unable to reset your password. Please try again."
                );

                return;
            }

            setSuccess(true);
        } catch (err) {
            console.error(
                "Reset password error:",
                err
            );

            setError(
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SUCCESS SCREEN
    |--------------------------------------------------------------------------
    */

    if (success) {
        return (
            <div className="maxus-reset-page">

                {/* LEFT IMAGE */}
                <div
                    className="maxus-reset-image"
                    aria-hidden="true"
                    style={
                        generalSettings.loginImageUrl
                            ? {
                                backgroundImage: `url("${generalSettings.loginImageUrl}")`,
                            }
                            : undefined
                    }
                />

                {/* RIGHT PANEL */}
                <div className="maxus-reset-panel">

                    <div className="maxus-reset-box maxus-reset-success-box">

                        {/* SUCCESS ICON */}
                        <div className="maxus-reset-success-icon">
                            <CheckCircle2 size={42} />
                        </div>

                        {/* TITLE */}
                        <h1>
                            Password Reset Successfully
                        </h1>

                        {/* DESCRIPTION */}
                        <p className="maxus-reset-description">
                            Your Maxus CRM password has been
                            updated successfully.
                        </p>

                        {/* CONTINUE */}
                        <button
                            type="button"
                            className="maxus-reset-button"
                            onClick={goToLogin}
                        >
                            Continue to Login
                        </button>

                        {/* TAGLINE */}
                        <div className="maxus-reset-tagline">
                            Powering Performance. Managing Growth.
                        </div>

                        {/* DIVIDER */}
                        <div className="maxus-reset-divider" />

                        {/* COPYRIGHT */}
                        <div className="maxus-reset-copyright">
                            © 2026 Maxus Professionals Pvt Ltd
                        </div>

                    </div>

                </div>

            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD FORM
    |--------------------------------------------------------------------------
    */

    return (
        <div className="maxus-reset-page">

            {/* LEFT IMAGE */}
            <div
                className="maxus-reset-image"
                aria-hidden="true"
                style={
                    generalSettings.loginImageUrl
                        ? {
                            backgroundImage: `url("${generalSettings.loginImageUrl}")`,
                        }
                        : undefined
                }
            />

            {/* RIGHT PANEL */}
            <div className="maxus-reset-panel">

                <div className="maxus-reset-box">

                    {/* TITLE */}
                    <h1>
                        Reset Password
                    </h1>

                    {/* DESCRIPTION */}
                    <p className="maxus-reset-description">
                        Create a new password for your
                        Maxus CRM account.
                    </p>

                    {/* EMAIL INFO */}
                    <div className="maxus-reset-email-display">

                        <Mail size={18} />

                        <div>
                            <span>
                                Resetting password for
                            </span>

                            <strong>
                                {email || "your account"}
                            </strong>
                        </div>

                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="maxus-reset-error">
                            <CircleAlert size={18} />

                            <span>
                                {error}
                            </span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* NEW PASSWORD */}
                        <div className="maxus-reset-field">

                            <label htmlFor="reset-password">
                                New Password
                            </label>

                            <div className="maxus-reset-input">

                                <LockKeyhole
                                    size={18}
                                    className="maxus-reset-input-icon"
                                />

                                <input
                                    id="reset-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(
                                            e.target.value
                                        );
                                        setError("");
                                    }}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="maxus-reset-eye"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>

                            </div>

                            {validationErrors.password && (
                                <div className="maxus-reset-field-error">
                                    {
                                        validationErrors
                                            .password[0]
                                    }
                                </div>
                            )}

                        </div>

                        {/* PASSWORD REQUIREMENTS */}
                        <div className="maxus-password-requirements">

                            <div className="maxus-password-requirements-title">
                                Password must contain:
                            </div>

                            <div
                                className={
                                    passwordChecks.length
                                        ? "requirement valid"
                                        : "requirement"
                                }
                            >
                                <span>
                                    {passwordChecks.length
                                        ? "✓"
                                        : "○"}
                                </span>

                                At least 8 characters
                            </div>

                            <div
                                className={
                                    passwordChecks.uppercase
                                        ? "requirement valid"
                                        : "requirement"
                                }
                            >
                                <span>
                                    {passwordChecks.uppercase
                                        ? "✓"
                                        : "○"}
                                </span>

                                One uppercase letter
                            </div>

                            <div
                                className={
                                    passwordChecks.lowercase
                                        ? "requirement valid"
                                        : "requirement"
                                }
                            >
                                <span>
                                    {passwordChecks.lowercase
                                        ? "✓"
                                        : "○"}
                                </span>

                                One lowercase letter
                            </div>

                            <div
                                className={
                                    passwordChecks.number
                                        ? "requirement valid"
                                        : "requirement"
                                }
                            >
                                <span>
                                    {passwordChecks.number
                                        ? "✓"
                                        : "○"}
                                </span>

                                One number
                            </div>

                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="maxus-reset-field">

                            <label htmlFor="reset-password-confirm">
                                Confirm New Password
                            </label>

                            <div className="maxus-reset-input">

                                <LockKeyhole
                                    size={18}
                                    className="maxus-reset-input-icon"
                                />

                                <input
                                    id="reset-password-confirm"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={
                                        passwordConfirmation
                                    }
                                    onChange={(e) => {
                                        setPasswordConfirmation(
                                            e.target.value
                                        );
                                        setError("");
                                    }}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="maxus-reset-eye"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>

                            </div>

                            {passwordConfirmation &&
                                password !==
                                    passwordConfirmation && (
                                    <div className="maxus-reset-field-error">
                                        Passwords do not match.
                                    </div>
                                )}

                            {validationErrors.password_confirmation && (
                                <div className="maxus-reset-field-error">
                                    {
                                        validationErrors
                                            .password_confirmation[0]
                                    }
                                </div>
                            )}

                        </div>

                        {/* RESET BUTTON */}
                        <button
                            type="submit"
                            className="maxus-reset-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="maxus-reset-spinner" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>

                    </form>

                    {/* BACK TO LOGIN */}
                    <button
                        type="button"
                        className="maxus-reset-back-login"
                        onClick={goToLogin}
                        disabled={loading}
                    >
                        <ArrowLeft size={16} />

                        <span>
                            Back to Login
                        </span>
                    </button>

                    {/* TAGLINE */}
                    <div className="maxus-reset-tagline">
                        Powering Performance. Managing Growth.
                    </div>

                    {/* DIVIDER */}
                    <div className="maxus-reset-divider" />

                    {/* COPYRIGHT */}
                    <div className="maxus-reset-copyright">
                        © 2026 Maxus Professionals Pvt Ltd
                    </div>

                </div>

            </div>

        </div>
    );
};

export default ResetPassword;