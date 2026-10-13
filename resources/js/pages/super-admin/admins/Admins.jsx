import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import {
    Ban,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Mail,
    MapPin,
    MoreVertical,
    Pencil,
    Phone,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
    X,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "./Admins.css";

const PAGE_SIZE = 10;

const getInitials = (name) =>
    String(name || "Admin")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

const formatPhone = (phone) => {
    if (!phone) {
        return "Not provided";
    }

    return String(phone).startsWith("+")
        ? phone
        : `+91 ${phone}`;
};

function AdminAvatar({ admin }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [admin.avatar]);

    if (!admin.avatar || hasError) {
        return (
            <span className="admins-avatar" aria-hidden="true">
                {getInitials(admin.name)}
            </span>
        );
    }

    return (
        <img
            className="admins-avatar"
            src={admin.avatar}
            alt={`${admin.name || "Admin"} profile`}
            onError={() => setHasError(true)}
        />
    );
}

export default function Admins({ navigateTo }) {
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [companyFilter, setCompanyFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [busyAdminId, setBusyAdminId] = useState(null);
    const [selectedAdminIds, setSelectedAdminIds] = useState([]);
    const selectAllCheckboxRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({
        top: 0,
        left: 0,
    });
    const actionMenuRef = useRef(null);
    const actionMenuTriggerRef = useRef(null);

    const openMenuAdmin =
        openMenuId === null
            ? null
            : admins.find((admin) => admin.id === openMenuId) || null;

    const updateActionMenuPosition = () => {
        const trigger = actionMenuTriggerRef.current;

        if (!trigger) {
            return;
        }

        const buttonRect = trigger.getBoundingClientRect();

        if (
            buttonRect.bottom < 0 ||
            buttonRect.top > window.innerHeight
        ) {
            setOpenMenuId(null);
            return;
        }

        const menuWidth = 210;
        const top = buttonRect.bottom + 6;
        const left = Math.min(
            Math.max(12, buttonRect.right - menuWidth),
            window.innerWidth - menuWidth - 12
        );

        setActionMenuPosition({
            top,
            left,
            maxHeight: Math.max(60, window.innerHeight - top - 12),
        });
    };

    useEffect(() => {
        if (openMenuId === null) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (
                !actionMenuRef.current?.contains(event.target) &&
                !actionMenuTriggerRef.current?.contains(event.target)
            ) {
                setOpenMenuId(null);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpenMenuId(null);
                actionMenuTriggerRef.current?.focus();
            }
        };

        const repositionMenuOnViewportChange = (event) => {
            if (actionMenuRef.current?.contains(event?.target)) {
                return;
            }

            updateActionMenuPosition();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener(
            "scroll",
            repositionMenuOnViewportChange,
            true
        );
        window.addEventListener(
            "resize",
            repositionMenuOnViewportChange
        );

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener(
                "scroll",
                repositionMenuOnViewportChange,
                true
            );
            window.removeEventListener(
                "resize",
                repositionMenuOnViewportChange
            );
        };
    }, [openMenuId]);

    const loadAdmins = async () => {
        try {
            setIsLoading(true);
            const response = await api.get("/superadmin/admins");

            if (response?.data?.success) {
                setAdmins(
                    Array.isArray(response.data.data)
                        ? response.data.data
                        : []
                );
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to load administrators."
                );
            }
        } catch (error) {
            console.error("Load administrators error:", error);
            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to load administrators. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const companies = useMemo(() => {
        const uniqueCompanies = new Map();

        admins.forEach((admin) => {
            (admin.companies || []).forEach((company) => {
                uniqueCompanies.set(Number(company.id), company);
            });
        });

        return [...uniqueCompanies.values()].sort((first, second) =>
            String(first.name).localeCompare(String(second.name))
        );
    }, [admins]);

    const filteredAdmins = useMemo(() => {
        const query = search.trim().toLowerCase();

        return admins.filter((admin) => {
            const matchesSearch =
                !query ||
                [admin.name, admin.email, admin.phone, admin.location]
                    .some((value) =>
                        String(value || "")
                            .toLowerCase()
                            .includes(query)
                    );
            const matchesStatus =
                statusFilter === "all" ||
                admin.status === statusFilter;
            const matchesCompany =
                companyFilter === "all" ||
                (admin.companies || []).some(
                    (company) =>
                        Number(company.id) === Number(companyFilter)
                );

            return matchesSearch && matchesStatus && matchesCompany;
        });
    }, [admins, search, statusFilter, companyFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredAdmins.length / PAGE_SIZE)
    );
    const paginatedAdmins = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;

        return filteredAdmins.slice(start, start + PAGE_SIZE);
    }, [filteredAdmins, currentPage]);

    const allCurrentPageSelected =
        paginatedAdmins.length > 0 &&
        paginatedAdmins.every((admin) =>
            selectedAdminIds.includes(admin.id)
        );
    const someCurrentPageSelected = paginatedAdmins.some((admin) =>
        selectedAdminIds.includes(admin.id)
    );

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate =
                someCurrentPageSelected && !allCurrentPageSelected;
        }
    }, [allCurrentPageSelected, someCurrentPageSelected]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedAdminIds([]);
    }, [search, statusFilter, companyFilter]);

    useEffect(() => {
        setSelectedAdminIds([]);
    }, [currentPage]);

    const summary = useMemo(
        () => ({
            total: admins.length,
            active: admins.filter((admin) => admin.status === "active").length,
            inactive: admins.filter((admin) => admin.status === "inactive").length,
            assigned: admins.filter(
                (admin) => (admin.companies || []).length > 0
            ).length,
        }),
        [admins]
    );

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setCompanyFilter("all");
    };

    const handleSelectCurrentPage = (event) => {
        const currentPageIds = paginatedAdmins.map((admin) => admin.id);

        if (event.target.checked) {
            setSelectedAdminIds((selectedIds) => [
                ...new Set([...selectedIds, ...currentPageIds]),
            ]);
            return;
        }

        setSelectedAdminIds((selectedIds) =>
            selectedIds.filter((id) => !currentPageIds.includes(id))
        );
    };

    const handleSelectAdmin = (adminId, isSelected) => {
        setSelectedAdminIds((selectedIds) => {
            if (isSelected) {
                return selectedIds.includes(adminId)
                    ? selectedIds
                    : [...selectedIds, adminId];
            }

            return selectedIds.filter((id) => id !== adminId);
        });
    };

    const handleToggleActionMenu = (adminId, button) => {
        if (openMenuId === adminId) {
            setOpenMenuId(null);
            return;
        }

        actionMenuTriggerRef.current = button;
        updateActionMenuPosition();
        setOpenMenuId(adminId);
    };

    const handleEdit = (admin) => {
        setOpenMenuId(null);
        navigateTo?.(`/administrators/${admin.id}/edit`);
    };

    const handleStatusToggle = async (admin) => {
        setOpenMenuId(null);
        const status = admin.status === "active" ? "inactive" : "active";
        const confirmation = await sweetAlert.confirm(
            `Change ${admin.name}'s status to ${status}? A status email will be sent to ${admin.email}.`,
            {
                title: "Change Administrator Status?",
                confirmText: `Set ${status === "active" ? "Active" : "Inactive"}`,
                cancelText: "Cancel",
            }
        );

        if (!confirmation?.isConfirmed) {
            return;
        }

        try {
            setBusyAdminId(admin.id);
            const response = await api.patch(
                `/superadmin/admins-status/${admin.id}/status`,
                { status }
            );

            if (!response?.data?.success) {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to update administrator status."
                );
                return;
            }

            setAdmins((previous) =>
                previous.map((item) =>
                    item.id === admin.id
                        ? { ...item, ...response.data.data }
                        : item
                )
            );
            await sweetAlert.success(response.data.message);
        } catch (error) {
            console.error("Update administrator status error:", error);
            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to update administrator status."
            );
        } finally {
            setBusyAdminId(null);
        }
    };

    const handleSendInvitation = async (admin) => {
        setOpenMenuId(null);
        const confirmation = await sweetAlert.confirm(
            `Send an activation invitation to ${admin.email}? They will set their own password using the link.`,
            {
                title: admin.has_pending_invitation
                    ? "Resend Activation Invitation?"
                    : "Send Activation Invitation?",
                confirmText: admin.has_pending_invitation
                    ? "Resend Invitation"
                    : "Send Invitation",
                cancelText: "Cancel",
            }
        );

        if (!confirmation?.isConfirmed) {
            return;
        }

        try {
            setBusyAdminId(admin.id);
            const response = await api.post(
                `/superadmin/admins/${admin.id}/invitation`
            );

            if (!response?.data?.success) {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to queue the activation invitation."
                );
                return;
            }

            setAdmins((previous) =>
                previous.map((item) =>
                    item.id === admin.id
                        ? { ...item, ...response.data.data }
                        : item
                )
            );
            await sweetAlert.success(response.data.message);
        } catch (error) {
            console.error("Send admin activation invitation error:", error);
            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to queue the activation invitation."
            );
        } finally {
            setBusyAdminId(null);
        }
    };

    const handleDelete = async (admin) => {
        setOpenMenuId(null);
        const result = await sweetAlert.confirm(
            `Are you sure you want to delete ${admin.name}?`,
            {
                title: "Delete Administrator?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!result?.isConfirmed) {
            return;
        }

        try {
            setBusyAdminId(admin.id);
            const response = await api.delete(
                `/superadmin/admins-destroy/${admin.id}`
            );

            if (!response?.data?.success) {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to delete administrator."
                );
                return;
            }

            setAdmins((previous) =>
                previous.filter((item) => item.id !== admin.id)
            );
            setSelectedAdminIds((selectedIds) =>
                selectedIds.filter((id) => id !== admin.id)
            );
            if (selectedAdmin?.id === admin.id) {
                setSelectedAdmin(null);
            }
            await sweetAlert.success(
                response.data.message ||
                    "Administrator deleted successfully."
            );
        } catch (error) {
            console.error("Delete administrator error:", error);
            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to delete administrator."
            );
        } finally {
            setBusyAdminId(null);
        }
    };

    const handleDeleteSelected = async () => {
        const selectedAdmins = admins.filter((admin) =>
            selectedAdminIds.includes(admin.id)
        );

        if (selectedAdmins.length === 0) {
            return;
        }

        const result = await sweetAlert.confirm(
            `Are you sure you want to delete ${selectedAdmins.length} selected ${
                selectedAdmins.length === 1
                    ? "administrator"
                    : "administrators"
            }?`,
            {
                title: "Delete Selected Administrators?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!result?.isConfirmed) {
            return;
        }

        setBusyAdminId("bulk");

        try {
            const deletionResults = await Promise.allSettled(
                selectedAdmins.map((admin) =>
                    api.delete(`/superadmin/admins-destroy/${admin.id}`)
                )
            );
            const deletedAdmins = [];
            const failedAdmins = [];

            deletionResults.forEach((deletionResult, index) => {
                const admin = selectedAdmins[index];

                if (
                    deletionResult.status === "fulfilled" &&
                    deletionResult.value?.data?.success
                ) {
                    deletedAdmins.push(admin);
                } else {
                    failedAdmins.push(admin);
                }
            });

            if (failedAdmins.length > 0) {
                console.error(
                    "Some selected administrators could not be deleted:",
                    failedAdmins
                );
            }

            const deletedIds = deletedAdmins.map((admin) => admin.id);
            setSelectedAdminIds([]);

            if (deletedIds.length > 0) {
                setAdmins((previous) =>
                    previous.filter((admin) => !deletedIds.includes(admin.id))
                );

                if (
                    selectedAdmin &&
                    deletedIds.includes(selectedAdmin.id)
                ) {
                    setSelectedAdmin(null);
                }
            }

            if (failedAdmins.length === 0) {
                await sweetAlert.success(
                    `${deletedAdmins.length} ${
                        deletedAdmins.length === 1
                            ? "administrator"
                            : "administrators"
                    } deleted successfully.`
                );
            } else {
                await sweetAlert.error(
                    `${deletedAdmins.length} deleted; ${failedAdmins.length} could not be deleted. Failed: ${failedAdmins
                        .map((admin) => admin.name)
                        .join(", ")}.`
                );
            }
        } finally {
            setBusyAdminId(null);
        }
    };

    return (
        <div className="admins-page">
            <header className="admins-page-header">
                <div className="admins-breadcrumb">
                    <button
                        type="button"
                        onClick={() => navigateTo?.("/dashboard")}
                        aria-label="Go to dashboard"
                    >
                        <Building2 size={15} />
                    </button>
                    <span>/</span>
                    <span className="admins-breadcrumb-current">
                        Administrators
                    </span>
                </div>

                <div className="admins-header-row">
                    <div className="admins-heading">
                        <div className="admins-heading-icon">
                            <Users size={27} />
                        </div>
                        <div>
                            <h1>Administrators</h1>
                            <p>
                                Manage administrator accounts and their
                                company access.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="admins-add-button"
                        onClick={() => navigateTo?.("/administrators/create")}
                        aria-label="Add administrator"
                    >
                        <Plus size={17} />
                        <span>Add Administrator</span>
                    </button>
                </div>
            </header>

            <main className="admins-main-container">
                <div className="admins-summary-grid">
                    <SummaryCard
                        icon={<Users size={20} />}
                        label="Total Administrators"
                        value={summary.total}
                        tone="blue"
                    />
                    <SummaryCard
                        icon={<CheckCircle2 size={20} />}
                        label="Active"
                        value={summary.active}
                        tone="green"
                    />
                    <SummaryCard
                        icon={<Ban size={20} />}
                        label="Inactive"
                        value={summary.inactive}
                        tone="red"
                    />
                    <SummaryCard
                        icon={<Building2 size={20} />}
                        label="With Company Access"
                        value={summary.assigned}
                        tone="orange"
                    />
                </div>

                <section className="admins-table-card">
                    <div className="admins-filter-bar">
                        <label className="admins-search">
                            <Search size={17} />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search name, email, phone, location..."
                                aria-label="Search administrators"
                            />
                        </label>

                        <label className="admins-filter-select">
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                aria-label="Filter by status"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <ChevronDown size={16} />
                        </label>

                        <label className="admins-filter-select">
                            <select
                                value={companyFilter}
                                onChange={(event) =>
                                    setCompanyFilter(event.target.value)
                                }
                                aria-label="Filter by company"
                            >
                                <option value="all">All Companies</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} />
                        </label>

                        <button
                            type="button"
                            className="admins-reset-button"
                            onClick={resetFilters}
                        >
                            <RotateCcw size={15} />
                            Reset
                        </button>

                        {selectedAdminIds.length > 0 && (
                            <button
                                type="button"
                                className="admins-delete-selected-button"
                                onClick={handleDeleteSelected}
                                disabled={busyAdminId !== null}
                            >
                                <Trash2 size={16} />
                                <span>
                                    Delete Selected (
                                    {selectedAdminIds.length})
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="admins-table-scroll">
                        <table className="admins-table">
                            <thead>
                                <tr>
                                    <th className="admins-checkbox-column">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            checked={allCurrentPageSelected}
                                            onChange={handleSelectCurrentPage}
                                            disabled={
                                                isLoading ||
                                                paginatedAdmins.length === 0 ||
                                                busyAdminId !== null
                                            }
                                            aria-label="Select all administrators on this page"
                                        />
                                    </th>
                                    <th>Administrator</th>
                                    <th>Contact</th>
                                    <th>Company Access</th>
                                    <th>Status</th>
                                    <th className="admins-actions-heading">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="admins-empty-cell"
                                        >
                                            <span className="admins-loader" />
                                            Loading administrators...
                                        </td>
                                    </tr>
                                ) : paginatedAdmins.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="admins-empty-cell"
                                        >
                                            <Users size={23} />
                                            <strong>
                                                {admins.length === 0
                                                    ? "No administrators yet"
                                                    : "No matching administrators"}
                                            </strong>
                                            <span>
                                                {admins.length === 0
                                                    ? "Add an administrator to get started."
                                                    : "Try adjusting your filters or search."}
                                            </span>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAdmins.map((admin) => (
                                        <tr
                                            key={admin.id}
                                            className={
                                                selectedAdminIds.includes(
                                                    admin.id
                                                )
                                                    ? "admin-row-selected"
                                                    : ""
                                            }
                                        >
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAdminIds.includes(
                                                        admin.id
                                                    )}
                                                    onChange={(event) =>
                                                        handleSelectAdmin(
                                                            admin.id,
                                                            event.target.checked
                                                        )
                                                    }
                                                    disabled={
                                                        busyAdminId !== null
                                                    }
                                                    aria-label={`Select ${admin.name}`}
                                                />
                                            </td>
                                            <td>
                                                <div className="admins-identity">
                                                    <AdminAvatar admin={admin} />
                                                    <span className="admins-identity-copy">
                                                        <strong>{admin.name}</strong>
                                                        <small>
                                                            Admin ID: {admin.id}
                                                        </small>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admins-contact">
                                                    <span>
                                                        <Mail size={14} />
                                                        {admin.email}
                                                    </span>
                                                    <span>
                                                        <Phone size={14} />
                                                        {formatPhone(admin.phone)}
                                                    </span>
                                                    {admin.location && (
                                                        <span>
                                                            <MapPin size={14} />
                                                            {admin.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="admins-company-list">
                                                    {(admin.companies || [])
                                                        .slice(0, 2)
                                                        .map((company) => (
                                                            <span
                                                                className="admins-company-chip"
                                                                key={company.id}
                                                                title={company.name}
                                                            >
                                                                {company.name}
                                                                {company.pivot?.is_default && (
                                                                    <small>Default</small>
                                                                )}
                                                            </span>
                                                        ))}
                                                    {(admin.companies || []).length > 2 && (
                                                        <span className="admins-company-more">
                                                            +{admin.companies.length - 2}
                                                        </span>
                                                    )}
                                                    {(!admin.companies ||
                                                        admin.companies.length === 0) && (
                                                        <span className="admins-no-access">
                                                            No companies assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`admins-status ${
                                                        admin.status === "active"
                                                            ? "is-active"
                                                            : "is-inactive"
                                                    }`}
                                                >
                                                    <span />
                                                    {admin.status === "active"
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="admins-action-menu-trigger"
                                                    onClick={(event) =>
                                                        handleToggleActionMenu(
                                                            admin.id,
                                                            event.currentTarget
                                                        )
                                                    }
                                                    disabled={
                                                        busyAdminId !== null
                                                    }
                                                    aria-label={`${admin.name} actions`}
                                                    aria-haspopup="menu"
                                                    aria-expanded={
                                                        openMenuId === admin.id
                                                    }
                                                >
                                                    <MoreVertical size={18} />
                                                </button>


                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isLoading && filteredAdmins.length > 0 && (
                        <footer className="admins-pagination">
                            <span>
                                Showing{" "}
                                <strong>
                                    {(currentPage - 1) * PAGE_SIZE + 1}-
                                    {Math.min(
                                        currentPage * PAGE_SIZE,
                                        filteredAdmins.length
                                    )}
                                </strong>{" "}
                                of <strong>{filteredAdmins.length}</strong>{" "}
                                administrators
                            </span>
                            <div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.max(1, page - 1)
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={17} />
                                </button>
                                <span>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.min(totalPages, page + 1)
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={17} />
                                </button>
                            </div>
                        </footer>
                    )}
                </section>
            </main>

            {openMenuAdmin &&
                createPortal(
                    <div
                        ref={actionMenuRef}
                        className="admins-action-menu"
                        style={{
                            top: actionMenuPosition.top,
                            left: actionMenuPosition.left,
                            maxHeight: actionMenuPosition.maxHeight,
                        }}
                        role="menu"
                        aria-label={`${openMenuAdmin.name} actions`}
                    >
                        <div className="admins-action-menu-header">
                            <button
                                type="button"
                                className="admins-action-menu-close"
                                onClick={() => setOpenMenuId(null)}
                                aria-label="Close administrator actions"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setSelectedAdmin(openMenuAdmin);
                                setOpenMenuId(null);
                            }}
                        >
                            <Eye size={15} />
                            View Details
                        </button>
                        
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleEdit(openMenuAdmin)}
                        >
                            <Pencil size={15} />
                            Edit Administrator
                        </button>

                        {!openMenuAdmin.has_accepted_invitation &&
                            (openMenuAdmin.status === "active" ||
                                !openMenuAdmin.has_revoked_invitation) && (
                                <>
                                    <div className="admins-menu-divider" />
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={() =>
                                            handleSendInvitation(openMenuAdmin)
                                        }
                                    >
                                        <Mail size={15} />
                                        {openMenuAdmin.has_pending_invitation
                                            ? "Resend Activation Invitation"
                                            : "Send Activation Invitation"}
                                    </button>
                                </>
                            )}

                        <div className="admins-menu-divider" />
                        <span className="admins-menu-label">
                            Change Status
                        </span>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                                handleStatusToggle(openMenuAdmin)
                            }
                        >
                            {openMenuAdmin.status === "active" ? (
                                <Ban size={15} />
                            ) : (
                                <CheckCircle2 size={15} />
                            )}
                            {openMenuAdmin.status === "active"
                                ? "Set Inactive"
                                : "Set Active"}
                        </button>
                        <div className="admins-menu-divider" />
                        <button
                            type="button"
                            role="menuitem"
                            className="danger"
                            onClick={() => handleDelete(openMenuAdmin)}
                        >
                            <Trash2 size={15} />
                            Delete Administrator
                        </button>
                    </div>,
                    document.body
                )}

            {selectedAdmin && (
                <div
                    className="admins-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedAdmin(null);
                        }
                    }}
                >
                    <section
                        className="admins-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-details-title"
                    >
                        <header>
                            <div className="admins-modal-person">
                                <AdminAvatar admin={selectedAdmin} />
                                <div>
                                    <h2 id="admin-details-title">
                                        {selectedAdmin.name}
                                    </h2>
                                    <span>Administrator details</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAdmin(null)}
                                aria-label="Close details"
                            >
                                <X size={19} />
                            </button>
                        </header>

                        <div className="admins-details-grid">
                            <Detail icon={<Mail size={17} />} label="Email">
                                {selectedAdmin.email}
                            </Detail>
                            <Detail icon={<Phone size={17} />} label="Phone">
                                {formatPhone(selectedAdmin.phone)}
                            </Detail>
                            <Detail icon={<MapPin size={17} />} label="Location">
                                {selectedAdmin.location || "Not provided"}
                            </Detail>
                            <Detail
                                icon={<ShieldCheck size={17} />}
                                label="Account status"
                            >
                                {selectedAdmin.status === "active"
                                    ? "Active"
                                    : "Inactive"}
                            </Detail>
                        </div>

                        <div className="admins-modal-companies">
                            <h3>
                                <Building2 size={17} />
                                Company access
                            </h3>
                            {(selectedAdmin.companies || []).length > 0 ? (
                                <ul>
                                    {selectedAdmin.companies.map((company) => (
                                        <li key={company.id}>
                                            <span>
                                                <strong>{company.name}</strong>
                                                <small>
                                                    {company.code || "Company"}
                                                </small>
                                            </span>
                                            {company.pivot?.is_default && (
                                                <em>Default</em>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No companies are assigned to this admin.</p>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon, label, value, tone }) {
    return (
        <article className={`admins-summary-card ${tone}`}>
            <span className="admins-summary-icon">{icon}</span>
            <span className="admins-summary-content">
                <small>{label}</small>
                <strong>{value}</strong>
            </span>
        </article>
    );
}

function Detail({ icon, label, children }) {
    return (
        <div className="admins-detail">
            <span>{icon}</span>
            <div>
                <small>{label}</small>
                <strong>{children}</strong>
            </div>
        </div>
    );
}
