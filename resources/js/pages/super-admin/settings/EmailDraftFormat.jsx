import React, { useMemo, useState } from "react";
import {
    Mail,
    User,
    Lock,
    KeyRound,
    Ban,
    Building2,
    Plus,
    ChevronRight,
    Save,
    Eye,
    Send,
    Trash2,
    Edit3,
    X,
    CheckCircle,
    Info,
    Settings,
    Variable,
    Monitor,
    Tablet,
    Smartphone,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

import "./EmailDraftFormat.css";

function EmailDraftFormat({ onNavigate }) {

    /* =========================================================
       DEFAULT TEMPLATES
    ========================================================== */

    const defaultTemplates = [
        {
            id: 1,
            name: "New Admin Invitation",
            description:
                "Sent automatically when a new Admin account is created.",
            trigger: "Admin Created",
            icon: User,
            is_active: true,
            is_default: true,
            last_updated: "23 Sep 2026, 03:12 PM",
            subject: "Welcome to {{app_name}} – Your Admin Account",
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

Welcome to {{app_name}}.

Your Admin account has been created successfully.

You can access your CRM account using the button below.

[LOGIN_BUTTON]

For security, please use the link below to set your password before your first login.

{{activation_url}}

If you were not expecting this invitation, please contact your system administrator.

Regards,
{{app_name}} Team`,
        },

        {
            id: 2,
            name: "Admin Account Activated",
            description:
                "Sent when an Admin activates their account.",
            trigger: "Account Activated",
            icon: Lock,
            is_active: true,
            is_default: true,
            last_updated: "20 Sep 2026, 11:45 AM",
            subject: "Your {{app_name}} Admin Account is Activated",
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

Your Admin account has been successfully activated.

You can now login to your CRM account.

[LOGIN_BUTTON]

Regards,
{{app_name}} Team`,
        },

        {
            id: 3,
            name: "Password Reset",
            description:
                "Sent when an Admin requests a password reset.",
            trigger: "Password Reset Requested",
            icon: KeyRound,
            is_active: true,
            is_default: true,
            last_updated: "18 Sep 2026, 04:20 PM",
            subject: "Reset Your {{app_name}} Password",
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

We received a request to reset your password.

Please use the link below to reset your password.

{{activation_url}}

If you did not request a password reset, please ignore this email.

Regards,
{{app_name}} Team`,
        },

        {
            id: 4,
            name: "Account Disabled",
            description:
                "Sent when an Admin account is disabled by Super Admin.",
            trigger: "Account Disabled",
            icon: Ban,
            is_active: true,
            is_default: true,
            last_updated: "15 Sep 2026, 02:10 PM",
            subject: "Your {{app_name}} Account Has Been Disabled",
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

Your Admin account has been disabled by the system administrator.

If you believe this was done by mistake, please contact your system administrator.

Regards,
{{app_name}} Team`,
        },

        {
            id: 5,
            name: "Company Access Granted",
            description:
                "Sent when an Admin is granted access to a company.",
            trigger: "Company Access Granted",
            icon: Building2,
            is_active: true,
            is_default: true,
            last_updated: "12 Sep 2026, 10:25 AM",
            subject: "Company Access Granted – {{company_name}}",
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

You have been granted access to {{company_name}}.

You can login to your CRM account using the button below.

[LOGIN_BUTTON]

Regards,
{{app_name}} Team`,
        },
    ];


    /* =========================================================
       STATES
    ========================================================== */

    const [templates, setTemplates] = useState(defaultTemplates);

    const [selectedTemplateId, setSelectedTemplateId] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [templateToDelete, setTemplateToDelete] = useState(null);

    const [showPreview, setShowPreview] = useState(false);

    const [activeTab, setActiveTab] = useState("content");

    const [previewDevice, setPreviewDevice] = useState("desktop");

    const [newTemplateName, setNewTemplateName] = useState("");

    const [newTemplateDescription, setNewTemplateDescription] =
        useState("");

    const [newTemplateTrigger, setNewTemplateTrigger] =
        useState("Custom Notification");

    const [formData, setFormData] = useState({
        subject: "",
        from_name: "",
        body: "",
    });

    /* =========================================================
       SELECTED TEMPLATE
    ========================================================== */

    const selectedTemplate = useMemo(() => {
        return templates.find(
            (template) => template.id === selectedTemplateId
        );
    }, [templates, selectedTemplateId]);


    /* =========================================================
       LOAD SELECTED TEMPLATE
    ========================================================== */

    React.useEffect(() => {
        if (!selectedTemplate) {
            return;
        }

        setFormData({
            subject: selectedTemplate.subject || "",
            from_name: selectedTemplate.from_name || "",
            body: selectedTemplate.body || "",
        });

        setActiveTab("content");
    }, [selectedTemplateId]);


    /* =========================================================
       HANDLE FORM CHANGE
    ========================================================== */

    const handleFormChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    /* =========================================================
       UPDATE TEMPLATE DATA
    ========================================================== */

    const updateSelectedTemplate = (updates) => {

        setTemplates((prev) =>
            prev.map((template) =>
                template.id === selectedTemplateId
                    ? {
                          ...template,
                          ...updates,
                          last_updated: "23 Sep 2026, 03:30 PM",
                      }
                    : template
            )
        );
    };


    /* =========================================================
       SAVE CHANGES
    ========================================================== */

    const handleSaveChanges = () => {

        updateSelectedTemplate({
            subject: formData.subject,
            from_name: formData.from_name,
            body: formData.body,
        });

        alert("Email template saved successfully.");
    };


    /* =========================================================
       TOGGLE TEMPLATE
    ========================================================== */

    const handleToggleTemplate = (id) => {

        setTemplates((prev) =>
            prev.map((template) =>
                template.id === id
                    ? {
                          ...template,
                          is_active: !template.is_active,
                      }
                    : template
            )
        );
    };


    /* =========================================================
       ADD TEMPLATE
    ========================================================== */

    const handleAddTemplate = () => {

        if (!newTemplateName.trim()) {
            return;
        }

        const newTemplate = {
            id: Date.now(),
            name: newTemplateName.trim(),
            description:
                newTemplateDescription.trim() ||
                "Custom email notification template.",
            trigger:
                newTemplateTrigger.trim() ||
                "Custom Notification",
            icon: Mail,
            is_active: true,
            is_default: false,
            last_updated: "23 Sep 2026, 03:30 PM",
            subject: `Notification from {{app_name}}`,
            from_name: "{{app_name}}",
            body: `Hello {{admin_name}},

This is a new email notification from {{app_name}}.

Please update this message according to your requirements.

Regards,
{{app_name}} Team`,
        };

        setTemplates((prev) => [...prev, newTemplate]);

        setSelectedTemplateId(newTemplate.id);

        setNewTemplateName("");
        setNewTemplateDescription("");
        setNewTemplateTrigger("Custom Notification");

        setShowAddModal(false);
    };


    /* =========================================================
       DELETE TEMPLATE
    ========================================================== */

    const openDeleteModal = (template, event) => {

        if (event) {
            event.stopPropagation();
        }

        if (template.is_default) {
            return;
        }

        setTemplateToDelete(template);

        setShowDeleteModal(true);
    };


    const confirmDeleteTemplate = () => {

        if (!templateToDelete) {
            return;
        }

        const remainingTemplates = templates.filter(
            (template) =>
                template.id !== templateToDelete.id
        );

        setTemplates(remainingTemplates);

        if (
            selectedTemplateId ===
            templateToDelete.id
        ) {

            if (remainingTemplates.length > 0) {
                setSelectedTemplateId(
                    remainingTemplates[0].id
                );
            }
        }

        setTemplateToDelete(null);

        setShowDeleteModal(false);
    };


    /* =========================================================
       INSERT VARIABLE
    ========================================================== */

    const insertVariable = (variable) => {

        setFormData((prev) => ({
            ...prev,
            body: `${prev.body}\n${variable}`,
        }));
    };


    /* =========================================================
       PREVIEW BODY
    ========================================================== */

    const previewBody = formData.body
        .replaceAll(
            "{{admin_name}}",
            "John Smith"
        )
        .replaceAll(
            "{{admin_email}}",
            "john@example.com"
        )
        .replaceAll(
            "{{company_name}}",
            "ABC Realty"
        )
        .replaceAll(
            "{{login_url}}",
            "https://crm.maxus.com/login"
        )
        .replaceAll(
            "{{activation_url}}",
            "https://crm.maxus.com/activate?token=abc123"
        )
        .replaceAll(
            "{{app_name}}",
            "Maxus CRM"
        )
        .replaceAll(
            "{{support_email}}",
            "support@maxus.com"
        );


    /* =========================================================
       RENDER ICON
    ========================================================== */

    const SelectedIcon =
        selectedTemplate?.icon || Mail;


    /* =========================================================
       NAVIGATION
    ========================================================== */

    const handleBackToSettings = () => {

        if (onNavigate) {
            onNavigate("/system-settings");
        }
    };


    return (
        <div className="email-draft-page">

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="email-draft-page-header">

                <div className="email-draft-title-section">

                    <div className="email-draft-title-icon">
                        <Mail size={28} />
                    </div>

                    <div>
                        <h1>Email Draft Format</h1>

                        <p>
                            Manage email templates used for
                            automated system notifications.
                        </p>
                    </div>

                </div>


                <div className="email-draft-breadcrumb">

                    <span
                        onClick={() =>
                            onNavigate &&
                            onNavigate("/dashboard")
                        }
                    >
                        Dashboard
                    </span>

                    <span>›</span>

                    <span
                        onClick={handleBackToSettings}
                    >
                        System Settings
                    </span>

                    <span>›</span>

                    <strong>
                        Email Draft Format
                    </strong>

                </div>

            </div>


            {/* =====================================================
                MAIN SINGLE CONTAINER
            ====================================================== */}

            <div className="email-draft-main-container">

                {/* =================================================
                    LEFT TEMPLATE PANEL
                ================================================== */}

                <div className="email-template-panel">

                    <div className="email-template-panel-header">

                        <div>
                            <h2>
                                Email Templates
                            </h2>

                            <p>
                                Manage and configure system
                                email templates.
                            </p>
                        </div>


                        <button
                            type="button"
                            className="email-add-template-btn"
                            onClick={() =>
                                setShowAddModal(true)
                            }
                        >
                            <Plus size={17} />
                            Add Template
                        </button>

                    </div>


                    <div className="email-template-list">

                        {templates.map((template) => {

                            const TemplateIcon =
                                template.icon || Mail;

                            const isSelected =
                                selectedTemplateId ===
                                template.id;

                            return (
                                <div
                                    key={template.id}
                                    className={`email-template-item ${
                                        isSelected
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setSelectedTemplateId(
                                            template.id
                                        )
                                    }
                                >

                                    <div className="email-template-item-icon">
                                        <TemplateIcon
                                            size={20}
                                        />
                                    </div>


                                    <div className="email-template-item-content">

                                        <div className="email-template-item-title-row">

                                            <h3>
                                                {template.name}
                                            </h3>

                                            <div className="email-template-item-actions">

                                                <span
                                                    className={`email-status-badge ${
                                                        template.is_active
                                                            ? "active"
                                                            : "inactive"
                                                    }`}
                                                >
                                                    <span />
                                                    {template.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>


                                                {!template.is_default && (
                                                    <button
                                                        type="button"
                                                        className="email-template-delete-btn"
                                                        title="Delete Template"
                                                        onClick={(e) =>
                                                            openDeleteModal(
                                                                template,
                                                                e
                                                            )
                                                        }
                                                    >
                                                        <Trash2
                                                            size={15}
                                                        />
                                                    </button>
                                                )}

                                                <ChevronRight
                                                    size={17}
                                                    className="email-template-arrow"
                                                />

                                            </div>

                                        </div>


                                        <p>
                                            {template.description}
                                        </p>


                                        <div className="email-template-meta">

                                            <span>
                                                Trigger:
                                                {" "}
                                                {template.trigger}
                                            </span>

                                            <span>
                                                Last Updated:
                                                {" "}
                                                {template.last_updated}
                                            </span>

                                        </div>

                                    </div>

                                </div>
                            );
                        })}

                    </div>

                </div>


                {/* =================================================
                    RIGHT EDITOR PANEL
                ================================================== */}

                <div className="email-editor-panel">

                    {/* =================================================
                        EDITOR HEADER
                    ================================================== */}

                    <div className="email-editor-header">

                        <div className="email-editor-heading">

                            <div className="email-editor-icon">
                                <SelectedIcon size={22} />
                            </div>

                            <div>
                                <h2>
                                    {selectedTemplate?.name}
                                </h2>

                                <p>
                                    Sent automatically when
                                    this event occurs.
                                </p>
                            </div>

                        </div>


                        <div className="email-editor-header-right">

                            <span
                                className={`email-status-badge ${
                                    selectedTemplate?.is_active
                                        ? "active"
                                        : "inactive"
                                }`}
                            >
                                <span />
                                {selectedTemplate?.is_active
                                    ? "Active"
                                    : "Inactive"}
                            </span>


                            <button
                                type="button"
                                className="email-main-toggle"
                                onClick={() =>
                                    handleToggleTemplate(
                                        selectedTemplateId
                                    )
                                }
                            >
                                {selectedTemplate?.is_active ? (
                                    <ToggleRight size={32} />
                                ) : (
                                    <ToggleLeft size={32} />
                                )}
                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        TABS
                    ================================================== */}

                    <div className="email-editor-tabs">

                        <button
                            type="button"
                            className={
                                activeTab === "content"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("content")
                            }
                        >
                            Email Content
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === "variables"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("variables")
                            }
                        >
                            Variables
                        </button>

                        <button
                            type="button"
                            className={
                                activeTab === "settings"
                                    ? "active"
                                    : ""
                            }
                            onClick={() =>
                                setActiveTab("settings")
                            }
                        >
                            Settings
                        </button>

                    </div>


                    {/* =================================================
                        EMAIL CONTENT
                    ================================================== */}

                    {activeTab === "content" && (

                        <div className="email-editor-content">

                            {/* LEFT CONTENT */}

                            <div className="email-compose-section">

                                <div className="email-form-field">

                                    <label>
                                        Subject
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="subject"
                                        value={
                                            formData.subject
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="Email subject"
                                    />

                                </div>


                                <div className="email-form-field">

                                    <label>
                                        From Name
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="text"
                                        name="from_name"
                                        value={
                                            formData.from_name
                                        }
                                        onChange={
                                            handleFormChange
                                        }
                                        placeholder="{{app_name}}"
                                    />

                                </div>


                                <div className="email-form-field">

                                    <label>
                                        Email Body
                                        <span>*</span>
                                    </label>


                                    <div className="email-rich-editor">

                                        <div className="email-editor-toolbar">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    document.execCommand(
                                                        "bold"
                                                    )
                                                }
                                            >
                                                <strong>B</strong>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    document.execCommand(
                                                        "italic"
                                                    )
                                                }
                                            >
                                                <em>I</em>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    document.execCommand(
                                                        "underline"
                                                    )
                                                }
                                            >
                                                <u>U</u>
                                            </button>

                                            <span />

                                            <button type="button">
                                                ≡
                                            </button>

                                            <button type="button">
                                                •
                                            </button>

                                            <button type="button">
                                                ☷
                                            </button>

                                            <span />

                                            <button type="button">
                                                ↗
                                            </button>

                                            <button type="button">
                                                🔗
                                            </button>

                                        </div>


                                        <textarea
                                            name="body"
                                            value={
                                                formData.body
                                            }
                                            onChange={
                                                handleFormChange
                                            }
                                            className="email-body-textarea"
                                            placeholder="Write your email content..."
                                        />

                                        <div className="email-character-count">
                                            {formData.body.length}
                                            /2000
                                        </div>

                                    </div>

                                </div>


                                {/* VARIABLES */}

                                <div className="email-available-variables">

                                    <div className="email-variable-heading">
                                        <Variable size={16} />
                                        Available Variables
                                    </div>


                                    <div className="email-variable-list">

                                        {[
                                            "{{admin_name}}",
                                            "{{admin_email}}",
                                            "{{company_name}}",
                                            "{{login_url}}",
                                            "{{activation_url}}",
                                            "{{app_name}}",
                                            "{{support_email}}",
                                        ].map(
                                            (variable) => (
                                                <button
                                                    type="button"
                                                    key={variable}
                                                    onClick={() =>
                                                        insertVariable(
                                                            variable
                                                        )
                                                    }
                                                >
                                                    {variable}
                                                </button>
                                            )
                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* RIGHT PREVIEW */}

                            <div className="email-preview-section">

                                <div className="email-preview-header">

                                    <h3>
                                        Email Preview
                                    </h3>


                                    <div className="email-preview-devices">

                                        <button
                                            type="button"
                                            className={
                                                previewDevice ===
                                                "desktop"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPreviewDevice(
                                                    "desktop"
                                                )
                                            }
                                            title="Desktop"
                                        >
                                            <Monitor
                                                size={16}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                previewDevice ===
                                                "tablet"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPreviewDevice(
                                                    "tablet"
                                                )
                                            }
                                            title="Tablet"
                                        >
                                            <Tablet
                                                size={16}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            className={
                                                previewDevice ===
                                                "mobile"
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setPreviewDevice(
                                                    "mobile"
                                                )
                                            }
                                            title="Mobile"
                                        >
                                            <Smartphone
                                                size={16}
                                            />
                                        </button>

                                    </div>

                                </div>


                                <div
                                    className={`email-preview-wrapper ${previewDevice}`}
                                >

                                    <div className="email-preview-card">

                                        <div className="email-preview-logo">
                                            <div className="email-preview-logo-mark">
                                                M
                                            </div>

                                            <strong>
                                                MAXUS CRM
                                            </strong>
                                        </div>


                                        <div className="email-preview-body">

                                            {previewBody
                                                .split("\n")
                                                .map(
                                                    (
                                                        line,
                                                        index
                                                    ) => {

                                                        if (
                                                            line ===
                                                            "[LOGIN_BUTTON]"
                                                        ) {
                                                            return (
                                                                <button
                                                                    key={
                                                                        index
                                                                    }
                                                                    type="button"
                                                                    className="email-preview-login-btn"
                                                                >
                                                                    Login
                                                                    to
                                                                    CRM
                                                                </button>
                                                            );
                                                        }

                                                        if (
                                                            line.trim() ===
                                                            ""
                                                        ) {
                                                            return (
                                                                <div
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="email-preview-space"
                                                                />
                                                            );
                                                        }

                                                        return (
                                                            <p
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                {
                                                                    line
                                                                }
                                                            </p>
                                                        );
                                                    }
                                                )}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        VARIABLES TAB
                    ================================================== */}

                    {activeTab === "variables" && (

                        <div className="email-tab-panel">

                            <div className="email-tab-panel-heading">
                                <Variable size={22} />

                                <div>
                                    <h3>
                                        Available Variables
                                    </h3>

                                    <p>
                                        Use these variables inside
                                        your email template.
                                    </p>
                                </div>
                            </div>


                            <div className="email-variable-table">

                                {[
                                    [
                                        "{{admin_name}}",
                                        "Admin user's name",
                                    ],
                                    [
                                        "{{admin_email}}",
                                        "Admin user's email",
                                    ],
                                    [
                                        "{{company_name}}",
                                        "Assigned company name",
                                    ],
                                    [
                                        "{{login_url}}",
                                        "CRM login URL",
                                    ],
                                    [
                                        "{{activation_url}}",
                                        "Account activation URL",
                                    ],
                                    [
                                        "{{app_name}}",
                                        "Application name",
                                    ],
                                    [
                                        "{{support_email}}",
                                        "Support email address",
                                    ],
                                ].map(
                                    ([variable, description]) => (
                                        <div
                                            className="email-variable-row"
                                            key={variable}
                                        >

                                            <code>
                                                {variable}
                                            </code>

                                            <span>
                                                {description}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    insertVariable(
                                                        variable
                                                    )
                                                }
                                            >
                                                Insert
                                            </button>

                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        SETTINGS TAB
                    ================================================== */}

                    {activeTab === "settings" && (

                        <div className="email-tab-panel">

                            <div className="email-settings-box">

                                <div className="email-setting-row">

                                    <div>
                                        <strong>
                                            Template Status
                                        </strong>

                                        <p>
                                            Enable or disable this
                                            automated email template.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="email-settings-toggle"
                                        onClick={() =>
                                            handleToggleTemplate(
                                                selectedTemplateId
                                            )
                                        }
                                    >
                                        {selectedTemplate?.is_active ? (
                                            <ToggleRight size={34} />
                                        ) : (
                                            <ToggleLeft size={34} />
                                        )}
                                    </button>

                                </div>


                                <div className="email-setting-row">

                                    <div>
                                        <strong>
                                            Trigger
                                        </strong>

                                        <p>
                                            Event that causes this
                                            email to be sent.
                                        </p>
                                    </div>

                                    <span className="email-trigger-badge">
                                        {selectedTemplate?.trigger}
                                    </span>

                                </div>


                                <div className="email-setting-row">

                                    <div>
                                        <strong>
                                            Template Type
                                        </strong>

                                        <p>
                                            Indicates whether this is
                                            a system or custom template.
                                        </p>
                                    </div>

                                    <span className="email-trigger-badge">
                                        {selectedTemplate?.is_default
                                            ? "System Template"
                                            : "Custom Template"}
                                    </span>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        EDITOR ACTION BAR
                    ================================================== */}

                    <div className="email-editor-actions">

                        <button
                            type="button"
                            className="email-secondary-action"
                            onClick={() =>
                                setShowPreview(true)
                            }
                        >
                            <Eye size={17} />
                            Preview
                        </button>


                        <button
                            type="button"
                            className="email-secondary-action"
                            onClick={() =>
                                alert(
                                    "Test email functionality will be connected to Laravel API."
                                )
                            }
                        >
                            <Send size={17} />
                            Send Test Email
                        </button>


                        <button
                            type="button"
                            className="email-primary-action"
                            onClick={handleSaveChanges}
                        >
                            <Save size={17} />
                            Save Changes
                        </button>

                    </div>

                </div>

            </div>


            {/* =====================================================
                ADD TEMPLATE MODAL
            ====================================================== */}

            {showAddModal && (

                <div className="email-modal-overlay">

                    <div className="email-modal">

                        <div className="email-modal-header">

                            <div className="email-modal-title">

                                <div className="email-modal-icon">
                                    <Plus size={21} />
                                </div>

                                <div>
                                    <h3>
                                        Add New Template
                                    </h3>

                                    <p>
                                        Create a custom email template.
                                    </p>
                                </div>

                            </div>


                            <button
                                type="button"
                                className="email-modal-close"
                                onClick={() =>
                                    setShowAddModal(false)
                                }
                            >
                                <X size={19} />
                            </button>

                        </div>


                        <div className="email-modal-body">

                            <div className="email-modal-field">

                                <label>
                                    Template Name
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    value={
                                        newTemplateName
                                    }
                                    onChange={(e) =>
                                        setNewTemplateName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Welcome Email"
                                />

                            </div>


                            <div className="email-modal-field">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    value={
                                        newTemplateDescription
                                    }
                                    onChange={(e) =>
                                        setNewTemplateDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Describe when this email will be sent."
                                    rows="3"
                                />

                            </div>


                            <div className="email-modal-field">

                                <label>
                                    Trigger
                                </label>

                                <input
                                    type="text"
                                    value={
                                        newTemplateTrigger
                                    }
                                    onChange={(e) =>
                                        setNewTemplateTrigger(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Custom Notification"
                                />

                            </div>

                        </div>


                        <div className="email-modal-actions">

                            <button
                                type="button"
                                className="email-modal-cancel"
                                onClick={() =>
                                    setShowAddModal(false)
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="email-modal-save"
                                onClick={handleAddTemplate}
                            >
                                <Plus size={16} />
                                Create Template
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                DELETE MODAL
            ====================================================== */}

            {showDeleteModal && templateToDelete && (

                <div className="email-modal-overlay">

                    <div className="email-delete-modal">

                        <div className="email-delete-icon">
                            <Trash2 size={24} />
                        </div>


                        <h3>
                            Delete Template?
                        </h3>


                        <p>
                            Are you sure you want to delete
                            {" "}
                            <strong>
                                "{templateToDelete.name}"
                            </strong>
                            ?
                        </p>


                        <span className="email-delete-warning">
                            This action cannot be undone.
                        </span>


                        <div className="email-delete-actions">

                            <button
                                type="button"
                                className="email-delete-cancel"
                                onClick={() => {
                                    setTemplateToDelete(null);
                                    setShowDeleteModal(false);
                                }}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="email-delete-confirm"
                                onClick={
                                    confirmDeleteTemplate
                                }
                            >
                                <Trash2 size={16} />
                                Delete Template
                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                FULL PREVIEW MODAL
            ====================================================== */}

            {showPreview && (

                <div className="email-modal-overlay">

                    <div className="email-full-preview-modal">

                        <div className="email-modal-header">

                            <div className="email-modal-title">

                                <div className="email-modal-icon">
                                    <Eye size={20} />
                                </div>

                                <div>
                                    <h3>
                                        Email Preview
                                    </h3>

                                    <p>
                                        Preview how the email will
                                        appear to the recipient.
                                    </p>
                                </div>

                            </div>


                            <button
                                type="button"
                                className="email-modal-close"
                                onClick={() =>
                                    setShowPreview(false)
                                }
                            >
                                <X size={19} />
                            </button>

                        </div>


                        <div className="email-full-preview-body">

                            <div className="email-full-preview-card">

                                <div className="email-preview-logo">
                                    <div className="email-preview-logo-mark">
                                        M
                                    </div>

                                    <strong>
                                        MAXUS CRM
                                    </strong>
                                </div>


                                <div className="email-preview-body">

                                    {previewBody
                                        .split("\n")
                                        .map(
                                            (
                                                line,
                                                index
                                            ) => {

                                                if (
                                                    line ===
                                                    "[LOGIN_BUTTON]"
                                                ) {
                                                    return (
                                                        <button
                                                            key={
                                                                index
                                                            }
                                                            type="button"
                                                            className="email-preview-login-btn"
                                                        >
                                                            Login
                                                            to
                                                            CRM
                                                        </button>
                                                    );
                                                }

                                                if (
                                                    line.trim() ===
                                                    ""
                                                ) {
                                                    return (
                                                        <div
                                                            key={
                                                                index
                                                            }
                                                            className="email-preview-space"
                                                        />
                                                    );
                                                }

                                                return (
                                                    <p
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        {line}
                                                    </p>
                                                );
                                            }
                                        )}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default EmailDraftFormat;