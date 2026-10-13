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
    Info,
    Mail,
    MapPin,
    Phone,
    Save,
    Search,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";
import {
    getAllowedFileTypes,
    getAvatarUploadError,
} from "../../../utils/avatarUploadSettings";
import "./CreateAdmin.css";

const MAX_ADMIN_COMPANIES = 2;

const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    location: "",
    status: "inactive",
};

const normalizePhoneNumber = (phone) => {
    const digits = String(phone || "").replace(/\D/g, "");

    return digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits.slice(0, 10);
};

const getInitials = (name) =>
    String(name || "Admin")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");

function AdminAvatar({ name, avatar, className }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [avatar]);

    if (!avatar || hasError) {
        return (
            <span className={className} aria-label={`${name || "Admin"} initials`}>
                {getInitials(name)}
            </span>
        );
    }

    return (
        <img
            className={className}
            src={avatar}
            alt={`${name || "Admin"} profile`}
            onError={() => setHasError(true)}
        />
    );
}

export default function CreateAdmin({
    onBack,
    onCreated,
    adminId,
    mode = "create",
}) {
    const isEditing = mode === "edit" && Boolean(adminId);
    const [form, setForm] = useState(INITIAL_FORM);
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
    const [defaultCompanyId, setDefaultCompanyId] = useState("");
    const [companySearch, setCompanySearch] = useState("");
    const [companyLoading, setCompanyLoading] = useState(true);
    const [adminLoading, setAdminLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [companyAccessStatus, setCompanyAccessStatus] =
        useState("active");
    const [avatar, setAvatar] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarUploadSettings, setAvatarUploadSettings] = useState(null);
    const [avatarSettingsError, setAvatarSettingsError] = useState("");
    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (!selectedAvatar) {
            setAvatarPreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(selectedAvatar);
        setAvatarPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [selectedAvatar]);

    useEffect(() => {
        loadCompanies();
        loadAvatarUploadSettings();
    }, []);

    useEffect(() => {
        if (!isEditing) {
            return undefined;
        }

        let isMounted = true;

        const loadAdmin = async () => {
            try {
                setAdminLoading(true);
                const response = await api.get(
                    `/superadmin/admins-details/${adminId}`
                );
                const admin = response?.data?.data;

                if (!isMounted) {
                    return;
                }

                if (!response?.data?.success || !admin) {
                    await sweetAlert.error(
                        response?.data?.message ||
                            "Unable to load administrator details."
                    );
                    return;
                }

                const assignedCompanies = Array.isArray(admin.companies)
                    ? admin.companies
                    : [];
                const assignedCompanyIds = assignedCompanies.map((company) =>
                    Number(company.id)
                );
                const defaultCompany = assignedCompanies.find(
                    (company) => Boolean(company.pivot?.is_default)
                );

                setForm({
                    name: admin.name || "",
                    email: admin.email || "",
                    phone: normalizePhoneNumber(admin.phone),
                    location: admin.location || "",
                    status: admin.status || "active",
                });
                setAvatar(admin.avatar || "");
                setSelectedCompanyIds(assignedCompanyIds);
                setDefaultCompanyId(
                    defaultCompany
                        ? String(defaultCompany.id)
                        : String(assignedCompanyIds[0] || "")
                );
                setCompanyAccessStatus(
                    defaultCompany?.pivot?.status || "active"
                );
                setCompanies((currentCompanies) => {
                    const currentCompaniesById = new Map(
                        currentCompanies.map((company) => [
                            Number(company.id),
                            company,
                        ])
                    );

                    assignedCompanies.forEach((company) => {
                        currentCompaniesById.set(Number(company.id), company);
                    });

                    return [...currentCompaniesById.values()].sort(
                        (first, second) =>
                            String(first.name).localeCompare(
                                String(second.name)
                            )
                    );
                });
            } catch (error) {
                console.error("Load administrator error:", error);

                if (isMounted) {
                    await sweetAlert.error(
                        error?.response?.data?.message ||
                            "Unable to load administrator details."
                    );
                }
            } finally {
                if (isMounted) {
                    setAdminLoading(false);
                }
            }
        };

        loadAdmin();

        return () => {
            isMounted = false;
        };
    }, [adminId, isEditing]);

    const loadCompanies = async () => {
        try {
            setCompanyLoading(true);

            const response = await api.get(
                "/superadmin/admins/available-companies"
            );

            if (response?.data?.success) {
                const records = Array.isArray(response.data.data)
                    ? response.data.data
                    : [];

                setCompanies((currentCompanies) => {
                    const companiesById = new Map(
                        currentCompanies.map((company) => [
                            Number(company.id),
                            company,
                        ])
                    );

                    records.forEach((company) => {
                        companiesById.set(Number(company.id), company);
                    });

                    return [...companiesById.values()].sort(
                        (first, second) =>
                            String(first.name).localeCompare(
                                String(second.name)
                            )
                    );
                });
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to load companies."
                );
            }
        } catch (error) {
            console.error("Load companies error:", error);

            await sweetAlert.error(
                error?.response?.data?.message ||
                    "Unable to load companies. Please try again."
            );
        } finally {
            setCompanyLoading(false);
        }
    };

    const loadAvatarUploadSettings = async () => {
        try {
            const response = await api.get(
                "/superadmin/settings/file-storage"
            );
            const settings = response?.data?.settings;
            const maxUploadSize = Number(settings?.max_upload_size);
            const allowedFileTypes = getAllowedFileTypes(
                settings?.allowed_file_types
            );

            if (
                !Number.isInteger(maxUploadSize) ||
                maxUploadSize < 1 ||
                allowedFileTypes.length === 0
            ) {
                setAvatarSettingsError(
                    "Unable to load valid profile photo upload settings."
                );
                return;
            }

            setAvatarUploadSettings({
                maxUploadSize,
                allowedFileTypes,
            });
        } catch (error) {
            console.error("Load file storage settings error:", error);

            setAvatarSettingsError(
                error?.response?.data?.message ||
                    "Unable to load profile photo upload settings."
            );
        }
    };

    const filteredCompanies = useMemo(() => {
        const query = companySearch.trim().toLowerCase();

        if (!query) return companies;

        return companies.filter((company) =>
            [
                company.name,
                company.code,
                company.email,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(query)
            )
        );
    }, [companies, companySearch]);

    const selectedCompanies = useMemo(
        () =>
            companies.filter((company) =>
                selectedCompanyIds.includes(Number(company.id))
            ),
        [companies, selectedCompanyIds]
    );
    const allVisibleCompaniesSelected =
        filteredCompanies.length > 0 &&
        filteredCompanies.every((company) =>
            selectedCompanyIds.includes(Number(company.id))
        );

    const validationMessages = useMemo(
        () => [...new Set(Object.values(errors).filter(Boolean))],
        [errors]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: undefined,
        }));
    };

    const handlePhoneChange = (event) => {
        const phone = event.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

        setForm((previous) => ({
            ...previous,
            phone,
        }));

        setErrors((previous) => ({
            ...previous,
            phone: undefined,
        }));
    };

    const handleAvatarChange = (event) => {
        const file = event.target.files?.[0];

        if (!file || !avatarUploadSettings) {
            return;
        }

        const error = getAvatarUploadError(file, avatarUploadSettings);

        if (error) {
            setSelectedAvatar(null);
            setErrors((previous) => ({
                ...previous,
                avatar: error,
            }));
            event.target.value = "";
            return;
        }

        setSelectedAvatar(file);
        setErrors((previous) => ({
            ...previous,
            avatar: undefined,
        }));
    };

    const toggleCompany = (companyId) => {
        const id = Number(companyId);

        setSelectedCompanyIds((previous) => {
            const alreadySelected = previous.includes(id);

            if (alreadySelected) {
                const next = previous.filter(
                    (selectedId) => selectedId !== id
                );

                setDefaultCompanyId((currentDefault) =>
                    Number(currentDefault) === id
                        ? String(next[0] || "")
                        : currentDefault
                );

                return next;
            }

            if (previous.length >= MAX_ADMIN_COMPANIES) {
                return previous;
            }

            const next = [...previous, id];

            if (next.length === 1) {
                setDefaultCompanyId(String(id));
            }

            return next;
        });

        setErrors((previous) => ({
            ...previous,
            companies: undefined,
            defaultCompany: undefined,
        }));
    };

    const handleSelectAllVisible = () => {
        const visibleIds = filteredCompanies.map((company) =>
            Number(company.id)
        );

        if (allVisibleCompaniesSelected) {
            const next = selectedCompanyIds.filter(
                (id) => !visibleIds.includes(id)
            );

            setSelectedCompanyIds(next);

            if (!next.includes(Number(defaultCompanyId))) {
                setDefaultCompanyId(String(next[0] || ""));
            }

            setErrors((previous) => ({
                ...previous,
                companies: undefined,
                defaultCompany: undefined,
            }));

            return;
        }

        const newVisibleIds = visibleIds.filter(
            (id) => !selectedCompanyIds.includes(id)
        );
        const remainingSlots = Math.max(
            0,
            MAX_ADMIN_COMPANIES - selectedCompanyIds.length
        );
        const next = [
            ...selectedCompanyIds,
            ...newVisibleIds.slice(0, remainingSlots),
        ];

        setSelectedCompanyIds(next);

        if (!defaultCompanyId && next.length > 0) {
            setDefaultCompanyId(String(next[0]));
        }

        setErrors((previous) => ({
            ...previous,
            companies:
                newVisibleIds.length > remainingSlots
                    ? "An admin can access a maximum of 2 companies. Remove a company before selecting another."
                    : undefined,
            defaultCompany: undefined,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = "Full name is required.";
        }

        if (!form.email.trim()) {
            nextErrors.email = "Email address is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ) {
            nextErrors.email = "Enter a valid email address.";
        }

        if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
            nextErrors.phone =
                "Phone number must contain exactly 10 digits.";
        }

        if (errors.avatar) {
            nextErrors.avatar = errors.avatar;
        }

        if (selectedCompanyIds.length === 0) {
            nextErrors.companies =
                "Select at least one company.";
        } else if (selectedCompanyIds.length > MAX_ADMIN_COMPANIES) {
            nextErrors.companies =
                "An admin can access a maximum of 2 companies. Remove a company before saving.";
        }

        if (
            selectedCompanyIds.length > 0 &&
            !selectedCompanyIds.includes(Number(defaultCompanyId))
        ) {
            nextErrors.defaultCompany =
                "Choose a default from your selected companies.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        try {
            setSubmitting(true);
            setErrors({});

            const payload = new FormData();
            payload.append("name", form.name.trim());
            payload.append("email", form.email.trim().toLowerCase());
            payload.append("phone", form.phone.trim());
            payload.append("location", form.location.trim());
            payload.append("status", form.status);
            selectedCompanyIds.forEach((companyId, index) => {
                payload.append(
                    `companies[${index}][company_id]`,
                    String(companyId)
                );
                payload.append(`companies[${index}][role]`, "admin");
                payload.append(
                    `companies[${index}][status]`,
                    companyAccessStatus
                );
                payload.append(
                    `companies[${index}][is_default]`,
                    companyId === Number(defaultCompanyId) ? "1" : "0"
                );
            });

            if (selectedAvatar) {
                payload.append("avatar", selectedAvatar);
            }

            if (isEditing) {
                payload.append("_method", "PUT");
            }

            const response = await api.post(
                isEditing
                    ? `/superadmin/admins-update/${adminId}`
                    : "/superadmin/admins",
                payload,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response?.data?.success) {
                await sweetAlert.success(
                    response?.data?.message ||
                        (isEditing
                            ? "Admin updated successfully."
                            : "Admin created successfully.")
                );

                if (typeof onCreated === "function") {
                    onCreated(response.data.data);
                }

                if (typeof onBack === "function") {
                    onBack();
                } else {
                    window.history.back();
                }
            } else {
                await sweetAlert.error(
                    response?.data?.message ||
                        "Unable to create admin."
                );
            }
        } catch (error) {
            console.error("Create admin error:", error);

            const validationErrors =
                error?.response?.data?.errors;

            if (validationErrors) {
                const mappedErrors = {};

                Object.entries(validationErrors).forEach(
                    ([key, messages]) => {
                        const message = Array.isArray(messages)
                            ? messages[0]
                            : messages;

                        if (key.startsWith("companies")) {
                            mappedErrors.companies = message;
                        } else {
                            mappedErrors[key] = message;
                        }
                    }
                );

                setErrors(mappedErrors);
            }

            await sweetAlert.error(
                error?.response?.data?.message ||
                    `Unable to ${isEditing ? "update" : "create"} admin. Please check the form.`
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="admin-create-page">
            {/* Page heading */}
            <div className="admin-create-breadcrumb">
                <button
                    type="button"
                    onClick={() =>
                        typeof onBack === "function"
                            ? onBack()
                            : window.history.back()
                    }
                    aria-label="Go back"
                >
                    <ArrowLeft size={15} />
                </button>

                <span>Administrators</span>
                <span className="admin-create-breadcrumb-slash">
                    /
                </span>
                <span className="admin-create-breadcrumb-current">
                    {isEditing ? "Edit Admin" : "Create Admin"}
                </span>
            </div>

            <div className="admin-create-page-header">
                <div className="admin-create-heading">
                    <div className="admin-create-heading-icon">
                        <UserRound size={28} />
                    </div>

                    <div>
                        <h1>{isEditing ? "Edit Admin" : "Create Admin"}</h1>
                        <p>
                            {isEditing
                                ? "Update administrator details and company access."
                                : "Add an administrator and assign access to your registered companies."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="admin-create-back-button"
                    onClick={() =>
                        typeof onBack === "function"
                            ? onBack()
                            : window.history.back()
                    }
                >
                    <ArrowLeft size={17} />
                    <span>Back to Administrators</span>
                </button>
            </div>

            <div className="admin-create-outer-container">
                <form
                    className="admin-create-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="admin-create-content">
                        <div className="admin-create-form-column">
                            {/* Personal information */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <CircleUserRound size={22} />
                                    </div>

                                    <div>
                                        <h2>Personal Information</h2>
                                        <p>
                                            {isEditing
                                                ? "Update the basic details of the administrator."
                                                : "Enter the basic details of the administrator."}
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-create-avatar-field">
                                    <AdminAvatar
                                        name={form.name}
                                        avatar={avatarPreview || avatar}
                                        className="admin-create-avatar-preview"
                                    />

                                    <div className="admin-create-avatar-controls">
                                        <strong>Profile picture</strong>
                                        <p>
                                            {avatarUploadSettings
                                                ? `Images only. File Storage types: ${avatarUploadSettings.allowedFileTypes
                                                      .map((extension) =>
                                                          extension.toUpperCase()
                                                      )
                                                      .join(", ")}. Maximum ${avatarUploadSettings.maxUploadSize} MB.`
                                                : avatarSettingsError ||
                                                  "Loading profile photo upload settings..."}
                                        </p>
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept={avatarUploadSettings?.allowedFileTypes
                                                .map((extension) => `.${extension}`)
                                                .join(",")}
                                            hidden
                                            disabled={!avatarUploadSettings}
                                            onChange={handleAvatarChange}
                                            aria-label="Choose administrator profile picture"
                                        />
                                        <button
                                            type="button"
                                            className="admin-create-avatar-button"
                                            disabled={
                                                submitting ||
                                                !avatarUploadSettings
                                            }
                                            onClick={() =>
                                                avatarInputRef.current?.click()
                                            }
                                        >
                                            <Camera size={15} />
                                            {avatarPreview || avatar
                                                ? "Change picture"
                                                : "Upload picture"}
                                        </button>
                                        {errors.avatar && (
                                            <small className="admin-create-error">
                                                {errors.avatar}
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div className="admin-create-fields-grid">
                                    <div className="admin-create-field">
                                        <label htmlFor="admin-name">
                                            Full Name
                                            <span>*</span>
                                        </label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.name
                                                    ? "has-error"
                                                    : ""
                                            }`}
                                        >
                                            <UserRound size={17} />

                                            <input
                                                id="admin-name"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                placeholder="Enter full name"
                                                autoComplete="name"
                                                maxLength={255}
                                            />
                                        </div>

                                        {errors.name && (
                                            <small className="admin-create-error">
                                                {errors.name}
                                            </small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="admin-email">
                                            Email Address
                                            <span>*</span>
                                        </label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.email
                                                    ? "has-error"
                                                    : ""
                                            }`}
                                        >
                                            <Mail size={17} />

                                            <input
                                                id="admin-email"
                                                name="email"
                                                type="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                placeholder="admin@company.com"
                                                autoComplete="email"
                                                maxLength={255}
                                            />
                                        </div>

                                        {errors.email && (
                                            <small className="admin-create-error">
                                                {errors.email}
                                            </small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="admin-phone">
                                            Phone Number
                                        </label>

                                        <div
                                            className={`admin-create-input-wrap ${
                                                errors.phone ? "has-error" : ""
                                            }`}
                                        >
                                            <Phone size={17} />
                                            <span className="admin-create-phone-prefix">
                                                +91
                                            </span>

                                            <input
                                                id="admin-phone"
                                                name="phone"
                                                type="tel"
                                                value={form.phone}
                                                onChange={handlePhoneChange}
                                                placeholder="Enter phone number"
                                                autoComplete="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                aria-invalid={Boolean(errors.phone)}
                                                aria-describedby={
                                                    errors.phone
                                                        ? "admin-phone-error"
                                                        : undefined
                                                }
                                            />
                                        </div>

                                        {errors.phone && (
                                            <small
                                                id="admin-phone-error"
                                                className="admin-create-error"
                                            >
                                                {errors.phone}
                                            </small>
                                        )}
                                    </div>

                                    <div className="admin-create-field">
                                        <label htmlFor="admin-location">
                                            Location
                                        </label>

                                        <div className="admin-create-input-wrap">
                                            <MapPin size={17} />

                                            <input
                                                id="admin-location"
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

                            {/* Account status */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <ShieldCheck size={22} />
                                    </div>

                                    <div>
                                        <h2>Account</h2>
                                        <p>
                                            Choose the administrator's
                                            account status.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-create-field">
                                    <label>
                                        Status <span>*</span>
                                    </label>

                                    <div
                                        className="admin-create-status-options"
                                        role="radiogroup"
                                        aria-label="Admin account status"
                                    >
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={
                                                form.status === "active"
                                            }
                                            className={`admin-create-status-option active-option ${
                                                form.status === "active"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    status: "active",
                                                }))
                                            }
                                        >
                                            <span className="admin-create-status-dot" />
                                            Active
                                        </button>

                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={
                                                form.status === "inactive"
                                            }
                                            className={`admin-create-status-option inactive-option ${
                                                form.status === "inactive"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    status: "inactive",
                                                }))
                                            }
                                        >
                                            <span className="admin-create-status-dot" />
                                            Inactive
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Company access */}
                            <section className="admin-create-card">
                                <div className="admin-create-card-heading">
                                    <div className="admin-create-card-icon">
                                        <Building2 size={22} />
                                    </div>

                                    <div>
                                        <h2>Company Access</h2>
                                        <p>
                                            Select the companies this
                                            admin can access.
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-create-company-grid">
                                    <div className="admin-create-field">
                                        <div className="admin-create-label-row">
                                            <label>
                                                Select Companies
                                                <span>*</span>
                                            </label>

                                            {companies.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="admin-create-text-button"
                                                    onClick={
                                                        handleSelectAllVisible
                                                    }
                                                    disabled={
                                                        selectedCompanyIds.length >=
                                                            MAX_ADMIN_COMPANIES &&
                                                        !allVisibleCompaniesSelected
                                                    }
                                                >
                                                    Select visible
                                                </button>
                                            )}
                                        </div>
                                        <small className="admin-create-company-limit">
                                            Select up to{" "}
                                            {MAX_ADMIN_COMPANIES} companies for
                                            this admin.
                                        </small>

                                        <div
                                            className={`admin-create-company-picker ${
                                                errors.companies
                                                    ? "has-error"
                                                    : ""
                                            }`}
                                        >
                                            <div className="admin-create-company-search">
                                                <Search size={16} />

                                                <input
                                                    value={companySearch}
                                                    onChange={(event) =>
                                                        setCompanySearch(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Search companies..."
                                                    aria-label="Search companies"
                                                />

                                                {companySearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCompanySearch("")
                                                        }
                                                        aria-label="Clear search"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="admin-create-company-list">
                                                {companyLoading ? (
                                                    <div className="admin-create-empty-state">
                                                        Loading companies...
                                                    </div>
                                                ) : filteredCompanies.length ===
                                                  0 ? (
                                                    <div className="admin-create-empty-state">
                                                        {companies.length === 0
                                                            ? "No active companies available."
                                                            : "No matching companies found."}
                                                    </div>
                                                ) : (
                                                    filteredCompanies.map(
                                                        (company) => {
                                                            const checked =
                                                                selectedCompanyIds.includes(
                                                                    Number(
                                                                        company.id
                                                                    )
                                                                );

                                                            return (
                                                                <label
                                                                    key={
                                                                        company.id
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
                                                                        disabled={
                                                                            !checked &&
                                                                            selectedCompanyIds.length >=
                                                                                MAX_ADMIN_COMPANIES
                                                                        }
                                                                        onChange={() =>
                                                                            toggleCompany(
                                                                                company.id
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
                                                                                company.name
                                                                            }
                                                                        </strong>

                                                                        {company.code && (
                                                                            <small>
                                                                                {
                                                                                    company.code
                                                                                }
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
                                                {selectedCompanyIds.length}{" "}
                                                of {MAX_ADMIN_COMPANIES}{" "}
                                                companies selected
                                            </div>
                                        </div>

                                        {errors.companies && (
                                            <small className="admin-create-error">
                                                {errors.companies}
                                            </small>
                                        )}
                                    </div>

                                    <div className="admin-create-company-settings">
                                        <div className="admin-create-field">
                                            <label htmlFor="default-company">
                                                Default Company
                                                <span>*</span>
                                            </label>

                                            <div className="admin-create-select-wrap">
                                                <Building2 size={17} />

                                                <select
                                                    id="default-company"
                                                    value={defaultCompanyId}
                                                    onChange={(event) => {
                                                        setDefaultCompanyId(
                                                            event.target.value
                                                        );
                                                        setErrors((previous) => ({
                                                            ...previous,
                                                            defaultCompany: undefined,
                                                        }));
                                                    }}
                                                    disabled={
                                                        selectedCompanies.length ===
                                                        0
                                                    }
                                                >
                                                    <option value="">
                                                        Select default company
                                                    </option>

                                                    {selectedCompanies.map(
                                                        (company) => (
                                                            <option
                                                                key={
                                                                    company.id
                                                                }
                                                                value={String(
                                                                    company.id
                                                                )}
                                                            >
                                                                {company.name}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                <ChevronDown
                                                    size={15}
                                                    className="admin-create-select-chevron"
                                                />
                                            </div>

                                            {errors.defaultCompany && (
                                                <small className="admin-create-error">
                                                    {errors.defaultCompany}
                                                </small>
                                            )}
                                        </div>

                                        <div className="admin-create-field">
                                            <label htmlFor="company-access-status">
                                                Company Access Status
                                            </label>

                                            <div className="admin-create-select-wrap">
                                                <CheckCircle2 size={17} />

                                                <select
                                                    id="company-access-status"
                                                    value={companyAccessStatus}
                                                    onChange={(event) =>
                                                        setCompanyAccessStatus(
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
                                                <strong>Admin</strong>
                                            </div>

                                            <span className="admin-create-role-badge">
                                                Admin
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedCompanies.length > 0 && (
                                    <div className="admin-create-selected-summary">
                                        <CheckCircle2 size={16} />

                                        <span>
                                            Access will be assigned to{" "}
                                            <strong>
                                                {selectedCompanies.length}{" "}
                                                {selectedCompanies.length === 1
                                                    ? "company"
                                                    : "companies"}
                                            </strong>
                                            .
                                        </span>
                                    </div>
                                )}
                            </section>

                        </div>

                        {/* Right-side information card */}
                        <aside className="admin-create-info-card">
                            <div className="admin-create-info-illustration">
                                <div className="admin-create-info-illustration-circle">
                                    <CircleUserRound size={53} />
                                    <span>
                                        <ShieldCheck size={26} />
                                    </span>
                                </div>
                            </div>

                            <h2>Administrator Access</h2>

                            <p className="admin-create-info-description">
                                Administrators can access the companies
                                assigned to them and manage their
                                authorized company operations.
                            </p>

                            <ul className="admin-create-benefits">
                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Manage assigned companies</span>
                                </li>

                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Handle authorized user accounts</span>
                                </li>

                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Access permitted reports</span>
                                </li>

                                <li>
                                    <CheckCircle2 size={17} />
                                    <span>Work within assigned permissions</span>
                                </li>
                            </ul>

                            <div className="admin-create-info-notice">
                                <Info size={17} />

                                <p>
                                    Company access can be changed later
                                    from the administrator's edit page.
                                    Only grant access to companies this
                                    administrator should manage.
                                </p>
                            </div>

                            <div className="admin-create-info-note">
                                <div className="admin-create-info-note-icon">
                                    <Mail size={17} />
                                </div>

                                <div>
                                    <strong>Next step</strong>
                                    <p>
                                        Connect your admin invitation
                                        email and password setup flow
                                        after creating the account.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {validationMessages.length > 0 && (
                        <div
                            className="admin-create-validation-summary"
                            role="alert"
                            aria-live="assertive"
                        >
                            <strong>
                                Please correct the following before saving:
                            </strong>
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
                            onClick={() =>
                                typeof onBack === "function"
                                    ? onBack()
                                    : window.history.back()
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="admin-create-submit-button"
                            disabled={
                                submitting || companyLoading || adminLoading
                            }
                        >
                            {submitting ? (
                                <>
                                    <span className="admin-create-spinner" />
                                    {isEditing ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    <span>
                                        {isEditing ? "Update Admin" : "Create Admin"}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}