import React from "react";
import {
    Activity,
    ArrowUpRight,
    BarChart3,
    Building2,
    CheckCircle2,
    Database,
    ShieldCheck,
    UserPlus,
    UserRound,
    Users,
} from "lucide-react";

import "./Dashboard.css";

function Dashboard() {
    const stats = [
        {
            title: "Total Companies",
            value: "3",
            text: "+1 this month",
            icon: Building2,
            className: "blue",
        },
        {
            title: "Total Admins",
            value: "3",
            text: "+1 this month",
            icon: Users,
            className: "green",
        },
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
    ];

    const companies = [
        {
            name: "Maxus Foundation",
            code: "MAXUS",
            admins: 2,
            employees: 18,
            leads: 820,
            status: "Active",
        },
        {
            name: "Company B",
            code: "COMP-B",
            admins: 1,
            employees: 7,
            leads: 312,
            status: "Active",
        },
        {
            name: "Company C",
            code: "COMP-C",
            admins: 0,
            employees: 3,
            leads: 116,
            status: "Active",
        },
    ];

    const activities = [
        {
            title: "New Company",
            description: "Maxus Foundation",
            time: "Today, 10:15 AM",
        },
        {
            title: "Admin Created",
            description: "John Doe",
            time: "Today, 09:42 AM",
        },
        {
            title: "Access Updated",
            description: "Company B",
            time: "Today, 08:30 AM",
        },
        {
            title: "Database Connected",
            description: "Platform database",
            time: "Yesterday, 04:20 PM",
        },
    ];

    const performance = [
        { name: "Maxus Foundation", value: 820, color: "blue" },
        { name: "Company B", value: 312, color: "green" },
        { name: "Company C", value: 116, color: "orange" },
    ];

    const platformSummary = [
        ["Active Companies", "3"],
        ["Active Admins", "3"],
        ["Employees", "28"],
        ["Leads", "1,248"],
    ];

    return (
        <div className="dashboard-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="dashboard-heading">
                <div>
                    <h1>Super Admin Dashboard</h1>

                    <p>Welcome back! Here's what's happening across MAXUS.</p>
                </div>

                <div className="dashboard-system-status">
                    <span className="dashboard-status-dot"></span>
                    System Online
                </div>
            </div>


            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="dashboard-stat-grid">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            className={`dashboard-stat-card ${stat.className}`}
                            key={stat.title}
                        >

                            <div className="dashboard-stat-icon">
                                <Icon size={24} strokeWidth={2} />
                            </div>

                            <div className="dashboard-stat-content">

                                <span className="dashboard-stat-title">
                                    {stat.title}
                                </span>

                                <strong className="dashboard-stat-value">
                                    {stat.value}
                                </strong>

                                <span className="dashboard-stat-growth">
                                    ↗ {stat.text}
                                </span>

                            </div>

                        </div>
                    );
                })}

            </div>


            <div className="dashboard-overview-grid">
                <section className="dashboard-card dashboard-performance-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Company Performance</h2>
                            <p>Lead volume by company.</p>
                        </div>
                    </div>

                    <div className="performance-list">
                        {performance.map((company) => (
                            <div className="performance-row" key={company.name}>
                                <span>{company.name}</span>
                                <div className="performance-bar-track">
                                    <span
                                        className={`performance-bar ${company.color}`}
                                        style={{ width: `${(company.value / 820) * 100}%` }}
                                    />
                                </div>
                                <strong>{company.value}</strong>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-card dashboard-summary-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Platform Summary</h2>
                            <p>Current platform totals.</p>
                        </div>
                    </div>

                    <div className="platform-summary-list">
                        {platformSummary.map(([label, value]) => (
                            <div className="platform-summary-row" key={label}>
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* =================================================
                COMPANY OVERVIEW
            ================================================= */}

            <section className="dashboard-card">

                <div className="dashboard-card-header">

                    <div>
                        <h2>Companies Overview</h2>

                        <p>
                            Overview of companies registered on the MAXUS
                            platform.
                        </p>
                    </div>

                    <button className="dashboard-view-button">
                        View All
                        <ArrowUpRight size={16} />
                    </button>

                </div>


                <div className="company-overview-grid">

                    {companies.map((company) => (
                        <div
                            className="company-overview-card"
                            key={company.code}
                        >

                            <div className="company-overview-top">

                                <div className="company-logo">
                                    {company.name.charAt(0)}
                                </div>

                                <span className="company-active-badge">
                                    <CheckCircle2 size={13} />
                                    {company.status}
                                </span>

                            </div>


                            <div className="company-information">

                                <h3>{company.name}</h3>

                                <span>{company.code}</span>

                            </div>


                            <div className="company-metrics">

                                <div>
                                    <span>Admins</span>
                                    <strong>{company.admins}</strong>
                                </div>

                                <div>
                                    <span>Employees</span>
                                    <strong>{company.employees}</strong>
                                </div>

                                <div>
                                    <span>Leads</span>
                                    <strong>{company.leads}</strong>
                                </div>

                            </div>


                            <button className="company-view-button">
                                View Company
                                <ArrowUpRight size={15} />
                            </button>

                        </div>
                    ))}

                </div>

            </section>


            {/* =================================================
                BOTTOM GRID
            ================================================= */}

            <div className="dashboard-bottom-grid">


                {/* RECENT ACTIVITY */}

                <section className="dashboard-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h2>Recent Activity</h2>

                            <p>
                                Latest activity across the platform.
                            </p>
                        </div>

                        <button className="dashboard-view-button">
                            View All
                            <ArrowUpRight size={16} />
                        </button>

                    </div>


                    <div className="activity-list">

                        {activities.map((activity, index) => (
                            <div
                                className="activity-row"
                                key={index}
                            >

                                <div className="activity-icon">
                                    <Activity size={17} />
                                </div>

                                <div className="activity-information">

                                    <strong>
                                        {activity.title}
                                    </strong>

                                    <span>
                                        {activity.description}
                                    </span>

                                </div>

                                <time>
                                    {activity.time}
                                </time>

                            </div>
                        ))}

                    </div>

                </section>


                {/* QUICK ACTIONS */}

                <section className="dashboard-card">

                    <div className="dashboard-card-header">

                        <div>
                            <h2>Quick Actions</h2>

                            <p>
                                Frequently used platform actions.
                            </p>
                        </div>

                    </div>


                    <div className="quick-actions">

                        <button className="quick-action blue-action">
                            <div>
                                <Building2 size={19} />
                            </div>

                            <span>
                                <strong>Add Company</strong>
                                <small>Register a new company</small>
                            </span>

                            <ArrowUpRight size={16} />
                        </button>


                        <button className="quick-action purple-action">
                            <div>
                                <Users size={19} />
                            </div>

                            <span>
                                <strong>Add Admin</strong>
                                <small>Create administrator</small>
                            </span>

                            <ArrowUpRight size={16} />
                        </button>


                        <button className="quick-action green-action">
                            <div>
                                <ShieldCheck size={19} />
                            </div>

                            <span>
                                <strong>Manage Access</strong>
                                <small>Manage company access</small>
                            </span>

                            <ArrowUpRight size={16} />
                        </button>


                        <button className="quick-action orange-action">
                            <div>
                                <BarChart3 size={19} />
                            </div>

                            <span>
                                <strong>View Reports</strong>
                                <small>Platform analytics</small>
                            </span>

                            <ArrowUpRight size={16} />
                        </button>

                    </div>

                </section>

            </div>


            {/* =================================================
                PLATFORM DATABASE STATUS
            ================================================= */}

            <section className="dashboard-database-status">

                <div className="database-status-left">

                    <div className="database-status-icon">
                        <Database size={20} />
                    </div>

                    <div>
                        <strong>Platform Database</strong>
                        <span>
                            maxus_platform • Connection healthy
                        </span>
                    </div>

                </div>

                <div className="database-status-online">
                    <span></span>
                    Connected
                </div>

            </section>

        </div>
    );
}

export default Dashboard;