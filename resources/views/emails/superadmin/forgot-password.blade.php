<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        http-equiv="X-UA-Compatible"
        content="IE=edge"
    >

    <title>Reset Your Password - Maxus CRM</title>

    <style>
        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #f4f6fb;
        }

        body {
            font-family:
                Arial,
                Helvetica,
                sans-serif;

            color: #25254a;

            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table {
            border-spacing: 0;
            border-collapse: collapse;
        }

        td {
            border-collapse: collapse;
        }

        img {
            border: 0;
            outline: none;
            text-decoration: none;
            display: block;
            max-width: 100%;
        }

        a {
            text-decoration: none;
        }

        /* =========================
           MAIN WRAPPER
        ========================== */

        .email-wrapper {
            width: 100%;
            background: #f4f6fb;
            padding: 40px 15px;
        }

        .email-container {
            width: 100%;
            max-width: 620px;
            background: #ffffff;
            margin: 0 auto;

            border-radius: 16px;
            overflow: hidden;

            box-shadow:
                0 8px 30px rgba(20, 20, 60, 0.08);
        }

        /* =========================
           HEADER
        ========================== */

        .email-header {
            background: #0c2854;
            padding: 34px 25px 30px;
            text-align: center;
        }

        /*
         * MAXUS WORDMARK
         *
         * The real MAXUS logo is a custom wordmark.
         * This font stack gives a similar bold geometric appearance.
         */

        .brand {
            margin: 0;

            color: #ffffff;

            font-family:
                "Arial Black",
                Arial,
                Helvetica,
                sans-serif;

            font-size: 42px;
            line-height: 1;

            font-weight: 900;

            letter-spacing: 4px;

            text-transform: uppercase;
        }

        .brand-subtitle {
            margin: 12px 0 0;

            color: #d9e5fa;

            font-size: 11px;
            line-height: 1.5;

            letter-spacing: 0.6px;
        }

        /* =========================
           CONTENT
        ========================== */

        .content {
            padding: 42px 45px 38px;
        }

        .title {
            margin: 0 0 14px;

            font-size: 25px;
            line-height: 1.3;

            font-weight: 700;

            color: #22224a;
        }

        .hello {
            margin: 0 0 16px;

            font-size: 16px;
            line-height: 1.5;

            font-weight: 600;

            color: #28284e;
        }

        .paragraph {
            margin: 0 0 18px;

            font-size: 14px;
            line-height: 1.7;

            color: #696981;
        }

        /* =========================
           ACCOUNT INFORMATION
        ========================== */

        .account-box {
            width: 100%;

            margin: 28px 0;

            background: #f7f7ff;

            border: 1px solid #e2e0ff;
        }

        .account-inner {
            padding: 20px;
        }

        .account-title {
            margin: 0 0 15px;

            font-size: 14px;
            line-height: 1.4;

            font-weight: 700;

            color: #352ca5;
        }

        .account-row {
            margin: 0 0 8px;

            font-size: 13px;
            line-height: 1.6;
        }

        .account-row:last-child {
            margin-bottom: 0;
        }

        .account-label {
            color: #85859a;
        }

        .account-value {
            color: #29294e;
            font-weight: 600;
        }

        /* =========================
           BUTTON
        ========================== */

        .button-wrapper {
            text-align: center;

            padding: 8px 0 24px;
        }

        .reset-button {
            display: inline-block;

            background: #352ca5;

            color: #ffffff !important;

            font-size: 14px;
            line-height: 1;

            font-weight: 700;

            padding: 15px 34px;

            border-radius: 8px;
        }

        /* =========================
           EXPIRY / SECURITY
        ========================== */

        .expiry-box {
            margin: 5px 0 25px;

            background: #fff8ed;

            border-left: 4px solid #f59e0b;
        }

        .expiry-inner {
            padding: 15px 18px;
        }

        .expiry-text {
            margin: 0;

            color: #805b17;

            font-size: 13px;
            line-height: 1.6;
        }

        /* =========================
           FALLBACK URL
        ========================== */

        .fallback {
            margin-top: 20px;

            padding-top: 20px;

            border-top: 1px solid #eeeeF5;
        }

        .fallback-title {
            margin: 0 0 8px;

            font-size: 12px;
            line-height: 1.5;

            font-weight: 700;

            color: #55556e;
        }

        .fallback-url {
            word-break: break-all;

            font-size: 11px;
            line-height: 1.6;

            color: #352ca5;
        }

        .security-text {
            margin: 25px 0 0;

            font-size: 12px;
            line-height: 1.7;

            color: #88889c;
        }

        /* =========================
           FOOTER
        ========================== */

        .footer {
            padding: 25px 30px;

            text-align: center;

            background: #f8f8fc;

            border-top: 1px solid #eeeeF5;
        }

        .footer-tagline {
            margin: 0 0 10px;

            color: #f28c00;

            font-size: 12px;
            line-height: 1.5;

            font-weight: 600;
        }

        .footer-copy {
            margin: 0;

            color: #9999a8;

            font-size: 11px;
            line-height: 1.5;
        }

        /* =========================
           MOBILE
        ========================== */

        @media only screen and (max-width: 600px) {

            .email-wrapper {
                padding: 20px 10px;
            }

            .email-container {
                border-radius: 10px;
            }

            .email-header {
                padding: 27px 18px 25px;
            }

            .brand {
                font-size: 32px;
                letter-spacing: 3px;
            }

            .brand-subtitle {
                font-size: 10px;
                margin-top: 10px;
            }

            .content {
                padding: 30px 22px 25px;
            }

            .title {
                font-size: 22px;
            }

            .hello {
                font-size: 15px;
            }

            .paragraph {
                font-size: 13px;
            }

            .account-inner {
                padding: 16px;
            }

            .account-title {
                font-size: 13px;
            }

            .account-row {
                font-size: 12px;
            }

            .reset-button {
                display: block;

                width: auto;

                padding: 15px 20px;
            }

            .fallback-url {
                font-size: 10px;
            }

            .footer {
                padding: 22px 15px;
            }
        }

        @media only screen and (max-width: 380px) {

            .content {
                padding: 25px 16px 20px;
            }

            .title {
                font-size: 20px;
            }

            .brand {
                font-size: 28px;
                letter-spacing: 2px;
            }
        }
    </style>
</head>

<body>

<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    class="email-wrapper"
>
    <tr>
        <td align="center">

            <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                class="email-container"
            >

                {{-- =========================================
                     HEADER
                ========================================== --}}

                <tr>
                    <td class="email-header">

                        <p class="brand">
                            MAXUS
                        </p>

                        <p class="brand-subtitle">
                            CRM
                            &nbsp;|&nbsp;
                            Powering Performance. Managing Growth.
                        </p>

                    </td>
                </tr>


                {{-- =========================================
                     CONTENT
                ========================================== --}}

                <tr>
                    <td class="content">

                        <h1 class="title">
                            Reset Your Password
                        </h1>

                        <p class="hello">
                            Hello {{ $user->name }},
                        </p>

                        <p class="paragraph">
                            We received a request to reset the password
                            for your Maxus CRM account associated with
                            this email address.
                        </p>

                        <p class="paragraph">
                            Click the button below to create a new
                            password for your account.
                        </p>


                        {{-- =================================
                             ACCOUNT INFORMATION
                        ================================== --}}

                        <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            class="account-box"
                        >
                            <tr>
                                <td class="account-inner">

                                    <p class="account-title">
                                        Account Information
                                    </p>

                                    <p class="account-row">

                                        <span class="account-label">
                                            Name:
                                        </span>

                                        &nbsp;

                                        <span class="account-value">
                                            {{ $user->name }}
                                        </span>

                                    </p>

                                    <p class="account-row">

                                        <span class="account-label">
                                            Email:
                                        </span>

                                        &nbsp;

                                        <span class="account-value">
                                            {{ $user->email }}
                                        </span>

                                    </p>

                                </td>
                            </tr>
                        </table>


                        {{-- =================================
                             RESET BUTTON
                        ================================== --}}

                        <div class="button-wrapper">

                            <a
                                href="{{ $resetUrl }}"
                                class="reset-button"
                                target="_blank"
                            >
                                Reset Password
                            </a>

                        </div>


                        {{-- =================================
                             SECURITY MESSAGE
                        ================================== --}}

                        <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            class="expiry-box"
                        >
                            <tr>
                                <td class="expiry-inner">

                                    <p class="expiry-text">
                                        For security reasons, this password
                                        reset link is temporary. If you did
                                        not request a password reset, you can
                                        safely ignore this email.
                                    </p>

                                </td>
                            </tr>
                        </table>


                        {{-- =================================
                             FALLBACK URL
                        ================================== --}}

                        <div class="fallback">

                            <p class="fallback-title">
                                If the button doesn't work, copy and
                                paste this link into your browser:
                            </p>

                            <a
                                href="{{ $resetUrl }}"
                                class="fallback-url"
                            >
                                {{ $resetUrl }}
                            </a>

                        </div>


                        {{-- =================================
                             SECURITY TEXT
                        ================================== --}}

                        <p class="security-text">

                            If you did not request this password reset,
                            no changes will be made to your account.
                            For additional assistance, please contact
                            your system administrator.

                        </p>

                    </td>
                </tr>


                {{-- =========================================
                     FOOTER
                ========================================== --}}

                <tr>
                    <td class="footer">

                        <p class="footer-tagline">
                            Powering Performance. Managing Growth.
                        </p>

                        <p class="footer-copy">
                            © {{ date('Y') }}
                            Maxus Professionals Pvt Ltd
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>