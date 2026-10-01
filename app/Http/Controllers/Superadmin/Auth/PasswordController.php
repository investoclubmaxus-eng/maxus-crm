<?php

namespace App\Http\Controllers\Superadmin\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Auth\ForgotPasswordRequest;
use App\Http\Requests\Superadmin\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Notifications\SuperadminResetPasswordNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PasswordController extends Controller
{
    public function forgot(
        ForgotPasswordRequest $request
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

        if (!$user) {
            return response()->json([
                'message' =>
                    'If an account exists with this email address, a password reset link has been sent.',
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
        . '/reset-password?token='
        . urlencode($token)
        . '&email='
        . urlencode($user->email);

        /*
        |--------------------------------------------------------------------------
        | Queue email
        |--------------------------------------------------------------------------
        */

        $user->notify(
            new SuperadminResetPasswordNotification(
                $token,
                $resetUrl
            )
        );

        return response()->json([
            'message' =>
                'If an account exists with this email address, a password reset link has been sent.',
        ]);
    }


    public function reset(
        ResetPasswordRequest $request
    ): JsonResponse {

        $credentials = $request->validated();

        $status = Password::broker()->reset(
            [
                'email' => $credentials['email'],
                'password' => $credentials['password'],
                'password_confirmation' =>
                    $credentials['password_confirmation'],
                'token' => $credentials['token'],
            ],

            function (User $user, string $password) {

                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => null,
                ])->save();

                /*
                |--------------------------------------------------------------------------
                | Revoke existing Sanctum sessions/tokens
                |--------------------------------------------------------------------------
                */

                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' =>
                'Your password has been reset successfully.',
        ]);
    }
}