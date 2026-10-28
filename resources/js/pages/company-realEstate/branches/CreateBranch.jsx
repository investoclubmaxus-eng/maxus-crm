import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronDown,
    Globe2,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    GitBranch,
    Lock,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./CreateBranch.css";

const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Chandigarh",
    "Other",
];

const INITIAL_FORM = {
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
    status: "active",
};

export default function CreateBranch({ navigateTo, branchId, mode = "create", company }) {
    const isEditing = mode === "edit" && Boolean(branchId);

    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);

    useEffect(() => {
        if (!isEditing) return;

        let isMounted = true;
        const loadBranch = async () => {
            setIsLoading(true);
            try {
                const headers = {};
                if (activeCompany?.id) {
                    headers["X-Company-Id"] = String(activeCompany.id);
                }

                const response = await api.get(`/company/branches-show/${branchId}`, { headers });
                const branch = response.data?.data;

                if (isMounted && branch) {
                    setForm({
                        name: branch.name || "",
                        code: branch.code || "",
                        email: branch.email || "",
                        phone: branch.phone || "",
                        address: branch.address || "",
                        city: branch.city || "",
                        state: branch.state || "",
                        country: branch.country || "India",
                        postal_code: branch.postal_code || "",
                        status: branch.status || "active",
                    });
                }
            } catch (error) {
                console.error("Load branch error:", error);
                sweetAlert.error("Failed to load branch details.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadBranch();
        return () => {
            isMounted = false;
        };
    }, [isEditing, branchId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
        setForm((prev) => ({
            ...prev,
            phone: value,
        }));
        if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: undefined }));
        }
    };

    const handlePostalCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setForm((prev) => ({
            ...prev,
            postal_code: value,
        }));
        if (errors.postal_code) {
            setErrors((prev) => ({ ...prev, postal_code: undefined }));
        }
    };

    const handleCodeChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        setForm((prev) => ({
            ...prev,
            code: value,
        }));
        if (errors.code) {
            setErrors((prev) => ({ ...prev, code: undefined }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Branch Name is required.";
        }
        if (!form.code.trim()) {
            newErrors.code = "Branch Code is required.";
        }
        if (!form.email.trim()) {
            newErrors.email = "Branch Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            newErrors.email = "Enter a valid email address.";
        }
        if (!form.phone.trim()) {
            newErrors.phone = "Phone number is required.";
        } else if (!/^[0-9]{10}$/.test(form.phone.trim())) {
            newErrors.phone = "Phone number must be exactly 10 digits.";
        }
        if (!form.address.trim()) {
            newErrors.address = "Address is required.";
        }
        if (!form.city.trim()) {
            newErrors.city = "City is required.";
        }
        if (!form.state.trim()) {
            newErrors.state = "State is required.";
        }
        if (!form.country.trim()) {
            newErrors.country = "Country is required.";
        }
        if (!form.postal_code.trim()) {
            newErrors.postal_code = "Postal code is required.";
        } else if (!/^[0-9]{6}$/.test(form.postal_code.trim())) {
            newErrors.postal_code = "Postal code must be exactly 6 digits.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            sweetAlert.error("Please fill in all required fields accurately.");
            return;
        }

        setIsSubmitting(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const payload = {
                ...form,
                company_id: activeCompany?.id,
            };

            let response;
            if (isEditing) {
                response = await api.put(`/company/branches-update/${branchId}`, payload, { headers });
            } else {
                response = await api.post("/company/branches-store", payload, { headers });
            }

            if (response.data?.success) {
                await sweetAlert.success(
                    response.data.message || (isEditing ? "Branch updated successfully." : "Branch created successfully.")
                );
                navigateTo("/company/branches");
            } else {
                sweetAlert.error(response.data?.message || "Failed to save branch.");
            }
        } catch (error) {
            console.error("Save branch error:", error);
            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                const formatted = {};
                Object.keys(apiErrors).forEach((key) => {
                    formatted[key] = apiErrors[key][0];
                });
                setErrors(formatted);
                sweetAlert.error(Object.values(formatted)[0] || "Validation failed.");
            } else {
                sweetAlert.error(error.response?.data?.message || "An unexpected error occurred while saving the branch.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="branch-create-page">
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#6682a8" }}>
                    <Loader2 size={36} className="company-spinner" style={{ margin: "0 auto 12px" }} />
                    <p>Loading branch details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="branch-create-page">
            {/* Page Header */}
            <div className="branch-page-header">
                <div className="branch-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="branch-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/branches")}
                        className="branch-breadcrumb-link"
                    >
                        Branches
                    </button>
                    <span>/</span>
                    <span className="branch-breadcrumb-current">
                        {isEditing ? "Edit Branch" : "Create Branch"}
                    </span>
                </div>

                <div className="branch-header-row">
                    <div className="branch-title-section">
                        <div className="branch-title-icon">
                            <GitBranch size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>{isEditing ? "Edit Branch" : "Create Branch"}</h1>
                            <p>
                                {isEditing
                                    ? "Update office location and branch details for this company."
                                    : "Add a new branch office to the system. All fields marked with "}
                                {!isEditing && (
                                    <>
                                        <span className="required-mark">*</span> are required.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="branch-back-button"
                        onClick={() => navigateTo("/company/branches")}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Branches</span>
                    </button>
                </div>
            </div>

            {/* Form Card */}
            <form className="branch-card" onSubmit={handleSubmit} noValidate>
                <div className="branch-card-header">
                    <h2>Branch Information</h2>
                    <p>Provide contact and location details for this branch office.</p>
                </div>

                <div className="branch-form-body">
                    {/* Row 1: Branch Name, Company (disabled/auto-selected), Code */}
                    <div className="branch-form-grid branch-grid-three">
                        {/* Branch Name */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-name">
                                Branch Name <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Building2 size={17} />
                                <input
                                    id="branch-name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter branch name"
                                    autoFocus
                                />
                            </div>
                            {errors.name && <small className="branch-error-text">{errors.name}</small>}
                        </div>

                        {/* Company (Disabled & Locked to current dashboard company) */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-company">
                                Company <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Building2 size={17} />
                                <input
                                    id="branch-company"
                                    type="text"
                                    disabled
                                    className="branch-input--disabled"
                                    value={activeCompany?.name || "Active Company"}
                                    readOnly
                                />
                                <span className="branch-lock-badge">
                                    <Lock size={11} style={{ display: "inline", marginRight: "4px" }} />
                                    Active
                                </span>
                            </div>
                            <small style={{ color: "#7790b0", fontSize: "11px", marginTop: "4px", display: "block" }}>
                                Automatically locked to current logged-in company portal.
                            </small>
                        </div>

                        {/* Code */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-code">
                                Code <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Hash size={17} />
                                <input
                                    id="branch-code"
                                    type="text"
                                    name="code"
                                    value={form.code}
                                    onChange={handleCodeChange}
                                    placeholder="e.g. BRANCH001"
                                    maxLength={50}
                                />
                            </div>
                            {errors.code && <small className="branch-error-text">{errors.code}</small>}
                        </div>
                    </div>

                    {/* Row 2: Email, Phone, Address */}
                    <div className="branch-form-grid branch-grid-three">
                        {/* Email */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-email">
                                Email <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Mail size={17} />
                                <input
                                    id="branch-email"
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Enter branch email"
                                />
                            </div>
                            {errors.email && <small className="branch-error-text">{errors.email}</small>}
                        </div>

                        {/* Phone */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-phone">
                                Phone <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Phone size={17} />
                                <span className="branch-phone-country-code">+91</span>
                                <input
                                    id="branch-phone"
                                    type="tel"
                                    name="phone"
                                    className="branch-phone-input"
                                    value={form.phone}
                                    onChange={handlePhoneChange}
                                    placeholder="Enter branch phone"
                                    maxLength={10}
                                />
                            </div>
                            {errors.phone && <small className="branch-error-text">{errors.phone}</small>}
                        </div>

                        {/* Address */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-address">
                                Address <span className="required-mark">*</span>
                            </label>
                            <div className="branch-textarea-wrapper">
                                <MapPin size={17} />
                                <textarea
                                    id="branch-address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Enter full address"
                                    rows={2}
                                />
                            </div>
                            {errors.address && <small className="branch-error-text">{errors.address}</small>}
                        </div>
                    </div>

                    {/* Row 3: City, State, Country */}
                    <div className="branch-form-grid branch-grid-three">
                        {/* City */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-city">
                                City <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <MapPin size={17} />
                                <input
                                    id="branch-city"
                                    type="text"
                                    name="city"
                                    value={form.city}
                                    onChange={handleChange}
                                    placeholder="Enter city"
                                />
                            </div>
                            {errors.city && <small className="branch-error-text">{errors.city}</small>}
                        </div>

                        {/* State */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-state">
                                State <span className="required-mark">*</span>
                            </label>
                            <div className="branch-select-wrapper">
                                <MapPin size={17} />
                                <select
                                    id="branch-state"
                                    name="state"
                                    value={form.state}
                                    onChange={handleChange}
                                >
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map((state) => (
                                        <option key={state} value={state}>
                                            {state}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={17} />
                            </div>
                            {errors.state && <small className="branch-error-text">{errors.state}</small>}
                        </div>

                        {/* Country */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-country">
                                Country <span className="required-mark">*</span>
                            </label>
                            <div className="branch-select-wrapper">
                                <Globe2 size={17} />
                                <select
                                    id="branch-country"
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                >
                                    <option value="India">India</option>
                                    <option value="United States">United States</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="United Arab Emirates">United Arab Emirates</option>
                                    <option value="Canada">Canada</option>
                                    <option value="Australia">Australia</option>
                                </select>
                                <ChevronDown size={17} />
                            </div>
                            {errors.country && <small className="branch-error-text">{errors.country}</small>}
                        </div>
                    </div>

                    {/* Row 4: Postal Code, Status */}
                    <div className="branch-form-grid branch-grid-three">
                        {/* Postal Code */}
                        <div className="branch-form-group">
                            <label htmlFor="branch-postal">
                                Postal Code <span className="required-mark">*</span>
                            </label>
                            <div className="branch-input-wrapper">
                                <Hash size={17} />
                                <input
                                    id="branch-postal"
                                    type="text"
                                    name="postal_code"
                                    value={form.postal_code}
                                    onChange={handlePostalCodeChange}
                                    placeholder="Enter postal code"
                                    maxLength={6}
                                />
                            </div>
                            {errors.postal_code && <small className="branch-error-text">{errors.postal_code}</small>}
                        </div>

                        {/* Status */}
                        <div className="branch-form-group">
                            <label>Status</label>
                            <div className="branch-status-options">
                                <button
                                    type="button"
                                    className={`branch-status-pill ${form.status === "active" ? "active" : ""}`}
                                    onClick={() => setForm((p) => ({ ...p, status: "active" }))}
                                >
                                    Active
                                </button>
                                <button
                                    type="button"
                                    className={`branch-status-pill ${form.status === "inactive" ? "inactive" : ""}`}
                                    onClick={() => setForm((p) => ({ ...p, status: "inactive" }))}
                                >
                                    Inactive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="branch-card-footer">
                    <button
                        type="button"
                        className="branch-btn-cancel"
                        onClick={() => navigateTo("/company/branches")}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="branch-btn-save"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="company-spinner" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>{isEditing ? "Update Branch" : "Save Branch"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
