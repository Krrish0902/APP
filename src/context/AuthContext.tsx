import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { Tables } from '../lib/supabase';
import { getArtistByUserId }  from '../lib/artist';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

type Artist = Tables['Artist']['Row'];

interface AuthContextType {
  user: any | null;
  artist: Artist | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshArtistProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  artist: null,
  isLoading: true,
  signOut: async () => {},
  refreshArtistProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchArtistProfile = async (userId: string) => {
    try {
      console.log('Fetching artist profile for user:', userId);
      const { artist, error } = await getArtistByUserId(userId);
      if (error) {
        console.error('Error in fetchArtistProfile:', error);
        return;
      }
      console.log('Artist profile fetched:', artist);
      setArtist(artist);
    } catch (error) {
      console.error('Error fetching artist profile:', error);
    }
  };

  const refreshArtistProfile = async () => {
    if (user) {
      await fetchArtistProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchArtistProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setArtist(null);
          router.replace('/(auth)/login'); // Redirect to login page
        }
      }
    );

    // Clean up the listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Initial state setup
  useEffect(() => {
    setUser(null);
    setArtist(null);
    setIsLoading(false);
    router.replace('/(auth)/login'); // Redirect to login page on initial load
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setArtist(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        artist,
        isLoading,
        signOut: handleSignOut,
        refreshArtistProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};