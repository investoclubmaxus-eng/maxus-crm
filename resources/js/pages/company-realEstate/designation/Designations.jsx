import React, { useEffect, useRef, useState } from "react";
import {
    Ban,
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    FolderTree,
    Link as LinkIcon,
    Loader2,
    MoreVertical,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Tag,
    Trash2,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./Designations.css";

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

export default function Designations({ navigateTo, company }) {
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

    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
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

    // Load available departments for filtering
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
                console.warn("Unable to load departments filter list:", err);
            }
        };
        fetchDepartments();
        return () => {
            isMounted = false;
        };
    }, [activeCompany?.id]);

    const loadDesignations = async (
        page = 1,
        searchQuery = debouncedSearch,
        status = statusFilter,
        deptId = departmentFilter
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
            if (deptId !== "all") params.department_id = deptId;

            const response = await api.get("/company/designations", {
                params,
                headers: getCompanyHeaders(),
            });

            if (response.data?.success) {
                setDesignations(response.data.data || []);
                if (response.data.pagination) {
                    setPagination(response.data.pagination);
                }
            } else {
                setDesignations([]);
            }
        } catch (error) {
            console.error("Unable to load designations:", error);
            sweetAlert.error("Unable to load designations list.");
            setDesignations([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Reload designations when page, filters, or debounced search changes
    useEffect(() => {
        loadDesignations(currentPage, debouncedSearch, statusFilter, departmentFilter);
    }, [currentPage, statusFilter, departmentFilter, debouncedSearch]);

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
        loadDesignations(1, search, statusFilter, departmentFilter);
    };

    const handleResetFilters = () => {
        setSearch("");
        setDebouncedSearch("");
        setStatusFilter("all");
        setDepartmentFilter("all");
        setCurrentPage(1);
        loadDesignations(1, "", "all", "all");
    };

    const handleMenuToggle = (e, desigId) => {
        e.stopPropagation();
        if (openMenuId === desigId) {
            setOpenMenuId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        setActionMenuPosition({
            top: rect.bottom + 6,
            left: Math.max(10, rect.right - 175),
        });
        setOpenMenuId(desigId);
    };

    const handleViewDetails = (desig) => {
        setOpenMenuId(null);
        navigateTo(`/company/designations/${desig.id}`);
    };

    const handleEdit = (desig) => {
        setOpenMenuId(null);
        navigateTo(`/company/designations/${desig.id}/edit`);
    };

    const handleToggleStatus = async (desig) => {
        setOpenMenuId(null);
        const nextStatus = desig.status === "active" ? "inactive" : "active";
        const actionLabel =
            nextStatus === "active" ? "activate" : "deactivate";

        const confirmed = await sweetAlert.confirm(
            `Set Designation ${nextStatus === "active" ? "Active" : "Inactive"}?`,
            `Are you sure you want to ${actionLabel} designation "${desig.name}"?`,
            nextStatus === "active" ? "Yes, Set Active" : "Yes, Set Inactive"
        );

        if (!confirmed) return;

        setIsUpdatingStatusId(desig.id);
        try {
            const response = await api.patch(
                `/company/designations-status/${desig.id}`,
                { status: nextStatus },
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                sweetAlert.success(`Designation is now ${nextStatus}.`);
                setDesignations((prev) =>
                    prev.map((d) =>
                        d.id === desig.id ? { ...d, status: nextStatus } : d
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

    const handleDelete = async (desig) => {
        setOpenMenuId(null);
        const confirmed = await sweetAlert.confirm(
            "Delete Designation?",
            `Are you sure you want to delete designation "${desig.name}" (${desig.designation_code})? This action cannot be undone.`,
            "Yes, Delete"
        );

        if (!confirmed) return;

        try {
            const response = await api.delete(
                `/company/designations-destroy/${desig.id}`,
                { headers: getCompanyHeaders() }
            );

            if (response.data?.success) {
                await sweetAlert.success("Designation deleted successfully.");
                loadDesignations(currentPage);
            } else {
                sweetAlert.error(
                    response.data?.message || "Unable to delete designation."
                );
            }
        } catch (error) {
            console.error("Delete designation error:", error);
            sweetAlert.error("Failed to delete designation.");
        }
    };

    const openMenuDesig =
        openMenuId !== null
            ? designations.find((item) => item.id === openMenuId) || null
            : null;

    const hasFiltersActive =
        Boolean(search) || statusFilter !== "all" || departmentFilter !== "all";

    return (
        <div className="designations-page">
            {/* Page Header */}
            <div className="designations-page-header">
                <div className="designations-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo("/company/dashboard")}
                        className="designations-breadcrumb-home"
                        aria-label="Dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <span className="designations-breadcrumb-current">
                        Designations
                    </span>
                </div>

                <div className="designations-header-row">
                    <div className="designations-title-section">
                        <div className="designations-title-icon">
                            <Briefcase size={28} strokeWidth={2} />
                        </div>
                        <div>
                            <h1>Designations</h1>
                            <p>
                                Manage company designations, job roles, department positions, and organization titles.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="designations-add-button"
                        onClick={() =>
                            navigateTo("/company/designations/create")
                        }
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Add Designation</span>
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="designations-main-container">
                {/* Filter Bar */}
                <form
                    className="designations-filter-bar"
                    onSubmit={handleSearchSubmit}
                >
                    <div className="designations-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, code, slug..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="designations-filter-controls">
                        {/* Department Filter */}
                        <div className="designations-select-wrapper">
                            <select
                                value={departmentFilter}
                                onChange={(e) => {
                                    setDepartmentFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={15} />
                        </div>

                        {/* Status Filter */}
                        <div className="designations-select-wrapper">
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

                        {hasFiltersActive && (
                            <button
                                type="button"
                                className="designations-reset-button"
                                onClick={handleResetFilters}
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Table Container */}
                <div className="designations-table-container">
                    <table className="designations-table">
                        <thead>
                            <tr>
                                <th>Designation Code</th>
                                <th>Name & Description</th>
                                <th>Department</th>
                                <th>Slug</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="designations-loading-state">
                                            <Loader2
                                                size={30}
                                                className="desig-spinner"
                                                style={{
                                                    color: "#1267e8",
                                                    marginBottom: "10px",
                                                }}
                                            />
                                            <p style={{ margin: 0 }}>
                                                Loading designations...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : designations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 0 }}>
                                        <div className="designations-empty-state">
                                            <Briefcase
                                                size={46}
                                                strokeWidth={1.5}
                                            />
                                            <h3>No designations found</h3>
                                            <p>
                                                {hasFiltersActive
                                                    ? "No designations match your current filter criteria."
                                                    : "No designations have been created yet."}
                                            </p>
                                            {hasFiltersActive ? (
                                                <button
                                                    type="button"
                                                    className="designations-reset-button"
                                                    onClick={handleResetFilters}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <RotateCcw
                                                        size={14}
                                                        style={{
                                                            marginTop: "2px",
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <span>Reset Filters</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="designations-add-button"
                                                    onClick={() =>
                                                        navigateTo(
                                                            "/company/designations/create"
                                                        )
                                                    }
                                                >
                                                    <Plus size={16} />
                                                    <span>Add First Designation</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                designations.map((desig) => (
                                    <tr key={desig.id}>
                                        {/* Code */}
                                        <td>
                                            <span className="desig-code-badge">
                                                <Tag size={13} />
                                                {desig.designation_code}
                                            </span>
                                        </td>

                                        {/* Name & Description */}
                                        <td>
                                            <div className="desig-name-cell">
                                                <strong>{desig.name}</strong>
                                                {desig.description && (
                                                    <span title={desig.description}>
                                                        {desig.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Department */}
                                        <td>
                                            {desig.department ? (
                                                <span className="desig-dept-badge">
                                                    <FolderTree size={12} />
                                                    {desig.department.name}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        {/* Slug */}
                                        <td>
                                            <span className="desig-slug-badge">
                                                <LinkIcon size={12} />
                                                {desig.slug}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <button
                                                type="button"
                                                className={`desig-status-badge ${desig.status}`}
                                                onClick={() =>
                                                    handleToggleStatus(desig)
                                                }
                                                disabled={
                                                    isUpdatingStatusId === desig.id
                                                }
                                                title={`Click to switch status to ${
                                                    desig.status === "active"
                                                        ? "Inactive"
                                                        : "Active"
                                                }`}
                                            >
                                                {isUpdatingStatusId === desig.id ? (
                                                    <Loader2
                                                        size={12}
                                                        className="desig-spinner"
                                                    />
                                                ) : desig.status === "active" ? (
                                                    <CheckCircle2 size={12} />
                                                ) : (
                                                    <Ban size={12} />
                                                )}
                                                <span>
                                                    {desig.status === "active"
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </button>
                                        </td>

                                        {/* Created */}
                                        <td style={{ color: "#64748b", fontSize: "12.5px" }}>
                                            {formatDate(desig.created_at)}
                                        </td>

                                        {/* Actions */}
                                        <td style={{ textAlign: "right" }}>
                                            <button
                                                type="button"
                                                className={`desig-action-button ${
                                                    openMenuId === desig.id
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={(e) =>
                                                    handleMenuToggle(e, desig.id)
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
                {!isLoading && designations.length > 0 && pagination.last_page > 1 && (
                    <div className="designations-pagination">
                        <div className="designations-pagination-info">
                            Showing page {pagination.current_page} of{" "}
                            {pagination.last_page} ({pagination.total} total)
                        </div>
                        <div className="designations-pagination-buttons">
                            <button
                                type="button"
                                className="designations-page-btn"
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                                aria-label="Previous Page"
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
                                    className={`designations-page-btn ${
                                        currentPage === page ? "active" : ""
                                    }`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="designations-page-btn"
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(pagination.last_page, p + 1)
                                    )
                                }
                                disabled={currentPage === pagination.last_page}
                                aria-label="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Context Action Menu */}
            {openMenuId !== null && openMenuDesig && (
                <div
                    ref={actionMenuRef}
                    className="desig-floating-menu"
                    style={{
                        top: `${actionMenuPosition.top}px`,
                        left: `${actionMenuPosition.left}px`,
                    }}
                >
                    <button
                        type="button"
                        className="desig-menu-item"
                        onClick={() => handleViewDetails(openMenuDesig)}
                    >
                        <Eye size={15} />
                        <span>View Details</span>
                    </button>

                    <button
                        type="button"
                        className="desig-menu-item"
                        onClick={() => handleEdit(openMenuDesig)}
                    >
                        <Pencil size={15} />
                        <span>Edit Designation</span>
                    </button>

                    <button
                        type="button"
                        className="desig-menu-item"
                        onClick={() => handleToggleStatus(openMenuDesig)}
                    >
                        {openMenuDesig.status === "active" ? (
                            <>
                                <Ban size={15} />
                                <span>Set Inactive</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={15} />
                                <span>Set Active</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="desig-menu-item danger"
                        onClick={() => handleDelete(openMenuDesig)}
                    >
                        <Trash2 size={15} />
                        <span>Delete</span>
                    </button>
                </div>
            )}
        </div>
    );
}
