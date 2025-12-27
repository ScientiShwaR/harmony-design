import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, Permission } from '@/core/rbac/permissions';
import { isAdminRole } from '@/core/rbac/permissions';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: AppRole[];
  permissions: Permission[];
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and roles
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        });
      }

      // Fetch user roles
      const { data: userRolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const userRoles = (userRolesData?.map(r => r.role) || []) as AppRole[];
      setRoles(userRoles);

      // Fetch permissions for roles
      if (userRoles.length > 0) {
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id, name')
          .in('name', userRoles);

        if (rolesData && rolesData.length > 0) {
          const roleIds = rolesData.map(r => r.id);
          const { data: permissionsData } = await supabase
            .from('role_permissions')
            .select('permission')
            .in('role_id', roleIds);

          const uniquePerms = [...new Set(permissionsData?.map(p => p.permission) || [])];
          setPermissions(uniquePerms as Permission[]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setPermissions([]);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setRoles([]);
          setPermissions([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = roles.some(isAdminRole);

  const hasPermission = (permission: Permission): boolean => {
    // Admins have all permissions
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        permissions,
        isLoading,
        isAdmin,
        hasPermission,
        hasRole,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
