<?php

namespace App\Services\Superadmin\Settings;

class EmailTemplateRenderer
{
    /**
     * Render an email template body.
     *
     * Supported variables:
     *
     * {{admin_name}}
     * {{admin_email}}
     * {{company_name}}
     * {{login_url}}
     * {{activation_url}}
     * {{app_name}}
     * {{support_email}}
     *
     * Supported components:
     *
     * [LOGIN_BUTTON]
     */
    public function render(
        string $body,
        array $variables = []
    ): string {
        /*
        |--------------------------------------------------------------------------
        | DEFAULT VARIABLES
        |--------------------------------------------------------------------------
        */

        $defaultVariables = [
            'admin_name' => 'John Smith',

            'admin_email' => 'john@example.com',

            'company_name' => 'ABC Realty',

            'login_url' => url('/'),

            'activation_url' => url('/'),

            'app_name' => config(
                'app.name',
                'Maxus CRM'
            ),

            'support_email' => 'support@maxus.com',
        ];

        /*
        |--------------------------------------------------------------------------
        | MERGE VARIABLES
        |--------------------------------------------------------------------------
        */

        $variables = array_merge(
            $defaultVariables,
            $variables
        );

        /*
        |--------------------------------------------------------------------------
        | REPLACE TEMPLATE VARIABLES
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | We DO NOT escape the complete body here.
        |
        | We escape individual variable values instead.
        |
        */

        foreach ($variables as $key => $value) {
            $body = preg_replace(
                '/\{\{\s*'
                . preg_quote($key, '/')
                . '\s*\}\}/i',
                e((string) $value),
                $body
            );
        }

        /*
        |--------------------------------------------------------------------------
        | LOGIN BUTTON
        |--------------------------------------------------------------------------
        */

        $loginUrl = $variables['login_url']
            ?? url('/');

        $loginButton = '
            <table
                role="presentation"
                border="0"
                cellpadding="0"
                cellspacing="0"
                width="100%"
                style="margin:25px 0;"
            >
                <tr>
                    <td
                        align="center"
                        style="padding:0;"
                    >

                        <a
                            href="' . e($loginUrl) . '"
                            target="_blank"
                            style="
                                display:inline-block;
                                padding:14px 28px;
                                background:#1f4fa3;
                                color:#ffffff;
                                font-family:Arial,Helvetica,sans-serif;
                                font-size:15px;
                                font-weight:600;
                                line-height:20px;
                                text-decoration:none;
                                border-radius:8px;
                            "
                        >
                            Login to CRM
                        </a>

                    </td>
                </tr>
            </table>
        ';

        /*
        |--------------------------------------------------------------------------
        | SPLIT CONTENT AROUND LOGIN BUTTON
        |--------------------------------------------------------------------------
        */

        $parts = preg_split(
            '/(\[LOGIN_BUTTON\])/',
            $body,
            -1,
            PREG_SPLIT_DELIM_CAPTURE
        );

        $html = '';

        /*
        |--------------------------------------------------------------------------
        | BUILD HTML
        |--------------------------------------------------------------------------
        */

        foreach ($parts as $part) {

            /*
            |--------------------------------------------------------------------------
            | LOGIN BUTTON
            |--------------------------------------------------------------------------
            */

            if ($part === '[LOGIN_BUTTON]') {

                $html .= $loginButton;

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | NORMAL TEXT
            |--------------------------------------------------------------------------
            */

            $lines = preg_split(
                "/\r\n|\n|\r/",
                $part
            );

            foreach ($lines as $line) {

                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                /*
                |--------------------------------------------------------------------------
                | Escape normal text
                |--------------------------------------------------------------------------
                |
                | We escape the line because template text should not
                | be interpreted as arbitrary HTML.
                |
                */

                $html .=
                    '<p style="
                        margin:0 0 16px 0;
                        color:#293548;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:15px;
                        line-height:1.7;
                    ">'
                    . e($line)
                    . '</p>';
            }
        }

        /*
        |--------------------------------------------------------------------------
        | RETURN FINAL HTML
        |--------------------------------------------------------------------------
        */

        return $html;
    }
}