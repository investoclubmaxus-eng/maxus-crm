<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>{{ $subject ?? 'Maxus CRM' }}</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f3f6fb;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            color: #334155;
        }

        table {
            border-collapse: collapse;
        }

        .email-wrapper {
            width: 100%;
            background: #f3f6fb;
            padding: 40px 20px;
        }

        .email-container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
        }

        /* =========================
           HEADER
        ========================== */

        .email-header {
            background: #102f5f;
            padding: 35px 30px;
            text-align: center;
        }

        .email-logo {
            color: #ffffff;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 8px;
            line-height: 1.2;
        }

        .email-tagline {
            margin-top: 10px;
            color: #dbeafe;
            font-size: 14px;
            line-height: 1.5;
        }

        /* =========================
           INFORMATION
        ========================== */

        .email-information {
            padding: 24px 36px;
            border-bottom: 1px solid #e5e7eb;
        }

        .information-row {
            padding: 7px 0;
        }

        .information-label {
            width: 100px;
            color: #94a3b8;
            font-size: 14px;
            font-weight: 600;
            vertical-align: top;
        }

        .information-value {
            color: #163b70;
            font-size: 15px;
            font-weight: 700;
        }

        /* =========================
           BODY
        ========================== */

        .email-content {
            padding: 40px 36px;
        }

        .email-content p {
            margin: 0 0 22px 0;
            color: #526b8d;
            font-size: 16px;
            line-height: 1.8;
        }

        .email-content h1,
        .email-content h2,
        .email-content h3 {
            color: #163b70;
        }

        /* =========================
           LOGIN BUTTON
        ========================== */

        .button-wrapper {
            padding: 12px 0 28px;
        }

        .login-button {
            display: inline-block;
            padding: 14px 28px;
            background: #1f4fa3;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 9px;
            font-size: 16px;
            font-weight: 700;
        }

        /* =========================
           FOOTER
        ========================== */

        .email-footer {
            background: #f8fafc;
            padding: 28px 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }

        .footer-title {
            display: block;
            color: #163b70;
            font-size: 16px;
            font-weight: 800;
            margin-bottom: 8px;
        }

        .footer-text {
            display: block;
            color: #8ca0ba;
            font-size: 13px;
            line-height: 1.6;
        }

        /* =========================
           MOBILE
        ========================== */

        @media only screen and (max-width: 600px) {

            .email-wrapper {
                padding: 15px 8px;
            }

            .email-header {
                padding: 28px 20px;
            }

            .email-logo {
                font-size: 26px;
                letter-spacing: 6px;
            }

            .email-information {
                padding: 20px;
            }

            .email-content {
                padding: 28px 20px;
            }

            .email-content p {
                font-size: 15px;
            }

            .information-label {
                width: 80px;
            }

            .login-button {
                width: 100%;
                box-sizing: border-box;
                text-align: center;
            }
        }
    </style>
</head>

<body>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    class="email-wrapper"
>
    <tr>
        <td align="center">

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                class="email-container"
            >

                {{-- =========================
                    HEADER
                ========================== --}}

                <tr>
                    <td class="email-header">

                        <div class="email-logo">
                            MAXUS
                        </div>

                        <div class="email-tagline">
                            CRM&nbsp;&nbsp;|&nbsp;&nbsp;
                            Powering Performance. Managing Growth.
                        </div>

                    </td>
                </tr>


                {{-- =========================
                    FROM / SUBJECT
                ========================== --}}

                <tr>
                    <td class="email-information">

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                        >

                            <tr>
                                <td
                                    class="information-label"
                                >
                                    From
                                </td>

                                <td
                                    class="information-value"
                                >
                                    {{ $fromName ?? 'Maxus CRM Team' }}
                                </td>
                            </tr>

                            <tr>
                                <td
                                    class="information-label"
                                >
                                    Subject
                                </td>

                                <td
                                    class="information-value"
                                >
                                    {{ $subject ?? 'Maxus CRM Notification' }}
                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>


                {{-- =========================
                    EMAIL BODY
                ========================== --}}

                <tr>
                    <td class="email-content">

                        {!! $bodyHtml !!}

                    </td>
                </tr>


                {{-- =========================
                    FOOTER
                ========================== --}}

                <tr>
                    <td class="email-footer">

                        <span class="footer-title">
                            MAXUS CRM
                        </span>

                        <span class="footer-text">
                            Powering Performance. Managing Growth.
                        </span>

                        <span class="footer-text">
                            © {{ date('Y') }}
                            Maxus Professionals Pvt Ltd.
                            All rights reserved.
                        </span>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>