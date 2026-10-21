import React from "react";
import { Home, ChevronRight } from "lucide-react";

import "./Breadcrumb.css";

export default function Breadcrumb({
    items = [],
    title = "",
}) {
    return (
        <div className="company-re-breadcrumb">

            <div className="company-re-breadcrumb__container">

                {/* Page title */}
                {title && (
                    <div className="company-re-breadcrumb__title">
                        {title}
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="company-re-breadcrumb__trail">

                    <button
                        type="button"
                        className="company-re-breadcrumb__home"
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
                                    className="company-re-breadcrumb__separator"
                                    size={14}
                                />

                                {isLast ? (
                                    <span className="company-re-breadcrumb__current">
                                        {item.label}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="company-re-breadcrumb__link"
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
