import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, FlatList, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../src/context/AuthContext';
import { Svg, Path, Defs, LinearGradient as SVGLinearGradient, Stop } from 'react-native-svg';

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
  latitude?: number;
  longitude?: number;
  location?: string;
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
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const videoRef = useRef(null);
  const { theme } = useTheme();
  const router = useRouter();
  const { userCoordinates } = useAuth(); // Access user coordinates

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const distance = userCoordinates && artist?.latitude && artist?.longitude
    ? calculateDistance(userCoordinates.latitude, userCoordinates.longitude, artist.latitude, artist.longitude)
    : null;
    
  const handleVideoPress = (videoPath: string) => {
    setSelectedVideo(videoPath);
    setVideoModalVisible(true);
  };

  const closeVideoModal = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };

  if (isLoading) {
  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000' : '#fff' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artist Profile</Text>
      </View>
      
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
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
      
      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artist Profile</Text>
      </View>

      <FlatList
        data={[{ key: 'profile' }, { key: 'videos' }]}
        renderItem={({ item }) => {
          if (item.key === 'profile') {
            return (
              <>
                {/* Curved gradient background - inside the scrollable area */}
                <View style={styles.curveBackground}>
                  <Svg height="300" width={SCREEN_WIDTH+1} viewBox={`0 0 ${SCREEN_WIDTH} 300`}>
                    <Defs>
                      <SVGLinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0" stopColor={theme === 'dark' ? '#2E1065' : '#2E1065'} />
                        <Stop offset="1" stopColor={theme === 'dark' ? '#2596be' : '#76b5c5'} />
                      </SVGLinearGradient>
                    </Defs>
                    <Path
                      d={`M0 0 L${SCREEN_WIDTH} 0 L${SCREEN_WIDTH} 200 Q${SCREEN_WIDTH/2} 300 0 200 Z`}
                      fill="url(#grad)"
                    />
                  </Svg>
                </View>
                
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

                        <View style={styles.contactItem_distance}>
                          <View style={styles.contactIcon}>
                            <Ionicons name="map" size={24} color="#0066ff" />
                          </View>
                          <View>
                            <Text style={[styles.contactText, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
                              {artist.location || 'No Location'}
                            </Text>
                            {distance !== null && (
                            <Text style={[styles.contactText_distance, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                             {distance.toFixed(2)} km away
                            </Text>
                            )}
                            <Text style={styles.contactLabel}>Location</Text>
                          </View>
                        </View>
                      </Animated.View>
                    )}

                  </Animated.View>
                </View>
              </>
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
                      <TouchableOpacity 
                        style={styles.videoCard}
                        onPress={() => handleVideoPress(supabase.storage.from('artist-media').getPublicUrl(item.file_path).data.publicUrl)}
                      >
                        <View style={{ position: 'relative' }}>
                          <Video
                            source={{ uri: supabase.storage.from('artist-media').getPublicUrl(item.file_path).data.publicUrl }}
                            style={styles.videoThumbnail}
                            resizeMode={ResizeMode.COVER}
                            isLooping
                          />
                          <Text style={[
                            styles.videoDate, 
                            { 
                               color: theme === 'dark' ? '#FFFFFF' : '#000000',
                              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'
                            }
                          ]}>
                            {new Date(item.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </TouchableOpacity>
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
      
      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeVideoModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity 
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000',
              borderRadius: 20,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }} 
            onPress={closeVideoModal}
          >
            <Ionicons name="close" size={24} color={theme === 'dark' ? '#000000' : '#FFFFFF'} />
          </TouchableOpacity>
          {selectedVideo && (
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH * 1.5,
              }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={true}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  curveBackground: {
    width: '100%',
    height: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 20,
  },
  loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    marginTop: -130,
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
  contactItem_distance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    display: 'flex',
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
  contactText_distance: {
    fontSize: 12,
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
  distanceText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});