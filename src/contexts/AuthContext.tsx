import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, ProfileRow } from '../types';

// ---- Types ----
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---- Helper ----
function profileFromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    totalPoints: row.total_points,
    gamesPlayed: row.games_played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    goals: row.goals,
    createdAt: row.created_at,
  };
}

// ---- Provider ----
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (!error && data) {
      setProfile(profileFromRow(data as ProfileRow));
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters.' };
    }
    if (!cleanUsername) {
      return { error: 'Username is required.' };
    }

    // 1. Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();
    if (existing) {
      return { error: 'That username is already taken. Please choose another.' };
    }

    // 2. Create auth user with metadata
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
        },
      },
    });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Registration failed. Please try again.' };

    // 3. Create or ensure profile row
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        user_id: data.user.id,
        username: cleanUsername,
        display_name: displayName.trim() || cleanUsername,
        email: cleanEmail,
        total_points: 0,
        games_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
      },
      { onConflict: 'user_id' }
    );

    if (profileError && !profileError.message.toLowerCase().includes('row-level security')) {
      console.warn('Profile upsert note:', profileError.message);
    }

    if (data.session && data.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id);
    }

    return { error: null };
  };

  const signIn = async (
    emailOrUsername: string,
    password: string
  ): Promise<{ error: string | null }> => {
    let emailToUse = emailOrUsername.trim();
    if (!emailToUse) {
      return { error: 'Please enter your email or username.' };
    }
    if (!password) {
      return { error: 'Please enter your password.' };
    }

    if (!emailToUse.includes('@')) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', emailToUse)
        .maybeSingle();
      if (prof?.email) {
        emailToUse = prof.email;
      } else {
        return { error: `No account found with username "${emailOrUsername}". Please enter your registered email address.` };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return { error: 'Email not confirmed yet. Check your inbox to verify your email, or turn off "Confirm email" in Supabase Auth settings.' };
      }
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid login credentials. Please check your email/username and password.' };
      }
      return { error: error.message };
    }

    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signUp, signIn, signOut, resetPassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
