import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Artist {
  id: string;
  name: string;
  bio: string;
  profile_picture_url: string;
  is_verified: boolean;
  email: string;
  phone_num: string;
  user_id: string;
}

interface video {
  id: string;
  file_path: string;
  created_at: string;
}

export default function ArtistProfileScreen() {
  const { id } = useLocalSearchParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [videos, setVideos] = useState<video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchArtistProfile();
  }, [id]);

  const fetchArtistProfile = async () => {
    try {
      setIsLoading(true);
      const { data: artistData, error: artistError } = await supabase
        .from('Artist') // Ensure this matches your actual table name
        .select('*')
        .eq('id', id)
        .single();

      if (artistError) throw artistError;
      if (!artistData) throw new Error('Artist not found');

      setArtist(artistData as Artist);
      await fetchArtistVideos(artistData.id); // Fetch videos for the artist
    } catch (err) {
      console.error('Error fetching artist profile:', err);
      setError('Failed to load artist profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArtistVideos = async (artistId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, file_path, created_at')
        .eq('artist_id', artistId)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching artist videos:', err);
      setError('Failed to load artist videos');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
        <Text style={[styles.errorText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          {error || 'Artist not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0066ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artist Profile</Text>
      </View>

      <FlatList
        data={[{ key: 'profile' }, { key: 'videos' }]} // Use a data array to differentiate sections
        renderItem={({ item }) => {
          if (item.key === 'profile') {
            return (
              <View style={styles.profileHeader}>
                <TouchableOpacity style={styles.avatarContainer}>
                  <Image 
                    source={{ 
                      uri: artist.profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.onlineIndicator} />
                </TouchableOpacity>
                
                <Animated.View entering={FadeInUp} style={styles.profileInfo}>
                  <View style={styles.usernameContainer}>
                    <Text style={styles.username} numberOfLines={1}>@{artist.user_id}</Text>
                  </View>
                  
                  <View style={styles.nameContainer}>
                    <Text style={[styles.name, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                      {artist.name}
                    </Text>
                    {artist.is_verified && (
                      <Ionicons name="checkmark-circle" size={24} color="#0066ff" style={styles.verifiedIcon} />
                    )}
                  </View>

                  {artist.bio ? (
                    <Text style={styles.bio}>{artist.bio}</Text>
                  ) : (
                    <Text style={styles.bio}>No bio added yet</Text>
                  )}

                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => setShowContact(!showContact)}
                  >
                    <Ionicons 
                      name={showContact ? "chevron-up-outline" : "chevron-down-outline"} 
                      size={20} 
                      color="#0066ff" 
                    />
                    <Text style={styles.contactButtonText}>Contact Info</Text>
                  </TouchableOpacity>

                  {showContact && (
                    <Animated.View 
                      entering={FadeInUp}
                      style={styles.contactInfo}
                    >
                      <View style={styles.contactItem}>
                        <View style={styles.contactIcon}>
                          <Ionicons name="mail-outline" size={24} color="#0066ff" />
                        </View>
                        <View>
                          <Text style={[styles.contactText, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                            {artist.email || 'No Email'}
                          </Text>
                          <Text style={styles.contactLabel}>Email</Text>
                        </View>
                      </View>

                      <View style={styles.contactItem}>
                        <View style={styles.contactIcon}>
                          <Ionicons name="call-outline" size={24} color="#0066ff" />
                        </View>
                        <View>
                          <Text style={[styles.contactText, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                            {artist.phone_num || 'No Phone'}
                          </Text>
                          <Text style={styles.contactLabel}>Phone</Text>
                        </View>
                      </View>
                    </Animated.View>
                  )}
                </Animated.View>
              </View>
            );
          } else if (item.key === 'videos') {
            return (
              <View style={styles.videoSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                    My Videos
                  </Text>
                </View>

                {videos.length > 0 ? (
                  <FlatList
                    data={videos}
                    renderItem={({ item }) => (
                      <View style={styles.videoCard}>
                        <View style={{ position: 'relative' }}>
                          <Video
                            source={{ uri: supabase.storage.from('artist-media').getPublicUrl(item.file_path).data.publicUrl }}
                            style={styles.videoThumbnail}
                            resizeMode={ResizeMode.COVER}
                            useNativeControls
                            isLooping
                          />
                          <Text style={[styles.videoDate, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    )}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                  />
                ) : (
                  <Text style={[styles.noVideosText, { color: theme === 'dark' ? '#999999' : '#666666' }]}>
                    No videos uploaded yet
                  </Text>
                )}
              </View>
            );
          }
          return null;
        }}
        keyExtractor={(item) => item.key}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066ff',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#0066ff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#000000',
  },
  profileInfo: {
    width: '100%',
    alignItems: 'center',
  },
  usernameContainer: {
    maxWidth: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    color: '#0066ff',
    textAlign: 'center',
    fontWeight: '500',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    maxWidth: SCREEN_WIDTH - 40,
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  bio: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
    width: '100%',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,102,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#0066ff',
    marginBottom: 15,
  },
  contactButtonText: {
    color: '#0066ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactInfo: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,102,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactText: {
    fontSize: 16,
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  videoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  videoCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 180,
  },
  videoThumbnail: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  videoDate: {
    fontSize: 12,
    padding: 8,
    paddingTop: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  noVideosText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    marginTop: 20,
  },
}); 