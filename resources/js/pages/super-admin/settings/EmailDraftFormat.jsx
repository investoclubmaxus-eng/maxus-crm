import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

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
    X,
    Variable,
    Monitor,
    Tablet,
    Smartphone,
    ToggleLeft,
    ToggleRight,
    Loader2,
} from "lucide-react";

import "./EmailDraftFormat.css";

import api from "../../../services/api";
import sweetAlert from "../../../utils/sweetAlert";


function EmailDraftFormat({ onNavigate }) {

    /* =========================================================
       STATES
    ========================================================== */

    const [templates, setTemplates] = useState([]);

    const [selectedTemplateId, setSelectedTemplateId] =
        useState(null);

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [showPreview, setShowPreview] =
        useState(false);

    const [showTestEmailModal, setShowTestEmailModal] =
        useState(false);

    const [activeTab, setActiveTab] =
        useState("content");

    const [previewDevice, setPreviewDevice] =
        useState("desktop");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [testingEmail, setTestingEmail] =
        useState(false);

    const [isDirty, setIsDirty] =
        useState(false);

    const [newTemplateName, setNewTemplateName] =
        useState("");

    const [newTemplateDescription, setNewTemplateDescription] =
        useState("");

    const [newTemplateTrigger, setNewTemplateTrigger] =
        useState("Custom Notification");

    const [testEmail, setTestEmail] =
        useState("");

    const [formData, setFormData] = useState({
        subject: "",
        from_name: "",
        body: "",
    });


    /* =========================================================
       ERROR MESSAGE HELPER
    ========================================================== */

    const getErrorMessage = (error, fallback) => {

        if (error?.response?.data?.message) {
            return error.response.data.message;
        }

        if (error?.response?.data?.errors) {

            const errors =
                error.response.data.errors;

            const firstError =
                Object.values(errors)
                    .flat()
                    .find(Boolean);

            if (firstError) {
                return firstError;
            }
        }

        return fallback;
    };


    /* =========================================================
       TEMPLATE ICON
    ========================================================== */

    const getTemplateIcon = (template) => {

        const trigger =
            String(template?.trigger || "")
                .toLowerCase();

        const name =
            String(template?.name || "")
                .toLowerCase();

        if (
            trigger.includes("admin created") ||
            trigger.includes("admin_created") ||
            name.includes("invitation")
        ) {
            return User;
        }

        if (
            trigger.includes("activated") ||
            trigger.includes("account_activated") ||
            name.includes("activated")
        ) {
            return Lock;
        }

        if (
            trigger.includes("password") ||
            trigger.includes("password_reset") ||
            name.includes("password")
        ) {
            return KeyRound;
        }

        if (
            trigger.includes("disabled") ||
            trigger.includes("account_disabled") ||
            name.includes("disabled")
        ) {
            return Ban;
        }

        if (
            trigger.includes("company") ||
            trigger.includes("company_access") ||
            name.includes("company")
        ) {
            return Building2;
        }

        return Mail;
    };


    /* =========================================================
       NORMALIZE API TEMPLATE
    ========================================================== */

    const normalizeTemplate = (template) => {

        if (!template) {
            return null;
        }

        return {
            ...template,

            id: Number(template.id),

            is_active:
                Boolean(template.is_active),

            is_default:
                Boolean(template.is_default),

            icon:
                template.icon ||
                "mail",

            last_updated:
                template.updated_at ||
                template.created_at ||
                template.last_updated ||
                null,
        };
    };


    /* =========================================================
       SELECTED TEMPLATE
    ========================================================== */

    const selectedTemplate = useMemo(() => {

        return templates.find(
            (template) =>
                Number(template.id) ===
                Number(selectedTemplateId)
        );

    }, [
        templates,
        selectedTemplateId,
    ]);


    /* =========================================================
       LOAD EMAIL TEMPLATES
    ========================================================== */

    const loadEmailTemplates = async () => {

        try {

            setLoading(true);

            const response = await api.get(
                "/superadmin/settings/email-templates"
            );

            const data = response.data;

            const apiTemplates =
                data.templates ??
                data.data ??
                [];

            const normalizedTemplates =
                apiTemplates.map(
                    normalizeTemplate
                );

            setTemplates(
                normalizedTemplates
            );

            if (
                normalizedTemplates.length > 0
            ) {

                setSelectedTemplateId(
                    normalizedTemplates[0].id
                );

            } else {

                setSelectedTemplateId(null);

                setFormData({
                    subject: "",
                    from_name: "",
                    body: "",
                });
            }

        } catch (error) {

            console.error(
                "Failed to load email templates:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to load email templates."
                )
            );

        } finally {

            setLoading(false);
        }
    };


    /* =========================================================
       INITIAL LOAD
    ========================================================== */

    useEffect(() => {

        loadEmailTemplates();

    }, []);


    /* =========================================================
       LOAD SELECTED TEMPLATE
    ========================================================== */

    useEffect(() => {

        if (!selectedTemplate) {

            setFormData({
                subject: "",
                from_name: "",
                body: "",
            });

            return;
        }

        setFormData({
            subject:
                selectedTemplate.subject || "",

            from_name:
                selectedTemplate.from_name || "",

            body:
                selectedTemplate.body || "",
        });

        setIsDirty(false);

        setActiveTab("content");

    }, [selectedTemplateId]);


    /* =========================================================
       HANDLE FORM CHANGE
    ========================================================== */

    const handleFormChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setIsDirty(true);
    };


    /* =========================================================
       SAVE CURRENT TEMPLATE
    ========================================================== */

    const handleSaveChanges = async () => {

        if (!selectedTemplate) {

            await sweetAlert.error(
                "Please select an email template."
            );

            return;
        }

        if (!formData.subject.trim()) {

            await sweetAlert.error(
                "Email subject is required."
            );

            return;
        }

        if (!formData.from_name.trim()) {

            await sweetAlert.error(
                "From name is required."
            );

            return;
        }

        if (!formData.body.trim()) {

            await sweetAlert.error(
                "Email body is required."
            );

            return;
        }

        if (formData.body.length > 2000) {

            await sweetAlert.error(
                "Email body cannot exceed 2000 characters."
            );

            return;
        }

        try {

            setSaving(true);

            const response = await api.put(
                `/superadmin/settings/email-templates/${selectedTemplate.id}`,
                {
                    subject:
                        formData.subject,

                    from_name:
                        formData.from_name,

                    body:
                        formData.body,
                }
            );

            const updatedTemplate =
                response.data?.template ??
                response.data?.data;

            if (updatedTemplate) {

                const normalizedTemplate =
                    normalizeTemplate(
                        updatedTemplate
                    );

                setTemplates((previous) =>
                    previous.map((template) =>
                        Number(template.id) ===
                        Number(
                            normalizedTemplate.id
                        )
                            ? {
                                  ...template,
                                  ...normalizedTemplate,
                              }
                            : template
                    )
                );

            } else {

                setTemplates((previous) =>
                    previous.map((template) =>
                        Number(template.id) ===
                        Number(selectedTemplate.id)
                            ? {
                                  ...template,

                                  subject:
                                      formData.subject,

                                  from_name:
                                      formData.from_name,

                                  body:
                                      formData.body,

                                  updated_at:
                                      new Date()
                                          .toISOString(),

                                  last_updated:
                                      new Date()
                                          .toISOString(),
                              }
                            : template
                    )
                );
            }

            setIsDirty(false);

            await sweetAlert.success(
                response.data?.message ||
                "Email template saved successfully."
            );

        } catch (error) {

            console.error(
                "Failed to save email template:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to save the email template."
                )
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       TOGGLE TEMPLATE
    ========================================================== */

    const handleToggleTemplate = async (id) => {

        try {

            const templateId = Number(id);

            if (
                !Number.isInteger(templateId) ||
                templateId < 1
            ) {

                await sweetAlert.error(
                    "Invalid email template ID."
                );

                return;
            }

            const response = await api.patch(
                `/superadmin/settings/email-templates/${templateId}/toggle`
            );

            const updatedTemplate =
                response.data?.template ??
                response.data?.data;

            if (!updatedTemplate) {

                throw new Error(
                    "Template status was updated, but no template data was returned."
                );
            }

            const updatedId =
                Number(
                    updatedTemplate.id ??
                    templateId
                );

            const updatedIsActive =
                Boolean(
                    updatedTemplate.is_active
                );

            /*
             * Only update status.
             * Keep subject, from_name, body,
             * description, trigger etc.
             */
            setTemplates((previous) =>
                previous.map((template) =>
                    Number(template.id) ===
                    updatedId
                        ? {
                              ...template,

                              is_active:
                                  updatedIsActive,

                              updated_at:
                                  updatedTemplate.updated_at ??
                                  template.updated_at,

                              last_updated:
                                  updatedTemplate.updated_at ??
                                  template.last_updated,
                          }
                        : template
                )
            );

            await sweetAlert.success(
                response.data?.message ||
                "Email template status updated successfully."
            );

        } catch (error) {

            console.error(
                "Toggle email template failed:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to update template status."
                )
            );
        }
    };


    /* =========================================================
       ADD TEMPLATE
    ========================================================== */

    const handleAddTemplate = async () => {

        if (!newTemplateName.trim()) {

            await sweetAlert.error(
                "Template name is required."
            );

            return;
        }

        if (!newTemplateTrigger.trim()) {

            await sweetAlert.error(
                "Template trigger is required."
            );

            return;
        }

        try {

            setSaving(true);

            const response = await api.post(
                "/superadmin/settings/email-templates",
                {
                    name:
                        newTemplateName.trim(),

                    description:
                        newTemplateDescription.trim() ||
                        "Custom email notification template.",

                    trigger:
                        newTemplateTrigger.trim(),

                    subject:
                        "Notification from {{app_name}}",

                    from_name:
                        "{{app_name}}",

                    body:
`Hello {{admin_name}},

This is a new email notification from {{app_name}}.

Please update this message according to your requirements.

Regards,
{{app_name}} Team`,

                    is_active:
                        true,

                    is_default:
                        false,
                }
            );

            const createdTemplate =
                response.data?.template ??
                response.data?.data;

            if (!createdTemplate) {

                throw new Error(
                    "Template was created but no template data was returned."
                );
            }

            const normalizedTemplate =
                normalizeTemplate(
                    createdTemplate
                );

            setTemplates((previous) => [
                ...previous,
                normalizedTemplate,
            ]);

            setSelectedTemplateId(
                normalizedTemplate.id
            );

            setNewTemplateName("");

            setNewTemplateDescription("");

            setNewTemplateTrigger(
                "Custom Notification"
            );

            setShowAddModal(false);

            await sweetAlert.success(
                response.data?.message ||
                "Email template created successfully."
            );

        } catch (error) {

            console.error(
                "Failed to create email template:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to create the email template."
                )
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       DELETE TEMPLATE
    ========================================================== */

    const handleDeleteTemplate = async (template) => {

        if (!template) {
            return;
        }

        if (template.is_default) {

            await sweetAlert.error(
                "Default system templates cannot be deleted."
            );

            return;
        }

        const result =
            await sweetAlert.confirm(
                `Are you sure you want to delete "${template.name}"?`,
                {
                    title: "Delete Email Template?",
                    confirmText: "Yes, Delete",
                    cancelText: "Cancel",
                }
            );

        if (!result?.isConfirmed) {
            return;
        }

        try {

            setSaving(true);

            const response = await api.delete(
                `/superadmin/settings/email-templates/${template.id}`
            );

            const remainingTemplates =
                templates.filter(
                    (item) =>
                        Number(item.id) !==
                        Number(template.id)
                );

            setTemplates(
                remainingTemplates
            );

            if (
                Number(selectedTemplateId) ===
                Number(template.id)
            ) {

                if (
                    remainingTemplates.length > 0
                ) {

                    setSelectedTemplateId(
                        remainingTemplates[0].id
                    );

                } else {

                    setSelectedTemplateId(null);

                    setFormData({
                        subject: "",
                        from_name: "",
                        body: "",
                    });
                }
            }

            await sweetAlert.success(
                response.data?.message ||
                "Email template deleted successfully."
            );

        } catch (error) {

            console.error(
                "Failed to delete email template:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to delete the email template."
                )
            );

        } finally {

            setSaving(false);
        }
    };


    /* =========================================================
       INSERT VARIABLE
    ========================================================== */

    const insertVariable = (variable) => {

        setFormData((previous) => {

            const currentBody =
                previous.body || "";

            const newBody =
                currentBody.length > 0
                    ? `${currentBody}\n${variable}`
                    : variable;

            return {
                ...previous,
                body: newBody,
            };
        });

        setIsDirty(true);
    };


    /* =========================================================
       PREVIEW VARIABLE VALUES
    ========================================================== */

    const previewVariables = {
        admin_name: "John Smith",
        admin_email: "john@example.com",
        company_name: "ABC Realty",
        login_url: "#",
        activation_url: "#",
        app_name: "Maxus CRM",
        support_email: "support@maxus.com",
    };


    /* =========================================================
       REPLACE PREVIEW VARIABLES
    ========================================================== */

    const replacePreviewVariables = (value = "") => {

        let result = String(value);

        Object.entries(
            previewVariables
        ).forEach(
            ([variable, replacement]) => {

                const regex =
                    new RegExp(
                        `{{\\s*${variable}\\s*}}`,
                        "gi"
                    );

                result =
                    result.replace(
                        regex,
                        replacement
                    );
            }
        );

        result =
            result.replace(
                /\b(Maxus CRM)\s+CRM\b/gi,
                "$1"
            );

        result =
            result.replace(
                /\b(MAXUS CRM)\s+CRM\b/gi,
                "$1"
            );

        return result;
    };


    /* =========================================================
       PREVIEW VALUES
    ========================================================== */

    const previewSubject = useMemo(() => {

        return replacePreviewVariables(
            formData.subject ||
            "Email Subject"
        );

    }, [
        formData.subject,
    ]);


    const previewFromName = useMemo(() => {

        return replacePreviewVariables(
            formData.from_name ||
            "{{app_name}} Team"
        );

    }, [
        formData.from_name,
    ]);


    const previewBody = useMemo(() => {

        return replacePreviewVariables(
            formData.body || ""
        );

    }, [
        formData.body,
    ]);


    /* =========================================================
       PREVIEW RENDER
    ========================================================== */

    const renderPreviewBody = () => {

        if (!previewBody.trim()) {

            return (
                <div className="email-preview-empty">
                    No email content available.
                </div>
            );
        }

        return previewBody
            .split("\n")
            .map((line, index) => {

                const trimmedLine =
                    line.trim();

                if (
                    trimmedLine ===
                    "[LOGIN_BUTTON]"
                ) {

                    return (
                        <div
                            key={index}
                            className="email-preview-button-row"
                        >
                            <a
                                href="#"
                                className="email-preview-login-btn"
                                onClick={(event) =>
                                    event.preventDefault()
                                }
                            >
                                Login to CRM
                            </a>
                        </div>
                    );
                }

                if (
                    trimmedLine === ""
                ) {

                    return (
                        <div
                            key={index}
                            className="email-preview-space"
                        />
                    );
                }

                if (
                    index === 0 &&
                    (
                        trimmedLine
                            .toLowerCase()
                            .includes("welcome to")
                    )
                ) {

                    return (
                        <p
                            key={index}
                            className="email-preview-welcome"
                        >
                            {line}
                        </p>
                    );
                }

                return (
                    <p
                        key={index}
                        className="email-preview-paragraph"
                    >
                        {line}
                    </p>
                );
            });
    };


    /* =========================================================
       OPEN TEST EMAIL MODAL
    ========================================================== */

    const handleOpenTestEmailModal = () => {

        if (!selectedTemplate) {

            sweetAlert.error(
                "Please select an email template."
            );

            return;
        }

        if (isDirty) {

            sweetAlert.error(
                "Please save your template changes before sending a test email."
            );

            return;
        }

        setTestEmail("");

        setShowTestEmailModal(true);
    };


    /* =========================================================
       SEND TEST EMAIL
    ========================================================== */

    const handleSendTestEmail = async () => {

        if (!selectedTemplate) {

            await sweetAlert.error(
                "Please select an email template."
            );

            return;
        }

        if (isDirty) {

            await sweetAlert.error(
                "Please save your template changes before sending a test email."
            );

            return;
        }

        if (!testEmail.trim()) {

            await sweetAlert.error(
                "Please enter the test email address."
            );

            return;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailPattern.test(
                testEmail.trim()
            )
        ) {

            await sweetAlert.error(
                "Please enter a valid email address."
            );

            return;
        }

        try {

            setTestingEmail(true);

            const response = await api.post(
                `/superadmin/settings/email-templates/${selectedTemplate.id}/test`,
                {
                    test_email:
                        testEmail.trim(),
                }
            );

            setShowTestEmailModal(false);

            await sweetAlert.success(
                response.data?.message ||
                "Test email sent successfully."
            );

        } catch (error) {

            console.error(
                "Failed to send test email:",
                error
            );

            await sweetAlert.error(
                getErrorMessage(
                    error,
                    "Unable to send the test email."
                )
            );

        } finally {

            setTestingEmail(false);
        }
    };


    /* =========================================================
       NAVIGATION
    ========================================================== */

    const handleBackToSettings = () => {

        if (onNavigate) {

            onNavigate(
                "/system-settings"
            );
        }
    };


    /* =========================================================
       FORMAT UPDATED DATE
    ========================================================== */

    const formatUpdatedDate = (template) => {

        const value =
            template?.updated_at ||
            template?.created_at ||
            template?.last_updated;

        if (!value) {
            return "Not updated yet";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);
        }

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };


    /* =========================================================
       LOADING SCREEN
    ========================================================== */

    if (loading) {

        return (
            <div className="email-draft-page">

                <div className="email-draft-loading">

                    <Loader2
                        size={28}
                        className="email-loading-spinner"
                    />

                    <p>
                        Loading email templates...
                    </p>

                </div>

            </div>
        );
    }


    /* =========================================================
       PAGE
    ========================================================== */

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

                        <h1>
                            Email Draft Format
                        </h1>

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
                        onClick={
                            handleBackToSettings
                        }
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
                MAIN CONTAINER
            ====================================================== */}

            <div className="email-draft-main-container">

                {/* LEFT TEMPLATE PANEL */}

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

                        {templates.length === 0 && (

                            <div className="email-empty-state">

                                <Mail size={30} />

                                <h3>
                                    No Email Templates
                                </h3>

                                <p>
                                    Create your first email template
                                    to get started.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddModal(true)
                                    }
                                >
                                    <Plus size={16} />
                                    Add Template
                                </button>

                            </div>
                        )}


                        {templates.map(
                            (template) => {

                                const TemplateIcon =
                                    getTemplateIcon(
                                        template
                                    );

                                const isSelected =
                                    Number(
                                        selectedTemplateId
                                    ) ===
                                    Number(
                                        template.id
                                    );

                                return (
                                    <div
                                        key={
                                            template.id
                                        }
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
                                                    {
                                                        template.name
                                                    }
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

                                                        {
                                                            template.is_active
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                    </span>


                                                    {!template.is_default && (

                                                        <button
                                                            type="button"
                                                            className="email-template-delete-btn"
                                                            title="Delete Template"
                                                            onClick={(
                                                                event
                                                            ) => {

                                                                event.stopPropagation();

                                                                handleDeleteTemplate(
                                                                    template
                                                                );
                                                            }}
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
                                                {
                                                    template.description
                                                }
                                            </p>


                                            <div className="email-template-meta">

                                                <span>
                                                    Trigger:{" "}
                                                    {
                                                        template.trigger
                                                    }
                                                </span>

                                                <span>
                                                    Last Updated:{" "}
                                                    {
                                                        formatUpdatedDate(
                                                            template
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                </div>


                {/* RIGHT EDITOR */}

                {selectedTemplate ? (

                    <div className="email-editor-panel">

                        {/* EDITOR HEADER */}

                        <div className="email-editor-header">

                            <div className="email-editor-heading">

                                <div className="email-editor-icon">

                                    {React.createElement(
                                        getTemplateIcon(
                                            selectedTemplate
                                        ),
                                        {
                                            size: 22,
                                        }
                                    )}

                                </div>

                                <div>

                                    <h2>
                                        {
                                            selectedTemplate.name
                                        }
                                    </h2>

                                    <p>
                                        {
                                            selectedTemplate.description ||
                                            "Sent automatically when this event occurs."
                                        }
                                    </p>

                                </div>

                            </div>


                            <div className="email-editor-header-right">

                                <span
                                    className={`email-status-badge ${
                                        selectedTemplate.is_active
                                            ? "active"
                                            : "inactive"
                                    }`}
                                >

                                    <span />

                                    {
                                        selectedTemplate.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }

                                </span>


                                <button
                                    type="button"
                                    className="email-main-toggle"
                                    onClick={() =>
                                        handleToggleTemplate(
                                            selectedTemplate.id
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    {selectedTemplate.is_active ? (
                                        <ToggleRight
                                            size={32}
                                        />
                                    ) : (
                                        <ToggleLeft
                                            size={32}
                                        />
                                    )}

                                </button>

                            </div>

                        </div>


                        {/* TABS */}

                        <div className="email-editor-tabs">

                            <button
                                type="button"
                                className={
                                    activeTab === "content"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "content"
                                    )
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
                                    setActiveTab(
                                        "variables"
                                    )
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
                                    setActiveTab(
                                        "settings"
                                    )
                                }
                            >
                                Settings
                            </button>

                        </div>


                        {/* EMAIL CONTENT */}

                        {activeTab === "content" && (

                            <div className="email-editor-content">

                                {/* LEFT */}

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
                                            maxLength={255}
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
                                            maxLength={255}
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
                                                    title="Bold"
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
                                                    title="Italic"
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
                                                    title="Underline"
                                                    onClick={() =>
                                                        document.execCommand(
                                                            "underline"
                                                        )
                                                    }
                                                >
                                                    <u>U</u>
                                                </button>

                                                <span />

                                                <button
                                                    type="button"
                                                    title="Align"
                                                >
                                                    ≡
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Bullet list"
                                                >
                                                    •
                                                </button>

                                                <button
                                                    type="button"
                                                    title="List"
                                                >
                                                    ☷
                                                </button>

                                                <span />

                                                <button
                                                    type="button"
                                                    title="Link"
                                                >
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
                                                maxLength={2000}
                                            />


                                            <div className="email-character-count">

                                                {
                                                    formData.body.length
                                                }
                                                /2000

                                            </div>

                                        </div>

                                    </div>


                                    {/* VARIABLES */}

                                    <div className="email-available-variables">

                                        <div className="email-variable-heading">

                                            <Variable
                                                size={16}
                                            />

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
                                                        key={
                                                            variable
                                                        }
                                                        onClick={() =>
                                                            insertVariable(
                                                                variable
                                                            )
                                                        }
                                                    >
                                                        {
                                                            variable
                                                        }
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
                                            >
                                                <Monitor size={16} />
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
                                            >
                                                <Tablet size={16} />
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
                                            >
                                                <Smartphone size={16} />
                                            </button>

                                        </div>

                                    </div>


                                    <div
                                        className={`email-full-preview-workspace ${previewDevice}`}
                                    >

                                        <div className="email-full-preview-card">

                                            <div className="email-full-preview-brand email-preview-dark-header">

                                                <div>

                                                    <strong className="email-preview-brand-text">
                                                        MAXUS
                                                    </strong>

                                                    <span className="email-preview-brand-sub">
                                                        CRM &nbsp;|&nbsp;
                                                        Powering Performance.
                                                        Managing Growth.
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="email-full-preview-information">

                                                <div className="email-full-preview-from">

                                                    <span>
                                                        From
                                                    </span>

                                                    <strong>
                                                        {previewFromName}
                                                    </strong>

                                                </div>


                                                <div className="email-full-preview-subject-row">

                                                    <span>
                                                        Subject
                                                    </span>

                                                    <strong>
                                                        {previewSubject}
                                                    </strong>

                                                </div>

                                            </div>


                                            <div className="email-full-preview-content">

                                                {renderPreviewBody()}

                                            </div>


                                            <div className="email-full-preview-footer">

                                                <strong>
                                                    MAXUS CRM
                                                </strong>

                                                <span>
                                                    Powering Performance.
                                                    Managing Growth.
                                                </span>

                                                <span>
                                                    ©{" "}
                                                    {new Date().getFullYear()}
                                                    {" "}
                                                    Maxus Professionals Pvt Ltd
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>
                        )}


                        {/* VARIABLES TAB */}

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
                                        ([
                                            variable,
                                            description,
                                        ]) => (

                                            <div
                                                className="email-variable-row"
                                                key={
                                                    variable
                                                }
                                            >

                                                <code>
                                                    {
                                                        variable
                                                    }
                                                </code>

                                                <span>
                                                    {
                                                        description
                                                    }
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


                        {/* SETTINGS TAB */}

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
                                                    selectedTemplate.id
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                        >

                                            {selectedTemplate.is_active ? (
                                                <ToggleRight
                                                    size={34}
                                                />
                                            ) : (
                                                <ToggleLeft
                                                    size={34}
                                                />
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

                                            {
                                                selectedTemplate.trigger
                                            }

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

                                            {
                                                selectedTemplate.is_default
                                                    ? "System Template"
                                                    : "Custom Template"
                                            }

                                        </span>

                                    </div>

                                </div>

                            </div>
                        )}


                        {/* ACTION BAR */}

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


                            {/* =================================================
                                SEND TEST EMAIL
                            ================================================== */}

                            <button
                                type="button"
                                className="email-secondary-action"
                                onClick={
                                    handleOpenTestEmailModal
                                }
                                disabled={
                                    testingEmail ||
                                    saving
                                }
                            >

                                <Send size={17} />

                                Send Test Email

                            </button>


                            <button
                                type="button"
                                className="email-primary-action"
                                onClick={
                                    handleSaveChanges
                                }
                                disabled={
                                    saving ||
                                    !isDirty
                                }
                            >

                                {saving ? (
                                    <Loader2
                                        size={17}
                                        className="email-loading-spinner"
                                    />
                                ) : (
                                    <Save size={17} />
                                )}

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>

                    </div>

                ) : (

                    <div className="email-editor-empty">

                        <Mail size={42} />

                        <h3>
                            Select an Email Template
                        </h3>

                        <p>
                            Select a template from the left
                            panel to start editing.
                        </p>

                    </div>
                )}

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
                                    onChange={(event) =>
                                        setNewTemplateName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Welcome Email"
                                    maxLength={255}
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
                                    onChange={(event) =>
                                        setNewTemplateDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Describe when this email will be sent."
                                    rows="3"
                                    maxLength={500}
                                />

                            </div>


                            <div className="email-modal-field">

                                <label>
                                    Trigger
                                    <span>*</span>
                                </label>

                                <input
                                    type="text"
                                    value={
                                        newTemplateTrigger
                                    }
                                    onChange={(event) =>
                                        setNewTemplateTrigger(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Custom Notification"
                                    maxLength={255}
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
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="email-modal-save"
                                onClick={
                                    handleAddTemplate
                                }
                                disabled={
                                    saving
                                }
                            >

                                {saving ? (
                                    <Loader2
                                        size={16}
                                        className="email-loading-spinner"
                                    />
                                ) : (
                                    <Plus size={16} />
                                )}

                                {saving
                                    ? "Creating..."
                                    : "Create Template"}

                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                TEST EMAIL MODAL
            ====================================================== */}

            {showTestEmailModal && selectedTemplate && (

                <div
                    className="email-modal-overlay"
                    onClick={() => {
                        if (!testingEmail) {
                            setShowTestEmailModal(false);
                        }
                    }}
                >

                    <div
                        className="email-modal email-test-email-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* HEADER */}

                        <div className="email-modal-header">

                            <div className="email-modal-title">

                                <div className="email-modal-icon">
                                    <Send size={20} />
                                </div>

                                <div>

                                    <h3>
                                        Send Test Email
                                    </h3>

                                    <p>
                                        Test the selected email template.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="email-modal-close"
                                onClick={() => {
                                    if (!testingEmail) {
                                        setShowTestEmailModal(false);
                                    }
                                }}
                                disabled={testingEmail}
                            >
                                <X size={19} />
                            </button>

                        </div>


                        {/* BODY */}

                        <div className="email-modal-body">

                            <div className="email-test-template-info">

                                <div className="email-test-template-icon">

                                    {React.createElement(
                                        getTemplateIcon(
                                            selectedTemplate
                                        ),
                                        {
                                            size: 20,
                                        }
                                    )}

                                </div>

                                <div>

                                    <strong>
                                        {
                                            selectedTemplate.name
                                        }
                                    </strong>

                                    <span>
                                        {
                                            selectedTemplate.subject ||
                                            "Email template"
                                        }
                                    </span>

                                </div>

                            </div>


                            <div className="email-modal-field">

                                <label>
                                    Test Email Address
                                    <span>*</span>
                                </label>

                                <input
                                    type="email"
                                    value={
                                        testEmail
                                    }
                                    onChange={(event) =>
                                        setTestEmail(
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) => {

                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            event.preventDefault();

                                            handleSendTestEmail();
                                        }

                                    }}
                                    placeholder="example@gmail.com"
                                    autoFocus
                                    disabled={
                                        testingEmail
                                    }
                                />

                                <small>
                                    The saved version of this template
                                    will be sent to this address.
                                </small>

                            </div>


                            <div className="email-test-warning">

                                <Mail size={17} />

                                <span>
                                    Test emails use the currently
                                    configured SMTP settings.
                                </span>

                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="email-modal-actions">

                            <button
                                type="button"
                                className="email-modal-cancel"
                                onClick={() =>
                                    setShowTestEmailModal(false)
                                }
                                disabled={
                                    testingEmail
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="email-modal-save"
                                onClick={
                                    handleSendTestEmail
                                }
                                disabled={
                                    testingEmail ||
                                    !testEmail.trim()
                                }
                            >

                                {testingEmail ? (
                                    <Loader2
                                        size={16}
                                        className="email-loading-spinner"
                                    />
                                ) : (
                                    <Send size={16} />
                                )}

                                {testingEmail
                                    ? "Sending..."
                                    : "Send Test Email"}

                            </button>

                        </div>

                    </div>

                </div>
            )}


            {/* =====================================================
                FULL EMAIL PREVIEW MODAL
            ====================================================== */}

            {showPreview &&
                selectedTemplate && (

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

                                <div className="email-full-preview-toolbar">

                                    <div>

                                        <span className="email-preview-toolbar-label">
                                            Recipient Preview
                                        </span>

                                        <span className="email-preview-toolbar-value">
                                            {previewSubject}
                                        </span>

                                    </div>


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
                                            title="Desktop preview"
                                        >
                                            <Monitor size={16} />
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
                                            title="Tablet preview"
                                        >
                                            <Tablet size={16} />
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
                                            title="Mobile preview"
                                        >
                                            <Smartphone size={16} />
                                        </button>

                                    </div>

                                </div>


                                <div
                                    className={`email-full-preview-workspace ${previewDevice}`}
                                >

                                    <div className="email-full-preview-card">

                                        <div className="email-full-preview-brand email-preview-dark-header">

                                            <div>

                                                <strong className="email-preview-brand-text">
                                                    MAXUS
                                                </strong>

                                                <span className="email-preview-brand-sub">
                                                    CRM &nbsp;|&nbsp;
                                                    Powering Performance.
                                                    Managing Growth.
                                                </span>

                                            </div>

                                        </div>


                                        <div className="email-full-preview-information">

                                            <div className="email-full-preview-from">

                                                <span>
                                                    From
                                                </span>

                                                <strong>
                                                    {previewFromName}
                                                </strong>

                                            </div>


                                            <div className="email-full-preview-subject-row">

                                                <span>
                                                    Subject
                                                </span>

                                                <strong>
                                                    {previewSubject}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="email-full-preview-content">

                                            {renderPreviewBody()}

                                        </div>


                                        <div className="email-full-preview-footer">

                                            <strong>
                                                MAXUS CRM
                                            </strong>

                                            <span>
                                                Powering Performance.
                                                Managing Growth.
                                            </span>

                                            <span>
                                                ©{" "}
                                                {new Date().getFullYear()}
                                                {" "}
                                                Maxus Professionals Pvt Ltd
                                            </span>

                                        </div>

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