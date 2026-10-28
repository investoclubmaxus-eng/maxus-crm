import React, { useEffect, useState, useRef } from "react";
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
    Globe2,
    CheckCircle2,
    Ban,
    Loader2,
    GitBranch,
    Eye,
    X,
    Calendar,
    Hash,
    Shield,
    ExternalLink,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./Branches.css";

const PAGE_SIZE = 10;

const formatBranchPhone = (phone) => {
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

export default function Branches({ navigateTo, company }) {
    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const [openMenuId, setOpenMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
    const actionMenuRef = useRef(null);

    const [selectedBranchForModal, setSelectedBranchForModal] = useState(null);
    const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);

    const loadBranches = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = {
                page,
                per_page: PAGE_SIZE,
            };
            if (search.trim()) params.search = search.trim();
            if (statusFilter !== "all") params.status = statusFilter;

            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const response = await api.get("/company/branches", { params, headers });
            if (response.data?.success) {
                setBranches(response.data.data || []);
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            } else {
                setBranches([]);
            }
        } catch (error) {
            console.error("Unable to load branches:", error);
            sweetAlert.error("Unable to load branches list.");
            setBranches([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBranches(currentPage);
    }, [currentPage, statusFilter]);

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        setCurrentPage(1);
        loadBranches(1);
    };

    const handleResetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    const handleMenuToggle = (e, branchId) => {
        e.stopPropagation();
        if (openMenuId === branchId) {
            setOpenMenuId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setActionMenuPosition({
            top: rect.bottom + 6,
            left: Math.max(10, rect.right - 165),
        });
        setOpenMenuId(branchId);
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

    const handleViewDetails = (branch) => {
        setOpenMenuId(null);
        navigateTo(`/company/branches/${branch.id}`);
    };

    const handleToggleStatus = async (branch) => {
        setOpenMenuId(null);
        const nextStatus = branch.status === "active" ? "inactive" : "active";
        const actionLabel = nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to ${actionLabel} branch "${branch.name}"?`,
            {
                title: nextStatus === "active" ? "Set Branch Active?" : "Set Branch Inactive?",
                confirmText: nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive",
                cancelText: "Cancel",
            }
        );

        if (!confirmed) return;

        setIsUpdatingStatusId(branch.id);
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
                setBranches((prev) =>
                    prev.map((item) =>
                        item.id === branch.id
                            ? { ...item, status: nextStatus, ...(response.data.data || {}) }
                            : item
                    )
                );
                if (selectedBranchForModal?.id === branch.id) {
                    setSelectedBranchForModal((prev) => ({
                        ...prev,
                        status: nextStatus,
                        ...(response.data.data || {}),
                    }));
                }
                await sweetAlert.success(
                    response.data.message || `Branch set to ${nextStatus} successfully.`
                );
            } else {
                sweetAlert.error(response.data?.message || "Failed to update branch status.");
            }
        } catch (error) {
            console.error("Status update error:", error);
            sweetAlert.error("Failed to update branch status.");
        } finally {
            setIsUpdatingStatusId(null);
        }
    };

    const handleDeleteBranch = async (branch) => {
        setOpenMenuId(null);
        const confirmed = await sweetAlert.confirm(
            `Are you sure you want to delete branch "${branch.name}"? This action cannot be undone.`,
            {
                title: "Delete Branch?",
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

            const response = await api.delete(`/company/branches-destroy/${branch.id}`, { headers });
            if (response.data?.success) {
                if (selectedBranchForModal?.id === branch.id) {
                    setSelectedBranchForModal(null);
                }
                await sweetAlert.success("Branch deleted successfully.");
                loadBranches(currentPage);
            } else {
                sweetAlert.error(response.data?.message || "Unable to delete branch.");
            }
        } catch (error) {
            console.error("Delete branch error:", error);
            sweetAlert.error("Failed to delete branch.");
        }
    };

    const openMenuBranch =
        openMenuId !== null
            ? branches.find((item) => item.id === openMenuId) || null
            : null;

    return (
        <div className="branches-page">
            {/* Page Header */}
            <div className="branches-page-header">
                <div className="branches-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="branches-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <span className="branches-breadcrumb-current">Branches</span>
                </div>

                <div className="branches-header-row">
                    <div className="branches-title-section">
                        <div className="branches-title-icon">
                            <GitBranch size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>Branches</h1>
                            <p>Manage office locations and regional branches for {activeCompany?.name || "your company"}.</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="branches-add-button"
                        onClick={() => navigateTo("/company/branches/create")}
                    >
                        <Plus size={18} />
                        <span>Add Branch</span>
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="branches-main-container">
                {/* Filter Bar */}
                <form className="branches-filter-bar" onSubmit={handleSearchSubmit}>
                    <div className="branches-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by branch name, code, city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="branches-filter-controls">
                        <div className="branches-select-wrapper">
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

                        {(search || statusFilter !== "all") && (
                            <button
                                type="button"
                                className="branches-reset-button"
                                onClick={handleResetFilters}
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Table */}
                <div className="branches-table-container">
                    <table className="branches-table">
                        <thead>
                            <tr>
                                <th>Branch Info</th>
                                <th>Contact Details</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="branches-loading-state">
                                            <Loader2 size={32} className="company-spinner" />
                                            <p>Loading branches...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : branches.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="branches-empty-state">
                                            <GitBranch size={42} strokeWidth={1.5} />
                                            <h3>No branches found</h3>
                                            <p>There are no branches created yet for this company.</p>
                                            <button
                                                type="button"
                                                className="branches-add-button"
                                                onClick={() => navigateTo("/company/branches/create")}
                                            >
                                                <span>Add First Branch</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                branches.map((branch) => (
                                    <tr key={branch.id}>
                                        <td>
                                            <div className="branch-name-cell">
                                                <div className="branch-avatar-icon">
                                                    <Building2 size={19} />
                                                </div>
                                                <div className="branch-name-info">
                                                    <button
                                                        type="button"
                                                        className="branch-name-button"
                                                        onClick={() => handleViewDetails(branch)}
                                                        title="Click to view branch details"
                                                    >
                                                        <strong>{branch.name}</strong>
                                                        <span>{branch.code}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="branch-contact-item">
                                                <Mail size={14} />
                                                <span>{branch.email || "N/A"}</span>
                                            </div>
                                            <div className="branch-contact-item">
                                                <Phone size={14} />
                                                <span>{formatBranchPhone(branch.phone)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="branch-contact-item">
                                                <MapPin size={14} />
                                                <span>
                                                    {[branch.city, branch.state, branch.country]
                                                        .filter(Boolean)
                                                        .join(", ") || "N/A"}
                                                </span>
                                            </div>
                                            {branch.address && (
                                                <small style={{ color: "#7a93b4", fontSize: "11.5px" }}>
                                                    {branch.address.length > 40
                                                        ? `${branch.address.slice(0, 40)}...`
                                                        : branch.address}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className={`branch-status-badge interactive ${branch.status}`}
                                                onClick={() => handleToggleStatus(branch)}
                                                disabled={isUpdatingStatusId === branch.id}
                                                title={`Click to switch status to ${branch.status === "active" ? "Inactive" : "Active"}`}
                                            >
                                                {isUpdatingStatusId === branch.id ? (
                                                    <Loader2 size={12} className="company-spinner" />
                                                ) : branch.status === "active" ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <Ban size={12} />
                                                )}
                                                <span>{branch.status === "active" ? "Active" : "Inactive"}</span>
                                            </button>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <button
                                                type="button"
                                                className="branches-actions-btn"
                                                onClick={(e) => handleMenuToggle(e, branch.id)}
                                                aria-label="Actions"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && pagination.total > 0 && (
                    <div className="branches-pagination">
                        <div>
                            Showing <strong>{branches.length}</strong> of <strong>{pagination.total}</strong> branches
                        </div>

                        <div className="branches-pagination-buttons">
                            <button
                                type="button"
                                className="branches-page-nav-btn"
                                disabled={pagination.current_page <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`branches-page-nav-btn ${pagination.current_page === page ? "active" : ""}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="branches-page-nav-btn"
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Context Menu */}
            {openMenuBranch !== null && (
                <div
                    ref={actionMenuRef}
                    className="branches-menu-dropdown"
                    style={{
                        top: `${actionMenuPosition.top}px`,
                        left: `${actionMenuPosition.left}px`,
                    }}
                >
                    <button
                        type="button"
                        className="branches-menu-item"
                        onClick={() => handleViewDetails(openMenuBranch)}
                    >
                        <Eye size={14} />
                        <span>View Details</span>
                    </button>

                    <button
                        type="button"
                        className="branches-menu-item"
                        onClick={() => {
                            const b = openMenuBranch;
                            setOpenMenuId(null);
                            navigateTo(`/company/branches/${b.id}/edit`);
                        }}
                    >
                        <Pencil size={14} />
                        <span>Edit Branch</span>
                    </button>

                    <div className="branches-menu-divider" />

                    <button
                        type="button"
                        className={`branches-menu-item ${openMenuBranch.status === "active" ? "status-inactive" : "status-active"}`}
                        onClick={() => handleToggleStatus(openMenuBranch)}
                    >
                        {openMenuBranch.status === "active" ? (
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

                    <div className="branches-menu-divider" />

                    <button
                        type="button"
                        className="branches-menu-item delete"
                        onClick={() => handleDeleteBranch(openMenuBranch)}
                    >
                        <Trash2 size={14} />
                        <span>Delete Branch</span>
                    </button>
                </div>
            )}

            {/* Quick View Branch Modal */}
            {selectedBranchForModal && (
                <div
                    className="branches-modal-backdrop"
                    onClick={() => setSelectedBranchForModal(null)}
                >
                    <div
                        className="branches-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="branches-modal-header">
                            <h3>
                                <GitBranch size={20} color="#1267e8" />
                                <span>{selectedBranchForModal.name}</span>
                                <span className="code">{selectedBranchForModal.code}</span>
                            </h3>
                            <button
                                type="button"
                                className="branches-modal-close-btn"
                                onClick={() => setSelectedBranchForModal(null)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="branches-modal-body">
                            <div className="branches-modal-grid">
                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Building2 size={12} />
                                        Branch Name
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {selectedBranchForModal.name}
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Hash size={12} />
                                        Branch Code
                                    </span>
                                    <span className="branches-modal-item-value">
                                        <strong>{selectedBranchForModal.code}</strong>
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Shield size={12} />
                                        Status
                                    </span>
                                    <span className="branches-modal-item-value">
                                        <span className={`branch-status-badge ${selectedBranchForModal.status}`}>
                                            {selectedBranchForModal.status === "active" ? (
                                                <CheckCircle2 size={12} />
                                            ) : (
                                                <Ban size={12} />
                                            )}
                                            <span>
                                                {selectedBranchForModal.status === "active" ? "Active" : "Inactive"}
                                            </span>
                                        </span>
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Calendar size={12} />
                                        Created On
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {formatDate(selectedBranchForModal.created_at)}
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Mail size={12} />
                                        Email
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {selectedBranchForModal.email ? (
                                            <a href={`mailto:${selectedBranchForModal.email}`}>
                                                {selectedBranchForModal.email}
                                            </a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Phone size={12} />
                                        Phone
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {formatBranchPhone(selectedBranchForModal.phone)}
                                    </span>
                                </div>

                                <div className="branches-modal-item full-width">
                                    <span className="branches-modal-item-label">
                                        <MapPin size={12} />
                                        Address
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {selectedBranchForModal.address || "N/A"}
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">City & State</span>
                                    <span className="branches-modal-item-value">
                                        {[selectedBranchForModal.city, selectedBranchForModal.state]
                                            .filter(Boolean)
                                            .join(", ") || "N/A"}
                                    </span>
                                </div>

                                <div className="branches-modal-item">
                                    <span className="branches-modal-item-label">
                                        <Globe2 size={12} />
                                        Country & PIN
                                    </span>
                                    <span className="branches-modal-item-value">
                                        {[selectedBranchForModal.country, selectedBranchForModal.postal_code]
                                            .filter(Boolean)
                                            .join(" - ") || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="branches-modal-footer">
                            <button
                                type="button"
                                className={`branches-menu-item ${selectedBranchForModal.status === "active" ? "status-inactive" : "status-active"}`}
                                style={{ width: "auto", border: "1px solid #cbd5e1" }}
                                onClick={() => handleToggleStatus(selectedBranchForModal)}
                            >
                                {selectedBranchForModal.status === "active" ? (
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

                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    className="branches-page-nav-btn"
                                    style={{ width: "auto", padding: "0 14px" }}
                                    onClick={() => {
                                        const b = selectedBranchForModal;
                                        setSelectedBranchForModal(null);
                                        navigateTo(`/company/branches/${b.id}/edit`);
                                    }}
                                >
                                    <Pencil size={13} style={{ marginRight: "6px" }} />
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="branches-add-button"
                                    style={{ minHeight: "34px", padding: "0 14px", fontSize: "12.5px" }}
                                    onClick={() => {
                                        const b = selectedBranchForModal;
                                        setSelectedBranchForModal(null);
                                        handleViewDetails(b);
                                    }}
                                >
                                    <ExternalLink size={13} />
                                    <span>Full Page</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
