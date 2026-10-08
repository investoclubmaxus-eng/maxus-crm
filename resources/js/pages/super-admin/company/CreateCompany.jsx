import React, { useEffect, useRef, useState } from "react";

import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronDown,
    Globe2,
    ImagePlus,
    Info,
    Lightbulb,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    UploadCloud,
    X,
    Hash,
    BriefcaseBusiness,
    
   
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";


import "./CreateCompany.css";

const INDUSTRIES = [
    "Real Estate",
    "Construction",
    "Finance",
    "Healthcare",
    "Education",
    "Technology",
    "Retail",
    "Manufacturing",
    "Hospitality",
    "Professional Services",
    "Other",
];

const COMPANY_STATUSES = [
    {
        value: "pending",
        label: "Pending",
        color: "orange",
    },
    {
        value: "active",
        label: "Active",
        color: "green",
    },
    {
        value: "inactive",
        label: "Inactive",
        color: "gray",
    },
    {
        value: "suspended",
        label: "Suspended",
        color: "red",
    },
];

const INITIAL_FORM = {
    name: "",
    code: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
    status: "pending",
};

const getNationalPhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");

    return digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.slice(0, 10);
};

const CreateCompany = ({
    navigateTo,
    companyId,
    mode = "create",
}) => {
    const isEditing = mode === "edit" && Boolean(companyId);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState(INITIAL_FORM);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoRemoved, setLogoRemoved] = useState(false);

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);

    useEffect(() => {
        if (!isEditing) {
            return undefined;
        }

        let isMounted = true;

        const loadCompany = async () => {
            setIsLoading(true);
            setServerError("");

            try {
                const response = await api.get(
                    `/superadmin/companies/${companyId}`
                );
                const company = response?.data?.data;

                if (!isMounted) {
                    return;
                }

                if (!response?.data?.success || !company) {
                    setServerError(
                        response?.data?.message ||
                            "Unable to load company details."
                    );

                    return;
                }

                setForm({
                    name: company.name || "",
                    code: company.code || "",
                    email: company.email || "",
                    phone: getNationalPhoneNumber(company.phone),
                    website: company.website || "",
                    industry: company.industry || "",
                    address: company.address || "",
                    city: company.city || "",
                    state: company.state || "",
                    country: company.country || "India",
                    postal_code: company.postal_code || "",
                    status: company.status || "pending",
                });

                const logoPath =
                    typeof company.logo_path === "string"
                        ? company.logo_path.trim()
                        : "";

                if (/^https?:\/\//i.test(logoPath)) {
                    setLogoPreview(logoPath);
                } else if (logoPath.startsWith("/")) {
                    setLogoPreview(logoPath);
                } else if (logoPath) {
                    setLogoPreview(`/storage/${logoPath}`);
                } else {
                    setLogoPreview(null);
                }
            } catch (error) {
                console.error("Load company error:", error);

                if (!isMounted) {
                    return;
                }

                if (error?.response?.status === 401) {
                    await sweetAlert.error(
                        "Your session has expired. Please login again."
                    );
                }

                setServerError(
                    error?.response?.data?.message ||
                        "Something went wrong while loading the company."
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadCompany();

        return () => {
            isMounted = false;
        };
    }, [companyId, isEditing]);

    /* =========================================================
       FIELD CHANGE
    ========================================================= */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((previous) => ({
                ...previous,
                [name]: "",
            }));
        }

        if (serverError) {
            setServerError("");
        }
    };

    /* =========================================================
       COMPANY CODE
    ========================================================= */

    const handleCodeChange = (event) => {
        const value = event.target.value
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, "");

        setForm((previous) => ({
            ...previous,
            code: value,
        }));

        if (errors.code) {
            setErrors((previous) => ({
                ...previous,
                code: "",
            }));
        }
    };

    const handlePhoneChange = (event) => {
        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

        setForm((previous) => ({
            ...previous,
            phone: value,
        }));

        if (errors.phone) {
            setErrors((previous) => ({
                ...previous,
                phone: "",
            }));
        }
    };

    const handlePostalCodeChange = (event) => {
        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 6);

        setForm((previous) => ({
            ...previous,
            postal_code: value,
        }));

        if (errors.postal_code) {
            setErrors((previous) => ({
                ...previous,
                postal_code: "",
            }));
        }
    };

    /* =========================================================
       LOGO UPLOAD
    ========================================================= */

    const handleLogoSelection = (file) => {
        if (!file) {
            return false;
        }

        if (!file.type.startsWith("image/")) {
            setErrors((previous) => ({
                ...previous,
                logo: "Please select a valid image file.",
            }));

            return false;
        }

        setErrors((previous) => ({
            ...previous,
            logo: "",
        }));

        setLogoFile(file);
        setLogoRemoved(false);

        const previewUrl = URL.createObjectURL(file);

        setLogoPreview(previewUrl);

        return true;
    };

    const handleLogoChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!handleLogoSelection(file)) {
            event.target.value = "";
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setLogoRemoved(isEditing);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleLogoDrop = (event) => {
        event.preventDefault();

        const file = event.dataTransfer.files?.[0];

        if (!file) {
            return;
        }

        handleLogoSelection(file);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    /* =========================================================
       VALIDATION
    ========================================================= */

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Company name is required.";
        }

        if (!form.code.trim()) {
            newErrors.code = "Company code is required.";
        }

        if (!form.country.trim()) {
            newErrors.country = "Country is required.";
        }

        if (!form.status) {
            newErrors.status = "Company status is required.";
        }

        if (form.phone && !/^\d{10}$/.test(form.phone)) {
            newErrors.phone = "Phone number must contain exactly 10 digits.";
        }

        if (
            form.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ) {
            newErrors.email = "Please enter a valid email address.";
        }

        if (
            form.website &&
            !/^https?:\/\/.+/i.test(form.website)
        ) {
            newErrors.website =
                "Website must start with http:// or https://.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    /* =========================================================
       SUBMIT
    ========================================================= */

    const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        setIsSubmitting(true);

        const formData = new FormData();

        /*
        |--------------------------------------------------------------------------
        | Company Name
        |--------------------------------------------------------------------------
        */

        formData.append(
            "name",
            form.name.trim()
        );

        /*
        |--------------------------------------------------------------------------
        | Company Code
        |--------------------------------------------------------------------------
        */

        formData.append(
            "code",
            form.code.trim()
        );

        /*
        |--------------------------------------------------------------------------
        | Email
        |--------------------------------------------------------------------------
        */

        if (form.email.trim()) {
            formData.append(
                "email",
                form.email.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Phone
        |--------------------------------------------------------------------------
        */

        if (form.phone.trim()) {
            formData.append(
                "phone",
                form.phone.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Website
        |--------------------------------------------------------------------------
        */

        if (form.website.trim()) {
            formData.append(
                "website",
                form.website.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Industry
        |--------------------------------------------------------------------------
        */

        if (form.industry) {
            formData.append(
                "industry",
                form.industry
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Address
        |--------------------------------------------------------------------------
        */

        if (form.address.trim()) {
            formData.append(
                "address",
                form.address.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | City
        |--------------------------------------------------------------------------
        */

        if (form.city.trim()) {
            formData.append(
                "city",
                form.city.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | State
        |--------------------------------------------------------------------------
        */

        if (form.state.trim()) {
            formData.append(
                "state",
                form.state.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Country
        |--------------------------------------------------------------------------
        */

        formData.append(
            "country",
            form.country.trim() || "India"
        );

        /*
        |--------------------------------------------------------------------------
        | Postal Code
        |--------------------------------------------------------------------------
        */

        if (form.postal_code.trim()) {
            formData.append(
                "postal_code",
                form.postal_code.trim()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        formData.append(
            "status",
            form.status
        );

        /*
        |--------------------------------------------------------------------------
        | Logo
        |--------------------------------------------------------------------------
        */

        if (logoFile) {
            formData.append(
                "logo",
                logoFile
            );
        }

        if (isEditing && logoRemoved) {
            formData.append("remove_logo", "1");
        }

        let response;

        if (isEditing) {
            formData.append("_method", "PUT");
            response = await api.post(
                `/superadmin/companies-update/${companyId}`,
                formData
            );
        } else {
            response = await api.post(
                "/superadmin/companies-create",
                formData
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS
        |--------------------------------------------------------------------------
        */

        if (response?.data?.success) {
            await sweetAlert.success(
                response?.data?.message ||
                    (isEditing
                        ? "Company updated successfully."
                        : "Company created successfully.")
            );

            if (typeof navigateTo === "function") {
                navigateTo("/companies");
            } else {
                window.history.pushState(
                    {},
                    "",
                    "/companies"
                );

                window.dispatchEvent(
                    new PopStateEvent("popstate")
                );
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Unexpected Response
        |--------------------------------------------------------------------------
        */

        await sweetAlert.error(
            response?.data?.message ||
                (isEditing
                    ? "Unable to update company."
                    : "Unable to create company.")
        );

    } catch (error) {
        console.error(
            isEditing
                ? "Update company error:"
                : "Create company error:",
            error
        );

        const responseData =
            error?.response?.data;

        /*
        |--------------------------------------------------------------------------
        | VALIDATION ERROR - 422
        |--------------------------------------------------------------------------
        */

        if (
            error?.response?.status === 422
        ) {
            const validationErrors =
                responseData?.errors;

            if (validationErrors) {
                const backendErrors = {};

                Object.keys(
                    validationErrors
                ).forEach((key) => {
                    backendErrors[key] =
                        validationErrors[key]?.[0] ||
                        "Invalid value.";
                });

                setErrors(
                    backendErrors
                );

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
                    responseData?.message ||
                        "Validation failed."
                );
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | UNAUTHORIZED
        |--------------------------------------------------------------------------
        */

        if (
            error?.response?.status === 401
        ) {
            await sweetAlert.error(
                "Your session has expired. Please login again."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | OTHER ERROR
        |--------------------------------------------------------------------------
        */

        await sweetAlert.error(
            responseData?.message ||
                error?.message ||
                (isEditing
                    ? "Something went wrong while updating the company."
                    : "Something went wrong while creating the company.")
        );
    } finally {
        setIsSubmitting(false);
    }
};

    /* =========================================================
       CANCEL
    ========================================================= */

    const handleCancel = () => {
        if (typeof navigateTo === "function") {
            navigateTo("/companies");
            return;
        }

        window.history.back();
    };

    if (isLoading) {
        return (
            <div className="company-create-page">
                <div className="company-main-container company-edit-loading">
                    <Loader2
                        size={22}
                        className="company-spinner"
                    />
                    <span>Loading company details...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="company-create-page">

            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="company-page-header">

                <div className="company-breadcrumb">

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="company-breadcrumb-home"
                        aria-label="Go to companies"
                    >
                        <Building2 size={15} />
                    </button>

                    <span>/</span>

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="company-breadcrumb-link"
                    >
                        Companies
                    </button>

                    <span>/</span>

                    <span className="company-breadcrumb-current">
                        {isEditing ? "Edit Company" : "Create Company"}
                    </span>

                </div>

                <div className="company-header-row">

                    <div className="company-title-section">

                        <div className="company-title-icon">
                            <Building2
                                size={28}
                                strokeWidth={2}
                            />
                        </div>

                        <div>
                            <h1>
                                {isEditing ? "Edit Company" : "Create Company"}
                            </h1>

                            <p>
                                {isEditing
                                    ? "Update the company information in the MAXUS system."
                                    : "Add a new company to the MAXUS system. All fields marked with "}
                                {!isEditing && (
                                    <>
                                <span className="required-mark">
                                    *
                                </span>{" "}
                                are required.
                                    </>
                                )}
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        className="company-back-button"
                        onClick={handleCancel}
                    >
                        <ArrowLeft size={17} />
                        <span>Back to Companies</span>
                    </button>

                </div>

            </div>

            {/* =====================================================
                SERVER ERROR
            ===================================================== */}

            {serverError && (
                <div className="company-server-error">

                    <Info size={18} />

                    <div>
                        <strong>
                            Unable to {isEditing ? "update" : "create"} company
                        </strong>

                        <p>{serverError}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setServerError("")}
                        aria-label="Close error"
                    >
                        <X size={17} />
                    </button>

                </div>
            )}

            {/* =====================================================
                SINGLE MAIN CONTAINER
            ===================================================== */}

            <div className="company-main-container">

                {/* =================================================
                    CONTENT AREA
                ================================================= */}

                <div className="company-content-area">

                    {/* =============================================
                        LEFT FORM
                    ============================================== */}

                    <form
                        className="company-details-section"
                        onSubmit={handleSubmit}
                    >

                        {/* CARD HEADER */}

                        <div className="company-card-header">

                            <div className="company-card-header-icon">
                                <Building2 size={22} />
                            </div>

                            <div>
                                <h2>Company Details</h2>

                                <p>
                                    Enter the basic information
                                    about the company.
                                </p>
                            </div>

                        </div>

                        {/* FORM BODY */}

                        <div className="company-form-body">

                            {/* =====================================
                                ROW 1
                            ====================================== */}

                            <div className="company-form-grid company-grid-three">

                                {/* LOGO */}

                                <div className="company-form-group company-logo-group">

                                    <label>
                                        Company Logo
                                    </label>

                                    <div
                                        className={`company-logo-upload ${
                                            logoPreview
                                                ? "has-preview"
                                                : ""
                                        }`}
                                        onDrop={handleLogoDrop}
                                        onDragOver={handleDragOver}
                                    >

                                        {logoPreview ? (
                                            <div className="company-logo-preview">

                                                <img
                                                    src={logoPreview}
                                                    alt="Company logo preview"
                                                />

                                                <button
                                                    type="button"
                                                    className="company-logo-remove"
                                                    onClick={
                                                        handleRemoveLogo
                                                    }
                                                    aria-label="Remove logo"
                                                >
                                                    <X size={15} />
                                                </button>

                                                <div className="company-logo-preview-name">
                                                    {logoFile?.name ||
                                                        (isEditing
                                                            ? "Current company logo"
                                                            : "")}
                                                </div>

                                            </div>
                                        ) : (
                                            <>
                                                <div className="company-upload-icon">
                                                    <UploadCloud size={29} />
                                                </div>

                                                <button
                                                    type="button"
                                                    className="company-upload-button"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                >
                                                    Click to upload
                                                </button>

                                                <span>
                                                    or drag and drop
                                                </span>

                                                <small>
                                                    PNG, JPG, SVG
                                                </small>
                                            </>
                                        )}

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                            onChange={
                                                handleLogoChange
                                            }
                                            hidden
                                        />

                                    </div>

                                    {errors.logo && (
                                        <small className="company-error-text">
                                            {errors.logo}
                                        </small>
                                    )}

                                </div>

                                {/* COMPANY NAME */}

                                <div className="company-form-group">

                                    <label htmlFor="company-name">
                                        Company Name{" "}
                                        <span>*</span>
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Building2 size={17} />

                                        <input
                                            id="company-name"
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter company name"
                                            autoComplete="organization"
                                        />

                                    </div>

                                    {errors.name && (
                                        <small className="company-error-text">
                                            {errors.name}
                                        </small>
                                    )}

                                </div>

                                {/* COMPANY CODE */}

                                <div className="company-form-group">

                                    <label htmlFor="company-code">
                                        Company Code{" "}
                                        <span>*</span>
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Hash size={17} />

                                        <input
                                            id="company-code"
                                            type="text"
                                            name="code"
                                            value={form.code}
                                            onChange={
                                                handleCodeChange
                                            }
                                            placeholder="e.g. MAX001"
                                            maxLength={100}
                                            autoComplete="off"
                                        />

                                    </div>

                                    <small className="company-field-hint">
                                        Must be unique.
                                    </small>

                                    {errors.code && (
                                        <small className="company-error-text">
                                            {errors.code}
                                        </small>
                                    )}

                                </div>

                            </div>

                            {/* =====================================
                                ROW 2
                            ====================================== */}

                            <div className="company-form-grid company-grid-three">

                                {/* EMAIL */}

                                <div className="company-form-group">

                                    <label htmlFor="company-email">
                                        Email
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Mail size={17} />

                                        <input
                                            id="company-email"
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="company@domain.com"
                                            autoComplete="email"
                                        />

                                    </div>

                                    {errors.email && (
                                        <small className="company-error-text">
                                            {errors.email}
                                        </small>
                                    )}

                                </div>

                                {/* PHONE */}

                                <div className="company-form-group">

                                    <label htmlFor="company-phone">
                                        Phone
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Phone size={17} />

                                        <span className="company-phone-country-code">
                                            +91
                                        </span>

                                        <input
                                            id="company-phone"
                                            type="tel"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handlePhoneChange}
                                            placeholder="Enter 10-digit number"
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            maxLength={10}
                                            pattern="[0-9]{10}"
                                            className="company-phone-input"
                                        />

                                    </div>

                                    {errors.phone && (
                                        <small className="company-error-text">
                                            {errors.phone}
                                        </small>
                                    )}

                                </div>

                                {/* WEBSITE */}

                                <div className="company-form-group">

                                    <label htmlFor="company-website">
                                        Website
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Globe2 size={17} />

                                        <input
                                            id="company-website"
                                            type="url"
                                            name="website"
                                            value={form.website}
                                            onChange={handleChange}
                                            placeholder="https://www.company.com"
                                            autoComplete="url"
                                        />

                                    </div>

                                    {errors.website && (
                                        <small className="company-error-text">
                                            {errors.website}
                                        </small>
                                    )}

                                </div>

                            </div>

                            {/* =====================================
                                ROW 3
                            ====================================== */}

                            <div className="company-form-grid company-grid-industry-address">

                                {/* INDUSTRY */}

                                <div className="company-form-group">

                                    <label htmlFor="company-industry">
                                        Industry
                                    </label>

                                    <div className="company-select-wrapper">

                                        <BriefcaseBusiness size={17} />

                                        <select
                                            id="company-industry"
                                            name="industry"
                                            value={form.industry}
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select industry
                                            </option>

                                            {INDUSTRIES.map(
                                                (industry) => (
                                                    <option
                                                        key={industry}
                                                        value={industry}
                                                    >
                                                        {industry}
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        <ChevronDown size={17} />

                                    </div>

                                </div>

                                {/* ADDRESS */}

                                <div className="company-form-group">

                                    <label htmlFor="company-address">
                                        Address
                                    </label>

                                    <div className="company-textarea-wrapper">

                                        <MapPin size={17} />

                                        <textarea
                                            id="company-address"
                                            name="address"
                                            value={form.address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows={3}
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =====================================
                                ROW 4
                            ====================================== */}

                            <div className="company-form-grid company-grid-three">

                                {/* CITY */}

                                <div className="company-form-group">

                                    <label htmlFor="company-city">
                                        City
                                    </label>

                                    <div className="company-input-wrapper">

                                        <Building2 size={17} />

                                        <input
                                            id="company-city"
                                            type="text"
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            placeholder="Enter city"
                                        />

                                    </div>

                                </div>

                                {/* STATE */}

                                <div className="company-form-group">

                                    <label htmlFor="company-state">
                                        State
                                    </label>

                                    <div className="company-input-wrapper">

                                        <MapPin size={17} />

                                        <input
                                            id="company-state"
                                            type="text"
                                            name="state"
                                            value={form.state}
                                            onChange={handleChange}
                                            placeholder="Enter state"
                                        />

                                    </div>

                                </div>

                                {/* POSTAL */}

                                <div className="company-form-group">

                                    <label htmlFor="company-postal">
                                        Postal Code
                                    </label>

                                    <div className="company-input-wrapper">

                                        <MapPin size={17} />

                                        <input
                                            id="company-postal"
                                            type="text"
                                            name="postal_code"
                                            value={form.postal_code}
                                            onChange={handlePostalCodeChange}
                                            placeholder="Enter postal code"
                                            inputMode="numeric"
                                            maxLength={6}
                                            pattern="[0-9]{1,6}"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =====================================
                                ROW 5
                            ====================================== */}

                            <div className="company-form-grid company-grid-country-status">

                                {/* COUNTRY */}

                                <div className="company-form-group">

                                    <label htmlFor="company-country">
                                        Country{" "}
                                        <span>*</span>
                                    </label>

                                    <div className="company-select-wrapper">

                                        <Globe2 size={17} />

                                        <select
                                            id="company-country"
                                            name="country"
                                            value={form.country}
                                            onChange={handleChange}
                                        >
                                            <option value="India">
                                                India
                                            </option>

                                            <option value="United States">
                                                United States
                                            </option>

                                            <option value="United Kingdom">
                                                United Kingdom
                                            </option>

                                            <option value="Canada">
                                                Canada
                                            </option>

                                            <option value="Australia">
                                                Australia
                                            </option>
                                        </select>

                                        <ChevronDown size={17} />

                                    </div>

                                    {errors.country && (
                                        <small className="company-error-text">
                                            {errors.country}
                                        </small>
                                    )}

                                </div>

                                {/* STATUS */}

                                <div className="company-form-group company-status-group">

                                    <label>
                                        Company Status{" "}
                                        <span>*</span>
                                    </label>

                                    <div className="company-status-options">

                                        {COMPANY_STATUSES.map(
                                            (status) => (
                                                <button
                                                    type="button"
                                                    key={status.value}
                                                    className={`company-status-option ${
                                                        form.status ===
                                                        status.value
                                                            ? "active"
                                                            : ""
                                                    } status-${status.color}`}
                                                    onClick={() =>
                                                        setForm(
                                                            (
                                                                previous
                                                            ) => ({
                                                                ...previous,
                                                                status:
                                                                    status.value,
                                                            })
                                                        )
                                                    }
                                                >
                                                    <span className="company-status-dot" />

                                                    <span>
                                                        {
                                                            status.label
                                                        }
                                                    </span>
                                                </button>
                                            )
                                        )}

                                    </div>

                                    {errors.status && (
                                        <small className="company-error-text">
                                            {errors.status}
                                        </small>
                                    )}

                                </div>

                            </div>

                        </div>

                    </form>

                    {/* =================================================
                        RIGHT INFORMATION COLUMN
                    ================================================= */}

                    <aside className="company-side-column">

                        {/* COMPANY INFORMATION */}

                        <div className="company-info-card company-info-primary">

                            <div className="company-info-icon">
                                <Building2 size={22} />
                            </div>

                            <div>
                                <h3>
                                    Company Information
                                </h3>

                                <p>
                                    {isEditing
                                        ? "Changes are applied to this company's existing MAXUS record."
                                        : "The company will be available in the system once created. You can assign administrators and manage access later."}
                                </p>
                            </div>

                        </div>

                        {/* IMPORTANT NOTES */}

                        <div className="company-info-card">

                            <div className="company-info-heading">

                                <div className="company-notes-icon">
                                    <Lightbulb size={19} />
                                </div>

                                <h3>
                                    Important Notes
                                </h3>

                            </div>

                            <ul className="company-notes-list">

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Company code must be
                                        unique.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        Logo requirements are
                                        controlled by File /
                                        Storage settings.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        You can edit company
                                        details later.
                                    </span>
                                </li>

                                <li>
                                    <CheckCircle2 size={16} />

                                    <span>
                                        New companies normally
                                        start with Pending
                                        status.
                                    </span>
                                </li>

                            </ul>

                        </div>

                        {/* QUICK INFO */}

                        <div className="company-info-card">

                            <div className="company-info-heading">

                                <div className="company-quick-icon">
                                    <Info size={18} />
                                </div>

                                <h3>
                                    Quick Info
                                </h3>

                            </div>

                            <div className="company-quick-info">

                                <div className="company-quick-row">

                                    <div className="company-quick-row-left">

                                        <div className="company-quick-badge blue">
                                            <Building2 size={17} />
                                        </div>

                                        <span>
                                            Company Setup
                                        </span>

                                    </div>

                                    <strong>
                                        Ready
                                    </strong>

                                </div>

                                <div className="company-quick-row">

                                    <div className="company-quick-row-left">

                                        <div className="company-quick-badge green">
                                            <ShieldCheck size={17} />
                                        </div>

                                        <span>
                                            {isEditing
                                                ? "Current Status"
                                                : "Initial Status"}
                                        </span>

                                    </div>

                                    <strong>
                                        {COMPANY_STATUSES.find(
                                            (status) =>
                                                status.value === form.status
                                        )?.label || "Pending"}
                                    </strong>

                                </div>

                                <div className="company-quick-row">

                                    <div className="company-quick-row-left">

                                        <div className="company-quick-badge orange">
                                            <ImagePlus size={17} />
                                        </div>

                                        <span>
                                            Logo
                                        </span>

                                    </div>

                                    <strong>
                                        Optional
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </aside>

                </div>

                {/* =================================================
                    BOTTOM ACTION BAR
                ================================================= */}

                <div className="company-form-actions">

                    <button
                        type="button"
                        className="company-cancel-button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="company-submit-button"
                        onClick={() => {
                            document
                                .querySelector(
                                    ".company-details-section"
                                )
                                ?.requestSubmit();
                        }}
                        disabled={isSubmitting}
                    >

                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={17}
                                    className="company-spinner"
                                />

                                <span>
                                    {isEditing
                                        ? "Updating..."
                                        : "Creating..."}
                                </span>
                            </>
                        ) : (
                            <>
                                <Save size={17} />

                                <span>
                                    {isEditing
                                        ? "Update Company"
                                        : "Create Company"}
                                </span>
                            </>
                        )}

                    </button>

                </div>

            </div>

        </div>
    );
};

export default CreateCompany;