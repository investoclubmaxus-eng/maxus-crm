    <?php

    use Illuminate\Support\Facades\Route;
    use Illuminate\Support\Facades\Mail;

    Route::view('/', 'app');


    Route::view('/dashboard', 'app');
    Route::view('/forgot-password', 'app');
    Route::view('/profile', 'app');
    Route::view('/profile/projects', 'app');
    Route::view('/system-settings/{setting?}', 'app')->where('setting', 'general|date-time|email-smtp|file-storage|maintenance|security|email-drafts');
    Route::view('/reset-password', 'app');

    /*
    |--------------------------------------------------------------------------
    | Company Pages
    |--------------------------------------------------------------------------
    */

    Route::view('/companies', 'app');

    Route::view('/companies/create', 'app');

    Route::view('/companies/{company}', 'app');

    Route::view('/companies/{company}/edit', 'app');
 