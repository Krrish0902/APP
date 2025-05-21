import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Dimensions, Switch, Platform, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { updateArtistProfile, updateArtistProfilePicture, deleteProfilePicture } from '../../src/lib/artist';
import { Tables } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import Constants from "expo-constants";
import * as Location from 'expo-location';
import { Svg, Circle, Path, Defs, LinearGradient as SVGLinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Artist = Tables['Artist']['Row'];

export default function ProfileScreen() {
  const { user, artist, signOut, refreshArtistProfile } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [videos, setVideos] = useState<Array<{ id: string; file_path: string; created_at: string }>>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const videoRef = useRef(null);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    email: '',
    phone_num: '',
    location: '',
    longitude: '',
    latitude: '',
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false); // Add state for location fetching

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    headerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 170,
      zIndex: 1,
    },
    curveBackground: {
      width: '100%',
      height: 370,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 5,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    signOutButton: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 12,
    },
    content: {
      flex: 1,
    },
    profileHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      width: '100%',
      marginTop: -200, // Pull content up into the curved area
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
      borderColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    editOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      padding: 8,
    },
    profileInfo: {
      width: '100%',
      alignItems: 'center',
    },
    usernameContainer: {
      maxWidth: '90%',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
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
    fullName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 10,
      textAlign: 'center',
      paddingHorizontal: 20,
      maxWidth: SCREEN_WIDTH - 40,
    },
    bio: {
      fontSize: 16,
      color: theme === 'dark' ? '#999999' : '#666666',
      textAlign: 'center',
      marginBottom: 30,
      paddingHorizontal: 20,
      lineHeight: 24,
      width: '100%',
    },
    statsContainer: {
      width: '100%',
      marginBottom: 30,
      paddingHorizontal: 20,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      padding: 15,
      borderRadius: 15,
      marginBottom: 10,
      width: '100%',
      overflow: 'hidden',
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,102,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
      flexShrink: 0,
    },
    statTextContainer: {
      flex: 1,
      marginRight: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 2,
      flexWrap: 'wrap',
      maxWidth: SCREEN_WIDTH - 120,
    },
    statLabel: {
      fontSize: 14,
      color: theme === 'dark' ? '#666666' : '#999999',
    },
    editProfileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,102,255,0.1)',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: '#0066ff',
      flex: 1,
      justifyContent: 'center',
      marginLeft: 8,
    },
    editIcon: {
      marginRight: 8,
    },
    editProfileText: {
      color: '#0066ff',
      fontSize: 16,
      fontWeight: '600',
    },
    editForm: {
      width: '100%',
      marginTop: 20,
      paddingHorizontal: 20,
    },
    formField: {
      marginBottom: 20,
      width: '100%',
    },
    formLabel: {
      color: theme === 'dark' ? '#999999' : '#666666',
      fontSize: 14,
      marginBottom: 8,
      marginLeft: 4,
    },
    formInput: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      borderRadius: 12,
      padding: 15,
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      width: '100%',
    },
    bioInput: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    editButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
      width: '100%',
    },
    editButton: {
      flex: 0.48,
      paddingVertical: 15,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      backgroundColor: '#0066ff',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    cancelButtonText: {
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      fontSize: 16,
      fontWeight: '600',
    },
    circleContainer: {
      position: 'absolute',
      zIndex: 0, // Above gradient background but below other components
      top: 0,
      left: 0,
    },
    themeToggleContainer: {
      position: 'absolute',
      top: 60,
      right: 70,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 2,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    themeToggleText: {
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginRight: 8,
      fontSize: 12,
      fontWeight: '600',
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
      flex: 1,
      justifyContent: 'center',
      marginRight: 8,
    },
    contactButtonText: {
      color: '#0066ff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 15,
      width: '100%',
    },
    contactInfo: {
      width: '100%',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      flex: 1,
    },
    contactLabel: {
      fontSize: 12,
      color: theme === 'dark' ? '#999999' : '#666666',
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
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,102,255,0.1)',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
    },
    uploadButtonText: {
      color: '#0066ff',
      marginLeft: 5,
      fontSize: 14,
      fontWeight: '500',
    },
    videoList: {
      marginHorizontal: -20,
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    videoCard: {
      marginRight: 12,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
    },
    noVideosText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 14,
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    locationButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: 'rgba(0,102,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
  });

  useEffect(() => {
    if (artist) {
      setEditForm({
        name: artist.name || '',
        bio: artist.bio || '',
        email: artist.email || '',
        phone_num: artist.phone_num ? String(artist.phone_num) : '',
        location: artist.location || '',
        longitude: artist.longitude || null,
        latitude: artist.latitude || null,
      });
      fetchUserVideos();
    }
  }, [artist]);

  const fetchUserVideos = async () => {
    if (!artist) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, file_path, created_at')
        .eq('artist_id', artist.id)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };
  
  const handleVideoPress = (videoPath: string) => {
    setSelectedVideo(videoPath);
    setVideoModalVisible(true);
  };

  const closeVideoModal = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };
 

  const handleUploadVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media library to upload videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'videos',
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300,
      });

      if (result.canceled) return;

      setIsLoading(true);
      const videoUri = result.assets[0].uri;
      console.log('Original video URI:', videoUri);

      // Get file extension and prepare upload path
      const fileExt = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `videos/${artist?.id}/${fileName}`;
      console.log('File path:', filePath);

      let uploadSuccess = false;
      let uploadAttempt = 0;
      const maxAttempts = 3;

      while (uploadAttempt < maxAttempts && !uploadSuccess) {
        try {
          uploadAttempt++;
          console.log(`Starting upload attempt ${uploadAttempt}`);

          // Create form data
          const formData = new FormData();
          formData.append('file', {
            uri: videoUri,
            type: `video/${fileExt}`,
            name: fileName,
          } as any);

          // Get the presigned URL for upload
          const { data: urlData, error: urlError } = await supabase.storage
            .from('artist-media')
            .createSignedUploadUrl(filePath);

          if (urlError || !urlData) {
            console.error('Error getting upload URL:', urlError);
            throw urlError || new Error('Failed to get upload URL');
          }

          // Upload to the presigned URL
          const uploadResponse = await fetch(urlData.signedUrl, {
            method: 'PUT',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${urlData.token}`,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed with status ${uploadResponse.status}`);
          }

          console.log('Upload successful');
          uploadSuccess = true;

          // Create post record
          const { error: postError } = await supabase
            .from('posts')
            .insert({
              artist_id: artist?.id,
              file_path: filePath,
              media_type: 'video'
            });

          if (postError) {
            console.error('Post creation error:', postError);
            // Cleanup uploaded file
            await supabase.storage
              .from('artist-media')
              .remove([filePath]);
            throw postError;
          }

          Alert.alert('Success', 'Video uploaded successfully!');
          await fetchUserVideos();
          break;

        } catch (uploadError: unknown) {
          console.error(`Upload attempt ${uploadAttempt} failed:`, uploadError);
          
          if (uploadAttempt === maxAttempts) {
            const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error occurred';
            throw new Error(`Upload failed after ${maxAttempts} attempts: ${errorMessage}`);
          }
          
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, uploadAttempt) * 1000));
        }
      }

    } catch (error: unknown) {
      console.error('Final error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Upload Failed',
        `Error: ${errorMessage}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };


  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted. Proceeding without location.');
        Alert.alert('Permission Denied', 'Location permission is required to fetch your current location.');
        return { latitude: null, longitude: null };
      }

      setIsFetchingLocation(true); // Show loading indicator
      const location = await Location.getCurrentPositionAsync({});
      Alert.alert('Success', 'Location fetched successfully!');
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
      return { latitude: null, longitude: null };
    } finally {
      setIsFetchingLocation(false); // Hide loading indicator
    }
  };

  const handleLocationButtonPress = async () => {
    console.log('Location button pressed');
    const { latitude, longitude } = await getCurrentLocation();
    if (latitude && longitude) {
      setEditForm((prev) => ({
        ...prev,
        latitude: `${latitude}`,
        longitude: `${longitude}`,
      }));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const updates = {
        name: editForm.name,
        bio: editForm.bio,
        email: editForm.email,
        phone_num: editForm.phone_num ? parseInt(editForm.phone_num) : null,
        location: editForm.location,
        latitude: null,
        longitude: null,
      };

      if (editForm.location) {
        const { latitude, longitude } = await getCurrentLocation(); // Fetch location only when saving
        updates.latitude = latitude;
        updates.longitude = longitude;
      }

      const { error } = await updateArtistProfile(user.id, updates);
      
      if (error) throw error;
      
      await refreshArtistProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (artist) {
      setEditForm({
        name: artist.name || '',
        bio: artist.bio || '',
        email: artist.email || '',
        phone_num: artist.phone_num ? String(artist.phone_num) : '',
        location: artist.location || '',
        latitude: artist.latitude || null,
        longitude: artist.longitude || null,
      });
    }
    setIsEditing(false);
  };

  const handleUpdateProfilePicture = async () => {
    if (!user) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to update your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsLoading(true);
        const { success, url, error } = await updateArtistProfilePicture(
          user.id,
          `data:image/jpeg;base64,${result.assets[0].base64}`
        );

        if (success && url) {
          await refreshArtistProfile();
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLongPressAvatar = () => {
    if (!user) return;

    Alert.alert(
      'Profile Picture',
      'What would you like to do?',
      [
        {
          text: 'Update Picture',
          onPress: handleUpdateProfilePicture
        },
        {
          text: 'Remove Picture',
          onPress: handleRemoveProfilePicture,
          style: 'destructive'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { success, error } = await deleteProfilePicture(user.id);

      if (success) {
        await refreshArtistProfile();
        Alert.alert('Success', 'Profile picture removed successfully');
      } else {
        Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderVideoSection = () => (
    <View style={styles.videoSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
          My Videos
        </Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleUploadVideo}
          disabled={isLoading}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#0066ff" />
          <Text style={styles.uploadButtonText}>Upload Video</Text>
        </TouchableOpacity>
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
                <Text style={[styles.videoDate, { color: theme === 'dark' ? '#FFFFFF' : '#000000' }]}>
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

  const renderContactInfo = () => {
    if (!showContact) return null;

    return (
      <Animated.View 
        entering={FadeInUp}
        style={styles.contactInfo}
      >
        <TouchableOpacity style={styles.contactItem} onPress={() => {}}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail-outline" size={24} color="#0066ff" />
          </View>
          <View>
            <Text style={styles.contactText}>{artist?.email || 'No Email'}</Text>
            <Text style={styles.contactLabel}>Email</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem} onPress={() => {}}>
          <View style={styles.contactIcon}>
            <Ionicons name="call-outline" size={24} color="#0066ff" />
          </View>
          <View>
            <Text style={styles.contactText}>{artist?.phone_num || 'No Phone'}</Text>
            <Text style={styles.contactLabel}>Phone</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactItem} onPress={() => {}}>
          <View style={styles.contactIcon}>
            <Ionicons name="map" size={24} color="#0066ff" />
          </View>
          <View>
            <Text style={styles.contactText}>{artist?.location || 'No Location'}</Text>
            <Text style={styles.contactLabel}>Location</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!artist) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.themeToggleContainer}>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E0E0E0', true: '#333333' }}
            thumbColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ key: 'profile' }, { key: 'videos' }]}
        renderItem={({ item }) => {
          if (item.key === 'profile') {
            return (
              <>
                {/* Curved gradient background - now inside the scrollable area */}
                <View style={styles.curveBackground}>
                  <Svg height="300" width={SCREEN_WIDTH} viewBox={`0 0 ${SCREEN_WIDTH} 300`}>
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
                  <TouchableOpacity 
                    style={styles.avatarContainer}
                    onPress={handleUpdateProfilePicture}
                    onLongPress={handleLongPressAvatar}
                    delayLongPress={500}
                  >
                    <Image 
                      source={{ 
                        uri: (artist as any).profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.onlineIndicator} />
                  </TouchableOpacity>
                  
                  {isEditing ? (
                    <Animated.View 
                      entering={FadeInUp} 
                      exiting={FadeOutDown}
                      style={styles.editForm}
                    >
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Name</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.name}
                          onChangeText={(text) => setEditForm({...editForm, name: text})}
                          placeholder="Your name"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                        />
                      </View>
                      
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Email</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.email}
                          onChangeText={(text) => setEditForm({...editForm, email: text})}
                          placeholder="Your email"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          keyboardType="email-address"
                        />
                      </View>
                      
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Phone</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.phone_num}
                          onChangeText={(text) => setEditForm({...editForm, phone_num: text})}
                          placeholder="Your phone number"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          keyboardType="phone-pad"
                        />
                      </View>
                      
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Location</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            style={[styles.formInput, { flex: 1 }]}
                            value={editForm.location}
                            onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                            placeholder="Your location"
                            placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          />
                          {editForm.location.length > 0 && (
                            <TouchableOpacity 
                              style={styles.locationButton} 
                              onPress={handleLocationButtonPress}
                              disabled={isFetchingLocation}
                            >
                              {isFetchingLocation ? (
                                <ActivityIndicator size="small" color="#0066ff" />
                              ) : (
                                <Ionicons name="locate-outline" size={20} color="#0066ff" />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.formField}>
                        <Text style={styles.formLabel}>Bio</Text>
                        <TextInput
                          style={[styles.formInput, styles.bioInput]}
                          value={editForm.bio}
                          onChangeText={(text) => setEditForm({...editForm, bio: text})}
                          placeholder="Tell us about yourself"
                          placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
                          multiline
                        />
                      </View>
                      
                      <View style={styles.editButtons}>
                        <TouchableOpacity 
                          style={[styles.editButton, styles.cancelButton]} 
                          onPress={handleCancelEdit}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.editButton, styles.saveButton]} 
                          onPress={handleSaveProfile}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </Animated.View>
                  ) : (
                    <Animated.View 
                      entering={FadeInUp}
                      style={styles.profileInfo}
                    >                   
                      <Text style={styles.fullName}>{artist.name || 'No Name Set'}</Text>
                      <View style={styles.usernameContainer}>
                        <Text style={styles.username} numberOfLines={1}>@{artist.user_id}</Text>
                      </View>
                      {artist.bio ? (
                        <Text style={styles.bio}>{artist.bio}</Text>
                      ) : (
                        <Text style={styles.bio}>No bio added yet</Text>
                      )}

                      <View style={styles.buttonContainer}>
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

                        <TouchableOpacity 
                          style={styles.editProfileButton}
                          onPress={handleEditProfile}
                        >
                          <Ionicons name="create-outline" size={20} color="#0066ff" style={styles.editIcon} />
                          <Text style={styles.editProfileText}>Edit Profile</Text>
                        </TouchableOpacity>
                      </View>

                      {renderContactInfo()}
                    </Animated.View>
                  )}
                </View>
              </>
            );
          } else if (item.key === 'videos') {
            return renderVideoSection();
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
            <Ionicons name="close" size={24} color= {theme === 'dark' ? '#000000' : '#FFFFFF'} />
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