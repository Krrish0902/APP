import { supabase } from './supabase';
import { Tables } from './supabase';
import { Alert } from 'react-native';
import { decode } from 'base64-arraybuffer';

export interface Artist {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone_num: string;
  user_id: string;
  password: string;
  dob: string;
  bio: string;
  profile_picture_url: string | null;
  is_verified?: boolean;
}

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

export async function searchArtists(query: string) {
  try {
    const { data: artists, error } = await supabase
      .from('Artist')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');

    if (error) throw error;

    return { artists, error: null };
  } catch (error) {
    console.error('Error searching artists:', error);
    return { artists: null, error };
  }
}

// Helper function to extract filename from URL
const getFilePathFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  try {
    // The URL will be like: https://xxx.supabase.co/storage/v1/object/public/artist-media/images/filename.jpg
    const matches = url.match(/artist-media\/images\/(.*)/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting file path:', error);
    return null;
  }
};

export const deleteProfilePicture = async (userId: string) => {
  try {
    // First get the current profile picture URL
    const { data: artist } = await supabase
      .from('Artist')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    const filePath = getFilePathFromUrl(artist?.profile_picture_url);

    if (filePath) {
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('artist-media')
        .remove([`images/${filePath}`]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }
    }

    // Update the artist record to remove the profile picture URL
    const { error: dbError } = await supabase
      .from('Artist')
      .update({ profile_picture_url: null })
      .eq('id', userId);

    if (dbError) throw dbError;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return { success: false, error };
  }
};

export const uploadProfilePicture = async (userId: string, base64Image: string) => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    // Get current profile picture to delete it
    const { data: currentArtist } = await supabase
      .from('Artist')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    // Delete old picture from storage if it exists
    if (currentArtist?.profile_picture_url) {
      const oldFilePath = getFilePathFromUrl(currentArtist.profile_picture_url);
      if (oldFilePath) {
        await supabase.storage
          .from('artist-media')
          .remove([`images/${oldFilePath}`]);
      }
    }

    // Create a unique file name
    const fileName = `${userId}-${Date.now()}.jpg`;
    const filePath = `images/${fileName}`;

    // Upload the new image
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('artist-media')
      .upload(filePath, decode(base64Data), {
        contentType: 'image/jpeg',
        upsert: false // Set to false since we're manually handling old file deletion
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('artist-media')
      .getPublicUrl(filePath);

    // Update the artist's profile_picture_url in the database
    const { error: updateError } = await supabase
      .from('Artist')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return { publicUrl: null, error };
  }
};

export const updateArtistProfilePicture = async (userId: string, imageUri: string) => {
  try {
    // First, upload the new image (this will also handle deleting the old image)
    const { publicUrl, error: uploadError } = await uploadProfilePicture(userId, imageUri);
    if (uploadError) throw uploadError;

    return { success: true, url: publicUrl, error: null };
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return { success: false, url: null, error };
  }
};
