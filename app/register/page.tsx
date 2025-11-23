import { createClient } from '@/lib/supabase/server';
import { SimpleRegistrationForm } from '@/components/auth/SimpleRegistrationForm';
import { redirect } from 'next/navigation';

export default async function RegisterPage() {
  const supabase = await createClient();

  // Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If already logged in, redirect to membership registration
    redirect('/register-membership');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SimpleRegistrationForm />
    </div>
  );
}
