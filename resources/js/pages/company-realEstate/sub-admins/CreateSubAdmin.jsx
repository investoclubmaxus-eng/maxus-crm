import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ArrowLeft,
    Building2,
    Camera,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleUserRound,
    GitBranch,
    Info,
    Mail,
    MapPin,
    Phone,
    Save,
    Search,
    ShieldCheck,
    UserRound,
    Users,
    X,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import "../../super-admin/admins/CreateAdmin.css";
import "./CreateSubAdmin.css";

const STORAGE_KEY = "company_subadmins_data";

export const getStoredSubAdmins = (companyId = null) => {
    try {
        const key = companyId ? `${STORAGE_KEY}_${companyId}` : STORAGE_KEY;
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return [];
};

export const saveStoredSubAdmins = (list, companyId = null) => {
    try {
        const key = companyId ? `${STORAGE_KEY}_${companyId}` : STORAGE_KEY;
        localStorage.setItem(key, JSON.stringify(list));
    } catch {
        // ignore
    }
};

const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    location: "",
    status: "active",
};

const normalizePhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.slice(0, 10);
};

const getInitials = (name) =>
    String(name || "SA")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

function SubAdminAvatar({ name, avatar, className }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [avatar]);

    if (!avatar || hasError) {
        return (
            <span className={className} aria-label={`${name || "Sub Admin"} initials`}>
                {getInitials(name)}
            </span>
        );
    }

    return (
        <img
            className={className}
            src={avatar}
            alt={`${name || "Sub Admin"} profile`}
            onError={() => setHasError(true)}
        />
    );
}

export default function CreateSubAdmin({
    navigateTo,
    onBack,
    subAdminId,
    mode = "create",
    company,
}) {
    const isEditing = mode === "edit" && Boolean(subAdminId);

    const activeCompany = company || (() => {
        try {
            const raw = localStorage.getItem("active_company") || sessionStorage.getItem("active_company");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const [form, setForm] = useState(INITIAL_FORM);
    const [branches, setBranches] = useState([]);
    const [selectedBranchIds, setSelectedBranchIds] = useState([]);
    const [defaultBranchId, setDefaultBranchId] = useState("");
    const [branchAccessStatus, setBranchAccessStatus] = useState("active");
    const [branchSearch, setBranchSearch] = useState("");
    const [branchesLoading, setBranchesLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [avatar, setAvatar] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const avatarInputRef = useRef(null);

   

    // Load available branches for company
    // (exclude branches already assigned to OTHER sub-admins)
    useEffect(() => {
        let isMounted = true;

        const loadBranches = async () => {
            try {
                setBranchesLoading(true);

                const headers = {};
                if (activeCompany?.id) {
                    headers["X-Company-Id"] = String(activeCompany.id);
                }

                // 1) Load all branches
                // 2) Load existing sub-admins (to know which branches are taken)
                const [branchesRes, subAdminsRes] = await Promise.all([
                    api.get("/company/branches", {
                        headers,
                        params: { per_page: 100 },
                    }),
                    api.get("/company/sub-admins", {
                        headers,
                        params: { per_page: 200 },
                    }).catch(() => null), // if endpoint fails, still show all active branches
                ]);

                if (!isMounted) return;

                // Collect branch IDs already assigned to OTHER sub-admins
                const takenBranchIds = new Set();
                const subAdminsList =
                    subAdminsRes?.data?.success && Array.isArray(subAdminsRes.data.data)
                        ? subAdminsRes.data.data
                        : [];

                subAdminsList.forEach((sa) => {
                    // When editing, keep this sub-admin's own branches available
                    if (isEditing && Number(sa.id) === Number(subAdminId)) {
                        return;
                    }

                    const ids = Array.isArray(sa.branch_ids)
                        ? sa.branch_ids
                        : Array.isArray(sa.assigned_branches)
                        ? sa.assigned_branches.map((b) => b.id)
                        : [];

                    ids.forEach((id) => {
                        if (id != null) takenBranchIds.add(Number(id));
                    });
                });

                // Only active + not taken by another sub-admin
                if (branchesRes?.data?.success && Array.isArray(branchesRes.data.data)) {
                    const available = branchesRes.data.data.filter((branch) => {
                        const isActive = branch.status === "active"; // change if you use is_active
                        const isTaken = takenBranchIds.has(Number(branch.id));
                        return isActive && !isTaken;
                    });
                    setBranches(available);
                } else {
                    setBranches([]);
                }
            } catch (error) {
                console.error("Load branches error:", error);
                if (isMounted) setBranches([]);
            } finally {
                if (isMounted) setBranchesLoading(false);
            }
        };

        loadBranches();

        return () => {
            isMounted = false;
        };
    }, [activeCompany?.id, isEditing, subAdminId]);
    // Load existing sub-admin if editing
    useEffect(() => {
        if (!isEditing || !subAdminId) return;

        let isMounted = true;
        const loadSubAdminDetails = async () => {
            try {
                const headers = {};
                if (activeCompany?.id) {
                    headers["X-Company-Id"] = String(activeCompany.id);
                }

                const response = await api.get(`/company/sub-admins-show/${subAdminId}`, { headers });
                if (!isMounted) return;

                if (response.data?.success && response.data?.data) {
                    const subAdmin = response.data.data;
                    setForm({
                        name: subAdmin.name || "",
                        email: subAdmin.email || "",
                        phone: normalizePhoneNumber(subAdmin.phone),
                        location: subAdmin.location || "",
                        status: subAdmin.status || "active",
                    });
                    setAvatar(subAdmin.avatar || "");
                    const assignedIds = Array.isArray(subAdmin.branch_ids) ? subAdmin.branch_ids.map(Number) : [];
                    setSelectedBranchIds(assignedIds);
                    setDefaultBranchId(
                        subAdmin.primary_branch_id
                            ? String(subAdmin.primary_branch_id)
                            : String(assignedIds[0] || "")
                    );
                    setBranchAccessStatus(subAdmin.branch_access_status || "active");
                } else {
                    sweetAlert.error("Sub-administrator details not found.");
                    if (typeof onBack === "function") {
                        onBack();
                    } else if (typeof navigateTo === "function") {
                        navigateTo("/company/sub-admins");
                    }
                }
            } catch (error) {
                console.error("Failed to load sub-admin details:", error);
                if (isMounted) {
                    sweetAlert.error("Failed to load sub-administrator details.");
                    if (typeof onBack === "function") {
                        onBack();
                    } else if (typeof navigateTo === "function") {
                        navigateTo("/company/sub-admins");
                    }
                }
            }
        };

        loadSubAdminDetails();

        return () => {
            isMounted = false;
        };
    }, [isEditing, subAdminId, activeCompany?.id]);

    const filteredBranches = useMemo(() => {
        const query = branchSearch.trim().toLowerCase();
        if (!query) return branches;

        return branches.filter((branch) =>
            [branch.name, branch.code, branch.city, branch.state].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(query)
            )
        );
    }, [branches, branchSearch]);

    const selectedBranches = useMemo(
        () => branches.filter((branch) => selectedBranchIds.includes(Number(branch.id))),
        [branches, selectedBranchIds]
    );

    const allVisibleBranchesSelected =
        filteredBranches.length > 0 &&
        filteredBranches.every((branch) => selectedBranchIds.includes(Number(branch.id)));

    const validationMessages = useMemo(
        () => [...new Set(Object.values(errors).filter(Boolean))],
        [errors]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handlePhoneChange = (event) => {
        const phone = event.target.value.replace(/\D/g, "").slice(0, 10);
        setForm((prev) => ({ ...prev, phone }));
        if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: undefined }));
        }
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setErrors((prev) => ({ ...prev, avatar: "Image size must be less than 2MB." }));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
            setErrors((prev) => ({ ...prev, avatar: undefined }));
        };
        reader.readAsDataURL(file);
    };

    const toggleBranch = (branchId) => {
        const id = Number(branchId);

        setSelectedBranchIds((prev) => {
            const alreadySelected = prev.includes(id);
            if (alreadySelected) {
                const next = prev.filter((item) => item !== id);
                setDefaultBranchId((currentDefault) =>
                    Number(currentDefault) === id ? String(next[0] || "") : currentDefault
                );
                return next;
            } else {
                const next = [...prev, id];
                if (next.length === 1) {
                    setDefaultBranchId(String(id));
                }
                return next;
            }
        });

        setErrors((prev) => ({
            ...prev,
            branches: undefined,
            defaultBranch: undefined,
        }));
    };

    const handleSelectAllVisible = () => {
        const visibleIds = filteredBranches.map((b) => Number(b.id));

        if (allVisibleBranchesSelected) {
            const next = selectedBranchIds.filter((id) => !visibleIds.includes(id));
            setSelectedBranchIds(next);
            if (!next.includes(Number(defaultBranchId))) {
                setDefaultBranchId(String(next[0] || ""));
            }
        } else {
            const next = Array.from(new Set([...selectedBranchIds, ...visibleIds]));
            setSelectedBranchIds(next);
            if (!defaultBranchId && next.length > 0) {
                setDefaultBranchId(String(next[0]));
            }
        }

        setErrors((prev) => ({
            ...prev,
            branches: undefined,
        }));
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = "Full name is required.";
        }
        if (!form.email.trim()) {
            nextErrors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            nextErrors.email = "Please enter a valid email address.";
        }
        if (form.phone && form.phone.length !== 10) {
            nextErrors.phone = "Phone number must be exactly 10 digits.";
        }
        if (selectedBranchIds.length === 0) {
            nextErrors.branches = "Please assign at least one branch to this sub-admin.";
        }
        if (selectedBranchIds.length > 0 && !defaultBranchId) {
            nextErrors.defaultBranch = "Please choose a primary branch.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) {
            sweetAlert.error("Please resolve form validation issues before submitting.");
            return;
        }

        setSubmitting(true);
        try {
            const headers = {};
            if (activeCompany?.id) {
                headers["X-Company-Id"] = String(activeCompany.id);
            }

            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone ? form.phone : null,
                location: form.location.trim() || null,
                status: form.status,
                branch_ids: selectedBranchIds,
                default_branch_id: Number(defaultBranchId),
                branch_access_status: branchAccessStatus,
                avatar: avatarPreview || avatar || null,
                company_id: activeCompany?.id ? Number(activeCompany.id) : undefined,
            };

            let response;
            if (isEditing) {
                response = await api.put(`/company/sub-admins-update/${subAdminId}`, payload, { headers });
            } else {
                response = await api.post("/company/sub-admins-store", payload, { headers });
            }

            if (response.data?.success) {
                await sweetAlert.success(
                    response.data.message ||
                    (isEditing ? "Sub Administrator updated successfully." : "Sub Administrator created successfully.")
                );

                if (typeof onBack === "function") {
                    onBack();
                } else if (typeof navigateTo === "function") {
                    navigateTo("/company/sub-admins");
                }
            } else {
                sweetAlert.error(response.data?.message || "Failed to save sub administrator.");
            }
        } catch (error) {
            console.error("Save sub admin error:", error);
            if (error.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                const formatted = {};
                Object.keys(apiErrors).forEach((key) => {
                    const firstMsg = Array.isArray(apiErrors[key]) ? apiErrors[key][0] : apiErrors[key];
                    if (key.includes("branches")) {
                        formatted.branches = firstMsg;
                    } else if (key.includes("default_branch")) {
                        formatted.defaultBranch = firstMsg;
                    } else {
                        formatted[key] = firstMsg;
                    }
                });
                setErrors((prev) => ({ ...prev, ...formatted }));
                sweetAlert.error(Object.values(formatted)[0] || "Validation failed.");
            } else {
                sweetAlert.error(error.response?.data?.message || "Failed to save sub administrator.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackClick = () => {
        if (typeof onBack === "function") {
            onBack();
        } else if (typeof navigateTo === "function") {
            navigateTo("/company/sub-admins");
        } else {
            window.history.back();
        }
    };

    return (
        <div className="admin-create-page">
            {/* Breadcrumb */}
            <div className="admin-create-breadcrumb">
                <button
                    type="button"
                    onClick={() => (navigateTo ? navigateTo("/company/dashboard") : window.history.back())}
                    aria-label="Dashboard"
                >
                    <Building2 size={15} />
                </button>
                <span className="admin-create-breadcrumb-slash">/</span>
                <button
                    type="button"
                    onClick={handleBackClick}
                    style={{ width: "auto", padding: "0 4px" }}
                >
                    Sub Admins
                </button>
                <span className="admin-create-breadcrumb-slash">/</span>
                <span className="admin-create-breadcrumb-current">
                    {isEditing ? "Edit Sub Admin" : "Create Sub Admin"}
                </span>
            </div>

            {/* Page Header */}
            <div className="admin-create-page-header">
                <div className="admin-create-heading">
                    <div className="admin-create-heading-icon">
                        <Users size={32} />
                    </div>

                    <div>
                        <h1>{isEditing ? "Edit Sub Admin" : "Add New Sub Admin"}</h1>
                        <p>
                            {isEditing
                                ? "Update sub-administrator details and assigned branch access."
                                : `Add a sub-administrator and assign access to branches in ${activeCompany?.name || "your company"}.`}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="admin-create-back-button"
                    onClick={handleBackClick}
                >
                    <ArrowLeft size={17} />
                    <span>Back to Sub Admins</span>
                </button>
            </div>

            {/* Form Container */}
            <div className="admin-create-outer-container">
                <form className="admin-create-form" onSubmit={handleSubmit} noValidate>
                    <div className="admin-create-content">
                        <div className="admin-create-form-column">
                            {/* Personal Information */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <CircleUserRound size={22} />
                                    </div>

                                    <div>
                                        <h2>Personal Information</h2>
                                        <p>
                                            {isEditing
                                                ? "Update the basic details of the sub-administrator."
                                                : "Enter the basic details of the sub-administrator."}
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-create-avatar-field">
                                    <SubAdminAvatar
                                        name={form.name}
                                        avatar={avatarPreview || avatar}
                                        className="admin-create-avatar-preview"
                                    />

                                    <div className="admin-create-avatar-controls">
                                        <strong>Profile picture</strong>
                                        <p>Images only (JPG, PNG, WEBP). Maximum 2 MB file size.</p>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleAvatarChange}
                                            aria-label="Choose sub-administrator profile picture"
                                        />
                                        <button
                                            type="button"
                                            className="admin-create-avatar-button"
                                            disabled={submitting}
                                            onClick={() => avatarInputRef.current?.click()}
                                        >
                                            <Camera size={15} />
                                            {avatarPreview || avatar ? "Change picture" : "Upload picture"}
                                        </button>
                                        {errors.avatar && (
                                            <small className="admin-create-error">{errors.avatar}</small>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-create-fields-grid">
                                    <div className="admin-create-field">
                                        <label htmlFor="subadmin-name">
                                            Full Name <span>*</span>
                                        </label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.name ? "has-error" : ""
                                            }`}
                                        >
                                            <UserRound size={17} />
                                            <input
                                                id="subadmin-name"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="Enter full name"
                                                autoComplete="name"
                                                maxLength={255}
                                            />
                                        </div>
                                        {errors.name && (
                                            <small className="admin-create-error">{errors.name}</small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="subadmin-email">
                                            Email Address <span>*</span>
                                        </label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.email ? "has-error" : ""
                                            }`}
                                        >
                                            <Mail size={17} />
                                            <input
                                                id="subadmin-email"
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="subadmin@company.com"
                                                autoComplete="email"
                                                maxLength={255}
                                            />
                                        </div>
                                        {errors.email && (
                                            <small className="admin-create-error">{errors.email}</small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="subadmin-phone">Phone Number</label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.phone ? "has-error" : ""
                                            }`}
                                        >
                                            <Phone size={17} />
                                            <span className="admin-create-phone-prefix">+91</span>
                                            <input
                                                id="subadmin-phone"
                                                name="phone"
                                                type="tel"
                                                value={form.phone}
                                                onChange={handlePhoneChange}
                                                placeholder="Enter phone number"
                                                autoComplete="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                            />
                                        </div>
                                        {errors.phone && (
                                            <small className="admin-create-error">{errors.phone}</small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="subadmin-location">Location</label>

                                        <div className="admin-create-input-wrap">
                                            <MapPin size={17} />
                                            <input
                                                id="subadmin-location"
                                                name="location"
                                                value={form.location}
                                                onChange={handleChange}
                                                placeholder="City, State"
                                                autoComplete="address-level2"
                                                maxLength={255}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Account Status */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <ShieldCheck size={22} />
                                    </div>

                                    <div>
                                        <h2>Account Status</h2>
                                        <p>Choose the sub-administrator's account status.</p>
                                    </div>
                                </div>

                                <div className="admin-create-field">
                                    <label>
                                        Status <span>*</span>
                                    </label>

                                    <div
                                        className="admin-create-status-options"
                                        role="radiogroup"
                                        aria-label="Sub Admin account status"
                                    >
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={form.status === "active"}
                                            className={`admin-create-status-option active-option ${
                                                form.status === "active" ? "selected" : ""
                                            }`}
                                            onClick={() =>
                                                setForm((prev) => ({ ...prev, status: "active" }))
                                            }
                                        >
                                            <span className="admin-create-status-dot" />
                                            Active
                                        </button>

                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={form.status === "inactive"}
                                            className={`admin-create-status-option inactive-option ${
                                                form.status === "inactive" ? "selected" : ""
                                            }`}
                                            onClick={() =>
                                                setForm((prev) => ({ ...prev, status: "inactive" }))
                                            }
                                        >
                                            <span className="admin-create-status-dot" />
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Branch access */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <GitBranch size={22} />
                                    </div>

                                    <div>
                                        <h2>Branch Access</h2>
                                        <p>
                                            Select the branches this
                                            sub-admin can access.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-create-company-grid">
                                    <div className="admin-create-field">
                                        <div className="admin-create-label-row">
                                            <label>
                                                Select Branches
                                                <span>*</span>
                                            </label>

                                            {branches.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="admin-create-text-button"
                                                    onClick={
                                                        handleSelectAllVisible
                                                    }
                                                >
                                                    {allVisibleBranchesSelected
                                                        ? "Deselect visible"
                                                        : "Select visible"}
                                                </button>
                                            )}
                                        </div>
                                        <small className="admin-create-company-limit">
                                            Assign branch access for this sub-admin.
                                        </small>

                                        <div
                                            className={`admin-create-company-picker ${
                                                errors.branches
                                                    ? "has-error"
                                                    : ""
                                            }`}
                                        >
                                            <div className="admin-create-company-search">
                                                <Search size={16} />

                                                <input
                                                    value={branchSearch}
                                                    onChange={(event) =>
                                                        setBranchSearch(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Search branches..."
                                                    aria-label="Search branches"
                                                />

                                                {branchSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setBranchSearch("")
                                                        }
                                                        aria-label="Clear search"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="admin-create-company-list">
                                                {branchesLoading ? (
                                                    <div className="admin-create-empty-state">
                                                        Loading branches...
                                                    </div>
                                                ) : filteredBranches.length ===
                                                  0 ? (
                                                    <div className="admin-create-empty-state">
                                                        {branches.length === 0
                                                            ? "No active branches available."
                                                            : "No matching branches found."}
                                                    </div>
                                                ) : (
                                                    filteredBranches.map(
                                                        (branch) => {
                                                            const checked =
                                                                selectedBranchIds.includes(
                                                                    Number(
                                                                        branch.id
                                                                    )
                                                                );

                                                            return (
                                                                <label
                                                                    key={
                                                                        branch.id
                                                                    }
                                                                    className={`admin-create-company-option ${
                                                                        checked
                                                                            ? "checked"
                                                                            : ""
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={
                                                                            checked
                                                                        }
                                                                        onChange={() =>
                                                                            toggleBranch(
                                                                                branch.id
                                                                            )
                                                                        }
                                                                    />

                                                                    <span className="admin-create-custom-checkbox">
                                                                        {checked && (
                                                                            <Check
                                                                                size={
                                                                                    13
                                                                                }
                                                                            />
                                                                        )}
                                                                    </span>

                                                                    <span className="admin-create-company-option-info">
                                                                        <strong>
                                                                            {
                                                                                branch.name
                                                                            }
                                                                        </strong>

                                                                        {(branch.code ||
                                                                            branch.city) && (
                                                                            <small>
                                                                                {
                                                                                    branch.code
                                                                                }
                                                                                {branch.code &&
                                                                                branch.city
                                                                                    ? ` • ${branch.city}`
                                                                                    : branch.city}
                                                                            </small>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                            );
                                                        }
                                                    )
                                                )}
                                            </div>

                                            <div className="admin-create-company-list-footer">
                                                {selectedBranchIds.length}{" "}
                                                {selectedBranchIds.length === 1
                                                    ? "branch"
                                                    : "branches"}{" "}
                                                selected
                                            </div>
                                        </div>

                                        {errors.branches && (
                                            <small className="admin-create-error">
                                                {errors.branches}
                                            </small>
                                        )}
                                    </div>

                                    <div className="admin-create-company-settings">
                                        <div className="admin-create-field">
                                            <label htmlFor="default-branch">
                                                Default Branch
                                                <span>*</span>
                                            </label>

                                            <div className="admin-create-select-wrap">
                                                <Building2 size={17} />

                                                <select
                                                    id="default-branch"
                                                    value={defaultBranchId}
                                                    onChange={(event) => {
                                                        setDefaultBranchId(
                                                            event.target.value
                                                        );
                                                        setErrors((previous) => ({
                                                            ...previous,
                                                            defaultBranch: undefined,
                                                        }));
                                                    }}
                                                    disabled={
                                                        selectedBranches.length ===
                                                        0
                                                    }
                                                >
                                                    <option value="">
                                                        Select default branch
                                                    </option>

                                                    {selectedBranches.map(
                                                        (branch) => (
                                                            <option
                                                                key={branch.id}
                                                                value={String(
                                                                    branch.id
                                                                )}
                                                            >
                                                                {branch.name}
                                                                {branch.code
                                                                    ? ` (${branch.code})`
                                                                    : ""}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                <ChevronDown
                                                    size={15}
                                                    className="admin-create-select-chevron"
                                                />
                                            </div>

                                            {errors.defaultBranch && (
                                                <small className="admin-create-error">
                                                    {errors.defaultBranch}
                                                </small>
                                            )}
                                        </div>

                                        <div className="admin-create-field">
                                            <label htmlFor="branch-access-status">
                                                Branch Access Status
                                            </label>

                                            <div className="admin-create-select-wrap">
                                                <CheckCircle2 size={17} />

                                                <select
                                                    id="branch-access-status"
                                                    value={branchAccessStatus}
                                                    onChange={(event) =>
                                                        setBranchAccessStatus(
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="active">
                                                        Active
                                                    </option>
                                                    <option value="pending">
                                                        Pending
                                                    </option>
                                                    <option value="inactive">
                                                        Inactive
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={15}
                                                    className="admin-create-select-chevron"
                                                />
                                            </div>
                                        </div>

                                        <div className="admin-create-role-display">
                                            <UserRound size={17} />

                                            <div>
                                                <span>Assigned Role</span>
                                                <strong>Sub Admin</strong>
                                            </div>

                                            <span className="admin-create-role-badge">
                                                Sub Admin
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedBranches.length > 0 && (
                                    <div className="admin-create-selected-summary">
                                        <CheckCircle2 size={16} />

                                        <span>
                                            Access will be assigned to{" "}
                                            <strong>
                                                {selectedBranches.length}{" "}
                                                {selectedBranches.length === 1
                                                    ? "branch"
                                                    : "branches"}
                                            </strong>
                                            .
                                        </span>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right-side information card (Exact style as CreateAdmin.jsx) */}
                        <aside className="admin-create-info-card">
                            <div className="admin-create-info-illustration">
                                <div className="admin-create-info-illustration-circle">
                                    <Users size={53} />
                                    <span>
                                        <ShieldCheck size={26} />
                                    </span>
                                </div>
                            </div>

                            <h2>Sub-Administrator Access</h2>

                            <p className="admin-create-info-description">
                                Sub-administrators can access the branches assigned to them and manage their
                                authorized operational data.
                            </p>

                            <ul className="admin-create-benefits">
                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Manage assigned branch properties</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Handle branch leads & client contacts</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Access branch operations & activity</span>
                                </li>
                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Work strictly within branch scope</span>
                                </li>
                            </ul>

                            <div className="admin-create-info-notice">
                                <Info size={17} />
                                <p>
                                    Branch access can be changed later from the sub-administrator's edit
                                    page. Only grant access to branches this sub-administrator should manage.
                                </p>
                            </div>

                            <div className="admin-create-info-note">
                                <div className="admin-create-info-note-icon">
                                    <Mail size={17} />
                                </div>
                                <div>
                                    <strong>Access control</strong>
                                    <p>
                                        Sub-admins have branch-scoped permissions and cannot alter
                                        company-wide settings.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {validationMessages.length > 0 && (
                        <div className="admin-create-validation-summary" role="alert" aria-live="assertive">
                            <strong>Please correct the following before saving:</strong>
                            <ul>
                                {validationMessages.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="admin-create-form-actions">
                        <button
                            type="button"
                            className="admin-create-cancel-button"
                            disabled={submitting}
                            onClick={handleBackClick}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="admin-create-submit-button"
                            disabled={submitting || branchesLoading}
                        >
                            {submitting ? (
                                <>
                                    <span className="admin-create-spinner" />
                                    {isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    <span>{isEditing ? "Update Sub Admin" : "Create Sub Admin"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
