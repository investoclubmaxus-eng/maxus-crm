<?php

namespace App\Services\Superadmin\Settings;

use App\Models\User;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorAuthenticationService
{
    public function __construct(
        private Google2FA $google2fa
    ) {
    }

    /**
     * Generate a new 2FA secret for the user.
     */
    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /**
     * Verify a 2FA code against the user's secret.
     */
    public function verifyCode(User $user, string $code): bool
    {
        if (!$user->two_factor_secret) {
            return false;
        }

        $secret = decrypt($user->two_factor_secret);


       return $this->google2fa->verifyKey(
            $secret,
            $code
        );
    }

      /**
     * Start the 2FA setup process.
     */

    public function setup(User $user): array
    {
        $secret = $this->generateSecret();

        $user->two_factor_secret = encrypt($secret);
        $user->two_factor_enabled = false;
        $user->two_factor_confirmed_at = null;
        $user->save();

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'Maxus CRM'),
            $user->email,
            $secret
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }
}