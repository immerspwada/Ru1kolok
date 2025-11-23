/**
 * Test page for RegistrationForm component
 * 
 * This page allows testing the multi-step registration form in isolation.
 * Navigate to /test-registration-form to test the component.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegistrationForm from '@/components/membership/RegistrationForm';

export default async function TestRegistrationFormPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const handleSuccess = () => {
    console.log('Registration successful!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Registration Form
          </h1>
          <p className="text-gray-600">
            Testing the multi-step membership registration form
          </p>
        </div>

        <RegistrationForm
          userId={user.id}
          onSuccess={() => {
            alert('Registration successful! Redirecting...');
            window.location.href = '/dashboard/athlete';
          }}
        />
      </div>
    </div>
  );
}
