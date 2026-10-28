import React from "react";
import {
    Activity,
    BarChart3,
    Building2,
    UserPlus,
    UserRound,
    Users,
} from "lucide-react";

import "./Dashboard.css";

export default function CompanyDashboard({ company }) {
    const activeCompany = company || (() => {
        try {
            const raw =
                localStorage.getItem('active_company') ||
                sessionStorage.getItem('active_company');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const companyName = activeCompany?.name || "Company";

    const stats = [
        {
            title: "Total Employees",
            value: "28",
            text: "+4 this month",
            icon: UserRound,
            className: "orange",
        },
        {
            title: "Total Leads",
            value: "1,248",
            text: "+12.5% this month",
            icon: UserPlus,
            className: "purple",
        },
        {
            title: "Active Deals",
            value: "84",
            text: "+3 this week",
            icon: Activity,
            className: "blue",
        },
        {
            title: "Reports",
            value: "12",
            text: "Last 30 days",
            icon: BarChart3,
            className: "green",
        },
    ];

    return (
        <div className="company-re-dashboard-page">

            {/* =========================================================
                PAGE HEADING
            ========================================================= */}

            <div className="company-re-dashboard__heading">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back. Here's what's happening today.</p>
                </div>
            </div>

            {/* =========================================================
                STATS GRID
            ========================================================= */}

            <div className="company-re-dashboard__stats">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={index}
                            className={`company-re-dashboard__stat-card ${stat.className}`}
                        >
                            <div className="company-re-dashboard__stat-icon">
                                <Icon size={22} />
                            </div>

                            <div className="company-re-dashboard__stat-body">
                                <span className="company-re-dashboard__stat-title">
                                    {stat.title}
                                </span>

                                <strong className="company-re-dashboard__stat-value">
                                    {stat.value}
                                </strong>

                                <small className="company-re-dashboard__stat-text">
                                    {stat.text}
                                </small>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* =========================================================
                WELCOME CARD
            ========================================================= */}

            <div className="company-re-dashboard__welcome-card">
                <Building2 size={40} />
                <h2>{companyName} Real Estate Portal</h2>
                <p>
                    Manage your properties, leads, and team from a single place.
                </p>
            </div>

        </div>
    );
}
