import React from "react";

import "./Footer.css";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="company-re-footer">
            <div className="company-re-footer__inner">

                <div className="company-re-footer__copyright">
                    © {currentYear} <strong>MAXUS</strong>. All rights reserved.
                </div>

              

               

            </div>
        </footer>
    );
}
