import React, { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    Layers,
    FileText,
    Loader2,
    Lock,
    Plus,
    Save,
    Tag,
    Users,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./CreateDepartment.css";

const INITIAL_FORM = {
    department_code: "",
    name: "",
    slug: "",
    status: "active",
    description: "",
    industry: "",
    company_id: "",
};

export default function CreateDepartment({
    navigateTo,
    departmentId,
    mode = "create",
    company,
}) {
    const isEditing = mode === "edit" && Boolean(departmentId);

     // Resolve active company from props or storage
    const activeCompany = company || (() => {
        try {
            const raw =
                localStorage.getItem("active_company") ||
                sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const getCompanyHeaders = () => {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }
            return headers;
        };
    
        const [form, setForm] = useState({
            ...INITIAL_FORM,
            company_id: activeCompany?.id || "",
            industry: activeCompany?.industry || "",
        });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditing);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Slugify helper
    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-");
    };

    // Close status dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setStatusDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Load initial code or existing department
    useEffect(() => {
        let isMounted = true;

        if (isEditing) {
            const loadDepartment = async () => {
                setIsLoading(true);
                try {
                    const response = await api.get(
                        `/company/departments-show/${departmentId}`,
                        { headers: getCompanyHeaders() }
                    );
                    const dept = response.data?.data;
                    if (isMounted && dept) {
                        setForm({
                            department_code: dept.department_code || "",
                            name: dept.name || "",
                            company_id: dept.company_id || activeCompany?.id || "",
                            slug: dept.slug || "",
                            status: dept.status || "active",
                            industry: dept.industry || activeCompany?.industry || "",
                            description: dept.description || "",
                        });
                    }
                } catch (error) {
                    console.error("Load department error:", error);
                    sweetAlert.error("Failed to load department details.");
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };

            loadDepartment();
        } else {
            // Fetch next auto-generated department code
            const fetchNextCode = async () => {
                try {
                    const params = {};
                    if (activeCompany?.id) {
                        params.company_id = activeCompany.id;
                    }
                    const response = await api.get(
                        "/company/departments/next-code",
                        {
                            params,
                            headers: getCompanyHeaders(),
                        }
                    );
                    if (isMounted && response.data?.code) {
                        setForm((prev) => ({
                            ...prev,
                            department_code: response.data.code,
                            company_id: activeCompany?.id || prev.company_id,
                            industry: activeCompany?.industry || response.data?.industry || prev.industry,
                        }));
                    }
                } catch (error) {
                    console.warn("Unable to fetch next code from API:", error);
                    if (isMounted) {
                        setForm((prev) => ({
                            ...prev,
                            department_code: "DEP-001",
                            company_id: activeCompany?.id || prev.company_id,
                            industry: activeCompany?.industry || prev.industry,
                        }));
                    }
                }
            };

            fetchNextCode();
        }

        return () => {
            isMounted = false;
        };
    }, [isEditing, departmentId, activeCompany?.id]);

    const handleNameChange = (e) => {
        const nameVal = e.target.value;
        setForm((prev) => ({
            ...prev,
            name: nameVal,
            slug: slugify(nameVal),
        }));

        if (errors.name) {
            setErrors((prev) => ({ ...prev, name: undefined }));
        }
    };

    const handleDescriptionChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            description: val,
        }));
        if (errors.description) {
            setErrors((prev) => ({ ...prev, description: undefined }));
        }
    };

    const handleSelectStatus = (statusValue) => {
        setForm((prev) => ({ ...prev, status: statusValue }));
        setStatusDropdownOpen(false);
        if (errors.status) {
            setErrors((prev) => ({ ...prev, status: undefined }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Department Name is required.";
        } else if (form.name.length > 100) {
            newErrors.name = "Department Name cannot exceed 100 characters.";
        }

        if (form.description && form.description.length > 500) {
            newErrors.description = "Description cannot exceed 500 characters.";
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
            const companyIdToStore =
                activeCompany?.id || (form.company_id ? Number(form.company_id) : null);
            const industryToStore =
                activeCompany?.industry || form.industry || null;

            const payload = {
                company_id: companyIdToStore,
                industry: industryToStore,
                department_code: form.department_code,
                name: form.name.trim(),
                slug: form.slug || slugify(form.name),
                status: form.status,
                description: form.description ? form.description.trim() : null,
            };

            const headers = getCompanyHeaders();

            let response;
            if (isEditing) {
                response = await api.put(
                    `/company/departments-update/${departmentId}`,
                    payload,
                    { headers }
                );
            } else {
                response = await api.post(
                    "/company/departments-store",
                    payload,
                    { headers }
                );
            }

            if (response.data?.success) {
                await sweetAlert.success(
                    response.data.message ||
                        (isEditing
                            ? "Department updated successfully."
                            : "Department created successfully.")
                );
                navigateTo("/company/departments");
            } else {
                sweetAlert.error(
                    response.data?.message || "Failed to save department."
                );
            }
        } catch (error) {
            console.error("Save department error:", error);
            const resErrors = error.response?.data?.errors;
            if (resErrors && typeof resErrors === "object") {
                const flatErrors = {};
                Object.keys(resErrors).forEach((key) => {
                    flatErrors[key] = Array.isArray(resErrors[key])
                        ? resErrors[key][0]
                        : resErrors[key];
                });
                setErrors(flatErrors);
                sweetAlert.error(
                    error.response?.data?.message ||
                        "Validation failed. Please check the form."
                );
            } else {
                sweetAlert.error(
                    error.response?.data?.message ||
                        "An unexpected error occurred while saving department."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="department-create-page">
                <div
                    style={{
                        padding: "80px 20px",
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    <Loader2
                        size={32}
                        className="department-spinner"
                        style={{ color: "#2563eb", marginBottom: "12px" }}
                    />
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>
                        Loading department details...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="department-create-page">
            {/* Page Header */}
            <div className="department-page-header">
                <div className="department-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="department-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/departments")}
                        className="department-breadcrumb-link"
                    >
                        Departments
                    </button>
                    <span>/</span>
                    <span className="department-breadcrumb-current">
                        {isEditing ? "Edit Department" : "Create Department"}
                    </span>
                </div>

                <div className="department-header-row">
                    <div className="department-title-section">
                        <div className="department-title-icon">
                            <Users size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>
                                {isEditing
                                    ? "Edit Department"
                                    : "Create Department"}
                            </h1>
                            <p>
                                {isEditing
                                    ? "Update department details and organize your organization structure."
                                    : "Add a new department to organize your organization structure."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="department-back-button"
                        onClick={() => navigateTo("/company/departments")}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Departments</span>
                    </button>
                </div>
            </div>

            {/* Form Card */}
            <form className="department-card" onSubmit={handleSubmit} noValidate>
                {/* Basic Information Header */}
                <div className="department-section-header">
                    <div className="department-section-icon">
                        <FileText size={22} strokeWidth={2} />
                    </div>
                    <div className="department-section-title-wrap">
                        <h2>Basic Information</h2>
                        <p>Enter the department details.</p>
                    </div>
                </div>

                <div className="department-form-body">
                    <div className="department-form-grid">
                        {/* Company Field (Locked to Active Authenticated Company) */}
                        <div className="department-form-group">
                            <label htmlFor="dept_company">
                                Company <span className="required-mark">*</span>
                            </label>
                            <div className="department-input-wrapper">
                                <Building2
                                    size={15}
                                    className="department-field-icon"
                                />
                                <input
                                    id="dept_company"
                                    type="text"
                                    value={
                                            activeCompany?.name
                                            ? `${activeCompany.name}${
                                            activeCompany.code
                                            ? ` (${activeCompany.code})`
                                            : ""
                                            }`
                                            : "Active Authenticated Company"
                                            }
                                            disabled
                                            readOnly
                                />
                            </div>
                           <small
                                style={{
                                    color: "#64748b",
                                    fontSize: "11.5px",
                                    marginTop: "2px",
                                }}
                            >
                                Automatically linked to your active company portal.
                            </small>
                        </div>                   
                        
                        {/* Department Code - Auto-generated and disabled */}
                        <div className="department-form-group">
                            <label htmlFor="dept-code">
                                Department Code{" "}
                                <span className="required-mark">*</span>
                            </label>
                            <div className="department-input-wrapper is-disabled">
                                <span className="department-field-icon">
                                    <Tag size={17} />
                                </span>
                                <input
                                    id="dept-code"
                                    type="text"
                                    name="department_code"
                                    value={form.department_code}
                                    disabled
                                    readOnly
                                    placeholder="Generating code..."
                                />
                                <span className="department-auto-badge">
                                    <Lock size={11} /> Auto Generated
                                </span>
                            </div>
                             <small
                                style={{
                                    color: "#64748b",
                                    fontSize: "11.5px",
                                    marginTop: "2px",
                                }}
                            >
                                Automatically assigned and locked.
                            </small>
                        </div>

                        {/* Name */}
                        <div className="department-form-group">
                            <label htmlFor="dept-name">
                                Name <span className="required-mark">*</span>
                            </label>
                            <div
                                className={`department-input-wrapper ${
                                    errors.name ? "has-error" : ""
                                }`}
                            >
                                <span className="department-field-icon">
                                    <Building2 size={17} />
                                </span>
                                <input
                                    id="dept-name"
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleNameChange}
                                    placeholder="Enter department name"
                                    maxLength={100}
                                    autoFocus
                                />
                            </div>
                            {errors.name && (
                                <small className="department-error-text">
                                    {errors.name}
                                </small>
                            )}
                        </div>

                        {/* Industry / Role Category */}
                            <div className="department-form-group">
                                <label htmlFor="dept_industry">
                                    Industry / Domain
                                </label>
                                <div className="department-input-wrapper">
                                    <Layers
                                        size={15}
                                        className="department-field-icon"
                                    />
                                    <input
                                        id="dept_industry"
                                        type="text"
                                      
                                        value={form.industry || activeCompany?.industry || "Loading company industry..."}
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <small
                                    style={{
                                        color: "#64748b",
                                        fontSize: "11.5px",
                                        marginTop: "2px",
                                    }}
                                >
                                   Industry is automatically determined by your active company.
                                </small>
                            </div>
                    </div>

                    {/* Row 2: Status (Custom Full-Width Expanded Dropdown) */}
                    <div className="department-form-grid">
                        <div className="department-form-group" ref={dropdownRef}>
                            <label id="status-label">
                                Status <span className="required-mark">*</span>
                            </label>

                            <div className="department-custom-select">
                                <button
                                    type="button"
                                    className={`department-custom-select-trigger ${
                                        statusDropdownOpen ? "is-open" : ""
                                    }`}
                                    onClick={() =>
                                        setStatusDropdownOpen(
                                            (isOpen) => !isOpen
                                        )
                                    }
                                    aria-haspopup="listbox"
                                    aria-expanded={statusDropdownOpen}
                                    aria-labelledby="status-label"
                                >
                                    <div className="department-custom-select-value">
                                        <span
                                            className={`department-status-dot ${form.status}`}
                                        />
                                        <span>
                                            {form.status === "active"
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                    <span
                                        className={`department-custom-select-arrow ${
                                            statusDropdownOpen ? "rotated" : ""
                                        }`}
                                    >
                                        <ChevronDown size={17} />
                                    </span>
                                </button>

                                {/* Fully Expanded Full-Width Dropdown Menu */}
                                {statusDropdownOpen && (
                                    <div
                                        className="department-custom-select-menu"
                                        role="listbox"
                                    >
                                        <div
                                            role="option"
                                            aria-selected={
                                                form.status === "active"
                                            }
                                            className={`department-custom-select-option ${
                                                form.status === "active"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSelectStatus("active")
                                            }
                                        >
                                            <div className="department-custom-select-option-content">
                                                <span className="department-status-dot active" />
                                                <span>Active</span>
                                            </div>
                                            {form.status === "active" && (
                                                <Check
                                                    size={16}
                                                    style={{
                                                        color: "#2563eb",
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div
                                            role="option"
                                            aria-selected={
                                                form.status === "inactive"
                                            }
                                            className={`department-custom-select-option ${
                                                form.status === "inactive"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleSelectStatus("inactive")
                                            }
                                        >
                                            <div className="department-custom-select-option-content">
                                                <span className="department-status-dot inactive" />
                                                <span>Inactive</span>
                                            </div>
                                            {form.status === "inactive" && (
                                                <Check
                                                    size={16}
                                                    style={{
                                                        color: "#2563eb",
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {errors.status && (
                                <small className="department-error-text">
                                    {errors.status}
                                </small>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Description */}
                    <div className="department-form-group department-form-group--full">
                        <label htmlFor="dept-description">Description</label>
                        <div
                            className={`department-textarea-wrapper ${
                                errors.description ? "has-error" : ""
                            }`}
                        >
                            <span className="department-field-icon">
                                <FileText size={17} />
                            </span>
                            <textarea
                                id="dept-description"
                                name="description"
                                value={form.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter department description..."
                                maxLength={500}
                                rows={3}
                            />
                            <span className="department-char-counter">
                                {form.description?.length || 0}/500
                            </span>
                        </div>
                        {errors.description && (
                            <small className="department-error-text">
                                {errors.description}
                            </small>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="department-form-actions">
                    <button
                        type="button"
                        className="department-cancel-button"
                        onClick={() => navigateTo("/company/departments")}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="department-submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="department-spinner"
                                />
                                <span>Saving...</span>
                            </>
                        ) : isEditing ? (
                            <>
                                <Save size={16} />
                                <span>Update Department</span>
                            </>
                        ) : (
                            <>
                                <Plus size={17} strokeWidth={2.5} />
                                <span>Create Department</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
