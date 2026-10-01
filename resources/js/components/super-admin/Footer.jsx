import React from "react";

import "./Footer.css";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="super-admin-footer">
            <div className="super-admin-footer__inner">

                <div className="super-admin-footer__copyright">
                    © {currentYear} <strong>MAXUS</strong>. All rights reserved.
                </div>

              

               

            </div>
        </footer>
    );
}