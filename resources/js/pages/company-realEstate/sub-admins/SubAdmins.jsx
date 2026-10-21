import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    Building2,
    Plus,
    Search,
    RotateCcw,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Pencil,
    Trash2,
    MapPin,
    Mail,
    Phone,
    CheckCircle2,
    Ban,
    Loader2,
    GitBranch,
    Users,
    Eye,
    X,
    Calendar,
    ExternalLink,
   
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./SubAdmins.css";

const PAGE_SIZE = 10;

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

export default function SubAdmins({ navigateTo, company }) {
    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [subAdmins, setSubAdmins] = useState([]);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [branchFilter, setBranchFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
    const actionMenuRef = useRef(null);

    const [selectedSubAdminForModal, setSelectedSubAdminForModal] = useState(null);

    // Clean up any legacy dummy data
    useEffect(() => {
        try {
            const raw = localStorage.getItem("company_subadmins_data");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.some((item) => item.email === "rajesh.sharma@example.com")) {
                    localStorage.removeItem("company_subadmins_data");
                }
            }
        } catch {
            // ignore
        }
    }, []);

    // Load branches & subadmins from API
    const loadData = async () => {
        setIsLoading(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const [branchesRes, subAdminsRes] = await Promise.all([
                api.get("/company/branches", { headers, params: { per_page: 100 } }).catch((err) => {
                    console.error("Error loading branches:", err);
                    return null;
                }),
                api.get("/company/sub-admins", { headers }).catch((err) => {
                    console.error("Error loading sub-admins:", err);
                    return null;
                }),
            ]);

            if (branchesRes?.data?.success && Array.isArray(branchesRes.data.data)) {
                setBranches(branchesRes.data.data);
            } else {
                setBranches([]);
            }

            if (subAdminsRes?.data?.success && Array.isArray(subAdminsRes.data.data)) {
                setSubAdmins(subAdminsRes.data.data);
            } else {
                setSubAdmins([]);
            }
        } catch (error) {
            console.error("Failed to load sub-admin module data:", error);
            sweetAlert.error("Failed to load sub-administrators list.");
            setSubAdmins([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeCompany?.id]);

    const handleMenuToggle = (e, id) => {
        e.stopPropagation();
        if (openMenuId === id) {
            setOpenMenuId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setActionMenuPosition({
            top: rect.bottom + 6,
            left: Math.max(10, rect.right - 165),
        });
        setOpenMenuId(id);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const filteredSubAdmins = useMemo(() => {
        return subAdmins.filter((item) => {
            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const matches = [item.name, item.email, item.phone, item.location, item.role]
                    .filter(Boolean)
                    .some((val) => String(val).toLowerCase().includes(q));
                if (!matches) return false;
            }

            if (statusFilter !== "all" && item.status !== statusFilter) {
                return false;
            }

            if (branchFilter !== "all") {
                const branchIdNum = Number(branchFilter);
                if (!Array.isArray(item.branch_ids) || !item.branch_ids.includes(branchIdNum)) {
                    return false;
                }
            }

            return true;
        });
    }, [subAdmins, search, statusFilter, branchFilter]);

    const paginatedSubAdmins = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredSubAdmins.slice(start, start + PAGE_SIZE);
    }, [filteredSubAdmins, currentPage]);

    const totalPages = Math.max(1, Math.ceil(filteredSubAdmins.length / PAGE_SIZE));

    const handleResetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setBranchFilter("all");
        setCurrentPage(1);
    };

    // const handleToggleStatus = async (subAdmin) => {
    //     setOpenMenuId(null);
    //     const nextStatus = subAdmin.status === "active" ? "inactive" : "active";
    //     const actionLabel = nextStatus === "active" ? "activate" : "deactivate";

    //     const confirmed = await sweetAlert.confirm(
    //         `Are you sure you want to ${actionLabel} sub admin "${subAdmin.name}"?`,
    //         {
    //             title: nextStatus === "active" ? "Set Sub Admin Active?" : "Set Sub Admin Inactive?",
    //             confirmText: nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive",
    //             cancelText: "Cancel",
    //         }
    //     );

    //     if (!confirmed) return;

    //     try {
    //         const headers = {};
    //         if (activeCompany?.id) {
    //             headers["X-Company-Id"] = String(activeCompany.id);
    //         }

    //         const response = await api.patch(
    //             `/company/sub-admins-status/${subAdmin.id}`,
    //             { status: nextStatus },
    //             { headers }
    //         );

    //         if (response.data?.success) {
    //             setSubAdmins((prev) =>
    //                 prev.map((item) =>
    //                     item.id === subAdmin.id ? { ...item, status: nextStatus, updated_at: new Date().toISOString() } : item
    //                 )
    //             );

    //             if (selectedSubAdminForModal?.id === subAdmin.id) {
    //                 setSelectedSubAdminForModal((prev) => ({ ...prev, status: nextStatus }));
    //             }

    //             await sweetAlert.success(`Sub Admin marked as ${nextStatus} successfully.`);
    //         } else {
    //             sweetAlert.error(response.data?.message || "Failed to update sub admin status.");
    //         }
    //     } catch (error) {
    //         console.error("Failed to toggle sub admin status:", error);
    //         sweetAlert.error(error.response?.data?.message || "Failed to update sub admin status.");
    //     }
    // };


    const handleToggleStatus = async (subAdmin) => {
    setOpenMenuId(null);
    const nextStatus = subAdmin.status === "active" ? "inactive" : "active";

    const confirmation = await sweetAlert.confirm(
        `Change ${subAdmin.name}'s status to ${nextStatus}? A status email will be sent to ${subAdmin.email}.`,
        {
            title: "Change Sub Admin Status?",
            confirmText: `Set ${nextStatus === "active" ? "Active" : "Inactive"}`,
            cancelText: "Cancel",
        }
    );

    if (!confirmation || confirmation.isConfirmed === false) {
        return;
    }

    try {
        setBusySubAdminId?.(subAdmin.id);

        const headers = {};
        if (activeCompany?.id) {
            headers["X-Company-Id"] = String(activeCompany.id);
        }

        const response = await api.patch(
            `/company/sub-admins-status/${subAdmin.id}`,
            { status: nextStatus },
            { headers }
        );

        if (!response?.data?.success) {
            await sweetAlert.error(
                response?.data?.message || "Failed to update sub admin status."
            );
            return;
        }

        setSubAdmins((prev) =>
            prev.map((item) =>
                item.id === subAdmin.id
                    ? { ...item, ...(response.data.data || {}), status: nextStatus }
                    : item
            )
        );

        if (selectedSubAdminForModal?.id === subAdmin.id) {
            setSelectedSubAdminForModal((prev) => ({
                ...prev,
                ...(response.data.data || {}),
                status: nextStatus,
            }));
        }

        await sweetAlert.success(
            response.data.message ||
                `Sub Admin marked as ${nextStatus} successfully.`
        );
    } catch (error) {
        console.error("Failed to toggle sub admin status:", error);
        await sweetAlert.error(
            error.response?.data?.message || "Failed to update sub admin status."
        );
    } finally {
        setBusySubAdminId?.(null);
    }
};
    const handleDeleteSubAdmin = async (subAdmin) => {
        setOpenMenuId(null);
        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to delete sub admin "${subAdmin.name}"? This action cannot be undone.`,
            {
                title: "Delete Sub Admin?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!confirmed) return;

        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.delete(`/company/sub-admins-destroy/${subAdmin.id}`, { headers });

            if (response.data?.success) {
                setSubAdmins((prev) => prev.filter((item) => item.id !== subAdmin.id));

                if (selectedSubAdminForModal?.id === subAdmin.id) {
                    setSelectedSubAdminForModal(null);
                }

                await sweetAlert.success("Sub Admin deleted successfully.");
            } else {
                sweetAlert.error(response.data?.message || "Failed to delete sub admin.");
            }
        } catch (error) {
            console.error("Failed to delete sub admin:", error);
            sweetAlert.error(error.response?.data?.message || "Failed to delete sub admin.");
        }
    };

    const [busySubAdminId, setBusySubAdminId] = useState(null);
    const handleSendInvitation = async (subAdmin) => {
        setOpenMenuId(null);

        const confirmation = await sweetAlert.confirm(
            `Send an activation invitation to ${subAdmin.email}? They will set their own password using the link.`,
            {
                title: subAdmin.has_pending_invitation
                    ? "Resend Activation Invitation?"
                    : "Send Activation Invitation?",
                confirmText: subAdmin.has_pending_invitation
                    ? "Resend Invitation"
                    : "Send Invitation",
                cancelText: "Cancel",
            }
        );

        // support both boolean and { isConfirmed } style
        if (!confirmation || confirmation.isConfirmed === false) {
            return;
        }

        try {
            setBusySubAdminId(subAdmin.id);

            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.post(
                `/company/sub-admins/${subAdmin.id}/send-invitation`,
                {},
                { headers }
            );

            if (!response?.data?.success) {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to queue the activation invitation."
                );
                return;
            }

            // merge invitation flags from API (same as admin list)
            setSubAdmins((prev) =>
                prev.map((item) =>
                    item.id === subAdmin.id
                        ? {
                            ...item,
                            ...(response.data.data || {}),
                            has_pending_invitation: true,
                        }
                        : item
                )
            );

            await sweetAlert.success(
                response.data.message ||
                    "Activation invitation queued successfully."
            );
        } catch (error) {
            console.error("Send sub-admin activation invitation error:", error);
            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to queue the activation invitation."
            );
        } finally {
            setBusySubAdminId(null);
        }
    };

    const getBranchNames = (branchIds, primaryId, subAdminObj = null) => {
        if (subAdminObj?.assigned_branches && Array.isArray(subAdminObj.assigned_branches) && subAdminObj.assigned_branches.length > 0) {
            return subAdminObj.assigned_branches
                .map((b) => ({
                    id: b.id,
                    name: b.name,
                    code: b.code || "",
                    isPrimary: Boolean(b.is_default) || Number(primaryId) === Number(b.id),
                }))
                .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
        }

        if (!Array.isArray(branchIds) || branchIds.length === 0) return [];
        return branchIds
            .map((id) => {
                const b = branches.find((item) => Number(item.id) === Number(id));
                return {
                    id,
                    name: b ? b.name : `Branch #${id}`,
                    code: b ? b.code : "",
                    isPrimary: Number(primaryId) === Number(id),
                };
            })
            .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
    };

    const openMenuSubAdmin =
        openMenuId !== null ? subAdmins.find((item) => item.id === openMenuId) || null : null;

    return (
        <div className="subadmins-page">
            {/* Page Header */}
            <div className="subadmins-page-header">
                <div className="subadmins-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="subadmins-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <span className="subadmins-breadcrumb-current">Sub Admins</span>
                </div>

                <div className="subadmins-header-row">
                    <div className="subadmins-title-section">
                        <div className="subadmins-title-icon">
                            <Users size={28} />
                        </div>
                        <div>
                            <h1>Sub Admins</h1>
                            <p>
                                Manage company sub-administrators, delegate operations, and monitor branch access for{" "}
                                {activeCompany?.name || "your company"}.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="subadmins-add-button"
                        onClick={() => navigateTo("/company/sub-admins/create")}
                    >
                        <Plus size={18} />
                        <span>Add Sub Admin</span>
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="subadmins-main-container">
                {/* Filter Bar */}
                <form
                    className="subadmins-filter-bar"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                    }}
                >
                    <div className="subadmins-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="subadmins-filter-controls">
                        <div className="subadmins-select-wrapper">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <ChevronDown size={15} />
                        </div>

                        {branches.length > 0 && (
                            <div className="subadmins-select-wrapper">
                                <select
                                    value={branchFilter}
                                    onChange={(e) => {
                                        setBranchFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.code})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={15} />
                            </div>
                        )}

                        {(search || statusFilter !== "all" || branchFilter !== "all") && (
                            <button
                                type="button"
                                className="subadmins-reset-button"
                                onClick={handleResetFilters}
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Table */}
                <div className="subadmins-table-container">
                    <table className="subadmins-table">
                        <thead>
                            <tr>
                                <th>Sub Admin Info</th>
                                <th>Contact & Location</th>
                                <th>Branch Access</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="subadmins-empty-state">
                                            <Loader2 size={32} className="company-spinner" />
                                            <p>Loading sub-admins...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedSubAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="subadmins-empty-state">
                                            <Users size={42} strokeWidth={1.5} />
                                            <h3>No sub-admins found</h3>
                                            <p>There are no sub-administrators created yet for this company.</p>
                                            <button
                                                type="button"
                                                className="subadmins-add-button"
                                                onClick={() => navigateTo("/company/sub-admins/create")}
                                            >
                                                <span>Add First Sub Admin</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSubAdmins.map((subAdmin) => {
                                    const assignedBranches = getBranchNames(
                                        subAdmin.branch_ids,
                                        subAdmin.primary_branch_id,
                                        subAdmin
                                    );
                                    return (
                                        <tr key={subAdmin.id}>
                                            <td>
                                                <div className="subadmin-name-cell">
                                                    <div className="subadmin-avatar">
                                                        {subAdmin.avatar ? (
                                                            <img src={subAdmin.avatar} alt={subAdmin.name} />
                                                        ) : (
                                                            <span>{getInitials(subAdmin.name)}</span>
                                                        )}
                                                    </div>
                                                    <div className="subadmin-name-info">
                                                        <button
                                                            type="button"
                                                            className="subadmin-name-button"
                                                            onClick={() => navigateTo(`/company/sub-admins/${subAdmin.id}`)}
                                                            title="Click to view details"
                                                        >
                                                            <strong>{subAdmin.name}</strong>
                                                            <span>Sub Admin</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#425f84" }}>
                                                        <Mail size={13} style={{ color: "#728aa8" }} />
                                                        <span>{subAdmin.email}</span>
                                                    </span>
                                                    {subAdmin.phone && (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#425f84" }}>
                                                            <Phone size={13} style={{ color: "#728aa8" }} />
                                                            <span>{formatPhone(subAdmin.phone)}</span>
                                                        </span>
                                                    )}
                                                    {subAdmin.location && (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#7a93b4", fontSize: "11.5px" }}>
                                                            <MapPin size={12} />
                                                            <span>{subAdmin.location}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="subadmin-branches-tags">
                                                    {assignedBranches.length === 0 ? (
                                                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>No branches</span>
                                                    ) : (
                                                        assignedBranches.slice(0, 2).map((b) => (
                                                            <span
                                                                key={b.id}
                                                                className={`subadmin-branch-badge ${b.isPrimary ? "primary" : ""}`}
                                                            >
                                                                <GitBranch size={11} />
                                                                <span>{b.code || b.name}</span>
                                                                {b.isPrimary && (
                                                                    <span style={{ fontSize: "10px", opacity: 0.8 }}>(Primary)</span>
                                                                )}
                                                            </span>
                                                        ))
                                                    )}
                                                    {assignedBranches.length > 2 && (
                                                        <span className="subadmin-branch-more-tag">
                                                            +{assignedBranches.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className={`subadmin-status-badge ${subAdmin.status}`}
                                                    onClick={() => handleToggleStatus(subAdmin)}
                                                    title={`Click to set ${subAdmin.status === "active" ? "Inactive" : "Active"}`}
                                                >
                                                    {subAdmin.status === "active" ? (
                                                        <CheckCircle2 size={12} />
                                                    ) : (
                                                        <Ban size={12} />
                                                    )}
                                                    <span>{subAdmin.status === "active" ? "Active" : "Inactive"}</span>
                                                </button>
                                            </td>

                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    className="subadmins-actions-btn"
                                                    onClick={(e) => handleMenuToggle(e, subAdmin.id)}
                                                    aria-label="Actions"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && filteredSubAdmins.length > 0 && (
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #edf2f9", fontSize: "13px", color: "#637e9f" }}>
                        <div>
                            Showing <strong>{paginatedSubAdmins.length}</strong> of <strong>{filteredSubAdmins.length}</strong> sub-admins
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                            <button
                                type="button"
                                className="branches-page-nav-btn"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`branches-page-nav-btn ${currentPage === page ? "active" : ""}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="branches-page-nav-btn"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Context Menu */}
            {openMenuSubAdmin !== null && (
                <div
                    ref={actionMenuRef}
                    className="subadmins-menu-dropdown"
                    style={{
                        top: `${actionMenuPosition.top}px`,
                        left: `${actionMenuPosition.left}px`,
                    }}
                >
                    <button
                        type="button"
                        className="subadmins-menu-item"
                        onClick={() => {
                            const item = openMenuSubAdmin;
                            setOpenMenuId(null);
                            navigateTo(`/company/sub-admins/${item.id}`);
                        }}
                    >
                        <Eye size={14} />
                        <span>View Details</span>
                    </button>

                    <button
                        type="button"
                        className="subadmins-menu-item"
                        onClick={() => {
                            const item = openMenuSubAdmin;
                            setOpenMenuId(null);
                            navigateTo(`/company/sub-admins/${item.id}/edit`);
                        }}
                    >
                        <Pencil size={14} />
                        <span>Edit Sub Admin</span>
                    </button>


                    {/* Send / Resend Invitation — only if not already activated */}
{!openMenuSubAdmin.has_accepted_invitation &&
    (openMenuSubAdmin.status === "active" ||
        !openMenuSubAdmin.has_revoked_invitation) && (
        <>
            <div className="subadmins-menu-divider" />
            <button
                type="button"
                className="subadmins-menu-item"
                disabled={busySubAdminId === openMenuSubAdmin.id}
                onClick={() => handleSendInvitation(openMenuSubAdmin)}
            >
                <Mail size={14} />
                <span>
                    {openMenuSubAdmin.has_pending_invitation
                        ? "Resend Activation Invitation"
                        : "Send Activation Invitation"}
                </span>
            </button>
        </>
    )}

                    <div className="subadmins-menu-divider" />

                    <button
                        type="button"
                        className={`subadmins-menu-item ${openMenuSubAdmin.status === "active" ? "status-inactive" : "status-active"}`}
                        onClick={() => handleToggleStatus(openMenuSubAdmin)}
                    >
                        {openMenuSubAdmin.status === "active" ? (
                            <>
                                <Ban size={14} />
                                <span>Set Inactive</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={14} />
                                <span>Set Active</span>
                            </>
                        )}
                    </button>

                    <div className="subadmins-menu-divider" />

                    <button
                        type="button"
                        className="subadmins-menu-item delete"
                        onClick={() => handleDeleteSubAdmin(openMenuSubAdmin)}
                    >
                        <Trash2 size={14} />
                        <span>Delete Sub Admin</span>
                    </button>
                </div>
            )}

            {/* Quick View Modal */}
            {selectedSubAdminForModal && (
                <div
                    className="subadmins-modal-backdrop"
                    onClick={() => setSelectedSubAdminForModal(null)}
                >
                    <div
                        className="subadmins-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="subadmins-modal-header">
                            <h3>
                                <Users size={20} color="#1267e8" />
                                <span>{selectedSubAdminForModal.name}</span>
                            </h3>
                            <button
                                type="button"
                                className="subadmins-modal-close-btn"
                                onClick={() => setSelectedSubAdminForModal(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="subadmins-modal-body">
                            <div className="subadmins-modal-grid">
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Email</span>
                                    <span className="subadmins-modal-item-value">{selectedSubAdminForModal.email}</span>
                                </div>
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Phone</span>
                                    <span className="subadmins-modal-item-value">{formatPhone(selectedSubAdminForModal.phone)}</span>
                                </div>
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Role</span>
                                    <span className="subadmins-modal-item-value">Sub Admin</span>
                                </div>
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Location</span>
                                    <span className="subadmins-modal-item-value">{selectedSubAdminForModal.location || "N/A"}</span>
                                </div>
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Status</span>
                                    <span className="subadmins-modal-item-value">
                                        <span className={`subadmin-status-badge ${selectedSubAdminForModal.status}`}>
                                            {selectedSubAdminForModal.status === "active" ? "Active" : "Inactive"}
                                        </span>
                                    </span>
                                </div>
                                <div className="subadmins-modal-item">
                                    <span className="subadmins-modal-item-label">Created</span>
                                    <span className="subadmins-modal-item-value">{formatDate(selectedSubAdminForModal.created_at)}</span>
                                </div>
                                <div className="subadmins-modal-item full-width">
                                    <span className="subadmins-modal-item-label">Assigned Branches</span>
                                    <div className="subadmin-branches-tags" style={{ marginTop: "6px" }}>
                                        {getBranchNames(selectedSubAdminForModal.branch_ids, selectedSubAdminForModal.primary_branch_id, selectedSubAdminForModal).map((b) => (
                                            <span key={b.id} className={`subadmin-branch-badge ${b.isPrimary ? "primary" : ""}`}>
                                                <GitBranch size={11} />
                                                <span>{b.name} ({b.code})</span>
                                                {b.isPrimary && <span>• Primary</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="subadmins-modal-footer">
                            <button
                                type="button"
                                className={`subadmins-menu-item ${selectedSubAdminForModal.status === "active" ? "status-inactive" : "status-active"}`}
                                style={{ width: "auto", border: "1px solid #cbd5e1" }}
                                onClick={() => handleToggleStatus(selectedSubAdminForModal)}
                            >
                                {selectedSubAdminForModal.status === "active" ? "Set Inactive" : "Set Active"}
                            </button>

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="branches-page-nav-btn"
                                    style={{ width: "auto", padding: "0 14px" }}
                                    onClick={() => {
                                        const s = selectedSubAdminForModal;
                                        setSelectedSubAdminForModal(null);
                                        navigateTo(`/company/sub-admins/${s.id}/edit`);
                                    }}
                                >
                                    <Pencil size={13} style={{ marginRight: "6px" }} />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="subadmins-add-button"
                                    style={{ minHeight: "34px", padding: "0 14px", fontSize: "12.5px" }}
                                    onClick={() => {
                                        const s = selectedSubAdminForModal;
                                        setSelectedSubAdminForModal(null);
                                        navigateTo(`/company/sub-admins/${s.id}`);
                                    }}
                                >
                                    <ExternalLink size={13} />
                                    <span>Full Details</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
