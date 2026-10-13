<?php

namespace App\Services\Superadmin\Settings;

class EmailTemplateRenderer
{
    public function render(
        string $body,
        array $variables = []
    ): string {
        $defaults = [
            'admin_name' => 'John Smith',
            'admin_email' => 'john@example.com',
            'company_name' => 'ABC Realty',
            'login_url' => url('/'),
            'activation_url' => null,
            'app_name' => config('app.name', 'Maxus CRM'),
            'support_email' => 'support@maxus.com',
        ];

        $variables = array_merge($defaults, $variables);

        /*
         * Replace variables with HTML-escaped values.
         * URLs remain HTML-escaped only for safe HTML output.
         */
        foreach ($variables as $key => $value) {
            $pattern = '/\{\{\s*'
                .preg_quote($key, '/')
                .'\s*\}\}/i';

            $body = preg_replace_callback(
                $pattern,
                static function () use ($value) {
                    return e((string) $value);
                },
                $body
            );
        }

        $parts = preg_split(
            '/(\[LOGIN_BUTTON\]|\[RESET_PASSWORD_BUTTON\]|\[RESET_BUTTON\]|\[BUTTON\])/i',
            $body,
            -1,
            PREG_SPLIT_DELIM_CAPTURE
        );

        $html = '';

        foreach ($parts as $part) {
            $upperPart = strtoupper(trim($part));

            if (in_array($upperPart, ['[LOGIN_BUTTON]', '[RESET_PASSWORD_BUTTON]', '[RESET_BUTTON]', '[BUTTON]'], true)) {
                $html .= $this->buildButtonHtml($upperPart, $variables);

                continue;
            }

            $lines = preg_split('/\r\n|\n|\r/', $part);

            foreach ($lines as $line) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                $html .= '
                    <p style="margin:0 0 16px 0;color:#293548;
                        font-family:Arial,Helvetica,sans-serif;
                        font-size:15px;line-height:1.7;">'
                    .$line.
                    '</p>';
            }
        }

        return $html;
    }

    private function buildButtonHtml(string $placeholder, array $variables): string
    {
        $isReset = in_array($placeholder, ['[RESET_PASSWORD_BUTTON]', '[RESET_BUTTON]'], true)
            || ($variables['template_slug'] ?? null) === 'password-reset';

        if ($isReset) {
            $buttonUrl = ! empty($variables['activation_url'])
                ? $variables['activation_url']
                : ($variables['login_url'] ?? url('/'));
            $buttonLabel = 'Reset Password';
        } else {
            $buttonUrl = ! empty($variables['login_url'])
                ? $variables['login_url']
                : (! empty($variables['activation_url']) ? $variables['activation_url'] : url('/'));
            $buttonLabel = ! empty($variables['button_label'])
                ? $variables['button_label']
                : 'Login to CRM';
        }

        $buttonUrl = e((string) $buttonUrl);
        $buttonLabel = e((string) $buttonLabel);

        return '
            <table role="presentation" border="0" cellpadding="0"
                cellspacing="0" width="100%" style="margin:25px 0;">
                <tr>
                    <td align="center">
                        <a href="'.$buttonUrl.'"
                            target="_blank"
                            style="display:inline-block;padding:14px 28px;
                            background:#1f4fa3;color:#ffffff;
                            font-family:Arial,Helvetica,sans-serif;
                            font-size:15px;font-weight:600;
                            line-height:20px;text-decoration:none;
                            border-radius:8px;">
                            '.$buttonLabel.'
                        </a>
                    </td>
                </tr>
            </table>
        ';
    }
}
