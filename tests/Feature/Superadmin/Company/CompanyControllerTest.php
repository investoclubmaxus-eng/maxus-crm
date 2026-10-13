<?php

namespace Tests\Feature\Superadmin\Company;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_cannot_list_companies(): void
    {
        $this->getJson('/api/superadmin/companies-details')
            ->assertUnauthorized();
    }

    public function test_authenticated_request_creates_company_and_persists_india_phone(): void
    {
        $this->authenticate();

        $this->postJson('/api/superadmin/companies-create', $this->validCompanyData())
            ->assertCreated()
            ->assertJsonPath('data.phone', '+919876543210')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('companies', [
            'name' => 'Test Realty',
            'code' => 'TEST-REALTY',
            'phone' => '+919876543210',
            'postal_code' => '560001',
            'status' => 'active',
        ]);
    }

    public function test_invalid_company_phone_is_rejected_without_creating_a_company(): void
    {
        $this->authenticate();

        $this->postJson(
            '/api/superadmin/companies-create',
            $this->validCompanyData(['phone' => '12345abc'])
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.phone.0',
                'Phone number must contain exactly 10 digits.'
            );

        $this->assertDatabaseCount('companies', 0);
    }

    public function test_postal_code_over_six_digits_is_rejected_with_a_clear_message(): void
    {
        $this->authenticate();

        $this->postJson(
            '/api/superadmin/companies-create',
            $this->validCompanyData(['postal_code' => '1234567'])
        )
            ->assertUnprocessable()
            ->assertJsonPath(
                'errors.postal_code.0',
                'Postal code must contain no more than 6 digits.'
            );

        $this->assertDatabaseCount('companies', 0);
    }

    public function test_listing_and_company_details_return_saved_company_data(): void
    {
        $user = $this->authenticate();
        $company = $this->createCompany($user);

        $this->getJson('/api/superadmin/companies-details')
            ->assertOk()
            ->assertJsonPath('data.0.id', $company->id)
            ->assertJsonPath('data.0.phone', '+919876543210');

        $this->getJson("/api/superadmin/companies/{$company->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $company->id)
            ->assertJsonPath('data.name', $company->name);
    }

    public function test_update_removes_the_company_logo_and_saves_the_india_phone_prefix(): void
    {
        Storage::fake('public');

        $user = $this->authenticate();
        $company = $this->createCompany($user, [
            'logo_path' => 'settings/companies/existing-logo.png',
        ]);
        Storage::disk('public')->put($company->logo_path, 'logo');

        $this->putJson(
            "/api/superadmin/companies-update/{$company->id}",
            $this->validCompanyData([
                'name' => 'Updated Realty',
                'remove_logo' => true,
            ])
        )
            ->assertOk()
            ->assertJsonPath('data.phone', '+919876543210')
            ->assertJsonPath('data.logo_path', null);

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Realty',
            'phone' => '+919876543210',
            'logo_path' => null,
        ]);
        Storage::disk('public')->assertMissing('settings/companies/existing-logo.png');
    }

    public function test_company_status_can_be_updated(): void
    {
        $user = $this->authenticate();
        $company = $this->createCompany($user);

        $this->patchJson(
            "/api/superadmin/companies-status/{$company->id}",
            ['status' => 'suspended']
        )
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'status' => 'suspended',
        ]);
    }

    public function test_company_deletion_soft_deletes_the_record_and_removes_its_logo(): void
    {
        Storage::fake('public');

        $user = $this->authenticate();
        $company = $this->createCompany($user, [
            'logo_path' => 'settings/companies/delete-logo.png',
        ]);
        Storage::disk('public')->put($company->logo_path, 'logo');

        $this->deleteJson("/api/superadmin/companies-delete/{$company->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted($company);
        Storage::disk('public')->assertMissing('settings/companies/delete-logo.png');
    }

    /**
     * @return array<string, mixed>
     */
    private function validCompanyData(array $overrides = []): array
    {
        return array_replace([
            'name' => 'Test Realty',
            'code' => 'TEST-REALTY',
            'email' => 'contact@test-realty.example',
            'phone' => '9876543210',
            'website' => 'https://test-realty.example',
            'industry' => 'Real Estate',
            'address' => '1 Main Street',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'country' => 'India',
            'postal_code' => '560001',
            'status' => 'active',
        ], $overrides);
    }

    private function authenticate(): User
    {
        $user = User::factory()->create();
        $this->withToken($user->createToken('feature-test')->plainTextToken);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createCompany(User $creator, array $overrides = []): Company
    {
        return Company::create(array_replace([
            'name' => 'Test Realty',
            'code' => 'TEST-REALTY',
            'email' => 'contact@test-realty.example',
            'phone' => '+919876543210',
            'website' => 'https://test-realty.example',
            'industry' => 'Real Estate',
            'address' => '1 Main Street',
            'city' => 'Bengaluru',
            'state' => 'Karnataka',
            'country' => 'India',
            'postal_code' => '560001',
            'status' => 'pending',
            'created_by' => $creator->id,
        ], $overrides));
    }
}
