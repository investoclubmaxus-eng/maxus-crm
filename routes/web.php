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

// Route::get('/test-email', function () {
//     try {
//         Mail::raw('This is a test email to verify SMTP settings.', function ($message) {
//             $message->to('investoclub.maxus@gmail.com') // Replace with your actual email
//                     ->subject('SMTP Test Email');
//         });
        
//         return 'Email sent successfully! Check your inbox.';
//     } catch (\Exception $e) {
//         return 'Failed to send email. Error: ' . $e->getMessage();
//     }
// });
 