import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Dimensions, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { updateArtistProfile, updateArtistProfilePicture, deleteProfilePicture } from '../../src/lib/artist';
import { Tables } from '../../src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Artist = Tables['Artist']['Row'];

export default function ProfileScreen() {
  const { user, artist, signOut, refreshArtistProfile } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    email: '',
    phone_num: '',
  });

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
      height: 120,
      zIndex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
    },
    signOutButton: {
      padding: 8,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderRadius: 12,
    },
    content: {
      flex: 1,
    },
    profileHeader: {
      alignItems: 'center',
      paddingTop: 100,
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
      marginHorizontal: 20,
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
    themeToggleContainer: {
      position: 'absolute',
      top: 60,
      right: 70,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 2,
      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
    },
    themeToggleText: {
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginRight: 8,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    if (artist) {
      setEditForm({
        name: artist.name || '',
        bio: artist.bio || '',
        email: artist.email || '',
        phone_num: artist.phone_num ? String(artist.phone_num) : '',
      });
    }
  }, [artist]);

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
      };
      
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  if (!artist) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.8)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.themeToggleContainer}>
            <Text style={styles.themeToggleText}>{isDarkMode ? 'Dark' : 'Light'}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E0E0E0', true: '#333333' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={24} color="#fff" />
            </View>
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
              <View style={styles.usernameContainer}>
                <Text style={styles.username} numberOfLines={1}>@{artist.user_id}</Text>
              </View>
              <Text style={styles.fullName}>{artist.name || 'No Name Set'}</Text>
              
              {artist.bio ? (
                <Text style={styles.bio}>{artist.bio}</Text>
              ) : (
                <Text style={styles.bio}>No bio added yet</Text>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="mail-outline" size={24} color="#0066ff" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{artist.email || 'No Email'}</Text>
                    <Text style={styles.statLabel}>Email</Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="call-outline" size={24} color="#0066ff" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{artist.phone_num || 'No Phone'}</Text>
                    <Text style={styles.statLabel}>Phone</Text>
                  </View>
                </View>

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="calendar-outline" size={24} color="#0066ff" />
                  </View>
                  <View style={styles.statTextContainer}>
                    <Text style={styles.statValue}>{new Date(artist.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.statLabel}>Joined</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="create-outline" size={20} color="#0066ff" style={styles.editIcon} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}