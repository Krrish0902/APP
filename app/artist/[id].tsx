import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getArtistByUserId } from '../../src/lib/artist';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Artist {
  id: string;
  name: string;
  bio: string;
  profile_picture_url: string;
  is_verified: boolean;
  email: string;
  phone_num: string;
}

export default function ArtistProfileScreen() {
  const { id } = useLocalSearchParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchArtistProfile();
  }, [id]);

  const fetchArtistProfile = async () => {
    try {
      setIsLoading(true);
      const { artist: artistData, error } = await getArtistByUserId(id as string);
      
      if (error) throw error;
      setArtist(artistData as Artist);
    } catch (err) {
      console.error('Error fetching artist profile:', err);
      setError('Failed to load artist profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {isLoading ? (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
          <ActivityIndicator size="large" color="#0066ff" />
        </View>
      ) : error || !artist ? (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
          <Text style={[styles.errorText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            {error || 'Artist not found'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}
          contentContainerStyle={styles.contentContainer}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={theme === 'dark' ? '#fff' : '#000'} 
            />
          </TouchableOpacity>

          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: artist.profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
              }}
              style={styles.profileImage}
            />
          </View>

          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: theme === 'dark' ? '#fff' : '#000' }]}>
              {artist.name}
            </Text>
            {artist.is_verified && (
              <Ionicons name="checkmark-circle" size={24} color="#0066ff" style={styles.verifiedIcon} />
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
              About
            </Text>
            <Text style={[styles.bio, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
              {artist.bio || 'No bio available'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#fff' : '#000' }]}>
              Contact Information
            </Text>
            {artist.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={20} color={theme === 'dark' ? '#fff' : '#000'} />
                <Text style={[styles.contactText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                  {artist.email}
                </Text>
              </View>
            )}
            {artist.phone_num && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={20} color={theme === 'dark' ? '#fff' : '#000'} />
                <Text style={[styles.contactText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                  {artist.phone_num}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    marginTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImageContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  profileImage: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.4,
    borderRadius: SCREEN_WIDTH * 0.2,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 