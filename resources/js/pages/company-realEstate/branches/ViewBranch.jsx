import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    GitBranch,
    Pencil,
    Trash2,
    CheckCircle2,
    Ban,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Hash,
    Globe2,
    Clock,
    Loader2,
    Shield,
    Sparkles,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./ViewBranch.css";

const formatPhone = (phone) => {
    if (!phone) return "N/A";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length === 10) return `+91 ${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
    return phone;
};

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

export default function ViewBranch({ navigateTo, branchId, company }) {
    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [branch, setBranch] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadBranch = async () => {
        setIsLoading(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.get(`/company/branches-show/${branchId}`, { headers });
            if (response.data?.success && response.data?.data) {
                setBranch(response.data.data);
            } else {
                sweetAlert.error("Branch details could not be found.");
            }
        } catch (error) {
            console.error("Failed to load branch details:", error);
            sweetAlert.error("Failed to load branch details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (branchId) {
            loadBranch();
        }
    }, [branchId]);

    const handleToggleStatus = async () => {
        if (!branch || isUpdatingStatus) return;

        const nextStatus = branch.status === "active" ? "inactive" : "active";
        const actionLabel = nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to ${actionLabel} branch "${branch.name}"?`,
            {
                title: nextStatus === "active" ? "Activate Branch?" : "Deactivate Branch?",
                confirmText: nextStatus === "active" ? "Yes, Activate" : "Yes, Deactivate",
            }
        );

        if (!confirmed) return;

        setIsUpdatingStatus(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.patch(
                `/company/branches-status/${branch.id}`,
                { status: nextStatus },
                { headers }
            );

            if (response.data?.success) {
                setBranch((prev) => ({
                    ...prev,
                    status: nextStatus,
                    ...response.data.data,
                }));
                await sweetAlert.success(
                    response.data.message || `Branch marked as ${nextStatus} successfully.`
                );
            } else {
                sweetAlert.error(response.data?.message || "Failed to update branch status.");
            }
        } catch (error) {
            console.error("Status update error:", error);
            sweetAlert.error("An error occurred while updating branch status.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDeleteBranch = async () => {
        if (!branch || isDeleting) return;

        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to delete branch "${branch.name}"? This action cannot be undone.`,
            {
                title: "Delete Branch?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.delete(`/company/branches-destroy/${branch.id}`, { headers });
            if (response.data?.success) {
                await sweetAlert.success("Branch deleted successfully.");
                navigateTo("/company/branches");
            } else {
                sweetAlert.error(response.data?.message || "Unable to delete branch.");
            }
        } catch (error) {
            console.error("Delete branch error:", error);
            sweetAlert.error("Failed to delete branch.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="view-branch-page">
                <div className="view-branch-loading">
                    <Loader2 size={36} className="view-branch-spinner" />
                    <p>Loading branch details...</p>
                </div>
            </div>
        );
    }

    if (!branch) {
        return (
            <div className="view-branch-page">
                <div className="view-branch-error">
                    <GitBranch size={42} color="#94a3b8" />
                    <h2>Branch Not Found</h2>
                    <p>The requested branch does not exist or has been deleted.</p>
                    <button
                        type="button"
                        className="view-branch-btn view-branch-btn-back"
                        onClick={() => navigateTo("/company/branches")}
                        style={{ marginTop: "16px" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Branches
                    </button>
                </div>
            </div>
        );
    }

    const isActive = branch.status === "active";

    return (
        <div className="view-branch-page">
            {/* Page Header */}
            <div className="view-branch-header">
                <div className="view-branch-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="view-branch-breadcrumb-link"
                    >
                        <Building2 size={14} />
                        <span>Dashboard</span>
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/branches")}
                        className="view-branch-breadcrumb-link"
                    >
                        <span>Branches</span>
                    </button>
                    <span>/</span>
                    <span className="view-branch-breadcrumb-current">View Details</span>
                </div>

                <div className="view-branch-header-row">
                    <div className="view-branch-title-section">
                        <div className="view-branch-title-icon">
                            <GitBranch size={28} />
                        </div>
                        <div>
                            <h1>
                                <span>{branch.name}</span>
                                <span className="view-branch-code-badge">{branch.code}</span>
                            </h1>
                            <p>Branch details and contact information for {activeCompany?.name || "your company"}.</p>
                        </div>
                    </div>

                    <div className="view-branch-header-actions">
                        <button
                            type="button"
                            className="view-branch-btn view-branch-btn-back"
                            onClick={() => navigateTo("/company/branches")}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>

                        <button
                            type="button"
                            className={`view-branch-btn ${isActive ? "view-branch-btn-status-deactivate" : "view-branch-btn-status-activate"}`}
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 size={15} className="view-branch-spinner" />
                            ) : isActive ? (
                                <Ban size={15} />
                            ) : (
                                <CheckCircle2 size={15} />
                            )}
                            <span>{isActive ? "Set Inactive" : "Set Active"}</span>
                        </button>

                        <button
                            type="button"
                            className="view-branch-btn view-branch-btn-edit"
                            onClick={() => navigateTo(`/company/branches/${branch.id}/edit`)}
                        >
                            <Pencil size={15} />
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            className="view-branch-btn view-branch-btn-delete"
                            onClick={handleDeleteBranch}
                            disabled={isDeleting}
                        >
                            <Trash2 size={15} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Status Action Banner */}
            <div className={`view-branch-status-banner ${isActive ? "is-active" : "is-inactive"}`}>
                <div className="view-branch-status-banner-text">
                    {isActive ? (
                        <CheckCircle2 size={24} color="#16a34a" />
                    ) : (
                        <Ban size={24} color="#d97706" />
                    )}
                    <div>
                        <strong>This branch is currently {isActive ? "Active" : "Inactive"}</strong>
                        <p>
                            {isActive
                                ? "Active branches are operational and visible across the CRM modules."
                                : "Inactive branches are paused and excluded from active business operations."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className={`view-branch-btn ${isActive ? "view-branch-btn-status-deactivate" : "view-branch-btn-status-activate"}`}
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                >
                    {isUpdatingStatus ? (
                        <Loader2 size={14} className="view-branch-spinner" />
                    ) : isActive ? (
                        <Ban size={14} />
                    ) : (
                        <CheckCircle2 size={14} />
                    )}
                    <span>{isActive ? "Switch to Inactive" : "Switch to Active"}</span>
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="view-branch-grid">
                {/* Left Column */}
                <div>
                    {/* Basic Info Card */}
                    <div className="view-branch-card">
                        <div className="view-branch-card-header">
                            <h2 className="view-branch-card-title">
                                <Building2 size={18} />
                                <span>Branch Overview</span>
                            </h2>
                            <span className={`view-branch-status-pill ${branch.status}`}>
                                {isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                <span>{isActive ? "Active" : "Inactive"}</span>
                            </span>
                        </div>
                        <div className="view-branch-card-body">
                            <div className="view-branch-fields-grid">
                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Building2 size={13} />
                                        Branch Name
                                    </span>
                                    <span className="view-branch-field-value">{branch.name}</span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Hash size={13} />
                                        Branch Code
                                    </span>
                                    <span className="view-branch-field-value">
                                        <strong style={{ letterSpacing: "0.5px", color: "#194799" }}>
                                            {branch.code}
                                        </strong>
                                    </span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Shield size={13} />
                                        Operational Status
                                    </span>
                                    <span className="view-branch-field-value">
                                        <span className={`view-branch-status-pill ${branch.status}`}>
                                            {isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                            <span>{isActive ? "Active" : "Inactive"}</span>
                                        </span>
                                    </span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Calendar size={13} />
                                        Created On
                                    </span>
                                    <span className="view-branch-field-value">{formatDate(branch.created_at)}</span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Clock size={13} />
                                        Last Updated
                                    </span>
                                    <span className="view-branch-field-value">{formatDate(branch.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="view-branch-card">
                        <div className="view-branch-card-header">
                            <h2 className="view-branch-card-title">
                                <MapPin size={18} />
                                <span>Address & Location</span>
                            </h2>
                        </div>
                        <div className="view-branch-card-body">
                            <div className="view-branch-fields-grid">
                                <div className="view-branch-field full-width">
                                    <span className="view-branch-field-label">
                                        <MapPin size={13} />
                                        Street Address
                                    </span>
                                    <span className="view-branch-field-value">
                                        {branch.address || "No street address provided"}
                                    </span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">City</span>
                                    <span className="view-branch-field-value">{branch.city || "N/A"}</span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">State</span>
                                    <span className="view-branch-field-value">{branch.state || "N/A"}</span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">Postal Code</span>
                                    <span className="view-branch-field-value">{branch.postal_code || "N/A"}</span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Globe2 size={13} />
                                        Country
                                    </span>
                                    <span className="view-branch-field-value">{branch.country || "India"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Contact Information Card */}
                    <div className="view-branch-card">
                        <div className="view-branch-card-header">
                            <h2 className="view-branch-card-title">
                                <Mail size={18} />
                                <span>Contact Details</span>
                            </h2>
                        </div>
                        <div className="view-branch-card-body">
                            <div className="view-branch-fields-grid" style={{ gridTemplateColumns: "1fr" }}>
                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Mail size={13} />
                                        Official Email
                                    </span>
                                    <span className="view-branch-field-value">
                                        {branch.email ? (
                                            <a href={`mailto:${branch.email}`}>{branch.email}</a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </span>
                                </div>

                                <div className="view-branch-field">
                                    <span className="view-branch-field-label">
                                        <Phone size={13} />
                                        Phone Number
                                    </span>
                                    <span className="view-branch-field-value">
                                        {branch.phone ? (
                                            <a href={`tel:${branch.phone}`}>{formatPhone(branch.phone)}</a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manager / Created By Card */}
                    <div className="view-branch-card">
                        <div className="view-branch-card-header">
                            <h2 className="view-branch-card-title">
                                <User size={18} />
                                <span>Branch Manager</span>
                            </h2>
                        </div>
                        <div className="view-branch-card-body">
                            {branch.manager ? (
                                <div className="view-branch-manager-box">
                                    <div className="view-branch-manager-avatar">
                                        {branch.manager.name ? branch.manager.name.charAt(0).toUpperCase() : "M"}
                                    </div>
                                    <div className="view-branch-manager-info">
                                        <strong>{branch.manager.name}</strong>
                                        <span>{branch.manager.email}</span>
                                        {branch.manager.phone && (
                                            <span style={{ display: "block", marginTop: "2px" }}>
                                                {formatPhone(branch.manager.phone)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: "#7a93b4", fontSize: "13px" }}>
                                    No designated branch manager assigned.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
