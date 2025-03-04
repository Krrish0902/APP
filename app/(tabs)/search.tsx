import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllArtists, getVerifiedArtists } from '../../src/lib/artist';
import { Link } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<any[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchArtists();
  }, [showVerifiedOnly]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArtists(artists);
    } else {
      const filtered = artists.filter(artist => 
        artist.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredArtists(filtered);
    }
  }, [searchQuery, artists]);

  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      const { artists: artistsData, error } = showVerifiedOnly 
        ? await getVerifiedArtists() 
        : await getAllArtists();
      
      if (error) throw error;
      setArtists(artistsData || []);
      setFilteredArtists(artistsData || []);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVerifiedFilter = () => {
    setShowVerifiedOnly(!showVerifiedOnly);
  };

  const renderArtistItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.artistCard}>
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
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 15,
      gap: 10,
    },
    searchBar: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#F5F5F5',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      padding: 12,
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      fontSize: 16,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#F5F5F5',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 12,
      gap: 5,
    },
    filterButtonActive: {
      backgroundColor: '#0066ff',
    },
    filterText: {
      color: theme === 'dark' ? '#666666' : '#999999',
      fontSize: 14,
    },
    filterTextActive: {
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    artistList: {
      padding: 20,
    },
    artistCard: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#F5F5F5',
      borderRadius: 12,
      marginBottom: 15,
      overflow: 'hidden',
    },
    artistImage: {
      width: 100,
      height: 100,
    },
    artistInfo: {
      flex: 1,
      padding: 15,
      justifyContent: 'space-between',
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    artistName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      marginRight: 5,
    },
    verifiedIcon: {
      marginLeft: 5,
    },
    artistBio: {
      fontSize: 14,
      color: theme === 'dark' ? '#999999' : '#666666',
      marginVertical: 5,
    },
    followButton: {
      backgroundColor: theme === 'dark' ? '#333333' : '#E0E0E0',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
      alignSelf: 'flex-start',
      marginTop: 5,
    },
    followButtonText: {
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyStateText: {
      color: theme === 'dark' ? '#666666' : '#999999',
      fontSize: 16,
      textAlign: 'center',
      marginTop: 15,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Artists</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme === 'dark' ? '#666666' : '#999999'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search artists..."
            placeholderTextColor={theme === 'dark' ? '#666666' : '#999999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme === 'dark' ? '#666666' : '#999999'} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.filterButton, showVerifiedOnly && styles.filterButtonActive]}
          onPress={toggleVerifiedFilter}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={showVerifiedOnly ? "#FFFFFF" : theme === 'dark' ? '#666666' : '#999999'} 
          />
          <Text style={[styles.filterText, showVerifiedOnly && styles.filterTextActive]}>
            Verified
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066ff" />
        </View>
      ) : filteredArtists.length > 0 ? (
        <FlatList
          data={filteredArtists}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.artistList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={theme === 'dark' ? '#666666' : '#999999'} />
          <Text style={styles.emptyStateText}>
            {searchQuery.length > 0 
              ? `No artists found for "${searchQuery}"`
              : 'No artists available'}
          </Text>
        </View>
      )}
    </View>
  );
}