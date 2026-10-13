<?php

namespace App\Services\Superadmin\Admin;

use App\Models\AdminInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminInvitationService
{
    /**
     * Create a new invitation for an admin.
     *
     * The raw token is returned only for constructing the email URL.
     * Only its SHA-256 hash is stored in the database.
     */
    public function createInvitation(
        User $admin,
        ?int $createdBy = null
    ): array {
        if (strtolower((string) $admin->user_type) !== 'admin') {
            throw ValidationException::withMessages([
                'admin' => ['Invitations can only be created for Admin accounts.'],
            ]);
        }

        $rawToken = Str::random(64);

        $invitation = DB::transaction(function () use (
            $admin,
            $createdBy,
            $rawToken
        ) {
            // Invalidate previous unaccepted invitations.
            AdminInvitation::where('user_id', $admin->id)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return AdminInvitation::create([
                'user_id' => $admin->id,
                'token_hash' => hash('sha256', $rawToken),
                'expires_at' => now()->addHours(2),
                'sent_at' => null,
                'created_by' => $createdBy,
            ]);
        });

        $frontendUrl = rtrim(
            (string) config('app.frontend_url', config('app.url')),
            '/'
        );

        $query = http_build_query([
            'token' => $rawToken,
            'email' => $admin->email,
            'invitation' => '1',
        ]);

        $activationUrl = $frontendUrl.'/reset-password?'.$query;

        return [
            'invitation' => $invitation,
            'activation_url' => $activationUrl,
        ];
    }

    /**
     * Find a valid, unused invitation by its raw token.
     */
    // public function findValidInvitation(string $rawToken,bool $lockForUpdate = false): AdminInvitation
    // {
    //     $tokenHash = hash('sha256', $rawToken);

    //     $query = AdminInvitation::with('user')
    //         ->where('token_hash', $tokenHash)
    //         ->whereNull('accepted_at')
    //         ->whereNull('revoked_at')
    //         ->where('expires_at', '>', now())
    //         ->whereHas('user', function (Builder $query): void {
    //             $query->whereRaw('LOWER(user_type) = ?', ['admin']);
    //         });

    //     if ($lockForUpdate) {
    //         $query->lockForUpdate();
    //     }

    //     $invitation = $query->first();

    //     if (! $invitation) {
    //         throw ValidationException::withMessages([
    //             'token' => [
    //                 'This invitation is invalid, expired, or already used.',
    //             ],
    //         ]);
    //     }

    //     return $invitation;
    // }

    public function findValidInvitation(
        string $rawToken,
        bool $lockForUpdate = false
    ): AdminInvitation {
        $tokenHash = hash('sha256', $rawToken);

        $query = AdminInvitation::with('user')
            ->where('token_hash', $tokenHash);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $invitation = $query->first();

        if (! $invitation) {
            Log::warning('Admin invitation validation failed: token hash not found.');

            throw ValidationException::withMessages([
                'token' => [
                    'This invitation is invalid, expired, or already used.',
                ],
            ]);
        }

        $reason = null;

        if ($invitation->accepted_at !== null) {
            $reason = 'already_accepted';
        } elseif ($invitation->revoked_at !== null) {
            $reason = 'revoked';
        } elseif ($invitation->expires_at === null ||
            $invitation->expires_at->lte(now())) {
            $reason = 'expired';
        } elseif (
            ! $invitation->user ||
            strtolower((string) $invitation->user->user_type) !== 'admin'
        ) {
            $reason = 'user_missing_or_not_admin';
        }

        if ($reason !== null) {
            Log::warning('Admin invitation validation failed.', [
                'invitation_id' => $invitation->id,
                'reason' => $reason,
            ]);

            throw ValidationException::withMessages([
                'token' => [
                    'This invitation is invalid, expired, or already used.',
                ],
            ]);
        }

        return $invitation;
    }

    /**
     * Mark an invitation as accepted.
     * Call this only inside the password-activation transaction.
     */
    public function markAccepted(AdminInvitation $invitation): void
    {
        $invitation->accepted_at = now();
        $invitation->save();
    }
}
