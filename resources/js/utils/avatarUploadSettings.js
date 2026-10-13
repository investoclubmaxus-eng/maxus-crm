export const getAllowedFileTypes = (value) =>
    [...new Set(
        String(value || "")
            .split(",")
            .map((extension) =>
                extension.trim().replace(/^\./, "").toLowerCase()
            )
            .filter((extension) => /^[a-z0-9]+$/.test(extension))
    )];

export const getAvatarUploadError = (file, settings) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (file.type && !file.type.startsWith("image/")) {
        return "Profile photo must be a valid image.";
    }

    if (!settings.allowedFileTypes.includes(extension)) {
        return "Profile photo type must be allowed by File Storage settings.";
    }

    if (file.size > settings.maxUploadSize * 1024 * 1024) {
        return "Profile photo exceeds the maximum size configured in File Storage settings.";
    }

    return "";
};
