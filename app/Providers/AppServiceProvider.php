<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;
use App\Models\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
{
    Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    RateLimiter::for('forgot-password', function (Request $request) {

        $email = strtolower(
            trim((string) $request->input('email'))
        );

        return [

        Limit::perMinute(5)
            ->by('forgot-ip:' . $request->ip())
            ->response(function (
                Request $request,
                array $headers
            ) {
                return response()->json([
                    'message' => 'Too many password reset requests from this IP address. Please try again later.',
                ], 429, $headers);
            }),

        Limit::perMinute(1)
            ->by('forgot-email:' . $email)
            ->response(function (
                Request $request,
                array $headers
            ) {
                return response()->json([
                    'message' => 'A password reset request was already made for this email address. Please try again in a minute.',
                ], 429, $headers);
            }),

    ];
    });
}
}
