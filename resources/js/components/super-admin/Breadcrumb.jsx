import React from "react";
import { Home, ChevronRight } from "lucide-react";

import "./Breadcrumb.css";

export default function Breadcrumb({
    items = [],
    title = "",
}) {
    return (
        <div className="super-admin-breadcrumb">

            <div className="super-admin-breadcrumb__container">

                {/* Page title */}
                {title && (
                    <div className="super-admin-breadcrumb__title">
                        {title}
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="super-admin-breadcrumb__trail">

                    <button
                        type="button"
                        className="super-admin-breadcrumb__home"
                        // onClick={() => {
                        //     window.location.href = "/";
                        // }}
                        aria-label="Dashboard"
                    >
                        <Home size={15} />
                    </button>

                    {items.map((item, index) => {

                        const isLast =
                            index === items.length - 1;

                        return (
                            <React.Fragment key={index}>

                                <ChevronRight
                                    className="super-admin-breadcrumb__separator"
                                    size={14}
                                />

                                {isLast ? (
                                    <span className="super-admin-breadcrumb__current">
                                        {item.label}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="super-admin-breadcrumb__link"
                                        onClick={() => {
                                            if (item.path) {
                                                window.location.href =
                                                    item.path;
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                )}

                            </React.Fragment>
                        );
                    })}

                </div>

            </div>

        </div>
    );
}