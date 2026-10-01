import React, { useEffect, useState } from "react";

import {
    Mail,
    Eye,
    EyeOff,
    ShieldCheck,
} from "lucide-react";

import api from "../../../services/api";
import "./Login.css";


export default function Login({
    onForgotPassword,
    onLogin,
}) {

    // =====================================================
    // LOGIN STATE
    // =====================================================

    const [showPassword, setShowPassword] = useState(false);

    const [rememberMe, setRememberMe] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | Remember Me Setting
    |--------------------------------------------------------------------------
    |
    | This comes from:
    |
    | GET /login-settings
    |
    | Default is false for security.
    |
    */

    const [rememberMeEnabled, setRememberMeEnabled] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");


    // =====================================================
    // TWO-FACTOR AUTHENTICATION STATE
    // =====================================================

    /*
    |--------------------------------------------------------------------------
    | requiresTwoFactor
    |--------------------------------------------------------------------------
    |
    | false:
    |       Normal email/password login screen
    |
    | true:
    |       Show 2FA verification screen
    |
    */

    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | Temporary 2FA Challenge Token
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This is NOT the Sanctum authentication token.
    |
    | It is only used to complete the 2FA login challenge.
    |
    */

    const [twoFactorToken, setTwoFactorToken] = useState("");


    /*
    |--------------------------------------------------------------------------
    | 6 Digit Authentication Code
    |--------------------------------------------------------------------------
    */

    const [twoFactorCode, setTwoFactorCode] = useState("");


    /*
    |--------------------------------------------------------------------------
    | 2FA Verification Loading
    |--------------------------------------------------------------------------
    */

    const [isVerifyingTwoFactor, setIsVerifyingTwoFactor] =
        useState(false);


    // =====================================================
    // GENERAL SETTINGS
    // =====================================================

    const [generalSettings, setGeneralSettings] = useState({
        applicationName: "MAXUS CRM",
        loginImageUrl: null,
    });


    // =====================================================
    // LOGIN FORM
    // =====================================================

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });


    // =====================================================
    // LOAD GENERAL SETTINGS
    // =====================================================

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


    // =====================================================
    // LOAD LOGIN SETTINGS
    // =====================================================
    //
    // IMPORTANT:
    //
    // Do NOT call:
    //
    // /superadmin/settings/security
    //
    // because that endpoint requires authentication.
    //
    // The login page uses:
    //
    // /login-settings
    //
    // which is a public endpoint containing only the
    // settings required before authentication.
    // =====================================================

    useEffect(() => {

        const loadLoginSettings = async () => {

            try {

                const response = await api.get(
                    "/login-settings"
                );

                const data = response.data?.data;

                if (!data) {

                    setRememberMeEnabled(false);
                    setRememberMe(false);

                    return;
                }

                const rememberEnabled =
                    Boolean(data.remember_me);

                setRememberMeEnabled(
                    rememberEnabled
                );


                /*
                |--------------------------------------------------------------------------
                | If Remember Me is disabled system-wide,
                | force the checkbox OFF.
                |--------------------------------------------------------------------------
                */

                if (!rememberEnabled) {

                    setRememberMe(false);

                }

            } catch (error) {

                console.error(
                    "Unable to load login settings:",
                    error
                );


                /*
                |--------------------------------------------------------------------------
                | Fail Closed
                |--------------------------------------------------------------------------
                |
                | If the frontend cannot verify the setting,
                | Remember Me remains disabled.
                |
                */

                setRememberMeEnabled(false);
                setRememberMe(false);

            }

        };

        loadLoginSettings();

    }, []);


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

    };


    // =====================================================
    // LOGIN SUBMIT
    // =====================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setIsSubmitting(true);
        setErrorMessage("");

        try {

            // =================================================
            // LOGIN API
            // =================================================

            const response = await api.post(
                "/login",
                {
                    email: formData.email,
                    password: formData.password,
                    remember_me: rememberMe,
                }
            );


            // =================================================
            // TWO-FACTOR AUTHENTICATION REQUIRED
            // =================================================
            //
            // If backend determines that this user has 2FA
            // enabled, it MUST NOT return a normal Sanctum
            // authentication token yet.
            //
            // Instead it returns:
            //
            // requires_two_factor: true
            // two_factor_token: temporary challenge
            //
            // =================================================

            if (
                response.data?.requires_two_factor === true
            ) {

                const challengeToken =
                    response.data?.two_factor_token;

                if (!challengeToken) {

                    setErrorMessage(
                        "Unable to start two-factor authentication. Please try again."
                    );

                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | Store only temporary challenge
                |--------------------------------------------------------------------------
                */

                setTwoFactorToken(
                    challengeToken
                );


                /*
                |--------------------------------------------------------------------------
                | Clear previous code
                |--------------------------------------------------------------------------
                */

                setTwoFactorCode("");


                /*
                |--------------------------------------------------------------------------
                | Show 2FA screen
                |--------------------------------------------------------------------------
                */

                setRequiresTwoFactor(true);


                /*
                |--------------------------------------------------------------------------
                | Clear any previous error
                |--------------------------------------------------------------------------
                */

                setErrorMessage("");


                return;
            }


            // =================================================
            // NORMAL LOGIN
            // =================================================

            /*
            |--------------------------------------------------------------------------
            | Backend is the final authority.
            |--------------------------------------------------------------------------
            |
            | Even if frontend sends:
            |
            | remember_me: true
            |
            | Laravel may return:
            |
            | remember_me: false
            |
            | if the system setting is disabled.
            |
            */

            const effectiveRememberMe =
                Boolean(
                    response.data?.remember_me
                );


            // =================================================
            // TOKEN STORAGE
            // =================================================
            //
            // Remember Me ON:
            //
            //     localStorage
            //
            // Remember Me OFF:
            //
            //     sessionStorage
            //
            // =================================================

            const storage =
                effectiveRememberMe
                    ? localStorage
                    : sessionStorage;


            const otherStorage =
                effectiveRememberMe
                    ? sessionStorage
                    : localStorage;


            /*
            |--------------------------------------------------------------------------
            | Remove old authentication token
            |--------------------------------------------------------------------------
            */

            otherStorage.removeItem(
                "auth_token"
            );


            /*
            |--------------------------------------------------------------------------
            | Store new authentication token
            |--------------------------------------------------------------------------
            */

            if (response.data?.token) {

                storage.setItem(
                    "auth_token",
                    response.data.token
                );

            }


            // =================================================
            // STORE USER
            // =================================================

            if (response.data?.user) {

                storage.setItem(
                    "user",
                    JSON.stringify(
                        response.data.user
                    )
                );


                /*
                |--------------------------------------------------------------------------
                | Make sure old user data isn't left
                | in the other storage.
                |--------------------------------------------------------------------------
                */

                otherStorage.removeItem(
                    "user"
                );

            }


            // =================================================
            // LOGIN CALLBACK
            // =================================================

            onLogin(
                response.data?.user
            );

        } catch (error) {

            // =================================================
            // VALIDATION ERRORS
            // =================================================

            const validationErrors =
                error.response?.data?.errors;


            const firstValidationError =
                validationErrors
                    ? Object.values(
                        validationErrors
                    ).flat()[0]
                    : null;


            // =================================================
            // DISPLAY ERROR
            // =================================================

            setErrorMessage(
                firstValidationError ||
                    error.response?.data?.message ||
                    "Unable to sign in. Please try again."
            );

        } finally {

            setIsSubmitting(false);

        }

    };


    // =====================================================
    // VERIFY TWO-FACTOR AUTHENTICATION
    // =====================================================

    const handleVerifyTwoFactor = async (e) => {

        e.preventDefault();

        const code =
            twoFactorCode.trim();


        // =================================================
        // VALIDATE CODE
        // =================================================

        if (!/^\d{6}$/.test(code)) {

            setErrorMessage(
                "Please enter the 6-digit authentication code."
            );

            return;
        }


        // =================================================
        // CHECK CHALLENGE TOKEN
        // =================================================

        if (!twoFactorToken) {

            setErrorMessage(
                "Your two-factor verification session has expired. Please login again."
            );

            return;
        }


        setIsVerifyingTwoFactor(true);
        setErrorMessage("");


        try {

            // =================================================
            // VERIFY 2FA
            // =================================================

            const response = await api.post(
                "/login/2fa",
                {
                    two_factor_token:
                        twoFactorToken,

                    code: code,
                }
            );


            // =================================================
            // LOGIN SUCCESS AFTER 2FA
            // =================================================

            const effectiveRememberMe =
                Boolean(
                    response.data?.remember_me
                );


            // =================================================
            // TOKEN STORAGE
            // =================================================

            const storage =
                effectiveRememberMe
                    ? localStorage
                    : sessionStorage;


            const otherStorage =
                effectiveRememberMe
                    ? sessionStorage
                    : localStorage;


            // =================================================
            // REMOVE OLD TOKENS
            // =================================================

            otherStorage.removeItem(
                "auth_token"
            );

            otherStorage.removeItem(
                "user"
            );


            // =================================================
            // STORE AUTH TOKEN
            // =================================================

            if (response.data?.token) {

                storage.setItem(
                    "auth_token",
                    response.data.token
                );

            }


            // =================================================
            // STORE USER
            // =================================================

            if (response.data?.user) {

                storage.setItem(
                    "user",
                    JSON.stringify(
                        response.data.user
                    )
                );

            }


            // =================================================
            // CLEAR 2FA STATE
            // =================================================

            setRequiresTwoFactor(false);

            setTwoFactorCode("");

            setTwoFactorToken("");

            setErrorMessage("");


            // =================================================
            // LOGIN CALLBACK
            // =================================================

            onLogin(
                response.data?.user
            );

        } catch (error) {

            // =================================================
            // VALIDATION ERRORS
            // =================================================

            const validationErrors =
                error.response?.data?.errors;


            const firstValidationError =
                validationErrors
                    ? Object.values(
                        validationErrors
                    ).flat()[0]
                    : null;


            // =================================================
            // DISPLAY ERROR
            // =================================================

            setErrorMessage(
                firstValidationError ||
                    error.response?.data?.message ||
                    "Invalid authentication code. Please try again."
            );

        } finally {

            setIsVerifyingTwoFactor(
                false
            );

        }

    };


    // =====================================================
    // RETURN TO NORMAL LOGIN
    // =====================================================

    const handleBackToLogin = () => {

        /*
        |--------------------------------------------------------------------------
        | Clear 2FA state
        |--------------------------------------------------------------------------
        */

        setRequiresTwoFactor(false);

        setTwoFactorCode("");

        setTwoFactorToken("");

        setErrorMessage("");

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="maxus-login">


            {/* =================================================
                IMAGE SIDE
            ================================================= */}

            <div
                className="maxus-login-image"
                style={
                    generalSettings.loginImageUrl
                        ? {
                              backgroundImage:
                                  `url("${generalSettings.loginImageUrl}")`,
                          }
                        : undefined
                }
            >
            </div>


            {/* =================================================
                LOGIN SIDE
            ================================================= */}

            <div className="maxus-login-right">

                <div className="maxus-login-box">


                    {/* =================================================
                        TWO-FACTOR LOGIN
                    ================================================= */}

                    {requiresTwoFactor ? (

                        <>
                            {/* =================================================
                                2FA TITLE
                            ================================================= */}

                            <div className="maxus-two-factor-login-header">

                                <div className="maxus-two-factor-login-icon">

                                    <ShieldCheck
                                        size={30}
                                    />

                                </div>


                                <h1>
                                    Two-Factor Authentication
                                </h1>

                                {/* =================================================
                                    ERROR MESSAGE
                                ================================================= */}

                                {errorMessage && (

                                    <div
                                        className="maxus-login-error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </div>

                                )}


                                <p>
                                    Enter the 6-digit verification
                                    code from your authenticator app.
                                </p>

                            </div>


                            {/* =================================================
                                2FA FORM
                            ================================================= */}

                            <form
                                onSubmit={
                                    handleVerifyTwoFactor
                                }
                            >


                                


                                {/* =================================================
                                    AUTHENTICATION CODE
                                ================================================= */}

                                <div className="maxus-field">

                                    <label
                                        htmlFor="login-two-factor-code"
                                    >
                                        Authentication Code
                                    </label>


                                    <div className="maxus-input">

                                        <input
                                            id="login-two-factor-code"
                                            name="two_factor_code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            pattern="[0-9]{6}"
                                            value={twoFactorCode}
                                            onChange={(e) =>
                                                setTwoFactorCode(
                                                    e.target.value
                                                        .replace(
                                                            /\D/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            6
                                                        )
                                                )
                                            }
                                            placeholder="Enter 6-digit code"
                                            autoFocus
                                            required
                                            disabled={
                                                isVerifyingTwoFactor
                                            }
                                        />

                                    </div>

                                </div>


                                {/* =================================================
                                    INFORMATION
                                ================================================= */}

                                <div className="maxus-two-factor-login-info">

                                    <ShieldCheck
                                        size={18}
                                    />

                                    <span>
                                        Open your authenticator
                                        app and enter the current
                                        6-digit code shown for
                                        Maxus CRM.
                                    </span>

                                </div>


                                {/* =================================================
                                    VERIFY BUTTON
                                ================================================= */}

                                <button
                                    type="submit"
                                    className="maxus-login-button"
                                    disabled={
                                        twoFactorCode.length !==
                                            6 ||
                                        isVerifyingTwoFactor
                                    }
                                >
                                    {isVerifyingTwoFactor
                                        ? "Verifying..."
                                        : "Verify & Login"}
                                </button>


                                {/* =================================================
                                    BACK TO LOGIN
                                ================================================= */}

                                <button
                                    type="button"
                                    className="maxus-forgot maxus-two-factor-back"
                                    onClick={
                                        handleBackToLogin
                                    }
                                    disabled={
                                        isVerifyingTwoFactor
                                    }
                                >
                                    Back to Login
                                </button>

                            </form>

                        </>

                    ) : (

                        <>
                            {/* =================================================
                                NORMAL LOGIN TITLE
                            ================================================= */}

                            <h1>
                                Welcome Back
                            </h1>


                            {/* =================================================
                                LOGIN FORM
                            ================================================= */}

                            <form
                                onSubmit={
                                    handleSubmit
                                }
                            >


                                {/* =================================================
                                    ERROR MESSAGE
                                ================================================= */}

                                {errorMessage && (

                                    <div
                                        className="maxus-login-error"
                                        role="alert"
                                    >
                                        {errorMessage}
                                    </div>

                                )}


                                {/* =================================================
                                    EMAIL
                                ================================================= */}

                                <div className="maxus-field">

                                    <label
                                        htmlFor="email"
                                    >
                                        Email address
                                    </label>


                                    <div className="maxus-input">

                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your email address"
                                            autoComplete="email"
                                            required
                                            disabled={
                                                isSubmitting
                                            }
                                        />


                                        <Mail
                                            size={18}
                                            className="maxus-input-icon"
                                        />

                                    </div>

                                </div>


                                {/* =================================================
                                    PASSWORD
                                ================================================= */}

                                <div className="maxus-field">

                                    <label
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>


                                    <div className="maxus-input">

                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={
                                                formData.password
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            required
                                            disabled={
                                                isSubmitting
                                            }
                                        />


                                        <button
                                            type="button"
                                            className="maxus-eye"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) =>
                                                        !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            disabled={
                                                isSubmitting
                                            }
                                        >

                                            {showPassword ? (

                                                <EyeOff
                                                    size={18}
                                                />

                                            ) : (

                                                <Eye
                                                    size={18}
                                                />

                                            )}

                                        </button>

                                    </div>

                                </div>


                                {/* =================================================
                                    OPTIONS
                                ================================================= */}

                                <div className="maxus-login-options">


                                    {/* =================================================
                                        REMEMBER ME
                                    ================================================= */}

                                    {rememberMeEnabled && (

                                        <label
                                            className="maxus-remember"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    rememberMe
                                                }
                                                onChange={(e) =>
                                                    setRememberMe(
                                                        e.target.checked
                                                    )
                                                }
                                                disabled={
                                                    isSubmitting
                                                }
                                            />

                                            <span>
                                                Remember me
                                            </span>

                                        </label>

                                    )}


                                    {/* =================================================
                                        FORGOT PASSWORD
                                    ================================================= */}

                                    <button
                                        type="button"
                                        className="maxus-forgot"
                                        onClick={
                                            onForgotPassword
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                    >
                                        Forgot Password?
                                    </button>

                                </div>


                                {/* =================================================
                                    LOGIN BUTTON
                                ================================================= */}

                                <button
                                    type="submit"
                                    className="maxus-login-button"
                                    disabled={
                                        isSubmitting
                                    }
                                >

                                    {isSubmitting
                                        ? "Signing in..."
                                        : "Login"}

                                </button>

                            </form>

                        </>

                    )}


                    {/* =================================================
                        TAGLINE
                    ================================================= */}

                    <div className="maxus-tagline">
                        Powering Performance. Managing Growth.
                    </div>


                    {/* =================================================
                        DIVIDER
                    ================================================= */}

                    <div className="maxus-divider">
                    </div>


                    {/* =================================================
                        COPYRIGHT
                    ================================================= */}

                    <div className="maxus-copyright">
                        @ 2026 Maxus Professionals Pvt Ltd
                    </div>


                </div>

            </div>

        </div>

    );

}