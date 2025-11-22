// Database types will be generated from Supabase
// Run: npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'coach' | 'athlete';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type CheckInMethod = 'manual' | 'qr' | 'auto';

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sport_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sport_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sport_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      athletes: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          first_name: string;
          last_name: string;
          nickname: string | null;
          date_of_birth: string;
          phone_number: string;
          email: string;
          gender: string;
          health_notes: string | null;
          profile_picture_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          club_id: string;
          first_name: string;
          last_name: string;
          nickname?: string | null;
          date_of_birth: string;
          phone_number: string;
          email: string;
          gender: string;
          health_notes?: string | null;
          profile_picture_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          club_id?: string;
          first_name?: string;
          last_name?: string;
          nickname?: string | null;
          date_of_birth?: string;
          phone_number?: string;
          email?: string;
          gender?: string;
          health_notes?: string | null;
          profile_picture_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      coaches: {
        Row: {
          id: string;
          user_id: string;
          club_id: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          email: string;
          certification_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          club_id: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          email: string;
          certification_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          club_id?: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          email?: string;
          certification_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          club_id: string;
          coach_id: string | null;
          title: string;
          description: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          location: string;
          max_participants: number | null;
          status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
          qr_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          coach_id?: string | null;
          title: string;
          description?: string | null;
          session_date: string;
          start_time: string;
          end_time: string;
          location: string;
          max_participants?: number | null;
          status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
          qr_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          coach_id?: string | null;
          title?: string;
          description?: string | null;
          session_date?: string;
          start_time?: string;
          end_time?: string;
          location?: string;
          max_participants?: number | null;
          status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
          qr_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_logs: {
        Row: {
          id: string;
          training_session_id: string;
          athlete_id: string;
          status: AttendanceStatus;
          check_in_time: string | null;
          check_in_method: CheckInMethod;
          marked_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_session_id: string;
          athlete_id: string;
          status: AttendanceStatus;
          check_in_time?: string | null;
          check_in_method: CheckInMethod;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          training_session_id?: string;
          athlete_id?: string;
          status?: AttendanceStatus;
          check_in_time?: string | null;
          check_in_method?: CheckInMethod;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          training_session_id: string;
          athlete_id: string;
          status: AttendanceStatus;
          check_in_time: string | null;
          check_in_method: CheckInMethod;
          marked_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          training_session_id: string;
          athlete_id: string;
          status: AttendanceStatus;
          check_in_time?: string | null;
          check_in_method: CheckInMethod;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          training_session_id?: string;
          athlete_id?: string;
          status?: AttendanceStatus;
          check_in_time?: string | null;
          check_in_method?: CheckInMethod;
          marked_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      performance_records: {
        Row: {
          id: string;
          athlete_id: string;
          coach_id: string;
          test_type: string;
          test_name: string;
          score: number;
          unit: string;
          test_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          coach_id: string;
          test_type: string;
          test_name: string;
          score: number;
          unit: string;
          test_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          athlete_id?: string;
          coach_id?: string;
          test_type?: string;
          test_name?: string;
          score?: number;
          unit?: string;
          test_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          club_id: string | null;
          author_id: string;
          author_role: UserRole;
          title: string;
          content: string;
          priority: AnnouncementPriority;
          published_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id?: string | null;
          author_id: string;
          author_role: UserRole;
          title: string;
          content: string;
          priority: AnnouncementPriority;
          published_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string | null;
          author_id?: string;
          author_role?: UserRole;
          title?: string;
          content?: string;
          priority?: AnnouncementPriority;
          published_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      login_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          device_info: Json;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          device_info: Json;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          device_info?: Json;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
