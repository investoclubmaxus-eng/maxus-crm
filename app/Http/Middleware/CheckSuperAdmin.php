<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Authentication Check
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
        | Super Admin Authorization
        |--------------------------------------------------------------------------
        */

        $userType = strtolower(str_replace(' ', '_', (string) $user->user_type));

        if ($userType !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'This module is restricted to the super admin account. Please sign in with the super admin user.',
            ], 403);
        }

        return $next($request);
    }
}
