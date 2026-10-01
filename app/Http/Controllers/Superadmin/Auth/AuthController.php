<?php

namespace App\Http\Controllers\Superadmin\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Superadmin\Auth\LoginRequest;
use App\Http\Requests\Superadmin\Auth\UpdatePasswordRequest;
use App\Http\Requests\Superadmin\Auth\UpdateProfileRequest;
use App\Services\Superadmin\Settings\SecuritySettingService;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\RateLimiter;
use App\Services\Superadmin\Settings\TwoFactorAuthenticationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class AuthController extends Controller
{

   public function __construct(
        private SecuritySettingService $securitySettingService,
        private TwoFactorAuthenticationService $twoFactorAuthenticationService
    ) {
    }
    // login function
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        /*
        |--------------------------------------------------------------------------
        | Security Settings
        |--------------------------------------------------------------------------
        */

        $securitySettings = $this->securitySettingService
            ->getSecuritySettings();


        /*
        |--------------------------------------------------------------------------
        | Remember Me
        |--------------------------------------------------------------------------
        */

        $rememberMe = (bool) (
            $credentials['remember_me'] ?? false
        );

        $rememberMeEnabled = (bool) (
            $securitySettings->remember_me
        );

        /*
        |--------------------------------------------------------------------------
        | Respect System Remember Me Setting
        |--------------------------------------------------------------------------
        */

        if (! $rememberMeEnabled) {
            $rememberMe = false;
        }


        /*
        |--------------------------------------------------------------------------
        | Login Attempt Protection
        |--------------------------------------------------------------------------
        */

        $loginAttemptProtection = (bool) (
            $securitySettings->login_attempt_protection
        );

        $maxFailedAttempts = (int) (
            $securitySettings->max_failed_attempts
        );

        $lockoutDuration = (int) (
            $securitySettings->lockout_duration
        );


        /*
        |--------------------------------------------------------------------------
        | Login Rate Limiter Key
        |--------------------------------------------------------------------------
        |
        | Email + IP address are used together.
        |
        */

        $loginKey = 'login:' .
            strtolower($credentials['email']) .
            '|' .
            $request->ip();


        /*
        |--------------------------------------------------------------------------
        | Check Existing Login Lockout
        |--------------------------------------------------------------------------
        */

        if ($loginAttemptProtection) {

            if (
                RateLimiter::tooManyAttempts(
                    $loginKey,
                    $maxFailedAttempts
                )
            ) {

                $seconds = RateLimiter::availableIn(
                    $loginKey
                );

                $minutes = max(
                    1,
                    ceil($seconds / 60)
                );

                throw ValidationException::withMessages([
                    'email' => [
                        "Too many failed login attempts. Please try again in {$minutes} minute(s).",
                    ],
                ]);
            }
        }


        /*
        |--------------------------------------------------------------------------
        | Find Active User
        |--------------------------------------------------------------------------
        */

        $user = User::where(
            'email',
            $credentials['email']
        )
            ->where(
                'status',
                'active'
            )
            ->first();


        /*
        |--------------------------------------------------------------------------
        | Validate Email + Password
        |--------------------------------------------------------------------------
        */

        if (
            ! $user ||
            ! Hash::check(
                $credentials['password'],
                $user->password
            )
        ) {

            /*
            |--------------------------------------------------------------------------
            | Record Failed Login Attempt
            |--------------------------------------------------------------------------
            */

            if ($loginAttemptProtection) {

                RateLimiter::hit(
                    $loginKey,
                    $lockoutDuration * 60
                );

                $attempts = RateLimiter::attempts(
                    $loginKey
                );


                /*
                |--------------------------------------------------------------------------
                | Maximum Failed Attempts Reached
                |--------------------------------------------------------------------------
                */

                if (
                    $attempts >= $maxFailedAttempts
                ) {

                    throw ValidationException::withMessages([
                        'email' => [
                            "Too many failed login attempts. Please try again in {$lockoutDuration} minute(s).",
                        ],
                    ]);
                }
            }


            /*
            |--------------------------------------------------------------------------
            | Invalid Credentials
            |--------------------------------------------------------------------------
            */

            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Password Authentication Successful
        |--------------------------------------------------------------------------
        |
        | At this point:
        |
        | Email       = correct
        | Password    = correct
        |
        | But we have NOT created a Sanctum token yet.
        |
        */

        if ($loginAttemptProtection) {

            RateLimiter::clear(
                $loginKey
            );
        }


        /*
        |--------------------------------------------------------------------------
        | TWO-FACTOR AUTHENTICATION
        |--------------------------------------------------------------------------
        |
        | 2FA will only be required when BOTH conditions are true:
        |
        | 1. Administrator allows user 2FA
        | 2. This user has enabled 2FA
        |
        */

        $twoFactorAllowed = (bool) (
            $securitySettings->allow_user_two_factor
        );

        $userHasTwoFactor = (bool) (
            $user->two_factor_enabled
        );


        if (
            $twoFactorAllowed &&
            $userHasTwoFactor
        ) {

            /*
            |--------------------------------------------------------------------------
            | Generate Temporary 2FA Challenge
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | This is NOT a Sanctum token.
            |
            | It is only a temporary token used to complete
            | the second authentication step.
            |
            */

            $twoFactorToken = Str::random(64);


            /*
            |--------------------------------------------------------------------------
            | Hash Temporary Token For Cache Key
            |--------------------------------------------------------------------------
            |
            | We never use the raw challenge token as the cache key.
            |
            */

            $challengeKey = 'login_2fa:' .
                hash(
                    'sha256',
                    $twoFactorToken
                );


            /*
            |--------------------------------------------------------------------------
            | Store Temporary 2FA Challenge
            |--------------------------------------------------------------------------
            |
            | Challenge expires after 5 minutes.
            |
            */

            Cache::put(
                $challengeKey,
                [
                    'user_id' => $user->id,

                    'remember_me' => $rememberMe,
                ],
                now()->addMinutes(5)
            );


            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | DO NOT:
            |
            | - create Sanctum token
            | - update last_login_at
            | - create login activity
            |
            | These happen only after successful 2FA.
            |
            */

            return response()->json([
                'message' => 'Two-factor authentication required.',

                'requires_two_factor' => true,

                'two_factor_token' => $twoFactorToken,
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | NORMAL LOGIN
        |--------------------------------------------------------------------------
        |
        | 2FA is not required.
        |
        | completeLogin() will:
        |
        | - update last_login_at
        | - create login activity
        | - create Sanctum token
        |
        */

        return $this->completeLogin(
            $user,
            $rememberMe,
            $request
        );
    }

    private function completeLogin(
        User $user,
        bool $rememberMe,
        Request $request
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | Update Last Login
        |--------------------------------------------------------------------------
        */

        $user->update([
            'last_login_at' => now(),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Login Activity
        |--------------------------------------------------------------------------
        */

        ActivityLog::create([
            'user_id' => $user->id,
            'module' => 'Authentication',
            'action' => 'login',
            'description' => $user->name . ' logged into the platform.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'login_type' => $user->user_type,
                'two_factor' => (bool) $user->two_factor_enabled,
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Create Sanctum Token
        |--------------------------------------------------------------------------
        */

        $accessToken = $user->createToken('api-token');

        $accessToken->accessToken->forceFill([
            'last_activity_at' => now(),
        ])->save();

        $token = $accessToken->plainTextToken;

        /*
        |--------------------------------------------------------------------------
        | Final Login Response
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' => 'Login successful.',

            'token' => $token,

            'token_type' => 'Bearer',

            'remember_me' => $rememberMe,

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'status' => $user->status,
                'phone' => $user->phone,
                'location' => $user->location,
                'avatar' => $user->avatar,
                'last_login_at' => $user->last_login_at,
            ],
        ]);
    }


    public function loginSettings(): JsonResponse
    {
        $securitySettings = $this->securitySettingService
            ->getSecuritySettings();

        return response()->json([
            'data' => [
                'remember_me' => (bool) $securitySettings->remember_me,
            ],
        ]);
    }

    // details of login user function
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'status' => $user->status,
                'phone' => $user->phone,
                'location' => $user->location,
                'avatar' => $user->avatar,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    // logout  function
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Store Logout Activity
        |--------------------------------------------------------------------------
        */

        if ($user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'module' => 'Authentication',
                'action' => 'logout',
                'description' => $user->name.' logged out of the platform.',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    // user activity logs function
    public function activities(Request $request): JsonResponse
    {
        $activityRecords = ActivityLog::where('user_id', $request->user()->id)
            ->whereBetween('created_at', [
                today()->subDay()->startOfDay(),
                today()->endOfDay(),
            ])
            ->latest()
            ->get([
                'id',
                'module',
                'action',
                'description',
                'created_at',
            ]);

        $activities = collect();

        foreach ($activityRecords as $activity) {
            $group = $activities->first(function (ActivityLog $groupedActivity) use ($activity): bool {
                return $groupedActivity->action === $activity->action &&
                    $groupedActivity->created_at->isSameDay($activity->created_at) &&
                    $groupedActivity->created_at->diffInMinutes($activity->created_at) < 30;
            });

            if ($group) {
                $group->occurrence_count++;
                $group->description = $activity->description.' ('.$group->occurrence_count.' times within 30 minutes.)';

                continue;
            }

            $activity->occurrence_count = 1;
            $activities->push($activity);
        }

        $activities = $activities
            ->take(8)
            ->values();

        return response()->json([
            'activities' => $activities,
        ]);
    }

    /**
     * Update logged-in user's profile.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        // Keep old values for activity log
        $oldValues = [
            'name' => $user->name,
            'phone' => $user->phone,
            'location' => $user->location,
            'avatar' => $user->avatar,
        ];

        $avatarPath = $user->avatar;

        if ($request->hasFile('avatar')) {
            File::ensureDirectoryExists(public_path('profile-images'));

            if ($user->avatar && str_starts_with($user->avatar, '/profile-images/')) {
                File::delete(public_path(ltrim($user->avatar, '/')));
            }

            $avatar = $request->file('avatar');
            $avatarName = 'user_'.$user->id.'_'.time().'.'.$avatar->extension();
            $avatar->move(public_path('profile-images'), $avatarName);
            $avatarPath = '/profile-images/'.$avatarName;
        }

        // Update profile
        $user->update([
            'name' => $request->validated('name'),
            'phone' => $request->validated('phone'),
            'location' => $request->validated('location'),
            'avatar' => $avatarPath,
        ]);

        // New values for activity log
        $newValues = [
            'name' => $user->name,
            'phone' => $user->phone,
            'location' => $user->location,
            'avatar' => $user->avatar,
        ];

        // Create activity log
        ActivityLog::create([
            'user_id' => $user->id,
            'module' => 'Profile',
            'action' => 'profile_updated',
            'description' => $user->name.' updated profile information.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully.',

            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'status' => $user->status,
                'phone' => $user->phone,
                'location' => $user->location,
                'avatar' => $user->avatar,
                'last_login_at' => $user->last_login_at,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        $securitySettings = $this->securitySettingService
        ->getSecuritySettings();


        $user->update([
            'password' => $request->validated('new_password'),
        ]);

         /*
        |--------------------------------------------------------------------------
        | Logout all sessions after password change
        |--------------------------------------------------------------------------
        */

        if ((bool) $securitySettings->logout_sessions_after_password_change) {
            $user->tokens()->delete();
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'module' => 'Profile',
            'action' => 'password_changed',
            'description' => $user->name.' changed account password.',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
            'force_logout' => (bool) $securitySettings->logout_sessions_after_password_change,
        ]);
    }


        public function verifyLoginTwoFactor(
            Request $request
        ): JsonResponse {

            /*
            |--------------------------------------------------------------------------
            | Validate Request
            |--------------------------------------------------------------------------
            */

            $request->validate([
                'two_factor_token' => [
                    'required',
                    'string',
                ],

                'code' => [
                    'required',
                    'digits:6',
                ],
            ]);

            /*
            |--------------------------------------------------------------------------
            | Get Challenge
            |--------------------------------------------------------------------------
            */

            $twoFactorToken = $request->input('two_factor_token');

            $challengeKey = 'login_2fa:' .
                hash('sha256', $twoFactorToken);

            $challenge = Cache::get($challengeKey);

            /*
            |--------------------------------------------------------------------------
            | Challenge Expired / Invalid
            |--------------------------------------------------------------------------
            */

            if (! $challenge) {

                return response()->json([
                    'message' =>
                        'Your two-factor authentication session has expired. Please log in again.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Find User
            |--------------------------------------------------------------------------
            */

            $user = User::where('id', $challenge['user_id'])
                ->where('status', 'active')
                ->first();

            if (! $user) {

                Cache::forget($challengeKey);

                return response()->json([
                    'message' => 'Unable to complete authentication.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Make Sure 2FA Is Still Enabled
            |--------------------------------------------------------------------------
            */

            if (! $user->two_factor_enabled) {

                Cache::forget($challengeKey);

                return response()->json([
                    'message' =>
                        'Two-factor authentication is not enabled for this account.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Verify Authenticator Code
            |--------------------------------------------------------------------------
            */

            $isValid = $this->twoFactorAuthenticationService
                ->verifyCode(
                    $user,
                    $request->input('code')
                );

            if (! $isValid) {

                return response()->json([
                    'message' =>
                        'Invalid authentication code. Please enter the current 6-digit code from your authenticator app.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | One-Time Challenge
            |--------------------------------------------------------------------------
            |
            | Delete it after successful verification.
            |
            */

            Cache::forget($challengeKey);

            /*
            |--------------------------------------------------------------------------
            | Complete Login
            |--------------------------------------------------------------------------
            */

            return $this->completeLogin(
                $user,
                (bool) ($challenge['remember_me'] ?? false),
                $request
            );
        }

    

    //2FA set up

    public function setupTwoFactor(): JsonResponse
    {
        $user = request()->user();

        $securitySettings = $this->securitySettingService
            ->getSecuritySettings();

        if (! $securitySettings->allow_user_two_factor) {
            return response()->json([
                'message' => 'Two-factor authentication is currently disabled by the administrator.',
            ], 403);
        }

        if ($user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        $data = $this->twoFactorAuthenticationService
            ->setup($user);

        return response()->json([
            'message' => 'Two-factor authentication setup started.',
            'data' => [
                'secret' => $data['secret'],
                'qr_code_url' => $data['qr_code_url'],
            ],
        ]);
    }


    public function confirmTwoFactor(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        $securitySettings = $this->securitySettingService
            ->getSecuritySettings();

        if (! $securitySettings->allow_user_two_factor) {
            return response()->json([
                'message' => 'Two-factor authentication is currently disabled by the administrator.',
            ], 403);
        }

        if (! $user->two_factor_secret) {
            return response()->json([
                'message' => 'Two-factor authentication setup has not been started.',
            ], 422);
        }

        if ($user->two_factor_enabled) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        $isValid = $this->twoFactorAuthenticationService->verifyCode(
            $user,
            $request->input('code')
        );

        if (! $isValid) {
            return response()->json([
                'message' => 'Invalid authentication code. Please enter the current 6-digit code from your authenticator app.',
            ], 422);
        }

        $user->update([
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Two-factor authentication enabled successfully.',
            'data' => [
                'two_factor_enabled' => true,
                'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
            ],
        ]);
    }
}
