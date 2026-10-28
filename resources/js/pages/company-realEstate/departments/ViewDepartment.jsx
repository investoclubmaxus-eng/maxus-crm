import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Layers,
    Link as LinkIcon,
    Loader2,
    Pencil,
    Shield,
    Tag,
    Trash2,
    Users,
    Ban,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./ViewDepartment.css";

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return dateString;
    }
};

export default function ViewDepartment({ navigateTo, departmentId, company }) {
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

    const [department, setDepartment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadDepartment = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(
                `/company/departments-show/${departmentId}`,
                { headers: getCompanyHeaders() }
            );
            if (response.data?.success && response.data?.data) {
                setDepartment(response.data.data);
            } else {
                sweetAlert.error("Department details could not be found.");
            }
        } catch (error) {
            console.error("Failed to load department details:", error);
            sweetAlert.error("Failed to load department details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (departmentId) {
            loadDepartment();
        }
    }, [departmentId, activeCompany?.id]);

    const handleToggleStatus = async () => {
        if (!department || isUpdatingStatus) return;

        const nextStatus =
            department.status === "active" ? "inactive" : "active";
        const actionLabel =
            nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Set Department ${nextStatus === "active" ? "Active" : "Inactive"}?`,
            `Are you sure you want to ${actionLabel} department "${department.name}"?`,
            nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive"
        );

        if (!confirmed) return;

        setIsUpdatingStatus(true);
        try {
            const response = await api.patch(
                `/company/departments-status/${department.id}`,
                { status: nextStatus },
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                setDepartment((prev) => ({
                    ...prev,
                    status: nextStatus,
                }));
                sweetAlert.success(`Department is now ${nextStatus}.`);
            } else {
                sweetAlert.error(
                    response.data?.message || "Failed to update department status."
                );
            }
        } catch (error) {
            console.error("Status update error:", error);
            sweetAlert.error("Failed to update department status.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!department || isDeleting) return;

        const confirmed = await sweetAlert.confirm(
            "Delete Department?",
            `Are you sure you want to delete department "${department.name}" (${department.department_code})? This action cannot be undone.`,
            "Yes, Delete"
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await api.delete(
                `/company/departments-destroy/${department.id}`,
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                await sweetAlert.success("Department deleted successfully.");
                navigateTo("/company/departments");
            } else {
                sweetAlert.error(
                    response.data?.message || "Unable to delete department."
                );
            }
        } catch (error) {
            console.error("Delete department error:", error);
            sweetAlert.error("Failed to delete department.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="view-department-page">
                <div className="view-department-loading">
                    <Loader2 size={36} className="view-department-spinner" />
                    <p>Loading department details...</p>
                </div>
            </div>
        );
    }

    if (!department) {
        return (
            <div className="view-department-page">
                <div className="view-department-error">
                    <Users size={42} color="#94a3b8" />
                    <h2>Department Not Found</h2>
                    <p>The requested department does not exist or has been deleted.</p>
                    <button
                        type="button"
                        className="view-department-btn view-department-btn-back"
                        onClick={() => navigateTo("/company/departments")}
                        style={{ marginTop: "16px" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Departments
                    </button>
                </div>
            </div>
        );
    }

    const isActive = department.status === "active";

    return (
        <div className="view-department-page">
            {/* Page Header */}
            <div className="view-department-header">
                <div className="view-department-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="view-department-breadcrumb-link"
                    >
                        <Building2 size={14} />
                        <span>Dashboard</span>
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/departments")}
                        className="view-department-breadcrumb-link"
                    >
                        <span>Departments</span>
                    </button>
                    <span>/</span>
                    <span className="view-department-breadcrumb-current">
                        View Details
                    </span>
                </div>

                <div className="view-department-header-row">
                    <div className="view-department-title-section">
                        <div className="view-department-title-icon">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1>
                                <span>{department.name}</span>
                                <span className="view-department-code-badge">
                                    {department.department_code}
                                </span>
                            </h1>
                            <p>
                                Department details and operational configuration.
                            </p>
                        </div>
                    </div>

                    <div className="view-department-header-actions">
                        <button
                            type="button"
                            className="view-department-btn view-department-btn-back"
                            onClick={() => navigateTo("/company/departments")}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>

                        <button
                            type="button"
                            className={`view-department-btn ${
                                isActive
                                    ? "view-department-btn-status-deactivate"
                                    : "view-department-btn-status-activate"
                            }`}
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? (
                                <Loader2
                                    size={15}
                                    className="view-department-spinner"
                                />
                            ) : isActive ? (
                                <Ban size={15} />
                            ) : (
                                <CheckCircle2 size={15} />
                            )}
                            <span>{isActive ? "Set Inactive" : "Set Active"}</span>
                        </button>

                        <button
                            type="button"
                            className="view-department-btn view-department-btn-edit"
                            onClick={() =>
                                navigateTo(
                                    `/company/departments/${department.id}/edit`
                                )
                            }
                        >
                            <Pencil size={15} />
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            className="view-department-btn view-department-btn-delete"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 size={15} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Status Action Banner */}
            <div
                className={`view-department-status-banner ${
                    isActive ? "is-active" : "is-inactive"
                }`}
            >
                <div className="view-department-status-banner-text">
                    {isActive ? (
                        <CheckCircle2 size={24} color="#16a34a" />
                    ) : (
                        <Ban size={24} color="#d97706" />
                    )}
                    <div>
                        <strong>
                            This department is currently{" "}
                            {isActive ? "Active" : "Inactive"}
                        </strong>
                        <p>
                            {isActive
                                ? "Active departments are functional and visible across the CRM modules."
                                : "Inactive departments are paused and hidden from active operations."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className={`view-department-btn ${
                        isActive
                            ? "view-department-btn-status-deactivate"
                            : "view-department-btn-status-activate"
                    }`}
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                >
                    {isUpdatingStatus ? (
                        <Loader2
                            size={14}
                            className="view-department-spinner"
                        />
                    ) : isActive ? (
                        <Ban size={14} />
                    ) : (
                        <CheckCircle2 size={14} />
                    )}
                    <span>
                        {isActive ? "Switch to Inactive" : "Switch to Active"}
                    </span>
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="view-department-grid">
                {/* Overview Card */}
                <div className="view-department-card">
                    <div className="view-department-card-header">
                        <h2 className="view-department-card-title">
                            <Building2 size={18} />
                            <span>Department Overview</span>
                        </h2>
                        <span
                            className={`view-department-status-pill ${department.status}`}
                        >
                            {isActive ? (
                                <CheckCircle2 size={12} />
                            ) : (
                                <Ban size={12} />
                            )}
                            <span>{isActive ? "Active" : "Inactive"}</span>
                        </span>
                    </div>

                    <div className="view-department-card-body">
                        <div className="view-department-fields-grid">
                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Building2 size={13} />
                                    Department Name
                                </span>
                                <span className="view-department-field-value">
                                    {department.name}
                                </span>
                            </div>

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Tag size={13} />
                                    Department Code
                                </span>
                                <span className="view-department-field-value">
                                    <strong
                                        style={{
                                            letterSpacing: "0.5px",
                                            color: "#194799",
                                        }}
                                    >
                                        {department.department_code}
                                    </strong>
                                </span>
                            </div>

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <LinkIcon size={13} />
                                    Slug
                                </span>
                                <span className="view-department-field-value">
                                    <code
                                        style={{
                                            background: "#f1f5f9",
                                            padding: "3px 8px",
                                            borderRadius: "5px",
                                            fontSize: "13px",
                                            color: "#2563eb",
                                        }}
                                    >
                                        {department.slug}
                                    </code>
                                </span>
                            </div>

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Layers size={13} />
                                    Industry / Domain
                                </span>
                                <span className="view-department-field-value">
                                    {department.industry || (
                                        <span style={{ color: "#94a3b8" }}>
                                            Not Specified
                                        </span>
                                    )}
                                </span>
                            </div>

                            {department.company && (
                                <div className="view-department-field">
                                    <span className="view-department-field-label">
                                        <Building2 size={13} />
                                        Company
                                    </span>
                                    <span className="view-department-field-value">
                                        {department.company.name} (
                                        {department.company.code})
                                    </span>
                                </div>
                            )}

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Shield size={13} />
                                    Operational Status
                                </span>
                                <span className="view-department-field-value">
                                    <span
                                        className={`view-department-status-pill ${department.status}`}
                                    >
                                        {isActive ? (
                                            <CheckCircle2 size={12} />
                                        ) : (
                                            <Ban size={12} />
                                        )}
                                        <span>
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </span>
                                </span>
                            </div>

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Calendar size={13} />
                                    Created On
                                </span>
                                <span className="view-department-field-value">
                                    {formatDate(department.created_at)}
                                </span>
                            </div>

                            <div className="view-department-field">
                                <span className="view-department-field-label">
                                    <Clock size={13} />
                                    Last Updated
                                </span>
                                <span className="view-department-field-value">
                                    {formatDate(department.updated_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Card */}
                {department.description && (
                    <div className="view-department-card">
                        <div className="view-department-card-header">
                            <h2 className="view-department-card-title">
                                <FileText size={18} />
                                <span>Description</span>
                            </h2>
                        </div>
                        <div className="view-department-card-body">
                            <div className="view-department-desc-box">
                                {department.description}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
