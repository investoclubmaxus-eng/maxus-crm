import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Settings,
    BriefcaseBusiness,
    Palette,
    Monitor,
    Upload,
    Trash2,
    Save,
    X,
    Info,
    Database,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";


import "./GeneralSettings.css";


/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

const API_URL =
    "/superadmin/settings/general";


/*
|--------------------------------------------------------------------------
| General Settings Component
|--------------------------------------------------------------------------
*/

const GeneralSettings = () => {

    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    const [settings, setSettings] = useState({
        applicationName: "",
        applicationUrl: "",
        environment: "",
        applicationStatus: "",

    });


    /*
    |--------------------------------------------------------------------------
    | EXISTING / PREVIEW IMAGES
    |--------------------------------------------------------------------------
    */

    const [logo, setLogo] = useState(null);
    const [loginLogo, setLoginLogo] = useState(null);
    const [favicon, setFavicon] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | NEW SELECTED FILES
    |--------------------------------------------------------------------------
    */

    const [logoFile, setLogoFile] = useState(null);
    const [loginLogoFile, setLoginLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);


    /*
    |--------------------------------------------------------------------------
    | UI STATES
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    /*
    |--------------------------------------------------------------------------
    | FILE INPUT REFS
    |--------------------------------------------------------------------------
    */

    const logoInputRef = useRef(null);
    const loginLogoInputRef = useRef(null);
    const faviconInputRef = useRef(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD GENERAL SETTINGS
    |--------------------------------------------------------------------------
    */

    const fetchGeneralSettings = async () => {

        try {

            setLoading(true);
            setError("");
            setSuccess("");


            /*
            |--------------------------------------------------------------------------
            | Axios GET
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            | No response.ok here.
            |
            | Axios throws automatically for:
            | 401
            | 403
            | 404
            | 422
            | 500
            |
            */

            const response = await api.get(
                API_URL
            );


            /*
            |--------------------------------------------------------------------------
            | Axios response data
            |--------------------------------------------------------------------------
            */

            const result = response.data;


            console.log(
                "GENERAL SETTINGS RESPONSE:",
                result
            );


            /*
            |--------------------------------------------------------------------------
            | Get actual data
            |--------------------------------------------------------------------------
            */

            const data =
                result?.data || {};


            /*
            |--------------------------------------------------------------------------
            | Application Information
            |--------------------------------------------------------------------------
            */

            setSettings({

                applicationName:
                    data.application_name || "",

                applicationUrl:
                    data.application_url || "",
                environment:
                    data.environment || "",

                applicationStatus:
                    data.application_status || "",    

            });


            /*
            |--------------------------------------------------------------------------
            | Existing Images
            |--------------------------------------------------------------------------
            */

            setLogo(
                data.logo_url || null
            );

            setLoginLogo(
                data.login_logo_url || null
            );

            setFavicon(
                data.favicon_url || null
            );


            /*
            |--------------------------------------------------------------------------
            | Clear Selected Files
            |--------------------------------------------------------------------------
            */

            setLogoFile(null);
            setLoginLogoFile(null);
            setFaviconFile(null);


            /*
            |--------------------------------------------------------------------------
            | Clear File Inputs
            |--------------------------------------------------------------------------
            */

            if (logoInputRef.current) {
                logoInputRef.current.value = "";
            }

            if (loginLogoInputRef.current) {
                loginLogoInputRef.current.value = "";
            }

            if (faviconInputRef.current) {
                faviconInputRef.current.value = "";
            }


        } catch (err) {

            console.error(
                "General settings fetch error:",
                err
            );


            /*
            |--------------------------------------------------------------------------
            | 401
            |--------------------------------------------------------------------------
            */

            if (
                err.response?.status === 401
            ) {

                setError(
                    "Your session has expired. Please login again."
                );

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Laravel Error
            |--------------------------------------------------------------------------
            */

            const message =
                err.response?.data?.message ||
                err.message ||
                "Unable to load general settings.";


            setError(message);


        } finally {

            setLoading(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | LOAD DATA ON PAGE OPEN
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        fetchGeneralSettings();

    }, []);


    /*
    |--------------------------------------------------------------------------
    | INPUT CHANGE
    |--------------------------------------------------------------------------
    */

    const handleInputChange = (e) => {

        const {
            name,
            value,
        } = e.target;


        setSettings((prev) => ({

            ...prev,

            [name]: value,

        }));


        /*
        | Clear messages
        */

        setError("");
        setSuccess("");
    };


    /*
    |--------------------------------------------------------------------------
    | IMAGE CHANGE
    |--------------------------------------------------------------------------
    */

    const handleImageChange = (
        e,
        type
    ) => {

        const file =
            e.target.files?.[0];


        if (!file) {
            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Validate File Type
        |--------------------------------------------------------------------------
        */

        const allowedTypes = [

            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/x-icon",

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setError(
                "Please select a valid image file."
            );

            e.target.value = "";

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Create Preview
        |--------------------------------------------------------------------------
        */

        const imageUrl =
            URL.createObjectURL(file);


        /*
        |--------------------------------------------------------------------------
        | Application Logo
        |--------------------------------------------------------------------------
        */

        if (type === "logo") {

            setLogo(imageUrl);

            setLogoFile(file);
        }


        /*
        |--------------------------------------------------------------------------
        | Login Logo
        |--------------------------------------------------------------------------
        */

        if (type === "loginLogo") {

            setLoginLogo(imageUrl);

            setLoginLogoFile(file);
        }


        /*
        |--------------------------------------------------------------------------
        | Favicon
        |--------------------------------------------------------------------------
        */

        if (type === "favicon") {

            setFavicon(imageUrl);

            setFaviconFile(file);
        }


        setError("");
        setSuccess("");
    };


    /*
    |--------------------------------------------------------------------------
    | REMOVE IMAGE
    |--------------------------------------------------------------------------
    */

    const removeImage = async (type) => {


        /*
        |--------------------------------------------------------------------------
        | Application Logo
        |--------------------------------------------------------------------------
        */

        if (type === "logo") {

            /*
            | New file not saved yet
            */

            if (logoFile) {

                setLogo(null);

                setLogoFile(null);


                if (logoInputRef.current) {

                    logoInputRef.current.value =
                        "";
                }

                return;
            }


            /*
            | Existing database image
            */

           const result = await sweetAlert.confirm(
                "Are you sure you want to remove the application logo?",
                {
                    title: "Remove Application Logo?",
                    confirmText: "Yes, Remove",
                    cancelText: "Cancel",
                }
            );

            if (!result.isConfirmed) {
                return;
            }

            await deleteImage(
                "logo",
                `${API_URL}/logo`,
                "Application logo removed successfully."
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Login Logo
        |--------------------------------------------------------------------------
        */

        if (type === "loginLogo") {

            if (loginLogoFile) {

                setLoginLogo(null);

                setLoginLogoFile(null);


                if (
                    loginLogoInputRef.current
                ) {

                    loginLogoInputRef.current.value =
                        "";
                }

                return;
            }


            const result = await sweetAlert.confirm(
                "Are you sure you want to remove the login page logo?",
                {
                    title: "Remove Login Logo?",
                    confirmText: "Yes, Remove",
                    cancelText: "Cancel",
                }
            );

            if (!result.isConfirmed) {
                return;
            }

            await deleteImage(
                "loginLogo",
                `${API_URL}/login-logo`,
                "Login logo removed successfully."
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | Favicon
        |--------------------------------------------------------------------------
        */

        if (type === "favicon") {

            if (faviconFile) {

                setFavicon(null);

                setFaviconFile(null);


                if (
                    faviconInputRef.current
                ) {

                    faviconInputRef.current.value =
                        "";
                }

                return;
            }


           const result = await sweetAlert.confirm(
                "Are you sure you want to remove the favicon?",
                {
                    title: "Remove Favicon?",
                    confirmText: "Yes, Remove",
                    cancelText: "Cancel",
                }
            );

            if (!result.isConfirmed) {
                return;
            }

            await deleteImage(
                "favicon",
                `${API_URL}/favicon`,
                "Favicon removed successfully."
            );
        }
    };


    /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE API
    |--------------------------------------------------------------------------
    */

    const deleteImage = async (
        type,
        url,
        successMessage
    ) => {

        try {

            setError("");
            setSuccess("");


            /*
            |--------------------------------------------------------------------------
            | Axios DELETE
            |--------------------------------------------------------------------------
            */

            const response =
                await api.delete(url);


            console.log(
                "DELETE IMAGE RESPONSE:",
                response.data
            );


            /*
            |--------------------------------------------------------------------------
            | Update Preview
            |--------------------------------------------------------------------------
            */

            if (type === "logo") {

                setLogo(null);

                setLogoFile(null);


                if (logoInputRef.current) {

                    logoInputRef.current.value =
                        "";
                }
            }


            if (type === "loginLogo") {

                setLoginLogo(null);

                setLoginLogoFile(null);


                if (
                    loginLogoInputRef.current
                ) {

                    loginLogoInputRef.current.value =
                        "";
                }
            }


            if (type === "favicon") {

                setFavicon(null);

                setFaviconFile(null);


                if (
                    faviconInputRef.current
                ) {

                    faviconInputRef.current.value =
                        "";
                }
            }


            await sweetAlert.success(
                response.data?.message ||
                successMessage
            );


        } catch (err) {

            console.error(
                "Delete image error:",
                err
            );


            const message =
                err.response?.data?.message ||
                err.message ||
                "Unable to remove image.";


            await sweetAlert.error(message);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | SAVE GENERAL SETTINGS
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {

        try {

            setSaving(true);

            setError("");

            setSuccess("");


            /*
            |--------------------------------------------------------------------------
            | FormData
            |--------------------------------------------------------------------------
            */

            const formData =
                new FormData();


            /*
            |--------------------------------------------------------------------------
            | Application Name
            |--------------------------------------------------------------------------
            */

            formData.append(
                "application_name",
                settings.applicationName
            );


            /*
            |--------------------------------------------------------------------------
            | Application URL
            |--------------------------------------------------------------------------
            */

            formData.append(
                "application_url",
                settings.applicationUrl
            );


            /*
            |--------------------------------------------------------------------------
            | Application Logo
            |--------------------------------------------------------------------------
            */

            if (logoFile) {

                formData.append(
                    "logo",
                    logoFile
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Login Logo
            |--------------------------------------------------------------------------
            */

            if (loginLogoFile) {

                formData.append(
                    "login_logo",
                    loginLogoFile
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Favicon
            |--------------------------------------------------------------------------
            */

            if (faviconFile) {

                formData.append(
                    "favicon",
                    faviconFile
                );
            }


            /*
            |--------------------------------------------------------------------------
            | Debug FormData
            |--------------------------------------------------------------------------
            */

            console.log(
                "Saving General Settings..."
            );


            /*
            |--------------------------------------------------------------------------
            | Axios POST
            |--------------------------------------------------------------------------
            |
            | DO NOT manually set Content-Type.
            |
            | Axios/browser will automatically generate:
            |
            | multipart/form-data; boundary=...
            |
            */

            const response =
                await api.post(
                    API_URL,
                    formData
                );


            console.log(
                "SAVE GENERAL SETTINGS RESPONSE:",
                response.data
            );


            /*
            |--------------------------------------------------------------------------
            | Get Response
            |--------------------------------------------------------------------------
            */

            const result =
                response.data;


            const data =
                result?.data || {};


            /*
            |--------------------------------------------------------------------------
            | Update State
            |--------------------------------------------------------------------------
            */

            setSettings({

                applicationName:
                    data.application_name || "",

                applicationUrl:
                    data.application_url || "",
                environment:
                    data.environment || "",

                applicationStatus:
                    data.application_status || "",        

            });


            /*
            |--------------------------------------------------------------------------
            | Update Images
            |--------------------------------------------------------------------------
            */

            setLogo(
                data.logo_url || null
            );

            setLoginLogo(
                data.login_logo_url || null
            );

            setFavicon(
                data.favicon_url || null
            );


            /*
            |--------------------------------------------------------------------------
            | Clear Selected Files
            |--------------------------------------------------------------------------
            */

            setLogoFile(null);

            setLoginLogoFile(null);

            setFaviconFile(null);


            /*
            |--------------------------------------------------------------------------
            | Clear File Inputs
            |--------------------------------------------------------------------------
            */

            if (logoInputRef.current) {

                logoInputRef.current.value =
                    "";
            }

            if (
                loginLogoInputRef.current
            ) {

                loginLogoInputRef.current.value =
                    "";
            }

            if (
                faviconInputRef.current
            ) {

                faviconInputRef.current.value =
                    "";
            }


            /*
            |--------------------------------------------------------------------------
            | Success
            |--------------------------------------------------------------------------
            */

           await sweetAlert.success(
                result?.message ||
                "General settings saved successfully."
            );


        } catch (err) {

            console.error(
                "Save general settings error:",
                err
            );


            /*
            |--------------------------------------------------------------------------
            | Laravel Validation Errors
            |--------------------------------------------------------------------------
            */

            if (
                err.response?.status === 422
            ) {

                const validationErrors =
                    err.response?.data?.errors;


                if (validationErrors) {

                    const firstError =
                        Object.values(
                            validationErrors
                        )?.[0]?.[0];


                    await sweetAlert.error(
                        firstError ||
                        "Please check the entered information."
                    );

                } else {

                     await sweetAlert.error(
                        err.response?.data?.message ||
                        "Validation failed."
                    );
                }

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Unauthorized
            |--------------------------------------------------------------------------
            */

            if (
                err.response?.status === 401
            ) {

               await sweetAlert.error(
                    "Your session has expired. Please login again."
                )

                return;
            }


            /*
            |--------------------------------------------------------------------------
            | Other Error
            |--------------------------------------------------------------------------
            */

            await sweetAlert.error(
                err.response?.data?.message ||
                err.message ||
                "Unable to save general settings."
            );


        } finally {

            setSaving(false);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {

        setError("");

        setSuccess("");


        /*
        | Clear selected files
        */

        setLogoFile(null);

        setLoginLogoFile(null);

        setFaviconFile(null);


        /*
        | Clear input values
        */

        if (logoInputRef.current) {

            logoInputRef.current.value =
                "";
        }

        if (
            loginLogoInputRef.current
        ) {

            loginLogoInputRef.current.value =
                "";
        }

        if (
            faviconInputRef.current
        ) {

            faviconInputRef.current.value =
                "";
        }


        /*
        | Reload saved database data
        */

        fetchGeneralSettings();
    };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (

            <div className="general-settings-page">

                <div className="general-settings-card">

                    <div className="settings-loading">

                        Loading General Settings...

                    </div>

                </div>

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (

        <div className="general-settings-page">


            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="general-page-header">

                <div className="general-title-section">

                    <div className="general-title-icon">

                        <Settings size={28} />

                    </div>


                    <div>

                        <h1>
                            General Settings
                        </h1>

                        <p>
                            Configure the basic application and branding
                            information for Maxus CRM.
                        </p>

                    </div>

                </div>

            </div>


            {/* =====================================================
                MAIN CONTAINER
            ====================================================== */}

            <div className="general-settings-card">


                {/* =================================================
                    ALERTS
                ================================================== */}

                {error && (

                    <div className="settings-alert settings-alert-error">

                        {error}

                    </div>

                )}


                {success && (

                    <div className="settings-alert settings-alert-success">

                        {success}

                    </div>

                )}


                {/* =================================================
                    APPLICATION INFORMATION
                ================================================== */}

                <section className="general-section">

                    <div className="general-section-header">

                        <div className="general-section-icon">

                            <BriefcaseBusiness size={20} />

                        </div>


                        <div>

                            <h2>
                                Application Information
                            </h2>

                            <p>
                                Manage the basic identity and URL of your
                                application.
                            </p>

                        </div>

                    </div>


                    <div className="application-fields">


                        {/* APPLICATION NAME */}

                        <div className="general-form-group">

                            <label>

                                Application Name

                                <span>
                                    *
                                </span>

                            </label>


                            <input
                                type="text"
                                name="applicationName"
                                value={
                                    settings.applicationName
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="Enter application name"
                            />


                            <small>
                                This name will be displayed throughout the
                                application.
                            </small>

                        </div>


                        {/* APPLICATION URL */}

                        <div className="general-form-group">

                            <label>

                                Application URL

                                <span>
                                    *
                                </span>

                            </label>


                            <input
                                type="url"
                                name="applicationUrl"
                                value={
                                    settings.applicationUrl
                                }
                                onChange={
                                    handleInputChange
                                }
                                placeholder="https://example.com"
                            />


                            <small>
                                Main URL used to access your CRM application.
                            </small>

                        </div>


                    </div>

                </section>


                {/* =================================================
                    APPLICATION BRANDING
                ================================================== */}

                <section className="general-section">

                    <div className="general-section-header">

                        <div className="general-section-icon">

                            <Palette size={20} />

                        </div>


                        <div>

                            <h2>
                                Application Branding
                            </h2>

                            <p>
                                Upload the images used across the CRM
                                application.
                            </p>

                        </div>

                    </div>


                    <div className="branding-grid">


                        <BrandingUpload
                            title="Application Logo"
                            description="Main logo used inside the CRM."
                            image={logo}
                            inputRef={logoInputRef}
                            onChange={(e) =>
                                handleImageChange(
                                    e,
                                    "logo"
                                )
                            }
                            onRemove={() =>
                                removeImage(
                                    "logo"
                                )
                            }
                            recommended="Recommended: 180 × 50 px"
                        />


                        <BrandingUpload
                            title="Login Page Logo"
                            description="Logo displayed on the login screen."
                            image={loginLogo}
                            inputRef={loginLogoInputRef}
                            onChange={(e) =>
                                handleImageChange(
                                    e,
                                    "loginLogo"
                                )
                            }
                            onRemove={() =>
                                removeImage(
                                    "loginLogo"
                                )
                            }
                            recommended="Recommended: 220 × 70 px"
                        />


                        <BrandingUpload
                            title="Favicon"
                            description="Small icon displayed in the browser tab."
                            image={favicon}
                            inputRef={faviconInputRef}
                            onChange={(e) =>
                                handleImageChange(
                                    e,
                                    "favicon"
                                )
                            }
                            onRemove={() =>
                                removeImage(
                                    "favicon"
                                )
                            }
                            recommended="Recommended: 32 × 32 px"
                            isFavicon
                        />


                    </div>

                </section>


                {/* =================================================
                    LOGIN PAGE PREVIEW
                ================================================== */}

                <section className="general-section">

                    <div className="general-section-header">

                        <div className="general-section-icon">

                            <Monitor size={20} />

                        </div>


                        <div>

                            <h2>
                                Login Page Preview
                            </h2>

                            <p>
                                Preview how your Maxus CRM login page will
                                appear to users.
                            </p>

                        </div>

                    </div>


                    <div className="login-preview-wrapper">

                        <div className="login-preview">


                            {/* LEFT IMAGE */}

                            <div className="login-preview-left">

                                {/* <img
                                    src="/images/login-background.png"
                                    alt="Maxus Login Background"
                                    className="login-preview-background"
                                    onError={(e) => {
                                        e.currentTarget.style.display =
                                            "none";
                                    }}
                                /> */}
                                {loginLogo ? (

                                        <img
                                            src={loginLogo}
                                            alt="Maxus Logo"
                                        />

                                    ) : (

                                        <span>
                                            MAXUS
                                        </span>

                                    )}


                                <div className="login-preview-left-overlay"></div>


                                

                            </div>


                            {/* RIGHT LOGIN PANEL */}

                            <div className="login-preview-right">

                                <div className="login-preview-form">


                                    <h3>
                                        Welcome Back
                                    </h3>


                                    {/* EMAIL */}

                                    <div className="preview-field-group">

                                        <label>
                                            Email address
                                        </label>


                                        <div className="preview-input-box">

                                            <span>
                                                Enter your email address
                                            </span>


                                            <span className="preview-input-icon">

                                                <svg
                                                    width="17"
                                                    height="17"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                >

                                                    <rect
                                                        x="3"
                                                        y="5"
                                                        width="18"
                                                        height="14"
                                                        rx="2"
                                                    />

                                                    <path d="m3 7 9 6 9-6" />

                                                </svg>

                                            </span>

                                        </div>

                                    </div>


                                    {/* PASSWORD */}

                                    <div className="preview-field-group">

                                        <label>
                                            Password
                                        </label>


                                        <div className="preview-input-box">

                                            <span>
                                                Enter your password
                                            </span>


                                            <span className="preview-input-icon">

                                                <svg
                                                    width="17"
                                                    height="17"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                >

                                                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="2.5"
                                                    />

                                                </svg>

                                            </span>

                                        </div>

                                    </div>


                                    {/* REMEMBER / FORGOT */}

                                    <div className="preview-login-options">

                                        <div className="preview-remember">

                                            <span className="preview-checkbox"></span>

                                            <span>
                                                Remember me
                                            </span>

                                        </div>


                                        <span className="preview-forgot">

                                            Forgot Password?

                                        </span>

                                    </div>


                                    {/* LOGIN BUTTON */}

                                    <button
                                        type="button"
                                        className="preview-login-btn"
                                    >
                                        Login
                                    </button>


                                    {/* TAGLINE */}

                                    <div className="preview-tagline">

                                        Powering Performance. Managing Growth.

                                    </div>


                                    {/* DIVIDER */}

                                    <div className="preview-divider"></div>


                                    {/* COPYRIGHT */}

                                    <div className="preview-copyright">

                                        © 2026 Maxus Professionals Pvt Ltd

                                    </div>


                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    SYSTEM INFORMATION
                ================================================== */}

                <section className="general-section">

                    <div className="general-section-header">

                        <div className="general-section-icon">

                            <Database size={20} />

                        </div>


                        <div>

                            <h2>
                                System Information
                            </h2>

                            <p>
                                Basic information about the current CRM
                                environment.
                            </p>

                        </div>

                    </div>


                    <div className="system-information-grid">


                        <div className="system-info-item">

                            <span>
                                Application
                            </span>

                            <strong>
                                {
                                    settings.applicationName ||
                                    "Maxus CRM"
                                }
                            </strong>

                        </div>


                        <div className="system-info-item">

                            <span>
                                Environment
                            </span>


                            <strong className="status-badge">

                                <CheckCircle2 size={14} />

                               {
                                    settings.environment
                                        ? settings.environment
                                            .charAt(0)
                                            .toUpperCase() +
                                        settings.environment.slice(1)
                                        : "Unknown"
                                }

                            </strong>

                        </div>


                        <div className="system-info-item">

                            <span>
                                Application Status
                            </span>


                             <strong
                                className={
                                    settings.applicationStatus === "active"
                                        ? "status-badge"
                                        : "status-badge status-badge-warning"
                                }
                            >

                                {settings.applicationStatus === "active" ? (
                                    <CheckCircle2 size={14} />
                                ) : (
                                    <AlertTriangle size={14} />
                                )}

                                {
                                    settings.applicationStatus === "active"
                                        ? "Active"
                                        : settings.applicationStatus === "maintenance"
                                            ? "Maintenance"
                                            : "Unknown"
                                }

                            </strong>

                        </div>


                    </div>

                </section>


                {/* =================================================
                    ACTION BAR
                ================================================== */}

                <div className="general-settings-actions">


                    <button
                        type="button"
                        className="general-cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                    >

                        <X size={18} />

                        Cancel

                    </button>


                    <button
                        type="button"
                        className="general-save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >

                        <Save size={18} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"
                        }

                    </button>


                </div>


            </div>

        </div>
    );
};


/*
|--------------------------------------------------------------------------
| BRANDING UPLOAD COMPONENT
|--------------------------------------------------------------------------
*/

const BrandingUpload = ({
    title,
    description,
    image,
    inputRef,
    onChange,
    onRemove,
    recommended,
    isFavicon = false,
}) => {

    return (

        <div className="branding-item">


            <div className="branding-item-header">

                <div>

                    <h3>
                        {title}
                    </h3>

                    <p>
                        {description}
                    </p>

                </div>

            </div>


            {/* IMAGE PREVIEW */}

            <div
                className={
                    `branding-preview ${
                        isFavicon
                            ? "favicon-preview"
                            : ""
                    }`
                }
            >

                {image ? (

                    <img
                        src={image}
                        alt={title}
                        onError={(e) => {

                            e.currentTarget.style.display =
                                "none";

                        }}
                    />

                ) : (

                    <div className="image-empty">

                        <Upload size={24} />

                        <span>
                            No image selected
                        </span>

                    </div>

                )}

            </div>


            {/* ACTIONS */}

            <div className="branding-actions">


                <input
                    ref={inputRef}
                    type="file"
                    accept="
                        image/png,
                        image/jpeg,
                        image/jpg,
                        image/svg+xml,
                        image/x-icon
                    "
                    onChange={onChange}
                    hidden
                />


                <button
                    type="button"
                    className="branding-change-btn"
                    onClick={() =>
                        inputRef.current?.click()
                    }
                >

                    <Upload size={16} />

                    Change

                </button>


                {image && (

                    <button
                        type="button"
                        className="branding-remove-btn"
                        onClick={onRemove}
                    >

                        <Trash2 size={16} />

                        Remove

                    </button>

                )}


            </div>


            {/* RECOMMENDATION */}

            <div className="branding-recommendation">

                <Info size={14} />

                <span>
                    {recommended}
                </span>

            </div>


            <div className="branding-format">

                PNG, JPG, JPEG, SVG supported

            </div>


        </div>
    );
};


export default GeneralSettings;