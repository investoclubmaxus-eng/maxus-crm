import Swal from "sweetalert2";
import "./sweetAlert.css";

const baseConfig = {
    buttonsStyling: false,

    customClass: {
        popup: "maxus-swal-popup",
        icon: "maxus-swal-icon",
        title: "maxus-swal-title",
        htmlContainer: "maxus-swal-text",
        confirmButton: "maxus-swal-confirm",
        cancelButton: "maxus-swal-cancel",
        actions: "maxus-swal-actions",
    },
};

const icons = {
    success: `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M5 12.5L9.2 16.5L19 6.5"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    `,

    error: `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M7 7L17 17"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
            />
            <path
                d="M17 7L7 17"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
            />
        </svg>
    `,

    warning: `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 4L21 19H3L12 4Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
            />
            <path
                d="M12 9V13"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            />
            <circle
                cx="12"
                cy="16"
                r="1"
                fill="currentColor"
            />
        </svg>
    `,

    info: `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                stroke-width="2"
            />
            <path
                d="M12 10.5V16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
            />
            <circle
                cx="12"
                cy="7.5"
                r="1"
                fill="currentColor"
            />
        </svg>
    `,
};

const showAlert = ({
    type,
    title,
    message,
    confirmText = "OK",
    showCancelButton = false,
    cancelText = "Cancel",
    ...options
}) => {
    return Swal.fire({
        ...baseConfig,

        icon: undefined,

        iconHtml: icons[type],

        title,
        text: message,

        showCancelButton,

        confirmButtonText: confirmText,
        cancelButtonText: cancelText,

        customClass: {
            ...baseConfig.customClass,
        },

        ...options,
    });
};

const sweetAlert = {
    success: (message, options = {}) => {
        return showAlert({
            type: "success",
            title: "Success",
            message,
            ...options,
        });
    },

    error: (message, options = {}) => {
        return showAlert({
            type: "error",
            title: "Error",
            message,
            ...options,
        });
    },

    warning: (message, options = {}) => {
        return showAlert({
            type: "warning",
            title: "Warning",
            message,
            ...options,
        });
    },

    info: (message, options = {}) => {
        return showAlert({
            type: "info",
            title: "Information",
            message,
            ...options,
        });
    },

    confirm: (
        message,
        {
            title = "Are you sure?",
            confirmText = "Yes, Continue",
            cancelText = "Cancel",
            ...options
        } = {}
    ) => {
        return showAlert({
            type: "warning",
            title,
            message,
            confirmText,
            cancelText,
            showCancelButton: true,
            ...options,
        });
    },
};

export default sweetAlert;