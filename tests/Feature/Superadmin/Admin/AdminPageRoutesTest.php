<?php

namespace Tests\Feature\Superadmin\Admin;

use Tests\TestCase;

class AdminPageRoutesTest extends TestCase
{
    public function test_administrator_list_page_renders_the_application_shell(): void
    {
        $response = $this->get('/administrators');

        $response->assertOk()
            ->assertSee('id="app"', false);
    }

    public function test_administrator_create_page_renders_the_application_shell(): void
    {
        $response = $this->get('/administrators/create');

        $response->assertOk()
            ->assertSee('id="app"', false);
    }

    public function test_administrator_edit_page_renders_the_application_shell(): void
    {
        $response = $this->get('/administrators/3/edit');

        $response->assertOk()
            ->assertSee('id="app"', false);
    }
}
