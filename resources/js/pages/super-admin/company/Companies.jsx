import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

import {
    Building2,
    Plus,
    Search,
    RotateCcw,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    X,
    Pencil,
    Eye,
    Trash2,
    MapPin,
    Mail,
    Phone,
    Globe2,
    Hash,
    BriefcaseBusiness,
    CalendarDays,
    UserRound,
    ExternalLink,
    CheckCircle2,
    Clock3,
    Ban,
    AlertCircle,
    Loader2,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";

import "./Companies.css";

const PAGE_SIZE = 10;

const formatCompanyPhone = (phone) => {
    if (!phone) {
        return "N/A";
    }

    const digits = String(phone).replace(/\D/g, "");

    if (digits.length === 10) {
        return `+91 ${digits}`;
    }

    if (digits.length === 12 && digits.startsWith("91")) {
        return `+91 ${digits.slice(2)}`;
    }

    return phone;
};

const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
];

const STATUS_CONFIG = {
    active: {
        label: "Active",
        className: "active",
        icon: CheckCircle2,
    },
    pending: {
        label: "Pending",
        className: "pending",
        icon: Clock3,
    },
    inactive: {
        label: "Inactive",
        className: "inactive",
        icon: Ban,
    },
    suspended: {
        label: "Suspended",
        className: "suspended",
        icon: AlertCircle,
    },
};

const Companies = ({ navigateTo }) => {
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [industryFilter, setIndustryFilter] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const selectAllCheckboxRef = useRef(null);

    const [selectedCompany, setSelectedCompany] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    const [openMenuId, setOpenMenuId] = useState(null);
    const [actionMenuPosition, setActionMenuPosition] = useState({
        top: 0,
        left: 0,
    });
    const actionMenuRef = useRef(null);
    const actionMenuTriggerRef = useRef(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openMenuCompany =
        openMenuId === null
            ? null
            : companies.find(
                  (company) => company.id === openMenuId
              ) || null;

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
            maxHeight: Math.max(
                60,
                window.innerHeight - top - 12
            ),
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
            if (
                actionMenuRef.current?.contains(event?.target)
            ) {
                return;
            }

            updateActionMenuPosition();
        };

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        );
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
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
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

    /*
    |--------------------------------------------------------------------------
    | LOAD COMPANIES
    |--------------------------------------------------------------------------
    */

    const loadCompanies = async () => {
        try {
            setIsLoading(true);

            const response = await api.get(
                "/superadmin/companies-details"
            );

            if (response?.data?.success) {
                setCompanies(response?.data?.data || []);
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to load companies."
                );
            }
        } catch (error) {
            console.error("Load companies error:", error);

            if (error?.response?.status === 401) {
                await sweetAlert.error(
                    "Your session has expired. Please login again."
                );

                return;
            }

            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Something went wrong while loading companies."
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | INDUSTRIES
    |--------------------------------------------------------------------------
    */

    const industries = useMemo(() => {
        const values = companies
            .map((company) => company?.industry)
            .filter(Boolean);

        return [...new Set(values)].sort();
    }, [companies]);

    /*
    |--------------------------------------------------------------------------
    | FILTER COMPANIES
    |--------------------------------------------------------------------------
    */

    const filteredCompanies = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return companies.filter((company) => {
            const matchesSearch =
                !searchValue ||
                company?.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                company?.code
                    ?.toLowerCase()
                    .includes(searchValue) ||
                company?.email
                    ?.toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "all" ||
                company?.status === statusFilter;

            const matchesIndustry =
                industryFilter === "all" ||
                company?.industry === industryFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesIndustry
            );
        });
    }, [
        companies,
        search,
        statusFilter,
        industryFilter,
    ]);

    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredCompanies.length / PAGE_SIZE
        )
    );

    const paginatedCompanies = useMemo(() => {
        const start =
            (currentPage - 1) * PAGE_SIZE;

        return filteredCompanies.slice(
            start,
            start + PAGE_SIZE
        );
    }, [
        filteredCompanies,
        currentPage,
    ]);

    const allCurrentPageSelected =
        paginatedCompanies.length > 0 &&
        paginatedCompanies.every((company) =>
            selectedCompanyIds.includes(company.id)
        );

    const someCurrentPageSelected =
        paginatedCompanies.some((company) =>
            selectedCompanyIds.includes(company.id)
        );

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            selectAllCheckboxRef.current.indeterminate =
                someCurrentPageSelected &&
                !allCurrentPageSelected;
        }
    }, [
        allCurrentPageSelected,
        someCurrentPageSelected,
    ]);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedCompanyIds([]);
    }, [
        search,
        statusFilter,
        industryFilter,
    ]);

    useEffect(() => {
        setSelectedCompanyIds([]);
    }, [currentPage]);

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = useMemo(() => {
        return {
            total: companies.length,

            active: companies.filter(
                (company) =>
                    company?.status === "active"
            ).length,

            pending: companies.filter(
                (company) =>
                    company?.status === "pending"
            ).length,

            suspended: companies.filter(
                (company) =>
                    company?.status === "suspended"
            ).length,
        };
    }, [companies]);

    /*
    |--------------------------------------------------------------------------
    | RESET
    |--------------------------------------------------------------------------
    */

    const handleReset = () => {
        setSearch("");
        setStatusFilter("all");
        setIndustryFilter("all");
        setCurrentPage(1);
        setSelectedCompanyIds([]);
    };

    const handleSelectCurrentPage = (event) => {
        const currentPageIds = paginatedCompanies.map(
            (company) => company.id
        );

        if (event.target.checked) {
            setSelectedCompanyIds(currentPageIds);
            return;
        }

        setSelectedCompanyIds((selectedIds) =>
            selectedIds.filter(
                (id) => !currentPageIds.includes(id)
            )
        );
    };

    const handleSelectCompany = (companyId, isSelected) => {
        setSelectedCompanyIds((selectedIds) => {
            if (isSelected) {
                return selectedIds.includes(companyId)
                    ? selectedIds
                    : [...selectedIds, companyId];
            }

            return selectedIds.filter((id) => id !== companyId);
        });
    };

    const handleToggleActionMenu = (companyId, button) => {
        if (openMenuId === companyId) {
            setOpenMenuId(null);
            return;
        }

        actionMenuTriggerRef.current = button;
        updateActionMenuPosition();
        setOpenMenuId(companyId);
    };

    /*
    |--------------------------------------------------------------------------
    | VIEW COMPANY
    |--------------------------------------------------------------------------
    */

    const handleViewCompany = (company) => {
        setSelectedCompany(company);
        setActiveTab("overview");
        setOpenMenuId(null);
    };

    /*
    |--------------------------------------------------------------------------
    | EDIT COMPANY
    |--------------------------------------------------------------------------
    */

    const handleEditCompany = (company) => {
        setOpenMenuId(null);

        if (typeof navigateTo === "function") {
            navigateTo(
                `/companies/${company.id}/edit`
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | DELETE COMPANY
    |--------------------------------------------------------------------------
    */

    const handleDeleteCompany = async (company) => {
        setOpenMenuId(null);

        const result = await sweetAlert.confirm(
            `Are you sure you want to delete ${company.name}?`,
            {
                title: "Delete Company?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!result?.isConfirmed) {
            return;
        }

        try {
            setIsDeleting(true);

            const response = await api.delete(
                `/superadmin/companies-delete/${company.id}`
            );

            if (response?.data?.success) {
                await sweetAlert.success(
                    response?.data?.message ||
                        "Company deleted successfully."
                );

                if (
                    selectedCompany?.id ===
                    company.id
                ) {
                    setSelectedCompany(null);
                }

                setSelectedCompanyIds((selectedIds) =>
                    selectedIds.filter(
                        (id) => id !== company.id
                    )
                );
                setCurrentPage(1);

                await loadCompanies();
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to delete company."
                );
            }
        } catch (error) {
            console.error(
                "Delete company error:",
                error
            );

            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Something went wrong while deleting the company."
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteSelectedCompanies = async () => {
        const selectedCompanies = companies.filter((company) =>
            selectedCompanyIds.includes(company.id)
        );

        if (selectedCompanies.length === 0) {
            return;
        }

        const result = await sweetAlert.confirm(
            `Are you sure you want to delete ${selectedCompanies.length} selected ${
                selectedCompanies.length === 1
                    ? "company"
                    : "companies"
            }?`,
            {
                title: "Delete Selected Companies?",
                confirmText: "Yes, Delete",
                cancelText: "Cancel",
            }
        );

        if (!result?.isConfirmed) {
            return;
        }

        try {
            setIsDeleting(true);

            const deletionResults = await Promise.allSettled(
                selectedCompanies.map((company) =>
                    api.delete(
                        `/superadmin/companies-delete/${company.id}`
                    )
                )
            );

            const deletedCompanies = [];
            const failedCompanies = [];

            deletionResults.forEach((deletionResult, index) => {
                const company = selectedCompanies[index];

                if (
                    deletionResult.status === "fulfilled" &&
                    deletionResult.value?.data?.success
                ) {
                    deletedCompanies.push(company);
                } else {
                    failedCompanies.push({
                        company,
                        error:
                            deletionResult.status === "rejected"
                                ? deletionResult.reason
                                : new Error(
                                      deletionResult.value?.data?.message ||
                                          "Unable to delete company."
                                  ),
                    });
                }
            });

            if (failedCompanies.length > 0) {
                console.error(
                    "Some selected companies could not be deleted:",
                    failedCompanies
                );
            }

            const deletedIds = deletedCompanies.map(
                (company) => company.id
            );

            setSelectedCompanyIds([]);

            if (deletedCompanies.length > 0) {
                setCurrentPage(1);
            }

            if (
                selectedCompany &&
                deletedIds.includes(selectedCompany.id)
            ) {
                setSelectedCompany(null);
            }

            if (deletedCompanies.length > 0) {
                await loadCompanies();
            }

            if (failedCompanies.length === 0) {
                await sweetAlert.success(
                    `${deletedCompanies.length} ${
                        deletedCompanies.length === 1
                            ? "company"
                            : "companies"
                    } deleted successfully.`
                );
            } else {
                const failedCompanyNames = failedCompanies
                    .map(({ company }) => company.name)
                    .join(", ");

                await sweetAlert.error(
                    `${deletedCompanies.length} deleted; ${failedCompanies.length} could not be deleted. Failed: ${failedCompanyNames}.`
                );
            }
        } finally {
            setIsDeleting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    const handleStatusChange = async (
        company,
        status
    ) => {
        setOpenMenuId(null);

        if (company.status === status) {
            return;
        }

        try {
            const response = await api.patch(
                `/superadmin/companies-status/${company.id}`,
                {
                    status,
                }
            );

            if (response?.data?.success) {
                await sweetAlert.success(
                    response?.data?.message ||
                        "Company status updated successfully."
                );

                await loadCompanies();

                if (
                    selectedCompany?.id ===
                    company.id
                ) {
                    setSelectedCompany(
                        response?.data?.data
                    );
                }
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to update company status."
                );
            }
        } catch (error) {
            console.error(
                "Status update error:",
                error
            );

            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to update company status."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | COMPANY LOGO
    |--------------------------------------------------------------------------
    */

    const getLogoUrl = (company) => {
        const logoPath =
            typeof company?.logo_path === "string"
                ? company.logo_path.trim()
                : "";

        if (!logoPath) {
            return null;
        }

        if (/^https?:\/\//i.test(logoPath)) {
            return logoPath;
        }

        if (logoPath.startsWith("/")) {
            return logoPath;
        }

        return `/storage/${logoPath}`;
    };

    /*
    |--------------------------------------------------------------------------
    | STATUS BADGE
    |--------------------------------------------------------------------------
    */

    const renderStatus = (status) => {
        const config =
            STATUS_CONFIG[status] ||
            STATUS_CONFIG.pending;

        const Icon = config.icon;

        return (
            <span
                className={`company-status-badge ${config.className}`}
            >
                <Icon size={12} />
                {config.label}
            </span>
        );
    };

    /*
    |--------------------------------------------------------------------------
    | DATE
    |--------------------------------------------------------------------------
    */

    const formatDate = (date) => {
        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "N/A";
        }

        return parsedDate.toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | COMPANY INITIAL
    |--------------------------------------------------------------------------
    */

    const getInitial = (name) => {
        if (!name) {
            return "C";
        }

        return name
            .trim()
            .charAt(0)
            .toUpperCase();
    };

    /*
    |--------------------------------------------------------------------------
    | NAVIGATION
    |--------------------------------------------------------------------------
    */

    const handleAddCompany = () => {
        if (typeof navigateTo === "function") {
            navigateTo("/companies/create");
        }
    };

    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (
        <div className="companies-page">

            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="companies-page-header">

                <div className="companies-breadcrumb">
                    <button
                        type="button"
                        className="companies-breadcrumb-home"
                        onClick={() => {
                            if (
                                typeof navigateTo ===
                                "function"
                            ) {
                                navigateTo(
                                    "/companies"
                                );
                            }
                        }}
                    >
                        <Building2 size={15} />
                    </button>

                    <span>/</span>

                    <span className="companies-breadcrumb-current">
                        Companies
                    </span>
                </div>

                <div className="companies-header-row">

                    <div className="companies-title-section">
                        <div className="companies-title-icon">
                            <Building2
                                size={28}
                                strokeWidth={2}
                            />
                        </div>

                        <div>
                            <h1>Companies</h1>

                            <p>
                                Manage and oversee all
                                registered companies in
                                the MAXUS system.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="companies-add-button"
                        onClick={
                            handleAddCompany
                        }
                    >
                        <Plus size={17} />
                        <span>
                            Add Company
                        </span>
                    </button>
                </div>
            </div>

            {/* =====================================================
                MAIN CONTAINER
            ===================================================== */}

            <div className="companies-main-container">

                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <div className="companies-summary-grid">

                    <SummaryCard
                        icon={<Building2 size={21} />}
                        label="Total Companies"
                        value={summary.total}
                        className="blue"
                    />

                    <SummaryCard
                        icon={
                            <CheckCircle2
                                size={21}
                            />
                        }
                        label="Active Companies"
                        value={summary.active}
                        className="green"
                    />

                    <SummaryCard
                        icon={
                            <Clock3 size={21} />
                        }
                        label="Pending Companies"
                        value={summary.pending}
                        className="orange"
                    />

                    <SummaryCard
                        icon={
                            <Ban size={21} />
                        }
                        label="Suspended Companies"
                        value={summary.suspended}
                        className="red"
                    />
                </div>

                {/* =================================================
                    TABLE CARD
                ================================================= */}

                <div className="companies-table-card">

                    {/* FILTER BAR */}

                    <div className="companies-filter-bar">

                        <div className="companies-search-wrapper">
                            <Search size={17} />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search by company name, code, email..."
                            />
                        </div>

                        <div className="companies-filter-select">
                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                            >
                                {STATUS_OPTIONS.map(
                                    (status) => (
                                        <option
                                            key={
                                                status.value
                                            }
                                            value={
                                                status.value
                                            }
                                        >
                                            {status.label}
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown
                                size={16}
                            />
                        </div>

                        <div className="companies-filter-select">
                            <select
                                value={
                                    industryFilter
                                }
                                onChange={(event) =>
                                    setIndustryFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="all">
                                    All Industry
                                </option>

                                {industries.map(
                                    (industry) => (
                                        <option
                                            key={
                                                industry
                                            }
                                            value={
                                                industry
                                            }
                                        >
                                            {industry}
                                        </option>
                                    )
                                )}
                            </select>

                            <ChevronDown
                                size={16}
                            />
                        </div>

                        <button
                            type="button"
                            className="companies-reset-button"
                            onClick={
                                handleReset
                            }
                        >
                            <RotateCcw
                                size={16}
                            />
                            <span>
                                Reset
                            </span>
                        </button>

                        {selectedCompanyIds.length > 0 && (
                            <button
                                type="button"
                                className="companies-delete-selected-button"
                                onClick={handleDeleteSelectedCompanies}
                                disabled={isDeleting}
                            >
                                <Trash2 size={16} />
                                <span>
                                    Delete Selected (
                                    {selectedCompanyIds.length})
                                </span>
                            </button>
                        )}
                    </div>

                    {/* TABLE */}

                    <div className="companies-table-scroll">

                        <table className="companies-table">

                            <thead>
                                <tr>
                                    <th className="companies-checkbox-column">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            checked={
                                                allCurrentPageSelected
                                            }
                                            onChange={
                                                handleSelectCurrentPage
                                            }
                                            disabled={
                                                isLoading ||
                                                paginatedCompanies.length ===
                                                    0 ||
                                                isDeleting
                                            }
                                            aria-label="Select all companies on this page"
                                        />
                                    </th>

                                    {/* <th className="companies-number-column">
                                        #
                                    </th> */}

                                    <th>
                                        Logo
                                    </th>

                                    <th>
                                        Company Name
                                    </th>

                                    <th>
                                        Code
                                    </th>

                                    <th>
                                        Industry
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        City
                                    </th>

                                    <th>
                                        Created At
                                    </th>

                                    <th className="companies-actions-column">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="companies-loading-cell"
                                        >
                                            <Loader2
                                                size={22}
                                                className="companies-spinner"
                                            />

                                            <span>
                                                Loading
                                                companies...
                                            </span>
                                        </td>
                                    </tr>
                                ) : paginatedCompanies.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan="10"
                                            className="companies-empty-cell"
                                        >
                                            <div className="companies-empty-state">

                                                <div className="companies-empty-icon">
                                                    <Building2
                                                        size={24}
                                                    />
                                                </div>

                                                <h3>
                                                    No companies
                                                    found
                                                </h3>

                                                <p>
                                                    No companies
                                                    match your
                                                    current
                                                    search or
                                                    filters.
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleReset
                                                    }
                                                >
                                                    Clear Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCompanies.map(
                                        (company) => {
                                            const logo =
                                                getLogoUrl(
                                                    company
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        company.id
                                                    }
                                                    className={
                                                        selectedCompanyIds.includes(
                                                            company.id
                                                        )
                                                            ? "company-row-selected"
                                                            : ""
                                                    }
                                                >
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedCompanyIds.includes(
                                                                    company.id
                                                                )
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                handleSelectCompany(
                                                                    company.id,
                                                                    event
                                                                        .target
                                                                        .checked
                                                                )
                                                            }
                                                            disabled={
                                                                isDeleting
                                                            }
                                                            aria-label={`Select ${company.name}`}
                                                        />
                                                    </td>

                                                    {/* <td className="companies-row-number">
                                                        {(currentPage -
                                                            1) *
                                                            PAGE_SIZE +
                                                            index +
                                                            1}
                                                    </td> */}

                                                    <td>
                                                        <div className="company-table-logo">

                                                            {logo ? (
                                                                <img
                                                                    src={
                                                                        logo
                                                                    }
                                                                    alt={
                                                                        company.name
                                                                    }
                                                                />
                                                            ) : (
                                                                getInitial(
                                                                    company.name
                                                                )
                                                            )}

                                                        </div>
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="company-name-button"
                                                            onClick={() =>
                                                                handleViewCompany(
                                                                    company
                                                                )
                                                            }
                                                        >
                                                            <strong>
                                                                {
                                                                    company.name
                                                                }
                                                            </strong>

                                                            {company.email && (
                                                                <span>
                                                                    {
                                                                        company.email
                                                                    }
                                                                </span>
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td>
                                                        <span className="company-code">
                                                            {
                                                                company.code
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="company-industry">
                                                            {company.industry ||
                                                                "N/A"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {renderStatus(
                                                            company.status
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="company-city">
                                                            {company.city ||
                                                                "N/A"}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span className="company-created-date">
                                                            {formatDate(
                                                                company.created_at
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="company-row-actions">

                                                            <button
                                                                type="button"
                                                                className="company-more-button"
                                                                onClick={(
                                                                    event
                                                                ) =>
                                                                    handleToggleActionMenu(
                                                                        company.id,
                                                                        event.currentTarget
                                                                    )
                                                                }
                                                                aria-label="Company actions"
                                                                aria-haspopup="menu"
                                                                aria-expanded={
                                                                    openMenuId ===
                                                                    company.id
                                                                }
                                                            >
                                                                <MoreVertical
                                                                    size={
                                                                        17
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}

                    {!isLoading &&
                        filteredCompanies.length >
                            0 && (
                            <div className="companies-pagination">

                                <div className="companies-pagination-info">
                                    Showing{" "}
                                    <strong>
                                        {(currentPage -
                                            1) *
                                            PAGE_SIZE +
                                            1}
                                    </strong>{" "}
                                    to{" "}
                                    <strong>
                                        {Math.min(
                                            currentPage *
                                                PAGE_SIZE,
                                            filteredCompanies.length
                                        )}
                                    </strong>{" "}
                                    of{" "}
                                    <strong>
                                        {
                                            filteredCompanies.length
                                        }
                                    </strong>{" "}
                                    companies
                                </div>

                                <div className="companies-pagination-controls">

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage ===
                                            1
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (page) =>
                                                    Math.max(
                                                        1,
                                                        page -
                                                            1
                                                    )
                                                )
                                            }
                                    >
                                        <ChevronLeft
                                            size={16}
                                        />
                                    </button>

                                    {Array.from(
                                        {
                                            length:
                                                totalPages,
                                        },
                                        (
                                            _,
                                            index
                                        ) =>
                                            index + 1
                                    ).map(
                                        (page) => (
                                            <button
                                                key={
                                                    page
                                                }
                                                type="button"
                                                className={
                                                    currentPage ===
                                                    page
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setCurrentPage(
                                                        page
                                                    )
                                                }
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage ===
                                            totalPages
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (page) =>
                                                    Math.min(
                                                        totalPages,
                                                        page +
                                                            1
                                                    )
                                            )
                                        }
                                    >
                                        <ChevronRight
                                            size={16}
                                        />
                                    </button>

                                </div>
                            </div>
                        )}

                </div>
            </div>

            {/* =====================================================
                COMPANY DETAILS DRAWER
            ===================================================== */}

            {selectedCompany && (
                <>

                    <div
                        className="company-drawer-overlay"
                        onClick={() =>
                            setSelectedCompany(
                                null
                            )
                        }
                    />

                    <aside className="company-details-drawer">

                        {/* DRAWER HEADER */}

                        <div className="company-drawer-header">

                            <div>
                                <h2>
                                    Company Details
                                </h2>

                                <p>
                                    View company
                                    information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedCompany(
                                        null
                                    )
                                }
                                className="company-drawer-close"
                                aria-label="Close company details"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* COMPANY IDENTITY */}

                        <div className="company-drawer-company">

                            <div className="company-drawer-logo">

                                {getLogoUrl(
                                    selectedCompany
                                ) ? (
                                    <img
                                        src={getLogoUrl(
                                            selectedCompany
                                        )}
                                        alt={
                                            selectedCompany.name
                                        }
                                    />
                                ) : (
                                    getInitial(
                                        selectedCompany.name
                                    )
                                )}

                            </div>

                            <div className="company-drawer-company-info">

                                <div className="company-drawer-title-row">

                                    <div>
                                        <h3>
                                            {
                                                selectedCompany.name
                                            }
                                        </h3>

                                        <span>
                                            {
                                                selectedCompany.code
                                            }
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="company-drawer-edit"
                                        onClick={() =>
                                            handleEditCompany(
                                                selectedCompany
                                            )
                                        }
                                    >
                                        <Pencil
                                            size={14}
                                        />
                                        Edit
                                    </button>
                                </div>

                                <div className="company-drawer-status">
                                    {renderStatus(
                                        selectedCompany.status
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TABS */}

                        <div className="company-drawer-tabs">

                            <button
                                type="button"
                                className={
                                    activeTab ===
                                    "overview"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "overview"
                                    )
                                }
                            >
                                Overview
                            </button>

                            <button
                                type="button"
                                className={
                                    activeTab ===
                                    "contact"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "contact"
                                    )
                                }
                            >
                                Contact
                            </button>

                            <button
                                type="button"
                                className={
                                    activeTab ===
                                    "location"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "location"
                                    )
                                }
                            >
                                Location
                            </button>

                            <button
                                type="button"
                                className={
                                    activeTab === "more"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "more"
                                    )
                                }
                            >
                                More
                            </button>
                        </div>

                        {/* DRAWER CONTENT */}

                        <div className="company-drawer-content">

                            {activeTab ===
                                "overview" && (
                                <>
                                    <DetailCard
                                        icon={
                                            <Building2
                                                size={18}
                                            />
                                        }
                                        title="Basic Information"
                                    >
                                        <DetailRow
                                            label="Company Name"
                                            value={
                                                selectedCompany.name
                                            }
                                        />

                                        <DetailRow
                                            label="Company Code"
                                            value={
                                                selectedCompany.code
                                            }
                                        />

                                        <DetailRow
                                            label="Industry"
                                            value={
                                                selectedCompany.industry ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="Website"
                                            value={
                                                selectedCompany.website ||
                                                "N/A"
                                            }
                                            link={
                                                selectedCompany.website
                                            }
                                        />

                                        <DetailRow
                                            label="Email"
                                            value={
                                                selectedCompany.email ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="Phone"
                                            value={formatCompanyPhone(
                                                selectedCompany.phone
                                            )}
                                        />

                                        <DetailRow
                                            label="Status"
                                            value={
                                                renderStatus(
                                                    selectedCompany.status
                                                )
                                            }
                                        />

                                        <DetailRow
                                            label="Created By"
                                            value={
                                                selectedCompany
                                                    ?.creator
                                                    ?.name ||
                                                "Super Admin"
                                            }
                                        />

                                        <DetailRow
                                            label="Created At"
                                            value={formatDateTime(
                                                selectedCompany.created_at
                                            )}
                                        />
                                    </DetailCard>

                                    <DetailCard
                                        icon={
                                            <MapPin
                                                size={18}
                                            />
                                        }
                                        title="Address Information"
                                    >
                                        <DetailRow
                                            label="Address"
                                            value={
                                                selectedCompany.address ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="City"
                                            value={
                                                selectedCompany.city ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="State"
                                            value={
                                                selectedCompany.state ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="Country"
                                            value={
                                                selectedCompany.country ||
                                                "N/A"
                                            }
                                        />

                                        <DetailRow
                                            label="Postal Code"
                                            value={
                                                selectedCompany.postal_code ||
                                                "N/A"
                                            }
                                        />
                                    </DetailCard>

                                    <CompanyLogoCard
                                        company={
                                            selectedCompany
                                        }
                                        logoUrl={getLogoUrl(
                                            selectedCompany
                                        )}
                                        getInitial={
                                            getInitial
                                        }
                                    />
                                </>
                            )}

                            {activeTab ===
                                "contact" && (
                                <DetailCard
                                    icon={
                                        <Mail
                                            size={18}
                                        />
                                    }
                                    title="Contact Information"
                                >
                                    <DetailRow
                                        label="Email"
                                        value={
                                            selectedCompany.email ||
                                            "N/A"
                                        }
                                    />

                                    <DetailRow
                                        label="Phone"
                                        value={formatCompanyPhone(
                                            selectedCompany.phone
                                        )}
                                    />

                                    <DetailRow
                                        label="Website"
                                        value={
                                            selectedCompany.website ||
                                            "N/A"
                                        }
                                        link={
                                            selectedCompany.website
                                        }
                                    />
                                </DetailCard>
                            )}

                            {activeTab ===
                                "location" && (
                                <DetailCard
                                    icon={
                                        <MapPin
                                            size={18}
                                        />
                                    }
                                    title="Location Information"
                                >
                                    <DetailRow
                                        label="Address"
                                        value={
                                            selectedCompany.address ||
                                            "N/A"
                                        }
                                    />

                                    <DetailRow
                                        label="City"
                                        value={
                                            selectedCompany.city ||
                                            "N/A"
                                        }
                                    />

                                    <DetailRow
                                        label="State"
                                        value={
                                            selectedCompany.state ||
                                            "N/A"
                                        }
                                    />

                                    <DetailRow
                                        label="Country"
                                        value={
                                            selectedCompany.country ||
                                            "N/A"
                                        }
                                    />

                                    <DetailRow
                                        label="Postal Code"
                                        value={
                                            selectedCompany.postal_code ||
                                            "N/A"
                                        }
                                    />
                                </DetailCard>
                            )}

                            {activeTab ===
                                "more" && (
                                <DetailCard
                                    icon={
                                        <CalendarDays
                                            size={18}
                                        />
                                    }
                                    title="Company Metadata"
                                >
                                    <DetailRow
                                        label="Company ID"
                                        value={
                                            selectedCompany.id
                                        }
                                    />

                                    <DetailRow
                                        label="Created At"
                                        value={formatDateTime(
                                            selectedCompany.created_at
                                        )}
                                    />

                                    <DetailRow
                                        label="Updated At"
                                        value={formatDateTime(
                                            selectedCompany.updated_at
                                        )}
                                    />

                                    <DetailRow
                                        label="Created By"
                                        value={
                                            selectedCompany
                                                ?.creator
                                                ?.name ||
                                            "Super Admin"
                                        }
                                    />
                                </DetailCard>
                            )}

                        </div>
                    </aside>
                </>
            )}

            {openMenuCompany &&
                createPortal(
                    <div
                        ref={actionMenuRef}
                        className="company-action-menu"
                        style={{
                            top: actionMenuPosition.top,
                            left: actionMenuPosition.left,
                            maxHeight: actionMenuPosition.maxHeight,
                        }}
                        role="menu"
                        aria-label={`${openMenuCompany.name} actions`}
                    >
                        <div className="company-action-menu-header">
                            <button
                                type="button"
                                className="company-action-menu-close"
                                onClick={() =>
                                    setOpenMenuId(null)
                                }
                                aria-label="Close company actions"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                                handleViewCompany(openMenuCompany)
                            }
                        >
                            <Eye size={15} />
                            View Details
                        </button>

                        <button
                            type="button"
                            role="menuitem"
                            onClick={() =>
                                handleEditCompany(openMenuCompany)
                            }
                        >
                            <Pencil size={15} />
                            Edit Company
                        </button>

                        <div className="company-menu-divider" />

                        <span className="company-menu-label">
                            Change Status
                        </span>

                        {STATUS_OPTIONS.filter(
                            (item) => item.value !== "all"
                        ).map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                role="menuitem"
                                onClick={() =>
                                    handleStatusChange(
                                        openMenuCompany,
                                        item.value
                                    )
                                }
                            >
                                {item.label}
                            </button>
                        ))}

                        <div className="company-menu-divider" />

                        <button
                            type="button"
                            role="menuitem"
                            className="danger"
                            onClick={() =>
                                handleDeleteCompany(openMenuCompany)
                            }
                        >
                            <Trash2 size={15} />
                            Delete Company
                        </button>
                    </div>,
                    document.body
                )}

            {isDeleting && (
                <div className="companies-action-loading">
                    <Loader2
                        size={20}
                        className="companies-spinner"
                    />
                    <span>
                        Processing...
                    </span>
                </div>
            )}
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| SUMMARY CARD
|--------------------------------------------------------------------------
*/

const SummaryCard = ({
    icon,
    label,
    value,
    className,
}) => {
    return (
        <div
            className={`company-summary-card ${className}`}
        >
            <div className="company-summary-icon">
                {icon}
            </div>

            <div className="company-summary-content">
                <span>{label}</span>
                <strong>{value}</strong>
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| DETAIL CARD
|--------------------------------------------------------------------------
*/

const DetailCard = ({
    icon,
    title,
    children,
}) => {
    return (
        <div className="company-detail-card">

            <div className="company-detail-card-heading">
                <div className="company-detail-card-icon">
                    {icon}
                </div>

                <h3>{title}</h3>
            </div>

            <div className="company-detail-card-body">
                {children}
            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| DETAIL ROW
|--------------------------------------------------------------------------
*/

const DetailRow = ({
    label,
    value,
    link,
}) => {
    return (
        <div className="company-detail-row">

            <span className="company-detail-label">
                {label}
            </span>

            <div className="company-detail-value">

                {link ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="company-detail-link"
                    >
                        {value}
                        <ExternalLink
                            size={13}
                        />
                    </a>
                ) : (
                    value
                )}

            </div>
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| LOGO CARD
|--------------------------------------------------------------------------
*/

const CompanyLogoCard = ({
    company,
    logoUrl,
    getInitial,
}) => {
    return (
        <div className="company-detail-card">

            <div className="company-detail-card-heading">
                <div className="company-detail-card-icon">
                    <Building2 size={18} />
                </div>

                <h3>Company Logo</h3>
            </div>

            <div className="company-logo-detail">

                <div className="company-large-logo">

                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={company.name}
                        />
                    ) : (
                        getInitial(company.name)
                    )}

                </div>

                <div className="company-logo-detail-info">

                    <strong>
                        {company.name}
                    </strong>

                    <span>
                        Company Logo
                    </span>

                    {logoUrl && (
                        <a
                            href={logoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="company-view-logo-button"
                        >
                            View Full Size
                            <ExternalLink
                                size={13}
                            />
                        </a>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Companies;