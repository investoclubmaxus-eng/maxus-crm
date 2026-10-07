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

export default function Profile({ currentPath = "/profile", onNavigate }) {
    const [activeTab, setActiveTab] = useState(
        currentPath === "/profile/projects" ? "projects" : "personal"
    );

    useEffect(() => {
        setActiveTab(
            currentPath === "/profile/projects"
                ? "projects"
                : "personal"
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
    const [activities, setActivities] = useState([]);

    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorSetup, setTwoFactorSetup] = useState({
        show: false,
        secret: "",
        qrCodeUrl: "",
    });
    const [twoFactorCode, setTwoFactorCode] = useState("");

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

    const projects = [
        ["Maxus Foundation", "MAXUS", "Active", "82%", "17 Sep 2026"],
        ["Company B Expansion", "COMP-B", "In Progress", "64%", "15 Sep 2026"],
        ["Company C Onboarding", "COMP-C", "Planning", "28%", "12 Sep 2026"],
    ];

    const changeTab = (tab) => {
        setActiveTab(tab);

        if (tab === "projects") {
            onNavigate?.("/profile/projects");
            return;
        }

        onNavigate?.("/profile");
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

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];

        if (file) {
            setSelectedAvatar(file);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSetupTwoFactor = async () => {
        setTwoFactorLoading(true);
      
        try {
            const response = await api.post("/superadmin/settings/2fa/setup");
            const data = response.data?.data;

            if (!data?.secret || !data?.qr_code_url) {
                throw new Error("Invalid 2FA setup response.");
            }

            setTwoFactorSetup({
                show: true,
                secret: data.secret,
                qrCodeUrl: data.qr_code_url,
            });

            setTwoFactorCode("");
              await sweetAlert.success(
                response.data?.message ||
                "Two-factor authentication setup started."
            );
        } catch (error) {
             await sweetAlert.error(
                error.response?.data?.message ||
                "Unable to start two-factor authentication."
            );
        } finally {
            setTwoFactorLoading(false);
        }
    };


    const handleConfirmTwoFactor = async () => {
    const code = twoFactorCode.trim();

    if (!/^\d{6}$/.test(code)) {
        await sweetAlert.error(
            "Please enter the 6-digit authentication code."
        );
        return;
    }

    setTwoFactorLoading(true);
    
    try {
        const response = await api.post(
            "/superadmin/settings/2fa/confirm",
            {
                code,
            }
        );

        setTwoFactorSetup({
            show: false,
            secret: "",
            qrCodeUrl: "",
        });

        setTwoFactorCode("");

         await sweetAlert.success(
            response.data?.message ||
            "Two-factor authentication enabled successfully."
             );

        // Refresh profile information
        try {
            const userResponse = await api.get("/user");
            const user = userResponse.data.user;

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
                two_factor_enabled: user.two_factor_enabled || false,
            }));
        } catch (error) {
            // Profile refresh failure should not undo successful 2FA activation.
        }

    } catch (error) {
        await sweetAlert.error(
            error.response?.data?.message ||
            "Unable to verify the authentication code."
        );
    } finally {
        setTwoFactorLoading(false);
    }

    
};

    const handleCopyTwoFactorSecret = async () => {
        if (!twoFactorSetup.secret) {
            return;
        }

        try {
            await navigator.clipboard.writeText(twoFactorSetup.secret);
             await sweetAlert.success(
                "2FA secret copied to clipboard."
            );
        } catch (error) {
            await sweetAlert.error(
                "Unable to copy the 2FA secret."
            );
        }

       
    };


        const handleCancelTwoFactorSetup = async () => {
        const result = await sweetAlert.confirm(
            "Your current two-factor authentication setup will be discarded.",
            {
                title: "Cancel 2FA Setup?",
                confirmText: "Yes, Cancel",
                cancelText: "Continue Setup",
            }
        );

        if (!result.isConfirmed) {
            return;
        }

        setTwoFactorSetup({
            show: false,
            secret: "",
            qrCodeUrl: "",
        });

        setTwoFactorCode("");

        await sweetAlert.success(
            "Two-factor authentication setup cancelled."
        );
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
                                activeTab === "twoFactor"
                                    ? "active"
                                    : ""
                            }
                            onClick={() => changeTab("twoFactor")}
                        >
                            <ShieldCheck size={18} />

                            <span>
                                Two-Factor Authentication
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

                        <button
                            type="button"
                            className={activeTab === "projects" ? "active" : ""}
                            onClick={() => changeTab("projects")}
                        >
                            <BriefcaseBusiness size={18} />

                            <span>Projects</span>
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
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                                hidden
                                                onChange={handleAvatarChange}
                                            />

                                            <button
                                                type="button"
                                                className="maxus-photo-button"
                                                onClick={() => avatarInputRef.current?.click()}
                                            >
                                                <Camera size={16} />

                                                Change Photo
                                            </button>
                                        </>
                                    )}

                                    <span>
                                        JPG, PNG or GIF
                                        <br />
                                        Maximum 2MB
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
                                                disabled={!isEditing}
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
                        TWO-FACTOR AUTHENTICATION
                    ================================= */}

                    {activeTab === "twoFactor" && (

                        <div className="maxus-profile-card maxus-two-factor-card">

                            <div className="maxus-card-header">

                                <div>
                                    <h2>
                                        Two-Factor Authentication
                                    </h2>

                                    <p>
                                        Add an extra layer of security to your account
                                        using an authenticator app.
                                    </p>
                                </div>

                            </div>


                            {!twoFactorSetup.show ? (

                                <div className="maxus-two-factor-content">

                                    <div className="maxus-two-factor-info">

                                        <div className="maxus-two-factor-info-icon">
                                            <Smartphone size={24} />
                                        </div>

                                        <div>
                                            <h3>
                                                Protect your account
                                            </h3>

                                            <p>
                                                Use Google Authenticator, Microsoft Authenticator,
                                                Authy, or another compatible authenticator app.
                                            </p>
                                        </div>

                                    </div>


                                    <div className="maxus-two-factor-actions">

                                        <button
                                            type="button"
                                            className="maxus-primary-button"
                                            onClick={handleSetupTwoFactor}
                                            disabled={twoFactorLoading}
                                        >
                                            <ShieldCheck size={16} />

                                            {twoFactorLoading
                                                ? "Setting up..."
                                                : "Enable Two-Factor Authentication"}
                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <div className="maxus-two-factor-setup">

                                    <div className="maxus-two-factor-step">

                                        <div className="maxus-two-factor-step-number">
                                            1
                                        </div>

                                        <div>
                                            <h3>
                                                Scan the QR code
                                            </h3>

                                            <p>
                                                Open your authenticator app and scan
                                                the QR code below.
                                            </p>
                                        </div>

                                    </div>


                                    <div className="maxus-two-factor-qr-wrapper">

                                        <div className="maxus-two-factor-qr">
                                            <QRCodeSVG
                                                value={twoFactorSetup.qrCodeUrl}
                                                size={220}
                                                includeMargin
                                            />
                                        </div>

                                    </div>


                                    <div className="maxus-two-factor-manual">

                                        <div>
                                            <strong>
                                                Can't scan the QR code?
                                            </strong>

                                            <p>
                                                Enter this setup key manually
                                                in your authenticator app.
                                            </p>
                                        </div>


                                        <div className="maxus-two-factor-secret">

                                            <code>
                                                {twoFactorSetup.secret}
                                            </code>

                                            <button
                                                type="button"
                                                onClick={handleCopyTwoFactorSecret}
                                                title="Copy secret"
                                                aria-label="Copy 2FA secret"
                                            >
                                                <Copy size={17} />
                                            </button>

                                        </div>

                                    </div>


                                    <div className="maxus-two-factor-step">

                                        <div className="maxus-two-factor-step-number">
                                            2
                                        </div>

                                        <div>
                                            <h3>
                                                Enter the verification code
                                            </h3>

                                            <p>
                                                Enter the 6-digit code shown in
                                                your authenticator app.
                                            </p>
                                        </div>

                                    </div>


                                    <div className="maxus-two-factor-code-group">

                                        <label htmlFor="two-factor-code">
                                            Authentication Code
                                        </label>

                                        <input
                                            id="two-factor-code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            pattern="[0-9]{6}"
                                            value={twoFactorCode}
                                            onChange={(e) =>
                                                setTwoFactorCode(
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6)
                                                )
                                            }
                                            placeholder="Enter 6-digit code"
                                        />

                                    </div>


                                    <div className="maxus-two-factor-notice">
                                        <ShieldCheck size={18} />

                                        <span>
                                            Verification will activate 2FA only after
                                            the code is successfully confirmed.
                                        </span>
                                    </div>


                                    <div className="maxus-form-actions">

                                        <button
                                            type="button"
                                            className="maxus-cancel-button"
                                            onClick={handleCancelTwoFactorSetup}
                                        >
                                            <X size={16} />
                                            Cancel Setup
                                        </button>


                                        <button
                                            type="button"
                                            className="maxus-primary-button"
                                            onClick={handleConfirmTwoFactor}
                                            disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                                            title={
                                                twoFactorCode.length !== 6
                                                    ? "Enter the 6-digit authentication code"
                                                    : "Verify and enable two-factor authentication"
                                            }
                                        >
                                            <CheckCircle2 size={16} />

                                            {twoFactorLoading
                                                ? "Verifying..."
                                                : "Verify & Enable 2FA"}
                                        </button>

                                    </div>

                                </div>

                            )}

                        </div>

                    )}


                    {activeTab === "projects" && (

                        <div className="maxus-profile-card">

                            <div className="maxus-card-header">
                                <div>
                                    <h2>Projects</h2>

                                    <p>
                                        Review project progress and recent updates.
                                    </p>
                                </div>
                            </div>

                            <div className="maxus-project-table-wrapper">
                                <table className="maxus-project-table">
                                    <thead>
                                        <tr>
                                            <th>Project</th>
                                            <th>Client</th>
                                            <th>Status</th>
                                            <th>Progress</th>
                                            <th>Last Updated</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {projects.map((project) => (
                                            <tr key={project[0]}>
                                                <td><strong>{project[0]}</strong></td>
                                                <td>{project[1]}</td>
                                                <td>
                                                    <span className={`maxus-project-status ${project[2]
                                                        .toLowerCase()
                                                        .replace(" ", "-")}`}>
                                                        {project[2]}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="maxus-project-progress">
                                                        <span>{project[3]}</span>
                                                        <div className="maxus-project-progress-track">
                                                            <span style={{ width: project[3] }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{project[4]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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