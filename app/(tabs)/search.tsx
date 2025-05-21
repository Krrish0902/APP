import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchArtists, searchArtistsByDistance } from '../../src/lib/artist';
import { Link, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '../../src/context/AuthContext';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Artist {
  id: string;
  name: string;
  profile_picture_url: string;
  bio: string;
  is_verified: boolean;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [viewedArtists, setViewedArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [distance, setDistance] = useState(''); // State for distance input
  const [showDistanceInput, setShowDistanceInput] = useState(false); // Toggle distance input field
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null); // User's current location

  const getStorageKey = () => {
    return user ? `viewedArtists_${user.id}` : 'viewedArtists_guest';
  };

  // Load viewed artists from storage on mount and when user changes
  useEffect(() => {
    loadViewedArtists();
  }, [user]); // Reload when user changes

  const loadViewedArtists = async () => {
    try {
      const viewed = await AsyncStorage.getItem(getStorageKey());
      if (viewed) {
        setViewedArtists(JSON.parse(viewed));
      } else {
        setViewedArtists([]); // Reset list if no data found for current user
      }
    } catch (error) {
      console.error('Error loading viewed artists:', error);
    }
  };

  const saveViewedArtists = async (artists: Artist[]) => {
    try {
      await AsyncStorage.setItem(getStorageKey(), JSON.stringify(artists));
    } catch (error) {
      console.error('Error saving viewed artists:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const { artists, error } = await searchArtists(searchQuery);
      if (error) throw error;
      console.log('Artists found:', artists);
      setSearchResults(artists || []);
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to fetch your current location.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
      return null;
    }
  };

  const handleSearchByDistance = async () => {
    if (!distance || isNaN(Number(distance))) {
      Alert.alert('Error', 'Please enter a valid distance.');
      return;
    }

    if (!userLocation) {
      const location = await getCurrentLocation();
      if (!location) return;
      setUserLocation(location);
    }

    try {
      setIsLoading(true);
      const { artists, error } = await searchArtistsByDistance( {
        latitude: userLocation?.latitude!,
        longitude: userLocation?.longitude!,
        distance: Number(distance),
      });
      if (error) throw error;
      console.log('Artists found:', artists);
      setSearchResults(artists || []);
    } catch (error) {
      console.error('Error searching artists by distance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToViewedArtists = (artist: Artist) => {
    const updatedViewed = [artist, ...viewedArtists.filter(a => a.id !== artist.id)].slice(0, 10);
    setViewedArtists(updatedViewed);
    saveViewedArtists(updatedViewed);
  };

  const removeFromViewed = (artistId: string) => {
    const updatedViewed = viewedArtists.filter(artist => artist.id !== artistId);
    setViewedArtists(updatedViewed);
    saveViewedArtists(updatedViewed);
  };

  const navigateToArtist = (artist: Artist) => {
    addToViewedArtists(artist);
    router.push(`/artist/${artist.id}`);
  };

  const renderArtistItem = ({ item }: { item: Artist }) => (
    <TouchableOpacity 
      style={styles.artistCard}
      onPress={() => navigateToArtist(item)}
    >
      <Image 
        source={{ 
          uri: item.profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
        }}
        style={styles.artistImage}
      />
      <View style={styles.artistInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.artistName}>{item.name}</Text>
          {item.is_verified && (
            <Ionicons name="checkmark-circle" size={16} color="#0066ff" style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={styles.artistBio} numberOfLines={2}>
          {item.bio || 'No bio available'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderViewedArtistItem = ({ item }: { item: Artist }) => (
    <View style={styles.artistCard}>
      <TouchableOpacity 
        style={styles.artistContent}
        onPress={() => navigateToArtist(item)}
      >
        <Image 
          source={{ 
            uri: item.profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
          }}
          style={styles.artistImage}
        />
        <View style={styles.artistInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.artistName}>{item.name}</Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color="#0066ff" style={styles.verifiedIcon} />
            )}
          </View>
          <Text style={styles.artistBio} numberOfLines={2}>
            {item.bio || 'No bio available'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromViewed(item.id)}
      >
        <Ionicons name="close-circle" size={24} color={theme === 'dark' ? '#666666' : '#999999'} />
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    headerGradient: {
      paddingTop: 60,
      paddingBottom: 15,
      zIndex: 1,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 15,
      marginTop: 95,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      letterSpacing: 0.5,
    },
    searchContainer: {
      paddingHorizontal: 20,
    },
    searchBar: {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      height: 50,
      shadowColor: theme === 'dark' ? '#000000' : '#FFFFFF',
      shadowRadius: 4,
      elevation: 3,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      fontSize: 16,
      height: '100%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    artistList: {
      flex: 1,
    },
    listContent: {
      padding: 20,
      paddingTop: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    artistCard: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
      borderRadius: 50,
      marginBottom: 15,
      overflow: 'hidden',
      shadowColor: theme === 'dark' ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
    },
    artistContent: {
      flex: 1,
      flexDirection: 'row',
    },
    artistImage: {
      width: 90,
      height: 90,
      borderRadius: 45,
      margin: 10,
    },
    artistInfo: {
      flex: 1,
      padding: 15,
      justifyContent: 'center',
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    artistName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginRight: 5,
      letterSpacing: 0.3,
    },
    verifiedIcon: {
      marginLeft: 4,
    },
    artistBio: {
      fontSize: 14,
      color: theme === 'dark' ? '#999999' : '#666666',
      lineHeight: 20,
    },
    removeButton: {
      padding: 15,
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyStateIcon: {
      marginBottom: 16,
      opacity: 0.5,
    },
    emptyStateText: {
      color: theme === 'dark' ? '#666666' : '#999999',
      fontSize: 16,
      textAlign: 'center',
      maxWidth: SCREEN_WIDTH * 0.7,
      lineHeight: 22,
    },
    distanceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    distanceButtonText: {
      marginLeft: 5,
      color: '#0066ff',
      fontSize: 16,
      fontWeight: '600',
    },
    distanceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      paddingHorizontal: 20,
    },
    distanceInput: {
      flex: 1,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 16,
      paddingHorizontal: 15,
      height: 50,
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
    },
    searchDistanceButton: {
      marginLeft: 10,
      backgroundColor: '#0066ff',
      borderRadius: 16,
      paddingHorizontal: 20,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchDistanceButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover Artists</Text>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={theme === 'dark' ? '#666666' : '#999999'} 
              style={styles.searchIcon} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search artists..."
              placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setShowDistanceInput(false)} // Hide distance input when search field is focused
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={theme === 'dark' ? '#666666' : '#999999'} 
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.distanceButton} 
            onPress={() => setShowDistanceInput(!showDistanceInput)}
          >
            <Ionicons name="location-outline" size={20} color="#0066ff" />
            <Text style={styles.distanceButtonText}>Search by Distance</Text>
          </TouchableOpacity>
        </View>
        {showDistanceInput && (
          <View style={styles.distanceInputContainer}>
            <TextInput
              style={styles.distanceInput}
              placeholder="Enter distance (km)"
              placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
              value={distance}
              onChangeText={setDistance}
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.searchDistanceButton} 
              onPress={handleSearchByDistance}
            >
              <Text style={styles.searchDistanceButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066ff" />
        </View>
      ) : (
        <FlatList
          style={styles.artistList}
          data={searchQuery || showDistanceInput ? searchResults : viewedArtists} // Adjusted condition
          renderItem={searchQuery || showDistanceInput ? renderArtistItem : renderViewedArtistItem} // Adjusted condition
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            !searchQuery && !showDistanceInput && viewedArtists.length > 0 ? ( // Adjusted condition
              <Animated.View entering={FadeInUp}>
                <Text style={styles.sectionTitle}>Recently Viewed</Text>
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery || showDistanceInput ? "search" : "time-outline"} // Adjusted condition
                size={48} 
                color={theme === 'dark' ? '#333333' : '#CCCCCC'} 
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateText}>
                {searchQuery || showDistanceInput 
                  ? 'No artists found. Try a different search.' 
                  : 'No recently viewed artists'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}