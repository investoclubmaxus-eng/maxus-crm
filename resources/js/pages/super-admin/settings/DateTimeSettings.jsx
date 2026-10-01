import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Clock3,
    Globe2,
    CalendarDays,
    Save,
    X,
    Info,
    ChevronDown,
    Search,
} from "lucide-react";

import sweetAlert from "../../../utils/sweetAlert";

import api from "../../../services/api";
import "./DateTimeSettings.css";

function DateTimeSettings({ onNavigate }) {

    /*
    |--------------------------------------------------------------------------
    | Default Settings
    |--------------------------------------------------------------------------
    */

    const [timezone, setTimezone] = useState("Asia/Kolkata");
    const [dateFormat, setDateFormat] = useState("d M Y");
    const [timeFormat, setTimeFormat] = useState("12");
    const [weekStartsOn, setWeekStartsOn] = useState("tuesday");

    /*
    |--------------------------------------------------------------------------
    | UI State
    |--------------------------------------------------------------------------
    */

    const [currentTime, setCurrentTime] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [timezoneSearch, setTimezoneSearch] = useState("");
    const [timezoneDropdownOpen, setTimezoneDropdownOpen] =
        useState(false);

    const timezoneRef = useRef(null);

    /*
    |--------------------------------------------------------------------------
    | Date Format Options
    |--------------------------------------------------------------------------
    */

    const dateFormatOptions = [
        {
            value: "d M Y",
            label: "DD MMM YYYY",
            example: "20 Sep 2026",
        },
        {
            value: "d/m/Y",
            label: "DD/MM/YYYY",
            example: "20/09/2026",
        },
        {
            value: "m/d/Y",
            label: "MM/DD/YYYY",
            example: "09/20/2026",
        },
        {
            value: "Y-m-d",
            label: "YYYY-MM-DD",
            example: "2026-09-20",
        },
        {
            value: "d-m-Y",
            label: "DD-MM-YYYY",
            example: "20-09-2026",
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Week Options - All 7 Days
    |--------------------------------------------------------------------------
    */

    const weekOptions = [
        {
            value: "monday",
            label: "Monday",
        },
        {
            value: "tuesday",
            label: "Tuesday",
        },
        {
            value: "wednesday",
            label: "Wednesday",
        },
        {
            value: "thursday",
            label: "Thursday",
        },
        {
            value: "friday",
            label: "Friday",
        },
        {
            value: "saturday",
            label: "Saturday",
        },
        {
            value: "sunday",
            label: "Sunday",
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Live Clock
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load Settings
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadSettings = async () => {

            try {

                setLoading(true);

                const response = await api.get(
                    "/superadmin/settings/date-time"
                );

                const data = response.data?.data;

                if (data) {

                    /*
                    |------------------------------------------------------------------
                    | Keep exact backend values
                    |------------------------------------------------------------------
                    */

                    setTimezone(
                        data.timezone || "Asia/Kolkata"
                    );

                    setDateFormat(
                        data.date_format || "d M Y"
                    );

                    setTimeFormat(
                        String(data.time_format || "12")
                    );

                    setWeekStartsOn(
                        String(
                            data.week_starts_on || "tuesday"
                        ).toLowerCase()
                    );
                }

            } catch (error) {

                console.error(
                    "Unable to load Date & Time settings:",
                    error
                );

                sweetAlert.error(errorMessage);

            } finally {

                setLoading(false);
            }
        };

        loadSettings();

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Generate Timezone List
    |--------------------------------------------------------------------------
    */

    const timezoneOptions = useMemo(() => {

        let zones = [];

        if (
            typeof Intl !== "undefined" &&
            typeof Intl.supportedValuesOf === "function"
        ) {

            zones = Intl.supportedValuesOf("timeZone");

        } else {

            zones = [
                "Africa/Cairo",
                "Africa/Johannesburg",

                "America/Chicago",
                "America/Denver",
                "America/Los_Angeles",
                "America/New_York",
                "America/Toronto",
                "America/Vancouver",

                "Asia/Bangkok",

                "Asia/Dhaka",
                "Asia/Dubai",
                "Asia/Hong_Kong",
                "Asia/Jakarta",
                "Asia/Kolkata",
                "Asia/Shanghai",
                "Asia/Singapore",
                "Asia/Tokyo",

                "Australia/Melbourne",
                "Australia/Sydney",

                "Europe/Berlin",
                "Europe/London",
                "Europe/Moscow",
                "Europe/Paris",

                "Pacific/Auckland",

                "UTC",
            ];
        }

        const requiredZones = [
        "Asia/Kolkata",
        "Asia/Dubai",
        "Asia/Singapore",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Hong_Kong",
        "Asia/Bangkok",
        "Asia/Jakarta",

        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Europe/Moscow",

        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Toronto",
        "America/Vancouver",

        "Australia/Sydney",
        "Australia/Melbourne",

        "Africa/Cairo",
        "Africa/Johannesburg",

        "Pacific/Auckland",

        "UTC",
    ];

    zones = [...new Set([...zones, ...requiredZones])];

    return zones.sort();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Timezone Label
    |--------------------------------------------------------------------------
    */

    const getTimezoneLabel = (zone) => {

        try {

            const parts = new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: zone,
                    timeZoneName: "longOffset",
                }
            ).formatToParts(new Date());

            const offset =
                parts.find(
                    (part) =>
                        part.type === "timeZoneName"
                )?.value || "UTC";

            return `${zone} (${offset})`;

        } catch {

            return zone;
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Search Timezones
    |--------------------------------------------------------------------------
    */

    const filteredTimezones = useMemo(() => {

        const search = timezoneSearch
            .trim()
            .toLowerCase();

        if (!search) {
            return timezoneOptions;
        }

        return timezoneOptions.filter((zone) => {

            const label =
                getTimezoneLabel(zone).toLowerCase();

            return (
                zone.toLowerCase().includes(search) ||
                label.includes(search)
            );

        });

    }, [timezoneOptions, timezoneSearch]);

    /*
    |--------------------------------------------------------------------------
    | Close Timezone Dropdown When Clicking Outside
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const handleOutsideClick = (event) => {

            if (
                timezoneRef.current &&
                !timezoneRef.current.contains(event.target)
            ) {

                setTimezoneDropdownOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );

        };

    }, []);

    /*
    |--------------------------------------------------------------------------
    | Select Timezone
    |--------------------------------------------------------------------------
    */

    const handleTimezoneSelect = (zone) => {

        setTimezone(zone);

        setTimezoneSearch("");

        setTimezoneDropdownOpen(false);
    };

    /*
    |--------------------------------------------------------------------------
    | Format Date According To Selected Format
    |--------------------------------------------------------------------------
    */

    const formatDateBySetting = (date, format) => {

        const parts = new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone: timezone,
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        ).formatToParts(date);

        const day =
            parts.find(
                (item) => item.type === "day"
            )?.value || "";

        const monthShort =
            parts.find(
                (item) => item.type === "month"
            )?.value || "";

        const year =
            parts.find(
                (item) => item.type === "year"
            )?.value || "";

        const monthNumber =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: timezone,
                    month: "2-digit",
                }
            ).format(date);

        switch (format) {

            case "d M Y":
                return `${day} ${monthShort} ${year}`;

            case "d/m/Y":
                return `${day}/${monthNumber}/${year}`;

            case "m/d/Y":
                return `${monthNumber}/${day}/${year}`;

            case "Y-m-d":
                return `${year}-${monthNumber}-${day}`;

            case "d-m-Y":
                return `${day}-${monthNumber}-${year}`;

            default:
                return `${day} ${monthShort} ${year}`;
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Current Date
    |--------------------------------------------------------------------------
    */

    const formatCurrentDate = () => {

        return formatDateBySetting(
            currentTime,
            dateFormat
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Current Time
    |--------------------------------------------------------------------------
    */

    const formatCurrentTime = () => {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                timeZone: timezone,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: timeFormat === "12",
            }
        ).format(currentTime);
    };

    /*
    |--------------------------------------------------------------------------
    | Save Settings
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {

        try {

            setSaving(true);

            /*
            |------------------------------------------------------------------
            | IMPORTANT
            | These values exactly match DateTimeSettingRequest.php
            |------------------------------------------------------------------
            */

            const payload = {
                timezone: String(timezone),
                date_format: String(dateFormat),
                time_format: String(timeFormat),
                week_starts_on: String(weekStartsOn).toLowerCase(),
            };

            console.log(
                "Date & Time API Payload:",
                payload
            );

            const response = await api.put(
                "/superadmin/settings/date-time-update",
                payload
            );

            /*
            |------------------------------------------------------------------
            | Update state from server response
            |------------------------------------------------------------------
            */

            const savedData =
                response.data?.data;

            if (savedData) {

                setTimezone(
                    savedData.timezone ||
                    timezone
                );

                setDateFormat(
                    savedData.date_format ||
                    dateFormat
                );

                setTimeFormat(
                    String(
                        savedData.time_format ||
                        timeFormat
                    )
                );

                setWeekStartsOn(
                    String(
                        savedData.week_starts_on ||
                        weekStartsOn
                    ).toLowerCase()
                );
            }

            /*
            |------------------------------------------------------------------
            | SweetAlert Success
            |------------------------------------------------------------------
            */

            await sweetAlert.success(
                response.data?.message ||
                "Date & Time settings saved successfully."
            );

        } catch (error) {

            console.error(
                "Unable to save Date & Time settings:",
                error
            );

            /*
            |------------------------------------------------------------------
            | Laravel Validation Error
            |------------------------------------------------------------------
            */

            const validationErrors =
                error.response?.data?.errors;

            let errorMessage =
                error.response?.data?.message ||
                "Unable to save Date & Time settings.";

            if (validationErrors) {

                const firstError =
                    Object.values(validationErrors)
                        .flat()
                        .find(Boolean);

                if (firstError) {
                    errorMessage = firstError;
                }
            }

            /*
            |------------------------------------------------------------------
            | SweetAlert Error
            |------------------------------------------------------------------
            */

            sweetAlert.error(errorMessage);

        } finally {

            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {

        if (onNavigate) {

            onNavigate("/system-settings");
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Loading
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <div className="datetime-settings-page">

                <div className="datetime-loading">
                    Loading Date & Time settings...
                </div>

            </div>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Selected Timezone Label
    |--------------------------------------------------------------------------
    */

    const selectedTimezoneLabel =
        getTimezoneLabel(timezone);

    /*
    |--------------------------------------------------------------------------
    | Selected Date Example
    |--------------------------------------------------------------------------
    */

    const selectedDateExample =
        dateFormatOptions.find(
            (item) =>
                item.value === dateFormat
        )?.example ||
        formatCurrentDate();

    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (

        <div className="datetime-settings-page">

            {/* =========================================================
                PAGE HEADER
            ========================================================== */}

            <div className="datetime-page-header">

                <div className="datetime-title-section">

                    <div className="datetime-title-icon">

                        <Clock3 size={28} />

                    </div>

                    <div>

                        <h1>
                            Date & Time Settings
                        </h1>

                        <p>
                            Configure the timezone, date format and
                            time format used throughout the Maxus CRM.
                        </p>

                    </div>

                </div>

            </div>


            {/* =========================================================
                MAIN CARD
            ========================================================== */}

            <div className="datetime-settings-card">

                {/* =====================================================
                    TOP GRID
                ====================================================== */}

                <div className="datetime-top-grid">

                    {/* =================================================
                        TIMEZONE
                    ================================================== */}

                    <section className="datetime-section">

                        <div className="datetime-section-heading">

                            <div className="datetime-section-icon">

                                <Globe2 size={21} />

                            </div>

                            <div>

                                <h2>
                                    Timezone
                                </h2>

                                <p>
                                    Select the timezone for your
                                    application.
                                </p>

                            </div>

                        </div>


                        <div className="datetime-form-group">

                            <label>
                                Timezone <span>*</span>
                            </label>


                            {/* SEARCHABLE TIMEZONE */}

                            <div
                                className="datetime-timezone-search"
                                ref={timezoneRef}
                            >

                                <div className="datetime-timezone-input-wrapper">

                                    <Search size={17} />

                                    <input
                                        type="text"
                                        value={
                                            timezoneDropdownOpen
                                                ? timezoneSearch
                                                : selectedTimezoneLabel
                                        }
                                        placeholder="Search timezone..."
                                        onFocus={() => {

                                            setTimezoneDropdownOpen(
                                                true
                                            );

                                            setTimezoneSearch("");
                                        }}
                                        onChange={(e) => {

                                            setTimezoneSearch(
                                                e.target.value
                                            );

                                            setTimezoneDropdownOpen(
                                                true
                                            );
                                        }}
                                    />

                                    <ChevronDown
                                        size={18}
                                        className={
                                            timezoneDropdownOpen
                                                ? "timezone-chevron-open"
                                                : ""
                                        }
                                    />

                                </div>


                                {timezoneDropdownOpen && (

                                    <div className="datetime-timezone-dropdown">

                                        {filteredTimezones.length > 0 ? (

                                            filteredTimezones.map(
                                                (zone) => (

                                                    <button
                                                        type="button"
                                                        key={zone}
                                                        className={
                                                            `datetime-timezone-option ${
                                                                timezone === zone
                                                                    ? "active"
                                                                    : ""
                                                            }`
                                                        }
                                                        onClick={() =>
                                                            handleTimezoneSelect(
                                                                zone
                                                            )
                                                        }
                                                    >

                                                        <span>
                                                            {zone}
                                                        </span>

                                                        <small>
                                                            {
                                                                getTimezoneLabel(
                                                                    zone
                                                                ).replace(
                                                                    `${zone} `,
                                                                    ""
                                                                )
                                                            }
                                                        </small>

                                                    </button>

                                                )
                                            )

                                        ) : (

                                            <div className="datetime-timezone-empty">

                                                No timezone found.

                                            </div>

                                        )}

                                    </div>

                                )}

                            </div>


                            <small>

                                This timezone will be used for all
                                system dates and times.

                            </small>

                        </div>

                    </section>


                    {/* =================================================
                        CURRENT SYSTEM TIME
                    ================================================== */}

                    <section className="datetime-section">

                        <div className="datetime-section-heading">

                            <div className="datetime-section-icon">

                                <Clock3 size={21} />

                            </div>

                            <div>

                                <h2>
                                    Current System Time
                                </h2>

                                <p>
                                    Current date and time in the
                                    selected timezone.
                                </p>

                            </div>

                        </div>


                        <div className="datetime-current-time">

                            <div className="datetime-current-icon">

                                <CalendarDays size={25} />

                            </div>


                            <div>

                                <strong>
                                    {formatCurrentDate()}
                                </strong>

                                <b>
                                    {formatCurrentTime()}
                                </b>

                                <span>
                                    {selectedTimezoneLabel}
                                </span>

                            </div>

                        </div>

                    </section>

                </div>


                {/* =====================================================
                    FORMAT GRID
                ====================================================== */}

                <div className="datetime-format-grid">

                    {/* =================================================
                        DATE FORMAT
                    ================================================== */}

                    <section className="datetime-format-card">

                        <div className="datetime-section-heading">

                            <div className="datetime-section-icon">

                                <CalendarDays size={21} />

                            </div>

                            <div>

                                <h2>
                                    Date Format
                                </h2>

                                <p>
                                    Choose how dates will be displayed
                                    across the system.
                                </p>

                            </div>

                        </div>


                        <div className="datetime-form-group">

                            <label htmlFor="date-format">

                                Date Format <span>*</span>

                            </label>


                            <div className="datetime-select-wrapper">

                                <select
                                    id="date-format"
                                    value={dateFormat}
                                    onChange={(e) =>
                                        setDateFormat(
                                            e.target.value
                                        )
                                    }
                                >

                                    {dateFormatOptions.map(
                                        (option) => (

                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>

                                        )
                                    )}

                                </select>

                                <ChevronDown size={18} />

                            </div>


                            <small>

                                Example:{" "}

                                {selectedDateExample}

                            </small>

                        </div>

                    </section>


                    {/* =================================================
                        TIME FORMAT
                    ================================================== */}

                    <section className="datetime-format-card">

                        <div className="datetime-section-heading">

                            <div className="datetime-section-icon">

                                <Clock3 size={21} />

                            </div>

                            <div>

                                <h2>
                                    Time Format
                                </h2>

                                <p>
                                    Choose how time will be displayed
                                    across the system.
                                </p>

                            </div>

                        </div>


                        <div className="datetime-form-group">

                            <label htmlFor="time-format">

                                Time Format <span>*</span>

                            </label>


                            <div className="datetime-select-wrapper">

                                <select
                                    id="time-format"
                                    value={timeFormat}
                                    onChange={(e) =>
                                        setTimeFormat(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="12">
                                        12 Hour (AM/PM)
                                    </option>

                                    <option value="24">
                                        24 Hour
                                    </option>

                                </select>

                                <ChevronDown size={18} />

                            </div>


                            <small>

                                Current:{" "}

                                {formatCurrentTime()}

                            </small>

                        </div>

                    </section>

                </div>


                {/* =====================================================
                    WEEK START
                ====================================================== */}

                <section className="datetime-week-section">

                    <div className="datetime-section-heading">

                        <div className="datetime-section-icon">

                            <CalendarDays size={21} />

                        </div>

                        <div>

                            <h2>
                                Week Starts On
                            </h2>

                            <p>
                                Select the first day of the week for
                                calendars and reports.
                            </p>

                        </div>

                    </div>


                    <div className="datetime-week-control">

                        <div className="datetime-form-group">

                            <label htmlFor="week-start">

                                Week Starts On <span>*</span>

                            </label>


                            <div className="datetime-select-wrapper">

                                <select
                                    id="week-start"
                                    value={weekStartsOn}
                                    onChange={(e) =>
                                        setWeekStartsOn(
                                            e.target.value
                                        )
                                    }
                                >

                                    {weekOptions.map(
                                        (day) => (

                                            <option
                                                key={day.value}
                                                value={day.value}
                                            >
                                                {day.label}
                                            </option>

                                        )
                                    )}

                                </select>

                                <ChevronDown size={18} />

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    INFORMATION
                ====================================================== */}

                <div className="datetime-information">

                    <Info size={18} />

                    <p>
                        These settings will be applied across the
                        entire system and will affect dates, times
                        and reports in all modules.
                    </p>

                </div>


                {/* =====================================================
                    ACTIONS
                ====================================================== */}

                <div className="datetime-actions">

                    <button
                        type="button"
                        className="datetime-cancel-btn"
                        onClick={handleCancel}
                        disabled={saving}
                    >

                        <X size={18} />

                        Cancel

                    </button>


                    <button
                        type="button"
                        className="datetime-save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >

                        <Save size={18} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"}

                    </button>

                </div>

            </div>

        </div>
    );
}

export default DateTimeSettings;