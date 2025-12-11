import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'recruiter' | 'candidate';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: AppRole | null;
  isOnboarded: boolean | null;
  signUp: (email: string, password: string, fullName: string, companyName?: string, role?: 'candidate' | 'recruiter') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fetchUserData = async (userId: string): Promise<void> => {
    try {
      // Fetch role and profile in parallel for speed
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', userId)
          .maybeSingle()
      ]);

      // Handle role
      if (roleResult.error) {
        console.error('Error fetching user role:', roleResult.error);
      } else if (roleResult.data) {
        setUserRole(roleResult.data.role as AppRole);
      }

      // Handle onboarding status
      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
        setIsOnboarded(false);
      } else if (!profileResult.data) {
        setIsOnboarded(false);
      } else {
        setIsOnboarded(profileResult.data.is_onboarded ?? false);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsOnboarded(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchUserData(initialSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setInitialLoadDone(true);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          // Only set loading true for sign in/up events after initial load
          if (initialLoadDone && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            setLoading(true);
          }
          
          // Use setTimeout to avoid deadlock, but await the result
          setTimeout(async () => {
            if (!mounted) return;
            await fetchUserData(newSession.user.id);
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setUserRole(null);
          setIsOnboarded(null);
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshOnboardingStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('is_onboarded')
      .eq('id', user.id)
      .maybeSingle();
    
    setIsOnboarded(data?.is_onboarded ?? false);
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    companyName?: string,
    role: 'candidate' | 'recruiter' = 'candidate'
  ) => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          company_name: companyName,
          role: role,
        }
      }
    });
    
    if (error) {
      setLoading(false);
    }
    // Loading will be set to false by onAuthStateChange after fetching user data
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
    }
    // Loading will be set to false by onAuthStateChange after fetching user data
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setIsOnboarded(null);
  };

  const hasRole = (role: AppRole): boolean => {
    return userRole === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      isOnboarded,
      signUp,
      signIn,
      signOut,
      hasRole,
      refreshOnboardingStatus,
    }}>
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
