import { supabase } from './supabase';
import { Tables } from './supabase';
import { Alert } from 'react-native';

export type Artist = Tables['Artist']['Row'];

export const getArtistByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('Artist')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { artist: data, error: null };
  } catch (error) {
    console.error('Error getting artist profile:', error);
    return { artist: null, error };
  }
};

export const createArtistProfile = async (
  id: string,
  artistData: {
    name: string;
    email?: string;
    password?: string;
    user_id?: string;
    phone_num?: number;
    bio?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from('Artist')
      .insert({
        id: id,
        name: artistData.name,
        email: artistData.email,
        password: artistData.password,
        user_id: artistData.user_id,
        phone_num: artistData.phone_num,
        bio: artistData.bio,
      })
      .select()
      .single();

    if (error) throw error;
    return { artist: data, error: null };
  } catch (error) {
    console.error('Error creating artist profile:', error);
    return { artist: null, error };
  }
};

export const updateArtistProfile = async (
  userId: string,
  updates: Partial<Omit<Tables['Artist']['Update'], 'id' | 'user_id' | 'created_at'>>
) => {
  try {
    console.log('Updating artist profile for userId:', userId);
    console.log('Updates:', updates);

    const { data, error } = await supabase
      .from('Artist')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error from database:', error);
      throw error;
    }

    console.log('Update successful, data returned:', data);
    return { artist: data, error: null };
  } catch (error) {
    console.error('Error updating artist profile:', error);
    return { artist: null, error };
  }
};

export const getAllArtists = async () => {
  try {
    const { data, error } = await supabase
      .from('Artist')
      .select('*')
      .order('name');

    if (error) throw error;
    return { artists: data, error: null };
  } catch (error) {
    console.error('Error getting all artists:', error);
    return { artists: null, error };
  }
};

export const getVerifiedArtists = async () => {
  try {
    const { data, error } = await supabase
      .from('Artist')
      .select('*')
      .eq('is_verified', true)
      .order('name');

    if (error) throw error;
    return { artists: data, error: null };
  } catch (error) {
    console.error('Error getting verified artists:', error);
    return { artists: null, error };
  }
};
