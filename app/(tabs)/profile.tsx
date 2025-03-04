import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { updateArtistProfile } from '../../src/lib/artist';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, artist, signOut, refreshArtistProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    email: '',
    phone_num: '',
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
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ 
                uri: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          
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
                  placeholderTextColor="#666"
                />
              </View>
              
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({...editForm, email: text})}
                  placeholder="Your email"
                  placeholderTextColor="#666"
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
                  placeholderTextColor="#666"
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
                  placeholderTextColor="#666"
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
              <Text style={styles.username}>@{artist.user_id}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
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
    color: '#fff',
  },
  signOutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    borderColor: '#000',
  },
  profileInfo: {
    width: '100%',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    color: '#0066ff',
    marginBottom: 5,
  },
  fullName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bio: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: '100%',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,102,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
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
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});