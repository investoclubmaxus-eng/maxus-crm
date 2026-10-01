import React, { useEffect, useState } from "react";


import {
    Mail,
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";

import api from "../../../services/api";
import "./ForgotPassword.css";

export default function ForgotPassword({ onBackToLogin }) {
    const [email, setEmail] = useState("");

    const [submitted, setSubmitted] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

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
                    "Unable to load general settings:",
                    error
                );
            }
        };

        loadGeneralSettings();
    }, []);


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous messages
        setError("");
        setSuccess("");

        // Basic frontend validation
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/forgot-password",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },

                    body: JSON.stringify({
                        email: email.trim(),
                    }),
                }
            );

            const data = await response.json();


            /*
            |--------------------------------------------------------------------------
            | Validation / API Error
            |--------------------------------------------------------------------------
            */

            if (!response.ok) {
                const validationError =
                    data.errors?.email?.[0];

                throw new Error(
                    validationError ||
                    data.message ||
                    "Unable to send reset link."
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */

            setSuccess(
                data.message ||
                "If an account exists with this email address, a password reset link has been sent."
            );

            setSubmitted(true);

        } catch (err) {

            console.error(
                "Forgot password error:",
                err
            );

            setError(
                err.message ||
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | Success Screen
    |--------------------------------------------------------------------------
    */

    if (submitted) {
        return (
            <div className="maxus-forgot-page">

                 <div
                        className="maxus-forgot-image"
                        aria-hidden="true"
                        style={
                            generalSettings.loginImageUrl
                                ? {
                                    backgroundImage: `url("${generalSettings.loginImageUrl}")`,
                                }
                                : undefined
                        }
                    />

                <div className="maxus-forgot-panel">

                    <div className="maxus-forgot-box">

                        {/* SUCCESS ICON */}
                        <div className="maxus-success-icon">
                            <CheckCircle2 size={42} />
                        </div>


                        {/* SUCCESS TITLE */}
                        <h1>
                            Check Your Email
                        </h1>


                        {/* SUCCESS MESSAGE */}
                        <p className="maxus-forgot-description">

                            {success || (
                                <>
                                    If an account exists for{" "}
                                    <strong>
                                        {email}
                                    </strong>
                                    , we have sent a password
                                    reset link to that email
                                    address.
                                </>
                            )}

                        </p>


                        {/* EMAIL DISPLAY */}
                        <div className="maxus-forgot-email-display">

                            <Mail size={18} />

                            <span>
                                {email}
                            </span>

                        </div>


                        {/* BACK TO LOGIN */}
                        <button
                            type="button"
                            className="maxus-back-login maxus-success-back"
                            onClick={onBackToLogin}
                        >
                            <ArrowLeft size={16} />

                            <span>
                                Back to Login
                            </span>
                        </button>


                        {/* TAGLINE */}
                        <div className="maxus-forgot-tagline">
                            Powering Performance. Managing Growth.
                        </div>


                        {/* DIVIDER */}
                        <div className="maxus-forgot-divider"></div>


                        {/* COPYRIGHT */}
                        <div className="maxus-forgot-copyright">
                            © 2026 Maxus Professionals Pvt Ltd
                        </div>

                    </div>

                </div>

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Forgot Password Form
    |--------------------------------------------------------------------------
    */

    return (
        <div className="maxus-forgot-page">

            {/* LEFT IMAGE */}
            <div
                className="maxus-forgot-image"
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
            <div className="maxus-forgot-panel">

                <div className="maxus-forgot-box">

                    {/* TITLE */}
                    <h1>
                        Forgot Password?
                    </h1>


                    {/* DESCRIPTION */}
                    <p className="maxus-forgot-description">
                        Enter your registered email address
                        and we will send you a link to reset
                        your password.
                    </p>


                    {/* FORM */}
                    <form onSubmit={handleSubmit}>
                          {/* ERROR */}
                        {error && (
                            <div className="maxus-forgot-error">
                                {error}
                            </div>
                        )}


                        {/* EMAIL */}
                        <div className="maxus-forgot-field">

                            <label htmlFor="forgot-email">
                                Email address
                            </label>

                            <div className="maxus-forgot-input">

                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter your email address"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                                <Mail
                                    size={18}
                                    className="maxus-forgot-input-icon"
                                />

                            </div>

                        </div>


                      

                        {/* SEND BUTTON */}
                        <button
                            type="submit"
                            className="maxus-forgot-button"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="maxus-forgot-spinner" />
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}

                        </button>

                    </form>


                    {/* BACK TO LOGIN */}
                    <button
                        type="button"
                        className="maxus-back-login"
                        onClick={onBackToLogin}
                        disabled={loading}
                    >

                        <ArrowLeft size={16} />

                        <span>
                            Back to Login
                        </span>

                    </button>


                    {/* TAGLINE */}
                    <div className="maxus-forgot-tagline">
                        Powering Performance. Managing Growth.
                    </div>


                    {/* DIVIDER */}
                    <div className="maxus-forgot-divider"></div>


                    {/* COPYRIGHT */}
                    <div className="maxus-forgot-copyright">
                        © 2026 Maxus Professionals Pvt Ltd
                    </div>

                </div>

            </div>

        </div>
    );
}