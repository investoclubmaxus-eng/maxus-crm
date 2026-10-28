import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Ban,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    FolderTree,
    Layers,
    Link as LinkIcon,
    Loader2,
    Pencil,
    Shield,
    Tag,
    Trash2,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./ViewDesignation.css";

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

export default function ViewDesignation({ navigateTo, designationId, company }) {
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

    const [designation, setDesignation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadDesignation = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(
                `/company/designations-show/${designationId}`,
                { headers: getCompanyHeaders() }
            );
            if (response.data?.success && response.data?.data) {
                setDesignation(response.data.data);
            } else {
                sweetAlert.error("Designation details could not be found.");
            }
        } catch (error) {
            console.error("Failed to load designation details:", error);
            sweetAlert.error("Failed to load designation details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (designationId) {
            loadDesignation();
        }
    }, [designationId]);

    const handleToggleStatus = async () => {
        if (!designation || isUpdatingStatus) return;

        const nextStatus =
            designation.status === "active" ? "inactive" : "active";
        const actionLabel =
            nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Set Designation ${nextStatus === "active" ? "Active" : "Inactive"}?`,
            `Are you sure you want to ${actionLabel} designation "${designation.name}"?`,
            nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive"
        );

        if (!confirmed) return;

        setIsUpdatingStatus(true);
        try {
            const response = await api.patch(
                `/company/designations-status/${designation.id}`,
                { status: nextStatus },
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                setDesignation((prev) => ({
                    ...prev,
                    status: nextStatus,
                }));
                sweetAlert.success(`Designation is now ${nextStatus}.`);
            } else {
                sweetAlert.error(
                    response.data?.message || "Failed to update status."
                );
            }
        } catch (error) {
            console.error("Toggle status error:", error);
            sweetAlert.error("Failed to update status.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!designation || isDeleting) return;

        const confirmed = await sweetAlert.confirm(
            "Delete Designation?",
            `Are you sure you want to permanently delete designation "${designation.name}" (${designation.designation_code})? This action cannot be undone.`,
            "Yes, Delete"
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const response = await api.delete(
                `/company/designations-destroy/${designation.id}`,
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                await sweetAlert.success("Designation deleted successfully.");
                navigateTo("/company/designations");
            } else {
                sweetAlert.error(
                    response.data?.message || "Failed to delete designation."
                );
            }
        } catch (error) {
            console.error("Delete error:", error);
            sweetAlert.error("Failed to delete designation.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="view-designation-page">
                <div className="view-designation-loading">
                    <Loader2 size={36} className="view-designation-spinner" />
                    <p style={{ margin: 0 }}>Loading designation details...</p>
                </div>
            </div>
        );
    }

    if (!designation) {
        return (
            <div className="view-designation-page">
                <div className="view-designation-error">
                    <h3>Designation Not Found</h3>
                    <p>The requested designation does not exist or has been removed.</p>
                    <button
                        type="button"
                        className="view-designation-btn back"
                        onClick={() => navigateTo("/company/designations")}
                    >
                        <ArrowLeft size={15} />
                        <span>Back to Designations</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="view-designation-page">
            {/* Header */}
            <div className="view-designation-header">
                <div className="view-designation-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="view-designation-breadcrumb-link"
                    >
                        <Building2 size={14} />
                        <span>Dashboard</span>
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/designations")}
                        className="view-designation-breadcrumb-link"
                    >
                        Designations
                    </button>
                    <span>/</span>
                    <span className="view-designation-breadcrumb-current">
                        {designation.name}
                    </span>
                </div>

                <div className="view-designation-header-row">
                    <div className="view-designation-title-section">
                        <div className="view-designation-title-icon">
                            <Briefcase size={26} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>{designation.name}</h1>
                            <p>
                                Job role &amp; designation overview in the organization structure.
                            </p>
                        </div>
                    </div>

                    <div className="view-designation-header-actions">
                        <button
                            type="button"
                            className="view-designation-btn back"
                            onClick={() => navigateTo("/company/designations")}
                        >
                            <ArrowLeft size={15} />
                            <span>Back</span>
                        </button>

                        <button
                            type="button"
                            className="view-designation-btn edit"
                            onClick={() =>
                                navigateTo(
                                    `/company/designations/${designation.id}/edit`
                                )
                            }
                        >
                            <Pencil size={15} />
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            className="view-designation-btn status-toggle"
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? (
                                <Loader2
                                    size={15}
                                    className="desig-spinner"
                                />
                            ) : designation.status === "active" ? (
                                <Ban size={15} />
                            ) : (
                                <CheckCircle2 size={15} />
                            )}
                            <span>
                                {designation.status === "active"
                                    ? "Set Inactive"
                                    : "Set Active"}
                            </span>
                        </button>

                        <button
                            type="button"
                            className="view-designation-btn delete"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 size={15} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="view-designation-card">
                {/* Banner */}
                <div className="view-designation-banner">
                    <div className="view-designation-banner-left">
                        <h2>{designation.name}</h2>
                        <span
                            className={`view-designation-status-pill ${designation.status}`}
                        >
                            {designation.status === "active" ? (
                                <CheckCircle2 size={14} />
                            ) : (
                                <Ban size={14} />
                            )}
                            <span>
                                {designation.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                            </span>
                        </span>
                    </div>

                    <span className="view-designation-badge code">
                        <Tag size={13} />
                        {designation.designation_code}
                    </span>
                </div>

                {/* Fields Grid */}
                <div className="view-designation-fields-grid">
                    {/* Code */}
                    <div className="view-designation-field-item">
                        <div className="view-designation-label">
                            <Tag size={14} />
                            <span>Designation Code</span>
                        </div>
                        <div className="view-designation-value">
                            <span className="view-designation-badge code">
                                {designation.designation_code}
                            </span>
                        </div>
                    </div>

                    {/* Department */}
                    <div className="view-designation-field-item">
                        <div className="view-designation-label">
                            <FolderTree size={14} />
                            <span>Department</span>
                        </div>
                        <div className="view-designation-value">
                            {designation.department ? (
                                <span className="view-designation-badge department">
                                    <FolderTree size={13} />
                                    {designation.department.name} (
                                    {designation.department.department_code})
                                </span>
                            ) : (
                                <span style={{ color: "#94a3b8" }}>
                                    None Assigned
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Slug */}
                    <div className="view-designation-field-item">
                        <div className="view-designation-label">
                            <LinkIcon size={14} />
                            <span>Slug</span>
                        </div>
                        <div className="view-designation-value">
                            <span className="view-designation-badge slug">
                                {designation.slug}
                            </span>
                        </div>
                    </div>

                    {/* Industry / Domain */}
                    <div className="view-designation-field-item">
                        <div className="view-designation-label">
                            <Layers size={14} />
                            <span>Industry / Domain</span>
                        </div>
                        <div className="view-designation-value">
                            {designation.industry || (
                                <span style={{ color: "#94a3b8" }}>
                                    Not Specified
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="view-designation-field-item">
                        <div className="view-designation-label">
                            <Shield size={14} />
                            <span>Status</span>
                        </div>
                        <div className="view-designation-value">
                            <span
                                className={`view-designation-status-pill ${designation.status}`}
                            >
                                {designation.status === "active" ? (
                                    <CheckCircle2 size={13} />
                                ) : (
                                    <Ban size={13} />
                                )}
                                <span>
                                    {designation.status === "active"
                                        ? "Active"
                                        : "Inactive"}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Company (if attached) */}
                    {designation.company && (
                        <div className="view-designation-field-item">
                            <div className="view-designation-label">
                                <Building2 size={14} />
                                <span>Company</span>
                            </div>
                            <div className="view-designation-value">
                                {designation.company.name} ({designation.company.code})
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="view-designation-field-item full-width">
                        <div className="view-designation-label">
                            <FileText size={14} />
                            <span>Description &amp; Overview</span>
                        </div>
                        <div className="view-designation-desc-box">
                            {designation.description || (
                                <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                                    No description provided for this designation.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Audit Timestamps */}
                <div className="view-designation-audit-row">
                    <div className="view-designation-audit-item">
                        <Clock size={14} />
                        <span>
                            Created on: {formatDate(designation.created_at)}
                        </span>
                    </div>
                    {designation.updated_at && (
                        <div className="view-designation-audit-item">
                            <Calendar size={14} />
                            <span>
                                Last updated: {formatDate(designation.updated_at)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
