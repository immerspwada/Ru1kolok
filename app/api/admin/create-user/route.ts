import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin API: Create User (Bypass Rate Limiting)
 * 
 * This endpoint uses the service role key to create users,
 * which bypasses Supabase's rate limiting.
 * 
 * Only accessible by admin users.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role - check both profiles and user_roles tables
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Also check user_roles table
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || userRole?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name' },
        { status: 400 }
      );
    }

    // Create user using Admin API (bypasses rate limiting)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Get first available club
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id')
      .limit(1);

    const clubId = clubs && clubs.length > 0 ? clubs[0].id : null;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name,
        role: 'athlete',
        club_id: clubId,
        membership_status: 'active',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't fail the request, profile can be created later
    }

    // Create athlete record if club exists
    if (clubId) {
      const nameParts = full_name.split(' ');
      const firstName = nameParts[0] || full_name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: athleteError } = await supabase
        .from('athletes')
        .insert({
          user_id: newUser.user.id,
          club_id: clubId,
          email,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: '2000-01-01',
          phone_number: '0000000000',
        });

      if (athleteError) {
        console.error('Error creating athlete:', athleteError);
        // Don't fail the request
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      },
      message: 'User created successfully',
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
