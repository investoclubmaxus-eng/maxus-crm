<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            [
                'email' => 'superadmin@gmail.com',
            ],
            [
                'name' => 'Super Admin',
                'password' => 'Maxus@121',

                'user_type' => 'super_admin',
                'status' => 'active',

                'phone' => '9823434565',
                'location'=> 'Gurugram',
                'location' => null,
                'avatar' => null,

                'last_login_at' => null,
                'email_verified_at' => now(),
            ]
        );
    }
}