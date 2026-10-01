<?php

namespace App\Http\Middleware;

use App\Models\SecuritySetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSecuritySession
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | User must be authenticated
        |--------------------------------------------------------------------------
        */

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | Get Current Sanctum Token
        |--------------------------------------------------------------------------
        */

        $token = $user->currentAccessToken();

        /*
        |--------------------------------------------------------------------------
        | No personal access token
        |--------------------------------------------------------------------------
        */

        if (! $token) {
            return $next($request);
        }

        /*
        |--------------------------------------------------------------------------
        | Get Security Settings
        |--------------------------------------------------------------------------
        */

        $securitySettings = SecuritySetting::first();

        /*
        |--------------------------------------------------------------------------
        | Session Timeout
        |--------------------------------------------------------------------------
        */

        $sessionTimeout = (int) (
            $securitySettings?->session_timeout ?? 30
        );

        /*
        |--------------------------------------------------------------------------
        | Check Inactivity
        |--------------------------------------------------------------------------
        */

        if ($token->last_activity_at) {

            $minutesInactive =
                $token->last_activity_at->diffInMinutes(now());

            if ($minutesInactive >= $sessionTimeout) {

                /*
                |--------------------------------------------------------------------------
                | Delete Expired Token
                |--------------------------------------------------------------------------
                */

                $token->delete();

                return response()->json([
                    'success' => false,
                    'message' =>
                        'Your session has expired due to inactivity.',
                    'error' => 'session_timeout',
                ], 401);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Update Last Activity
        |--------------------------------------------------------------------------
        */

        $token->forceFill([
            'last_activity_at' => now(),
        ])->save();

        return $next($request);
    }
}