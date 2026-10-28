import React, { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Check,
    ChevronDown,
    FileText,
    FolderTree,
    Layers,
    Link as LinkIcon,
    Loader2,
    Lock,
    Plus,
    Save,
    Tag,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./CreateDesignation.css";

const INITIAL_FORM = {
    designation_code: "",
    name: "",
    company_id: "",
    department_id: "",
    slug: "",
    industry: "",
    status: "active",
    description: "",
};

export default function CreateDesignation({
    navigateTo,
    designationId,
    mode = "create",
    company,
}) {
    const isEditing = mode === "edit" && Boolean(designationId);

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
    const [departments, setDepartments] = useState([]);
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

    // Load active departments for dropdown
    useEffect(() => {
        let isMounted = true;
        const fetchDepartments = async () => {
            try {
                const response = await api.get("/company/departments", {
                    params: { per_page: 100, status: "active" },
                    headers: getCompanyHeaders(),
                });
                if (isMounted && response.data?.success) {
                    setDepartments(response.data.data || []);
                }
            } catch (err) {
                console.warn("Unable to fetch departments for designation:", err);
            }
        };
        fetchDepartments();
        return () => {
            isMounted = false;
        };
    }, [activeCompany?.id]);

    // Load initial code or existing designation
    useEffect(() => {
        let isMounted = true;

        if (isEditing) {
            const loadDesignation = async () => {
                setIsLoading(true);
                try {
                    const response = await api.get(
                        `/company/designations-show/${designationId}`,
                        { headers: getCompanyHeaders() }
                    );
                    const desig = response.data?.data;
                    if (isMounted && desig) {
                        setForm({
                            designation_code: desig.designation_code || "",
                            name: desig.name || "",
                            company_id: desig.company_id || activeCompany?.id || "",
                            department_id: desig.department_id ? String(desig.department_id) : "",
                            slug: desig.slug || "",
                            industry: desig.industry || activeCompany?.industry || "",
                            status: desig.status || "active",
                            description: desig.description || "",
                        });
                    }
                } catch (error) {
                    console.error("Load designation error:", error);
                    sweetAlert.error("Failed to load designation details.");
                } finally {
                    if (isMounted) setIsLoading(false);
                }
            };

            loadDesignation();
        } else {
            // Fetch next auto-generated designation code
            const fetchNextCode = async () => {
                try {
                    const params = {};
                    if (activeCompany?.id) {
                        params.company_id = activeCompany.id;
                    }
                    const response = await api.get(
                        "/company/designations/next-code",
                        {
                            params,
                            headers: getCompanyHeaders(),
                        }
                    );
                    if (isMounted && response.data?.code) {
                        setForm((prev) => ({
                            ...prev,
                            designation_code: response.data.code,
                            company_id: activeCompany?.id || prev.company_id,
                            industry: activeCompany?.industry || response.data?.industry || prev.industry,
                        }));
                    }
                } catch (error) {
                    console.warn("Unable to fetch next code from API:", error);
                    if (isMounted) {
                        setForm((prev) => ({
                            ...prev,
                            designation_code: "DES-001",
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
    }, [isEditing, designationId, activeCompany?.id]);

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

    const handleDepartmentChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            department_id: val,
        }));
        if (errors.department_id) {
            setErrors((prev) => ({ ...prev, department_id: undefined }));
        }
    };

    const handleSlugChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            slug: slugify(val),
        }));
        if (errors.slug) {
            setErrors((prev) => ({ ...prev, slug: undefined }));
        }
    };

    const handleIndustryChange = (e) => {
        const val = e.target.value;
        setForm((prev) => ({
            ...prev,
            industry: val,
        }));
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
            newErrors.name = "Designation Name is required.";
        } else if (form.name.length > 150) {
            newErrors.name = "Designation Name cannot exceed 150 characters.";
        }

        if (!form.department_id) {
            newErrors.department_id = "Please select a department for this designation.";
        }

        if (form.description && form.description.length > 1000) {
            newErrors.description = "Description cannot exceed 1000 characters.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            sweetAlert.error("Please fill in all required fields, including selecting a department.");
            return;
        }

        setIsSubmitting(true);
        try {
            const companyIdToStore =
                activeCompany?.id || (form.company_id ? Number(form.company_id) : null);
            const industryToStore =
                activeCompany?.industry || form.industry || null;

            const payload = {
                name: form.name.trim(),
                designation_code: form.designation_code.trim(),
                company_id: companyIdToStore,
                department_id: form.department_id ? Number(form.department_id) : null,
                slug: form.slug.trim() || slugify(form.name),
                industry: industryToStore,
                status: form.status,
                description: form.description ? form.description.trim() : null,
            };

            const headers = getCompanyHeaders();

            let response;
            if (isEditing) {
                response = await api.put(
                    `/company/designations-update/${designationId}`,
                    payload,
                    { headers }
                );
            } else {
                response = await api.post(
                    "/company/designations-store",
                    payload,
                    { headers }
                );
            }

            if (response.data?.success) {
                sweetAlert.success(
                    isEditing
                        ? "Designation updated successfully."
                        : "Designation created successfully."
                );
                navigateTo("/company/designations");
            } else {
                sweetAlert.error(
                    response.data?.message || "Operation failed. Please try again."
                );
            }
        } catch (error) {
            console.error("Save designation error:", error);
            const apiErrors = error.response?.data?.errors;
            if (apiErrors) {
                const formatted = {};
                Object.keys(apiErrors).forEach((key) => {
                    formatted[key] = apiErrors[key][0];
                });
                setErrors(formatted);
                sweetAlert.error(
                    error.response?.data?.message ||
                        "Validation error. Please check highlighted fields."
                );
            } else {
                sweetAlert.error(
                    error.response?.data?.message ||
                        "An unexpected error occurred while saving designation."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="designation-create-page">
            {/* Page Header */}
            <div className="designation-page-header">
                <div className="designation-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="designation-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/designations")}
                        className="designation-breadcrumb-link"
                    >
                        Designations
                    </button>
                    <span>/</span>
                    <span className="designation-breadcrumb-current">
                        {isEditing ? "Edit Designation" : "Create Designation"}
                    </span>
                </div>

                <div className="designation-header-row">
                    <div className="designation-title-section">
                        <div className="designation-title-icon">
                            <Briefcase size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>
                                {isEditing
                                    ? "Edit Designation"
                                    : "Create New Designation"}
                            </h1>
                            <p>
                                {isEditing
                                    ? "Update title, department hierarchy, and metadata for this designation."
                                    : "Define a new company job role or functional position."}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="designation-back-button"
                        onClick={() => navigateTo("/company/designations")}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Designations</span>
                    </button>
                </div>
            </div>

            {/* Form Card */}
            <div className="designation-card">
                {isLoading ? (
                    <div className="designation-loading-card">
                        <Loader2
                            size={36}
                            className="desig-spinner"
                            style={{ margin: "0 auto 12px", color: "#1267e8" }}
                        />
                        <p style={{ margin: 0 }}>
                            Loading designation details...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="designation-card-header">
                            <h2>
                                {isEditing
                                    ? "Designation Information"
                                    : "General Information"}
                            </h2>
                            <p>
                                Fields marked with{" "}
                                <span className="required-mark">*</span> are
                                required.
                            </p>
                        </div>

                        <div className="designation-form-grid">
                            {/* Company Field (Locked to Active Authenticated Company) */}
                            <div className="designation-form-group">
                                <label htmlFor="desig_company">
                                    Company <span className="required-mark">*</span>
                                </label>
                                <div className="designation-input-wrapper">
                                    <Building2
                                        size={15}
                                        className="designation-input-icon"
                                    />
                                    <input
                                        id="desig_company"
                                        type="text"
                                        className="designation-input with-icon readonly"
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
                                <span className="designation-help-text">
                                    Automatically linked to your active company portal.
                                </span>
                            </div>

                            {/* Designation Code */}
                            <div className="designation-form-group">
                                <label htmlFor="designation_code">
                                    Designation Code
                                </label>
                                <div className="designation-input-wrapper">
                                    <Tag
                                        size={15}
                                        className="designation-input-icon"
                                    />
                                    <input
                                        id="designation_code"
                                        type="text"
                                        className="designation-input with-icon"
                                        value={form.designation_code}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                designation_code: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="e.g. DES-001"
                                        disabled
                                        readOnly

                                    />
                                </div>
                                <span className="designation-help-text">
                                    Auto-generated unique code identifier.
                                </span>
                                {errors.designation_code && (
                                    <span className="designation-error-text">
                                        {errors.designation_code}
                                    </span>
                                )}
                            </div>

                            {/* Designation Name */}
                            <div className="designation-form-group">
                                <label htmlFor="desig_name">
                                    Designation Name{" "}
                                    <span className="required-mark">*</span>
                                </label>
                                <div className="designation-input-wrapper">
                                    <Briefcase
                                        size={15}
                                        className="designation-input-icon"
                                    />
                                    <input
                                        id="desig_name"
                                        type="text"
                                        className={`designation-input with-icon ${
                                            errors.name ? "error" : ""
                                        }`}
                                        placeholder="e.g. Senior Property Consultant"
                                        value={form.name}
                                        onChange={handleNameChange}
                                        autoFocus={!isEditing}
                                    />
                                </div>
                                {errors.name ? (
                                    <span className="designation-error-text">
                                        {errors.name}
                                    </span>
                                ) : (
                                    <span className="designation-help-text">
                                        Primary job title or organizational role.
                                    </span>
                                )}
                            </div>

                            {/* Department */}
                            <div className="designation-form-group">
                                <label htmlFor="desig_department">
                                    Department{" "}
                                    <span className="required-mark">*</span>
                                </label>
                                <div className={`designation-input-wrapper${errors.department_id ? " has-error" : ""}`}>
                                    <FolderTree
                                        size={15}
                                        className="designation-input-icon"
                                    />
                                    <select
                                        id="desig_department"
                                        className={`designation-select${errors.department_id ? " error" : ""}`}
                                        value={form.department_id}
                                        onChange={handleDepartmentChange}
                                    >
                                        <option value="">
                                            — Select Associated Department —
                                        </option>
                                        {departments.map((dept) => (
                                            <option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                {dept.name} ({dept.department_code})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={15}
                                        className="designation-select-chevron"
                                    />
                                </div>
                                {errors.department_id ? (
                                    <span className="designation-error-text">
                                        {errors.department_id}
                                    </span>
                                ) : (
                                    <span className="designation-help-text">
                                        Department this position belongs to.
                                    </span>
                                )}
                            </div>

                            

                            {/* Industry / Role Category */}
                            <div className="designation-form-group">
                                <label htmlFor="desig_industry">
                                    Industry / Domain
                                </label>
                                <div className="designation-input-wrapper">
                                    <Layers
                                        size={15}
                                        className="designation-input-icon"
                                    />
                                    <input
                                        id="desig_industry"
                                        type="text"
                                        className="designation-input with-icon readonly"
                                        value={form.industry || activeCompany?.industry || "Loading company industry..."}
                                        disabled
                                        readOnly
                                    />
                                </div>
                                <span className="designation-help-text">
                                   Industry is automatically determined by your active company.
                                </span>
                            </div>

                            {/* Status Dropdown */}
                            <div className="designation-form-group">
                                <label>
                                    Status{" "}
                                    <span className="required-mark">*</span>
                                </label>
                                <div
                                    className="designation-status-select-container"
                                    ref={dropdownRef}
                                >
                                    <button
                                        type="button"
                                        className={`designation-status-trigger ${
                                            statusDropdownOpen ? "open" : ""
                                        }`}
                                        onClick={() =>
                                            setStatusDropdownOpen(
                                                !statusDropdownOpen
                                            )
                                        }
                                    >
                                        <span
                                            className={`designation-status-pill ${form.status}`}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor:
                                                        form.status === "active"
                                                            ? "#10b981"
                                                            : "#ef4444",
                                                }}
                                            />
                                            {form.status === "active"
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                        <ChevronDown size={15} />
                                    </button>

                                    {statusDropdownOpen && (
                                        <div className="designation-status-dropdown">
                                            <button
                                                type="button"
                                                className={`designation-status-option ${
                                                    form.status === "active"
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleSelectStatus("active")
                                                }
                                            >
                                                <span className="designation-status-pill active">
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                "#10b981",
                                                        }}
                                                    />
                                                    Active
                                                </span>
                                                {form.status === "active" && (
                                                    <Check size={14} color="#1267e8" />
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className={`designation-status-option ${
                                                    form.status === "inactive"
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleSelectStatus("inactive")
                                                }
                                            >
                                                <span className="designation-status-pill inactive">
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: "50%",
                                                            backgroundColor:
                                                                "#ef4444",
                                                        }}
                                                    />
                                                    Inactive
                                                </span>
                                                {form.status === "inactive" && (
                                                    <Check size={14} color="#1267e8" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="designation-help-text">
                                    Inactive designations cannot be assigned to staff.
                                </span>
                            </div>

                            {/* Description */}
                            <div className="designation-form-group full-width">
                                <label htmlFor="desig_description">
                                    Description & Responsibilities
                                </label>
                                <textarea
                                    id="desig_description"
                                    className={`designation-textarea ${
                                        errors.description ? "error" : ""
                                    }`}
                                    placeholder="Enter a brief overview of this designation's role and key responsibilities..."
                                    value={form.description}
                                    onChange={handleDescriptionChange}
                                    rows={4}
                                />
                                <span className="designation-help-text">
                                    Optional overview of the position (max 1000 characters).
                                </span>
                                {errors.description && (
                                    <span className="designation-error-text">
                                        {errors.description}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="designation-form-actions">
                            <button
                                type="button"
                                className="designation-cancel-button"
                                onClick={() =>
                                    navigateTo("/company/designations")
                                }
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="designation-submit-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="desig-spinner"
                                        />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        <span>
                                            {isEditing
                                                ? "Update Designation"
                                                : "Save Designation"}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
