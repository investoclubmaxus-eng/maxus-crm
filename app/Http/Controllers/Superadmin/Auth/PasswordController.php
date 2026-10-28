<?php

namespace App\Http\Controllers\Superadmin\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Auth\ForgotPasswordRequest;
use App\Http\Requests\Superadmin\Auth\ResetPasswordRequest;
use App\Models\AdminInvitation;
use App\Models\User;
use App\Services\Superadmin\Admin\AdminInvitationService;
use App\Services\Superadmin\Settings\EmailTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordController extends Controller
{
    public function validateInvitation(
        Request $request,
        AdminInvitationService $invitationService
    ): JsonResponse {
        $credentials = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255'],
        ]);

        $invitation = $invitationService->findValidInvitation(
            $credentials['token']
        );
        $invitedEmail = mb_strtolower(trim($invitation->user->email));
        $submittedEmail = mb_strtolower(trim($credentials['email']));

        if (! hash_equals($invitedEmail, $submittedEmail)) {
            throw ValidationException::withMessages([
                'email' => [
                    'This invitation was issued to a different email address.',
                ],
            ]);
        }

        if (AdminInvitation::query()
            ->where('user_id', $invitation->user_id)
            ->whereNotNull('accepted_at')
            ->exists()) {
            throw ValidationException::withMessages([
                'token' => [
                    'This administrator has already activated their account.',
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'The invitation is valid.',
            'data' => [
                'name' => $invitation->user->name,
                'email' => $invitation->user->email,
            ],
        ]);
    }

    public function forgot(
        ForgotPasswordRequest $request,
        EmailTemplateService $emailTemplateService
    ): JsonResponse {

        $email = strtolower(
            trim($request->validated('email'))
        );

        $user = User::where('email', $email)
            ->where('status', 'active')
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Generic response
        |--------------------------------------------------------------------------
        |
        | We intentionally don't tell the user whether the email exists.
        |
        */

        if (! $user) {
            return response()->json([
                'message' => 'If an account exists with this email address, a password reset link has been sent.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Create password reset token
        |--------------------------------------------------------------------------
        */

        $token = Password::broker()->createToken($user);

        /*
        |--------------------------------------------------------------------------
        | Build React reset URL
        |--------------------------------------------------------------------------
        */

        $resetUrl = rtrim(
            config('app.frontend_url'),
            '/'
        )
        .'/reset-password?token='
        .urlencode($token)
        .'&email='
        .urlencode($user->email);

        /*
        |--------------------------------------------------------------------------
        | Queue email
        |--------------------------------------------------------------------------
        */

        Mail::to($user->email)->queue(
            $emailTemplateService
                ->buildPasswordResetEmail($user, $resetUrl)
                ->onQueue('emails')
                ->afterCommit()
        );

        return response()->json([
            'message' => 'If an account exists with this email address, a password reset link has been sent.',
        ]);
    }

    public function reset(
        ResetPasswordRequest $request,
        AdminInvitationService $invitationService
    ): JsonResponse {
        $credentials = $request->validated();

        /*
        |--------------------------------------------------------------------------
        | Admin invitation activation
        |--------------------------------------------------------------------------
        */

        if ($credentials['invitation'] ?? false) {
            DB::transaction(function () use (
                $credentials,
                $invitationService
            ): void {
                // Lock and validate the invitation first.
                $invitation = $invitationService->findValidInvitation(
                    $credentials['token'],
                    lockForUpdate: true
                );

                // Lock the associated Admin account.
                $user = User::query()
                    ->whereKey($invitation->user_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                // Ensure this invitation belongs to this email address.
                $invitedEmail = mb_strtolower(trim($user->email));
                $submittedEmail = mb_strtolower(trim($credentials['email']));

                if (! hash_equals($invitedEmail, $submittedEmail)) {
                    throw ValidationException::withMessages([
                        'email' => [
                            'This invitation was issued to a different email address.',
                        ],
                    ]);
                }

                // Only Admin accounts may accept Admin invitations.
                $userType = strtolower(trim((string) $user->user_type));
                if (! in_array($userType, ['admin', 'sub admin'], true)) {
                    throw ValidationException::withMessages([
                        'token' => [
                            'This invitation is not for an Admin account.',
                        ],
                    ]);
                }

                // Prevent activating an account that has already accepted an invitation.
                if (AdminInvitation::query()
                    ->where('user_id', $user->id)
                    ->whereNotNull('accepted_at')
                    ->exists()) {
                    throw ValidationException::withMessages([
                        'token' => [
                            'This administrator has already activated their account.',
                        ],
                    ]);
                }

                // Set the password securely and activate the account.
                $user->forceFill([
                    'password' => Hash::make($credentials['password']),
                    'remember_token' => null,
                    'status' => 'active',
                ])->save();

                // Invalidate existing Sanctum tokens, if any.
                $user->tokens()->delete();

                // Mark the invitation as used.
                $invitationService->markAccepted($invitation);
            });

            return response()->json([
                'success' => true,
                'message' => 'Your administrator account is ready. You can now sign in.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Normal forgotten-password reset
        |--------------------------------------------------------------------------
        */

        $status = Password::broker()->reset(
            [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
                'password_confirmation' => $credentials['password_confirmation'],
                'token' => $credentials['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();

                // Revoke existing Sanctum tokens.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset successfully.',
        ]);
    }
}
