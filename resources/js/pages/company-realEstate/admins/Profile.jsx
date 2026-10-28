import React, { useEffect, useRef, useState } from "react";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Edit3,
    Save,
    X,
    Lock,
    Eye,
    EyeOff,
    Activity,
    BriefcaseBusiness,
    LogIn,
    KeyRound,
    ShieldCheck,
    Smartphone,
    Copy,
    Clock,
    CheckCircle2,
} from "lucide-react";

import "./Profile.css";
import api from "../../../services/api";
import { QRCodeSVG } from "qrcode.react";
import sweetAlert from "../../../utils/sweetAlert";
import {
    getAllowedFileTypes,
    getAvatarUploadError,
} from "../../../utils/avatarUploadSettings";


const getProfileInitials = (name) => {
    const nameParts = name.trim().split(/\s+/).filter(Boolean);

    if (nameParts.length === 0) {
        return "NA";
    }

    if (nameParts.length === 1) {
        return nameParts[0].charAt(0).toUpperCase();
    }

    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
};

const getActivityIcon = (action) => {
    if (action === "login" || action === "logout") {
        return LogIn;
    }

    if (action === "password_changed") {
        return KeyRound;
    }

    return User;
};

export default function Profile({ currentPath = "/company/profile", onNavigate }) {
    const isCompanyProfile = currentPath.startsWith("/company");
   

    const [activeTab, setActiveTab] = useState(
        "personal"
    );

    useEffect(() => {
        setActiveTab(
           "personal"
        );
    }, [currentPath]);
    const [isEditing, setIsEditing] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const avatarInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        user_type: "",
        location: "",
        avatar: "",
        
    });
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState("");
    const [avatarUploadSettings, setAvatarUploadSettings] = useState(null);
    const [avatarSettingsError, setAvatarSettingsError] = useState("");
    const [avatarFileError, setAvatarFileError] = useState("");
    const [activities, setActivities] = useState([]);

    

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState("");

    const loadActivities = async () => {
        try {
            const activitiesResponse = await api.get("/profile/activity-logs");

            setActivities(
                activitiesResponse.data.activities.map((activity) => {
                    const activityDate = new Date(activity.created_at);

                    return {
                        id: activity.id,
                        icon: getActivityIcon(activity.action),
                        title: activity.action
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" "),
                        description: activity.description,
                        date: activityDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        }),
                        time: activityDate.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        }),
                    };
                })
            );
        } catch (error) {
            setProfileError(
                error.response?.data?.message ||
                "Unable to load activity information."
            );
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await api.get("/user");
                const user = response.data.user;
                const maxUploadSize = Number(
                    user.avatar_upload_settings?.max_upload_size
                );
                const allowedFileTypes = getAllowedFileTypes(
                    user.avatar_upload_settings?.allowed_file_types
                );

                if (
                    Number.isInteger(maxUploadSize) &&
                    maxUploadSize > 0 &&
                    allowedFileTypes.length > 0
                ) {
                    setAvatarUploadSettings({
                        maxUploadSize,
                        allowedFileTypes,
                    });
                } else {
                    setAvatarSettingsError(
                        "Unable to load valid profile photo upload settings."
                    );
                }

                setProfileData({
                    name: user.name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    user_type: user.user_type || "",
                    location: user.location || "",
                    avatar: user.avatar || "",
                    last_login_at: user.last_login_at || "",
                    created_at: user.created_at || "",
                });
            } catch (error) {
                if (error.response?.status === 401) {
                    localStorage.removeItem("auth_token");
                    sessionStorage.removeItem("auth_token");
                    onNavigate?.("/");
                    return;
                }

                setAvatarSettingsError(
                    error.response?.data?.message ||
                        "Unable to load profile photo upload settings."
                );
                setProfileError(
                    error.response?.data?.message ||
                    "Unable to load profile information."
                );
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (activeTab === "activity") {
            loadActivities();
        }
    }, [activeTab]);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

   
    const profileInitials = getProfileInitials(profileData.name);

    useEffect(() => {
        if (!selectedAvatar) {
            setAvatarPreview("");
            return undefined;
        }

        const previewUrl = URL.createObjectURL(selectedAvatar);
        setAvatarPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [selectedAvatar]);

    

    const changeTab = (tab) => {
        setActiveTab(tab);
       onNavigate?.(isCompanyProfile ? "/company/profile" : "/profile");
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "phone"
            ? value.replace(/\D/g, "").slice(0, 10)
            : name === "name"
                ? value.replace(/[^A-Za-z ]/g, "")
                : value;

        setProfileData((previous) => ({
            ...previous,
            [name]: nextValue,
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
            setAvatarFileError(error);
            event.target.value = "";
            return;
        }

        setAvatarFileError("");
        setSelectedAvatar(file);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };


    const handleSaveProfile = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            formData.append("name", profileData.name);
            formData.append("email", profileData.email);
            formData.append("phone", profileData.phone);
            formData.append("location", profileData.location);
            formData.append("_method", "PUT");

            if (selectedAvatar) {
                formData.append("avatar", selectedAvatar);
            }

            const response = await api.post("/superadmin/profile", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            const user = response.data.user;

            setProfileData((previous) => ({
                ...previous,
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                user_type: user.user_type || "",
                location: user.location || "",
                avatar: user.avatar || "",
                last_login_at: user.last_login_at || "",
                created_at: user.created_at || "",
            }));
            setSelectedAvatar(null);

            await loadActivities();

            setIsEditing(false);
           await sweetAlert.success(
                response.data?.message ||
                "Profile updated successfully."
            );
        } catch (error) {
            await sweetAlert.error(
                error.response?.data?.errors?.avatar?.[0] ||
                error.response?.data?.message ||
                "Unable to update profile information."
            );
        }

      
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (
            !passwordData.currentPassword ||
            !passwordData.newPassword ||
            !passwordData.confirmPassword
        ) {
          await sweetAlert.error(
                "Please fill in all password fields."
            );
            return;
        }

        if (
            passwordData.newPassword !==
            passwordData.confirmPassword
        ) {
          await sweetAlert.error(
                "New password and confirm password do not match."
            );
            return;
        }

        setIsUpdatingPassword(true);

        try {
            const response = await api.put("/superadmin/password", {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
                new_password_confirmation: passwordData.confirmPassword,
            });

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            /*
            |--------------------------------------------------------------------------
            | Logout all sessions after password change
            |--------------------------------------------------------------------------
            |
            | Backend decides this based on:
            | security_settings.logout_sessions_after_password_change
            |
            */

            if (response.data?.force_logout) {

                // Remove authentication tokens
                localStorage.removeItem("auth_token");
                sessionStorage.removeItem("auth_token");

                // Remove stored user information
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");

                // Optional: show message before redirect
                await sweetAlert.success(
                    "Password updated successfully. Please login again."
                );

                window.location.href = "/";

                return;
            }

            /*
            
            |--------------------------------------------------------------------------
            | Setting is OFF
            |--------------------------------------------------------------------------
            */

            await loadActivities();
            await sweetAlert.success(
                response.data?.message ||
                "Password updated successfully."
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            const firstValidationError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : null;

            await sweetAlert.error(
                firstValidationError ||
                error.response?.data?.message ||
                "Unable to update password."
            );
        } finally {
            setIsUpdatingPassword(false);
        }

        
    };

    return (
        <div className="maxus-profile-page">

            {/* =========================================
                PAGE HEADER
            ========================================= */}

            <div className="maxus-profile-header">

                <div className="maxus-profile-header-icon">
                    <User size={24} />
                </div>

                <div>
                    <h1>My Profile</h1>

                    <p>
                        Manage your profile information and account settings.
                    </p>
                </div>

            </div>


            {/* =========================================
                SUCCESS / STATUS MESSAGE
            ========================================= */}

            


            {/* =========================================
                MAIN PROFILE LAYOUT
            ========================================= */}

            <div className="maxus-profile-layout">


                {/* =====================================
                    LEFT PROFILE SUMMARY
                ===================================== */}

                <aside className="maxus-profile-sidebar">

                    <div className="maxus-profile-summary">

                        {/* AVATAR */}

                        <div className="maxus-profile-avatar-wrapper">

                            {profileData.avatar ? (
                                <img
                                    className="maxus-profile-avatar"
                                    src={profileData.avatar}
                                    alt={`${profileData.name} profile`}
                                />
                            ) : (
                                <div className="maxus-profile-avatar">
                                    {profileInitials}
                                </div>
                            )}

                            <button
                                type="button"
                                className="maxus-avatar-camera"
                                title="Change photo"
                            >
                                <Camera size={15} />
                            </button>

                        </div>


                        <h2>{profileData.name ?? "N/A"}</h2>

                        <p className="maxus-profile-designation">
                            {profileData.user_type ?? "N/A"}
                        </p>


                        <div className="maxus-profile-badge">
                            <ShieldCheck size={15} />
                            {profileData.user_type ?? "N/A"}
                        </div>


                        {/* CONTACT */}

                        <div className="maxus-profile-contact">

                            <div className="maxus-contact-item">
                                <Mail size={17} />

                                <span>
                                    {profileData.email}
                                </span>
                            </div>


                            <div className="maxus-contact-item">
                                <Phone size={17} />

                                <span>
                                    {profileData.phone ?? "N/A"}
                                </span>
                            </div>


                            <div className="maxus-contact-item">
                                <MapPin size={17} />

                                <span>
                                    {profileData.location}
                                </span>
                            </div>

                        </div>


                        {/* ACCOUNT DETAILS */}

                        <div className="maxus-account-info">

                            <div>
                                <span>Last Login</span>

                                <strong>
                                   {profileData.last_login_at
                                        ? new Date(profileData.last_login_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric"
                                        })
                                        : "N/A"}
                                </strong>

                                <small>
                                    {profileData.last_login_at
                                        ? new Date(profileData.last_login_at).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })
                                        : ""}
                                </small>
                            </div>


                            <div>
                                <span>Account Created</span>

                                <strong>
                                    {profileData.created_at
                                        ? new Date(profileData.created_at).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric"
                                        })
                                        : "N/A"}
                                </strong>

                                <small>
                                    {profileData.created_at
                                        ? new Date(profileData.created_at).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true
                                        })
                                        : ""}
                                </small>
                            </div>

                        </div>

                    </div>


                    {/* =================================
                        PROFILE NAVIGATION
                    ================================= */}

                    <div className="maxus-profile-navigation">

                        <button
                            type="button"
                            className={
                                activeTab === "personal"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => changeTab("personal")}
                        >
                            <User size={18} />

                            <span>
                                Personal Information
                            </span>
                        </button>


                        <button
                            type="button"
                            className={
                                activeTab === "password"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => changeTab("password")}
                        >
                            <Lock size={18} />

                            <span>
                                Change Password
                            </span>
                        </button>


                      


                        <button
                            type="button"
                            className={
                                activeTab === "activity"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => changeTab("activity")}
                        >
                            <Activity size={18} />

                            <span>
                                Activity Logs
                            </span>
                        </button>


                    </div>

                </aside>


                {/* =====================================
                    RIGHT CONTENT
                ===================================== */}

                <section className="maxus-profile-content">


                    {/* =================================
                        PERSONAL INFORMATION
                    ================================= */}

                    {activeTab === "personal" && (

                        <div className="maxus-profile-card">

                            <div className="maxus-card-header">

                                <div>

                                    <h2>
                                        Personal Information
                                    </h2>

                                    <p>
                                        Update your personal details and contact information.
                                    </p>

                                </div>


                                {!isEditing && (

                                    <button
                                        type="button"
                                        className="maxus-outline-button"
                                        onClick={() =>
                                            setIsEditing(true)
                                        }
                                    >
                                        <Edit3 size={16} />

                                        Edit Profile
                                    </button>

                                )}

                            </div>


                            <form
                                className="maxus-profile-form"
                                onSubmit={handleSaveProfile}
                            >

                                {/* PROFILE PHOTO */}

                                <div className="maxus-photo-section">

                                    {avatarPreview || profileData.avatar ? (
                                        <img
                                            className="maxus-large-avatar"
                                            src={avatarPreview || profileData.avatar}
                                            alt={`${profileData.name} profile`}
                                        />
                                    ) : (
                                        <div className="maxus-large-avatar">
                                            {profileInitials}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <>
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept={avatarUploadSettings?.allowedFileTypes
                                                    .map((extension) => `.${extension}`)
                                                    .join(",")}
                                                hidden
                                                disabled={!avatarUploadSettings}
                                                onChange={handleAvatarChange}
                                            />

                                            <button
                                                type="button"
                                                className="maxus-photo-button"
                                                disabled={!avatarUploadSettings}
                                                onClick={() => avatarInputRef.current?.click()}
                                            >
                                                <Camera size={16} />

                                                Change Photo
                                            </button>
                                        </>
                                    )}

                                    <span>
                                        {avatarUploadSettings ? (
                                            <>
                                                Images only. File Storage types:{" "}
                                                {avatarUploadSettings.allowedFileTypes
                                                    .map((extension) =>
                                                        extension.toUpperCase()
                                                    )
                                                    .join(", ")}
                                                <br />
                                                Maximum{" "}
                                                {avatarUploadSettings.maxUploadSize} MB
                                            </>
                                        ) : (
                                            avatarSettingsError ||
                                            "Loading profile photo upload settings..."
                                        )}
                                        {avatarFileError && (
                                            <>
                                                <br />
                                                <small role="alert">
                                                    {avatarFileError}
                                                </small>
                                            </>
                                        )}
                                    </span>

                                </div>


                                {/* FIELDS */}

                                <div className="maxus-fields-grid">

                                    <div className="maxus-form-group">

                                        <label>
                                            Full Name <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <User size={17} />

                                            <input
                                                type="text"
                                                name="name"
                                                value={profileData.name}
                                                onChange={handleProfileChange}
                                                disabled
                                                pattern="[A-Za-z]+(?: [A-Za-z]+)*"
                                                maxLength={255}
                                                required
                                            />

                                        </div>

                                    </div>


                                    <div className="maxus-form-group">

                                        <label>
                                            Email Address <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <Mail size={17} />

                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleProfileChange}
                                                disabled
                                               
                                            />

                                        </div>

                                    </div>


                                    <div className="maxus-form-group">

                                        <label>
                                            Phone Number <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <Phone size={17} />

                                            <input
                                                type="text"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                maxLength={10}
                                                required
                                            />

                                        </div>

                                    </div>


                                    <div className="maxus-form-group">

                                        <label>
                                            User Type <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <ShieldCheck size={17} />

                                            <input
                                                type="text"
                                                name="user_type"
                                                value={profileData.user_type ?? "N/A"}
                                                onChange={handleProfileChange}
                                                disabled
                                            />

                                        </div>

                                    </div>


                                    <div className="maxus-form-group full-width">

                                        <label>
                                            Location <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <MapPin size={17} />

                                            <input
                                                type="text"
                                                name="location"
                                                value={profileData.location}
                                                onChange={handleProfileChange}
                                                disabled={!isEditing}
                                                required
                                            />

                                        </div>

                                    </div>

                                </div>


                                {/* ACTIONS */}

                                {isEditing && (

                                    <div className="maxus-form-actions">

                                        <button
                                            type="button"
                                            className="maxus-cancel-button"
                                            onClick={handleCancelEdit}
                                        >
                                            <X size={16} />

                                            Cancel
                                        </button>


                                        <button
                                            type="submit"
                                            className="maxus-primary-button"
                                        >
                                            <Save size={16} />

                                            Save Changes
                                        </button>

                                    </div>

                                )}

                            </form>

                        </div>

                    )}


                    {/* =================================
                        CHANGE PASSWORD
                    ================================= */}

                    {activeTab === "password" && (

                        <div className="maxus-profile-card">

                            <div className="maxus-card-header">

                                <div>

                                    <h2>
                                        Change Password
                                    </h2>

                                    <p>
                                        Update your password to keep your account secure.
                                    </p>

                                </div>

                            </div>


                            <form
                                className="maxus-password-form"
                                onSubmit={handleUpdatePassword}
                            >

                                <div className="maxus-password-intro">

                                    <div className="maxus-password-icon">
                                        <Lock size={28} />
                                    </div>

                                    <h3>
                                        Keep your account secure
                                    </h3>

                                    <p>
                                        Use a strong password that you don't
                                        use anywhere else.
                                    </p>

                                    <div className="maxus-password-rules">

                                        <span>
                                            • At least 8 characters
                                        </span>

                                        <span>
                                            • Mix letters and numbers
                                        </span>

                                        <span>
                                            • Include a special character
                                        </span>

                                    </div>

                                </div>


                                <div className="maxus-password-fields">


                                    {/* CURRENT PASSWORD */}

                                    <div className="maxus-form-group">

                                        <label>
                                            Current Password <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <Lock size={17} />

                                            <input
                                                type={
                                                    showCurrentPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="currentPassword"
                                                value={
                                                    passwordData.currentPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                placeholder="Enter current password"
                                                autoComplete="current-password"
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="maxus-password-eye"
                                                onClick={() =>
                                                    setShowCurrentPassword(
                                                        (previous) =>
                                                            !previous
                                                    )
                                                }
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff size={17} />
                                                ) : (
                                                    <Eye size={17} />
                                                )}
                                            </button>

                                        </div>

                                    </div>


                                    {/* NEW PASSWORD */}

                                    <div className="maxus-form-group">

                                        <label>
                                            New Password <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <Lock size={17} />

                                            <input
                                                type={
                                                    showNewPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="newPassword"
                                                value={
                                                    passwordData.newPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                placeholder="Enter new password"
                                                minLength={8}
                                                pattern="(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                                                autoComplete="new-password"
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="maxus-password-eye"
                                                onClick={() =>
                                                    setShowNewPassword(
                                                        (previous) =>
                                                            !previous
                                                    )
                                                }
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff size={17} />
                                                ) : (
                                                    <Eye size={17} />
                                                )}
                                            </button>

                                        </div>

                                    </div>


                                    {/* CONFIRM PASSWORD */}

                                    <div className="maxus-form-group">

                                        <label>
                                            Confirm Password <span className="maxus-required" aria-hidden="true">*</span>
                                        </label>

                                        <div className="maxus-form-input">

                                            <Lock size={17} />

                                            <input
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="confirmPassword"
                                                value={
                                                    passwordData.confirmPassword
                                                }
                                                onChange={
                                                    handlePasswordChange
                                                }
                                                placeholder="Confirm new password"
                                                minLength={8}
                                                autoComplete="new-password"
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="maxus-password-eye"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        (previous) =>
                                                            !previous
                                                    )
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff size={17} />
                                                ) : (
                                                    <Eye size={17} />
                                                )}
                                            </button>

                                        </div>

                                    </div>


                                    {/* BUTTONS */}

                                    <div className="maxus-form-actions">

                                        <button
                                            type="button"
                                            className="maxus-cancel-button"
                                            onClick={() =>
                                                setPasswordData({
                                                    currentPassword: "",
                                                    newPassword: "",
                                                    confirmPassword: "",
                                                })
                                            }
                                        >
                                            Cancel
                                        </button>


                                        <button
                                            type="submit"
                                            className="maxus-primary-button"
                                            disabled={isUpdatingPassword}
                                        >
                                            <Lock size={16} />

                                            {isUpdatingPassword ? "Updating..." : "Update Password"}
                                        </button>

                                    </div>

                                </div>

                            </form>

                        </div>

                    )}


                    {/* =================================
                        ACTIVITY LOGS
                    ================================= */}

                    {activeTab === "activity" && (

                        <div className="maxus-profile-card">

                            <div className="maxus-card-header">

                                <div>

                                    <h2>
                                        Activity Logs
                                    </h2>

                                    <p>
                                        View recent activity and account history.
                                    </p>

                                </div>

                            </div>


                            <div className="maxus-activity-list">

                                {activities.length > 0 ? activities.map(
                                    (activity, index) => {

                                        const ActivityIcon =
                                            activity.icon;

                                        return (
                                            <div
                                                className="maxus-activity-item"
                                                key={activity.id || index}
                                            >

                                                <div className="maxus-activity-icon">
                                                    <ActivityIcon
                                                        size={18}
                                                    />
                                                </div>


                                                <div className="maxus-activity-details">

                                                    <h3>
                                                        {activity.title}
                                                    </h3>

                                                    <p>
                                                        {activity.description}
                                                    </p>

                                                </div>


                                                <div className="maxus-activity-time">

                                                    <strong>
                                                        {activity.date}
                                                    </strong>

                                                    <span>
                                                        {activity.time}
                                                    </span>

                                                </div>

                                            </div>
                                        );
                                    }
                                ) : (
                                    <div className="maxus-activity-empty">
                                        No recent activity found.
                                    </div>
                                )}

                            </div>


                            <div className="maxus-activity-footer">

                                <Clock size={17} />

                                Activity logs are retained for
                                security and auditing purposes.

                            </div>

                        </div>

                    )}

                </section>

            </div>


           
        </div>
    );
}