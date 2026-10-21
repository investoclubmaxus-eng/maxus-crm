import React, { useEffect, useState } from "react";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    GitBranch,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Shield,
    ShieldCheck,
    Trash2,
    Users,
    Ban,
    Loader2,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./ViewSubAdmin.css";

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

const getInitials = (name) => {
    return String(name || "SA")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("");
};

export default function ViewSubAdmin({ navigateTo, subAdminId, company }) {
    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [subAdmin, setSubAdmin] = useState(null);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const [branchesRes, subAdminRes] = await Promise.all([
                api.get("/company/branches", { headers, params: { per_page: 100 } }).catch(() => null),
                api.get(`/company/sub-admins-show/${subAdminId}`, { headers }).catch((err) => {
                    console.error("Failed to load sub-admin details:", err);
                    return null;
                }),
            ]);

            if (branchesRes?.data?.success && Array.isArray(branchesRes.data.data)) {
                setBranches(branchesRes.data.data);
            } else {
                setBranches([]);
            }

            if (subAdminRes?.data?.success && subAdminRes.data.data) {
                setSubAdmin(subAdminRes.data.data);
            } else {
                setSubAdmin(null);
            }
        } catch (error) {
            console.error("Failed to load sub admin data:", error);
            sweetAlert.error("Failed to load sub-administrator details.");
            setSubAdmin(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (subAdminId) {
            loadData();
        }
    }, [subAdminId, activeCompany?.id]);

    const handleToggleStatus = async () => {
        if (!subAdmin || isUpdatingStatus) return;
        const nextStatus = subAdmin.status === "active" ? "inactive" : "active";
        const actionLabel = nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to ${actionLabel} sub admin "${subAdmin.name}"?`,
            {
                title: nextStatus === "active" ? "Set Sub Admin Active?" : "Set Sub Admin Inactive?",
                confirmText: nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive",
                cancelText: "Cancel",
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
                `/company/sub-admins-status/${subAdmin.id}`,
                { status: nextStatus },
                { headers }
            );

            if (response.data?.success) {
                setSubAdmin((prev) => ({ ...prev, status: nextStatus }));
                await sweetAlert.success(`Sub Admin marked as ${nextStatus} successfully.`);
            } else {
                sweetAlert.error(response.data?.message || "Failed to update sub admin status.");
            }
        } catch (error) {
            console.error("Failed to toggle sub admin status:", error);
            sweetAlert.error(error.response?.data?.message || "Failed to update sub admin status.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!subAdmin || isDeleting) return;
        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to delete sub admin "${subAdmin.name}"? This action cannot be undone.`,
            {
                title: "Delete Sub Admin?",
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

            const response = await api.delete(`/company/sub-admins-destroy/${subAdmin.id}`, { headers });

            if (response.data?.success) {
                await sweetAlert.success("Sub Admin deleted successfully.");
                navigateTo("/company/sub-admins");
            } else {
                sweetAlert.error(response.data?.message || "Failed to delete sub admin.");
            }
        } catch (error) {
            console.error("Failed to delete sub admin:", error);
            sweetAlert.error(error.response?.data?.message || "Failed to delete sub admin.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="view-subadmin-page">
                <div className="view-subadmin-loading">
                    <Loader2 size={36} className="view-subadmin-spinner" />
                    <p>Loading sub-admin details...</p>
                </div>
            </div>
        );
    }

    if (!subAdmin) {
        return (
            <div className="view-subadmin-page">
                <div className="view-subadmin-error">
                    <Users size={42} color="#94a3b8" />
                    <h2>Sub Admin Not Found</h2>
                    <p>The requested sub-admin does not exist or has been removed.</p>
                    <button
                        type="button"
                        className="view-subadmin-btn view-subadmin-btn-back"
                        onClick={() => navigateTo("/company/sub-admins")}
                        style={{ marginTop: "16px" }}
                    >
                        <ArrowLeft size={16} />
                        Back to Sub Admins
                    </button>
                </div>
            </div>
        );
    }

    const isActive = subAdmin.status === "active";
    const assignedBranches =
        subAdmin.assigned_branches && subAdmin.assigned_branches.length > 0
            ? subAdmin.assigned_branches.map((b) => ({
                  id: b.id,
                  name: b.name,
                  code: b.code || "",
                  city: b.city || "",
                  isPrimary: Boolean(b.is_default) || Number(subAdmin.primary_branch_id) === Number(b.id),
              }))
            : (subAdmin.branch_ids || []).map((id) => {
                  const b = branches.find((item) => Number(item.id) === Number(id));
                  return {
                      id,
                      name: b ? b.name : `Branch #${id}`,
                      code: b ? b.code : "",
                      city: b?.city || "",
                      isPrimary: Number(subAdmin.primary_branch_id) === Number(id),
                  };
              });

    const permissionLabel =
        subAdmin.permissions === "view_only"
            ? "Read-Only View"
            : subAdmin.permissions === "view_edit"
            ? "View & Edit Properties"
            : "Full Management Access";

    return (
        <div className="view-subadmin-page">
            {/* Page Header */}
            <div className="view-subadmin-header">
                <div className="view-subadmin-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="view-subadmin-breadcrumb-link"
                    >
                        <Building2 size={14} />
                        <span>Dashboard</span>
                    </button>
                    <span>/</span>
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/sub-admins")}
                        className="view-subadmin-breadcrumb-link"
                    >
                        <span>Sub Admins</span>
                    </button>
                    <span>/</span>
                    <span className="view-subadmin-breadcrumb-current">View Details</span>
                </div>

                <div className="view-subadmin-header-row">
                    <div className="view-subadmin-title-section">
                        <div className="view-subadmin-avatar-large">
                            {subAdmin.avatar ? (
                                <img src={subAdmin.avatar} alt={subAdmin.name} />
                            ) : (
                                <span>{getInitials(subAdmin.name)}</span>
                            )}
                        </div>
                        <div>
                            <h1>
                                <span>{subAdmin.name}</span>
                                <span className="view-subadmin-role-badge">
                                    {subAdmin.role || "Sub Administrator"}
                                </span>
                            </h1>
                            <p>
                                Sub-administrator profile and branch delegation overview for{" "}
                                {activeCompany?.name || "your company"}.
                            </p>
                        </div>
                    </div>

                    <div className="view-subadmin-header-actions">
                        <button
                            type="button"
                            className="view-subadmin-btn view-subadmin-btn-back"
                            onClick={() => navigateTo("/company/sub-admins")}
                        >
                            <ArrowLeft size={16} />
                            <span>Back</span>
                        </button>

                        <button
                            type="button"
                            className={`view-subadmin-btn ${
                                isActive
                                    ? "view-subadmin-btn-status-deactivate"
                                    : "view-subadmin-btn-status-activate"
                            }`}
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 size={15} className="view-subadmin-spinner" />
                            ) : isActive ? (
                                <Ban size={15} />
                            ) : (
                                <CheckCircle2 size={15} />
                            )}
                            <span>{isActive ? "Set Inactive" : "Set Active"}</span>
                        </button>

                        <button
                            type="button"
                            className="view-subadmin-btn view-subadmin-btn-edit"
                            onClick={() => navigateTo(`/company/sub-admins/${subAdmin.id}/edit`)}
                        >
                            <Pencil size={15} />
                            <span>Edit</span>
                        </button>

                        <button
                            type="button"
                            className="view-subadmin-btn view-subadmin-btn-delete"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 size={15} />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Status Action Banner (same as Branch) */}
            <div className={`view-subadmin-status-banner ${isActive ? "is-active" : "is-inactive"}`}>
                <div className="view-subadmin-status-banner-text">
                    {isActive ? (
                        <CheckCircle2 size={24} color="#16a34a" />
                    ) : (
                        <Ban size={24} color="#d97706" />
                    )}
                    <div>
                        <strong>This sub-admin is currently {isActive ? "Active" : "Inactive"}</strong>
                        <p>
                            {isActive
                                ? "Active sub-admins can manage their assigned branches and properties."
                                : "Inactive sub-admins are paused and cannot perform operations."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className={`view-subadmin-btn ${
                        isActive
                            ? "view-subadmin-btn-status-deactivate"
                            : "view-subadmin-btn-status-activate"
                    }`}
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                >
                    {isUpdatingStatus ? (
                        <Loader2 size={14} className="view-subadmin-spinner" />
                    ) : isActive ? (
                        <Ban size={14} />
                    ) : (
                        <CheckCircle2 size={14} />
                    )}
                    <span>{isActive ? "Switch to Inactive" : "Switch to Active"}</span>
                </button>
            </div>

            {/* Main Content Grid */}
            <div className="view-subadmin-grid">
                {/* Left Column */}
                <div>
                    {/* Personal Details Card */}
                    <div className="view-subadmin-card">
                        <div className="view-subadmin-card-header">
                            <h2 className="view-subadmin-card-title">
                                <Users size={18} />
                                <span>Personal Details</span>
                            </h2>
                            <span className={`view-subadmin-status-pill ${subAdmin.status}`}>
                                {isActive ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                                <span>{isActive ? "Active" : "Inactive"}</span>
                            </span>
                        </div>
                        <div className="view-subadmin-card-body">
                            <div className="view-subadmin-fields-grid">
                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Users size={13} />
                                        Full Name
                                    </span>
                                    <span className="view-subadmin-field-value">{subAdmin.name}</span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Shield size={13} />
                                        Designation / Role
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {subAdmin.role || "Sub Administrator"}
                                    </span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Mail size={13} />
                                        Official Email
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {subAdmin.email ? (
                                            <a href={`mailto:${subAdmin.email}`}>{subAdmin.email}</a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Phone size={13} />
                                        Phone Number
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {subAdmin.phone ? (
                                            <a href={`tel:${subAdmin.phone}`}>{formatPhone(subAdmin.phone)}</a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <MapPin size={13} />
                                        Base Location
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {subAdmin.location || "N/A"}
                                    </span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <ShieldCheck size={13} />
                                        Permission Level
                                    </span>
                                    <span className="view-subadmin-field-value">{permissionLabel}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branch Access Card */}
                    <div className="view-subadmin-card">
                        <div className="view-subadmin-card-header">
                            <h2 className="view-subadmin-card-title">
                                <GitBranch size={18} />
                                <span>Branch Access & Authorization</span>
                            </h2>
                            <span className="view-subadmin-branch-count">
                                {assignedBranches.length}{" "}
                                {assignedBranches.length === 1 ? "Branch" : "Branches"} Assigned
                            </span>
                        </div>
                        <div className="view-subadmin-card-body">
                            {assignedBranches.length === 0 ? (
                                <p className="view-subadmin-empty-text">
                                    No branches assigned to this sub-admin.
                                </p>
                            ) : (
                                <div className="view-subadmin-branch-cards">
                                    {assignedBranches.map((b) => (
                                        <div key={b.id} className="view-subadmin-branch-row">
                                            <div className="view-subadmin-branch-row-left">
                                                <div className="view-subadmin-branch-icon">
                                                    <GitBranch size={16} />
                                                </div>
                                                <div>
                                                    <strong className="view-subadmin-branch-name">
                                                        {b.name}
                                                    </strong>
                                                    <span className="view-subadmin-branch-meta">
                                                        Code: {b.code || "N/A"}
                                                        {b.city ? ` • ${b.city}` : ""}
                                                    </span>
                                                </div>
                                            </div>
                                            {b.isPrimary && (
                                                <span className="view-subadmin-branch-pill">
                                                    Primary Branch
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Account Info Card */}
                    <div className="view-subadmin-card">
                        <div className="view-subadmin-card-header">
                            <h2 className="view-subadmin-card-title">
                                <ShieldCheck size={18} />
                                <span>Account Info</span>
                            </h2>
                        </div>
                        <div className="view-subadmin-card-body">
                            <div className="view-subadmin-fields-grid" style={{ gridTemplateColumns: "1fr" }}>
                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Calendar size={13} />
                                        Created On
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {formatDate(subAdmin.created_at)}
                                    </span>
                                </div>

                                <div className="view-subadmin-field">
                                    <span className="view-subadmin-field-label">
                                        <Clock size={13} />
                                        Last Updated
                                    </span>
                                    <span className="view-subadmin-field-value">
                                        {formatDate(subAdmin.updated_at)}
                                    </span>
                                </div>

                                <div className="view-subadmin-field" style={{ paddingTop: "10px", borderTop: "1px solid #edf4fd" }}>
                                    <span className="view-subadmin-field-label">
                                        <Shield size={13} />
                                        Access Scope
                                    </span>
                                    <p className="view-subadmin-scope-text">
                                        Sub-administrators have scoped privileges limited to their assigned
                                        branches and cannot alter organization-level company settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}