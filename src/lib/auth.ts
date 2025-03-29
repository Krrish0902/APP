import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createArtistProfile, uploadProfilePicture } from './artist';

// SecureStore is not available on web, so we use localStorage as a fallback
const storeItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const removeItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

// Auth functions
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  fullName: string, 
  phoneNumber: string,
  latitude?: number,
  longitude?: number,
  profilePicture?: string | null
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
          phone: phoneNumber,
        },
      },
    });

    if (error) throw error;

    // Create a profile for the user
    if (data.user) {
      const user_id = email.split('@')[0]; // Simple username generation
      
      // Create an artist profile for the user
      await createArtistProfile(data.user.id, {
        name: fullName,
        email: email,
        password: password,
        user_id: user_id,
        phone_num: phoneNumber ? parseInt(phoneNumber) : undefined,
        latitude: latitude ? latitude : undefined,
        longitude: latitude ? longitude : undefined,
        bio: `Artist profile for ${fullName}`,
      });

      // Upload profile picture if provided
      if (profilePicture) {
        const { publicUrl, error: uploadError } = await uploadProfilePicture(data.user.id, profilePicture);
        if (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
        }
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { data: null, error };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error };
  }
};