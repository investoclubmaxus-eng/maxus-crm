import React, { useEffect, useRef, useState } from "react";
import {
    Ban,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Link as LinkIcon,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Tag,
    Trash2,
    Users,
    X,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./Departments.css";

const PAGE_SIZE = 10;

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

export default function Departments({ navigateTo, company }) {
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

    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);

    // Floating action dropdown menu state
    const [openMenuId, setOpenMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({
        top: 0,
        left: 0,
    });
    const actionMenuRef = useRef(null);

    // Live search debounce (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const loadDepartments = async (
        page = 1,
        searchQuery = debouncedSearch,
        status = statusFilter
    ) => {
        setIsLoading(true);
        try {
            const params = {
                page,
                per_page: PAGE_SIZE,
            };
            if (activeCompany?.id) {
                params.company_id = activeCompany.id;
            }
            const query = typeof searchQuery === "string" ? searchQuery.trim() : "";
            if (query) params.search = query;
            if (status !== "all") params.status = status;

            const response = await api.get("/company/departments", {
                params,
                headers: getCompanyHeaders(),
            });

            if (response.data?.success) {
                setDepartments(response.data.data || []);
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            } else {
                setDepartments([]);
            }
        } catch (error) {
            console.error("Unable to load departments:", error);
            sweetAlert.error("Unable to load departments list.");
            setDepartments([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload departments when page, status filter, debounced search, or active company changes
    useEffect(() => {
        loadDepartments(currentPage, debouncedSearch, statusFilter);
    }, [currentPage, statusFilter, debouncedSearch, activeCompany?.id]);

    // Handle outside click for actions menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                actionMenuRef.current &&
                !actionMenuRef.current.contains(e.target)
            ) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        setDebouncedSearch(search);
        setCurrentPage(1);
        loadDepartments(1, search, statusFilter);
    };

    const handleResetFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setStatusFilter("all");
        setCurrentPage(1);
        loadDepartments(1, "", "all");
    };

    const handleMenuToggle = (e, deptId) => {
        e.stopPropagation();
        if (openMenuId === deptId) {
            setOpenMenuId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setActionMenuPosition({
            top: rect.bottom + 6,
            left: Math.max(10, rect.right - 175),
        });
        setOpenMenuId(deptId);
    };

    const handleViewDetails = (dept) => {
        setOpenMenuId(null);
        navigateTo(`/company/departments/${dept.id}`);
    };

    const handleToggleStatus = async (dept) => {
        setOpenMenuId(null);
        const nextStatus = dept.status === "active" ? "inactive" : "active";
        const actionLabel =
            nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Set Department ${nextStatus === "active" ? "Active" : "Inactive"}?`,
            `Are you sure you want to ${actionLabel} department "${dept.name}"?`,
            nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive"
        );

        if (!confirmed) return;

        setIsUpdatingStatusId(dept.id);
        try {
            const response = await api.patch(
                `/company/departments-status/${dept.id}`,
                { status: nextStatus },
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                sweetAlert.success(`Department is now ${nextStatus}.`);
                setDepartments((prev) =>
                    prev.map((d) =>
                        d.id === dept.id ? { ...d, status: nextStatus } : d
                    )
                );
            } else {
                sweetAlert.error(
                    response.data?.message || "Failed to update status."
                );
            }
        } catch (error) {
            console.error("Toggle status error:", error);
            sweetAlert.error("Failed to update status.");
        } finally {
            setIsUpdatingStatusId(null);
        }
    };

    const handleDelete = async (dept) => {
        setOpenMenuId(null);
        const confirmed = await sweetAlert.confirm(
            "Delete Department?",
            `Are you sure you want to delete department "${dept.name}" (${dept.department_code})? This action cannot be undone.`,
            "Yes, Delete"
        );

        if (!confirmed) return;

        try {
            const response = await api.delete(
                `/company/departments-destroy/${dept.id}`,
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                await sweetAlert.success("Department deleted successfully.");
                loadDepartments(currentPage);
            } else {
                sweetAlert.error(
                    response.data?.message || "Unable to delete department."
                );
            }
        } catch (error) {
            console.error("Delete department error:", error);
            sweetAlert.error("Failed to delete department.");
        }
    };

    const openMenuDept =
        openMenuId !== null
            ? departments.find((item) => item.id === openMenuId) || null
            : null;

    return (
        <div className="departments-page">
            {/* Page Header */}
            <div className="departments-page-header">
                <div className="departments-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="departments-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <span className="departments-breadcrumb-current">
                        Departments
                    </span>
                </div>

                <div className="departments-header-row">
                    <div className="departments-title-section">
                        <div className="departments-title-icon">
                            <Users size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>Departments</h1>
                            <p>
                                Manage company departments, functional units, and organization structure.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="departments-add-button"
                        onClick={() =>
                            navigateTo("/company/departments/create")
                        }
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Add Department</span>
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="departments-main-container">
                {/* Filter Bar */}
                <form
                    className="departments-filter-bar"
                    onSubmit={handleSearchSubmit}
                >
                    <div className="departments-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, code, slug..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="departments-filter-controls">
                        <div className="departments-select-wrapper">
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
                                className="departments-reset-button"
                                onClick={handleResetFilters}
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Table Container */}
                <div className="departments-table-container">
                    <table className="departments-table">
                        <thead>
                            <tr>
                                <th>Department Code</th>
                                <th>Name & Description</th>
                                <th>Slug</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="departments-loading-state">
                                            <Loader2
                                                size={30}
                                                className="dept-spinner"
                                                style={{
                                                    color: "#2563eb",
                                                    marginBottom: "10px",
                                                }}
                                            />
                                            <p style={{ margin: 0 }}>
                                                Loading departments...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : departments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 0 }}>
                                        <div className="departments-empty-state">
                                            <Users
                                                size={46}
                                                strokeWidth={1.5}
                                            />
                                            <h3>No departments found</h3>
                                            <p>
                                                {search || statusFilter !== "all"
                                                    ? "No departments match your current filter criteria."
                                                    : "No departments have been created yet."}
                                            </p>
                                            {search || statusFilter !== "all" ? (
                                                <button
                                                    type="button"
                                                    className="departments-reset-button"
                                                    onClick={handleResetFilters}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px"
                                                    }}
                                                    
                                                >
                                               <RotateCcw size={14} style={{ marginTop: "2px", flexShrink: 0 }} />                                                 
                                                 <span>Reset Filters</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="departments-add-button"
                                                    onClick={() =>
                                                        navigateTo(
                                                            "/company/departments/create"
                                                        )
                                                    }
                                                >
                                                    <Plus size={16} />
                                                    <span>Add First Department</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.id}>
                                        {/* Department Code */}
                                        <td>
                                            <span className="dept-code-badge">
                                                <Tag size={13} />
                                                {dept.department_code}
                                            </span>
                                        </td>

                                        {/* Name & Description */}
                                        <td>
                                            <div className="dept-name-cell">
                                                <strong>{dept.name}</strong>
                                                {dept.description && (
                                                    <span title={dept.description}>
                                                        {dept.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Slug */}
                                        <td>
                                            <span className="dept-slug-badge">
                                                <LinkIcon size={12} />
                                                {dept.slug}
                                            </span>
                                        </td>

                                        {/* Status Pill Badge (Matching Branch Module) */}
                                        <td>
                                            <button
                                                type="button"
                                                className={`dept-status-badge interactive ${dept.status}`}
                                                onClick={() =>
                                                    handleToggleStatus(dept)
                                                }
                                                disabled={
                                                    isUpdatingStatusId === dept.id
                                                }
                                                title={`Click to switch status to ${
                                                    dept.status === "active"
                                                        ? "Inactive"
                                                        : "Active"
                                                }`}
                                            >
                                                {isUpdatingStatusId === dept.id ? (
                                                    <Loader2
                                                        size={12}
                                                        className="dept-spinner"
                                                    />
                                                ) : dept.status === "active" ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <Ban size={12} />
                                                )}
                                                <span>
                                                    {dept.status === "active"
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </button>
                                        </td>

                                        {/* Created */}
                                        <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                                            {formatDate(dept.created_at)}
                                        </td>

                                        {/* Actions (3 dots button - Matching Branch Module) */}
                                        <td style={{ textAlign: "right" }}>
                                            <button
                                                type="button"
                                                className="departments-actions-btn"
                                                onClick={(e) =>
                                                    handleMenuToggle(e, dept.id)
                                                }
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
                    <div className="departments-pagination">
                        <div className="departments-pagination-info">
                            Showing{" "}
                            <strong>
                                {(pagination.current_page - 1) * PAGE_SIZE + 1}
                            </strong>{" "}
                            to{" "}
                            <strong>
                                {Math.min(
                                    pagination.current_page * PAGE_SIZE,
                                    pagination.total
                                )}
                            </strong>{" "}
                            of <strong>{pagination.total}</strong> departments
                        </div>

                        <div className="departments-pagination-buttons">
                            <button
                                type="button"
                                className="departments-page-btn"
                                disabled={pagination.current_page <= 1}
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {Array.from(
                                { length: pagination.last_page },
                                (_, i) => i + 1
                            ).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    className={`departments-page-btn ${
                                        pagination.current_page === page
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="departments-page-btn"
                                disabled={
                                    pagination.current_page >= pagination.last_page
                                }
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(pagination.last_page, p + 1)
                                    )
                                }
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Context Menu (Matching Branch Module) */}
            {openMenuDept !== null && (
                <div
                    ref={actionMenuRef}
                    className="departments-menu-dropdown"
                    style={{
                        top: `${actionMenuPosition.top}px`,
                        left: `${actionMenuPosition.left}px`,
                    }}
                >
                    <button
                        type="button"
                        className="departments-menu-item"
                        onClick={() => handleViewDetails(openMenuDept)}
                    >
                        <Eye size={14} />
                        <span>View Details</span>
                    </button>

                    <button
                        type="button"
                        className="departments-menu-item"
                        onClick={() => {
                            const d = openMenuDept;
                            setOpenMenuId(null);
                            navigateTo(`/company/departments/${d.id}/edit`);
                        }}
                    >
                        <Pencil size={14} />
                        <span>Edit Department</span>
                    </button>

                    <div className="departments-menu-divider" />

                    <button
                        type="button"
                        className={`departments-menu-item ${
                            openMenuDept.status === "active"
                                ? "status-inactive"
                                : "status-active"
                        }`}
                        onClick={() => handleToggleStatus(openMenuDept)}
                    >
                        {openMenuDept.status === "active" ? (
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

                    <div className="departments-menu-divider" />

                    <button
                        type="button"
                        className="departments-menu-item delete"
                        onClick={() => handleDelete(openMenuDept)}
                    >
                        <Trash2 size={14} />
                        <span>Delete Department</span>
                    </button>
                </div>
            )}
        </div>
    );
}
