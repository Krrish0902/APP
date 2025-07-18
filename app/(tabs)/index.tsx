// HomeScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, ViewToken, ActivityIndicator, ListRenderItemInfo, Platform, TouchableOpacity, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FlatList } from 'react-native-gesture-handler';
import VideoPost from '../../components/VideoPost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router'; 
import { supabase } from '../../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';


// Get screen dimensions and add extra padding to ensure proper spacing
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const router = useRouter();

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

interface Artist {
  id: string;
  name: string;
  profile_picture_url: string | null;
}


// Remove the fixed TAB_BAR_HEIGHT and calculate content height dynamically
const getContentHeight = (insets: { top: number; bottom: number }) => {
  return SCREEN_HEIGHT - insets.bottom;
};

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

interface PostData {
  id: string;
  file_path: string;
  created_at: string;
  artist: {
    id: string;
    name: string;
    profile_picture_url: string | null;
  };
}

interface Video {
  id: string;
  url: string;
  artist: {
    id: string;
    name: string;
    avatar: string;
  };
}

export default function HomeScreen() {

  // All hooks must be at the top level
  const [fontsLoaded] = useFonts({
    'Meddon': require('../../assets/fonts/DancingScript-Bold.ttf'),
  });
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const VIDEOS_PER_PAGE = 5;
  const [refreshing, setRefreshing] = useState(false);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set());

  const CONTENT_HEIGHT = getContentHeight(insets);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  setPage(0);
  await fetchVideos(0);
  setRefreshing(false);
}, []);

  // Fetch videos from the posts table
  const fetchVideos = async (pageNumber: number = 0) => {
    try {
      setIsLoading(true);
      const from = pageNumber * VIDEOS_PER_PAGE;
      const to = from + VIDEOS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          file_path,
          created_at,
          artist:artist_id (
            id,
            name,
            profile_picture_url
          )
        `)
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedVideos = (data || []).map(post => {
        const artist = post.artist as unknown as { 
          id: string; 
          name: string; 
          profile_picture_url: string | null;
        };
        
        const publicUrl = supabase.storage.from('artist-media').getPublicUrl(post.file_path).data.publicUrl;
        
        
        return {
          id: post.id,
          url: publicUrl,
          artist: {
            id: artist.id,
            name: artist.name,
            avatar: artist.profile_picture_url || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800&auto=format&fit=crop&q=60'
          }
        };
      });

      setVideos(prev => pageNumber === 0 ? formattedVideos : [...prev, ...formattedVideos]);
      setHasMore(data.length === VIDEOS_PER_PAGE);
      
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Enhanced viewability configuration for better performance
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 300,
    waitForInteraction: true
  });

  const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <View style={[styles.container, styles.errorContainer]}>
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity 
      style={styles.retryButton} 
      onPress={() => {
        setError(null);
        onRetry();
      }}
    >
      <Text style={styles.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

  const preloadNextVideo = useCallback((nextIndex: number) => {
      if (videos[nextIndex]?.url && !preloadedVideos.has(videos[nextIndex].id)) {
        // Preload avatar
        Image.prefetch(videos[nextIndex].artist.avatar);
        setPreloadedVideos(prev => new Set([...prev, videos[nextIndex].id]));
      }
  }, [videos, preloadedVideos]);


  useEffect(() => {
  if (currentIndex < videos.length - 1) {
    preloadNextVideo(currentIndex + 1);
  }
}, [currentIndex, videos]);

  const cleanupInactiveVideos = useCallback((activeIndex: number) => {
  const keepIndices = [activeIndex - 1, activeIndex, activeIndex + 1];
  videos.forEach((video, index) => {
    if (!keepIndices.includes(index) && preloadedVideos.has(video.id)) {
      setPreloadedVideos(prev => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  });
}, [videos, preloadedVideos]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setPage(prev => prev + 1);
      fetchVideos(page + 1);
    }
  }, [isLoadingMore, hasMore, page]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentIndex(newIndex);
      cleanupInactiveVideos(newIndex);
    }
  }, [cleanupInactiveVideos]);

  const handleVideoError = useCallback((videoId: string, error: string) => {
    console.error(`Error playing video ${videoId}:`, error);
    setError(`Failed to load video. Please try again.`);
  }, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<Video>) => (
    <View style={styles.videoContainer}>
      <VideoPost
        video={{
          ...item,
          url: { uri: item.url }  // Convert string URL to object format for Video component
        }}
        onDoubleTap={() => {
          console.log('Double tap detected');
        }}
        isActive={index === currentIndex}
        onError={(error) => handleVideoError(item.id, error)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
      <TouchableOpacity onPress={() => router.push(`/artist/${item.artist.id}`)} style={styles.profilePhotoContainer}>
        <Image
          source={{ uri: item.artist.avatar }}
          style={styles.avatar}
        />
      </TouchableOpacity>
    </View>
  ), [currentIndex, handleVideoError, isMuted, handleToggleMute]);

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  if (error) {
  return <ErrorView onRetry={() => fetchVideos(page)} />;
}

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BEHANCE</Text>
      </View>
      <View style={styles.videoContainer}>
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig.current}
          initialScrollIndex={currentIndex}
          getItemLayout={getItemLayout}
          horizontal={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={1}
          windowSize={2}
          style={StyleSheet.absoluteFillObject}
          scrollEnabled={true}
          bounces={false}
          overScrollMode="never"
          contentContainerStyle={{
            height: videos.length * SCREEN_HEIGHT,
            flexGrow: 1,
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : null
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryText: {
    color: '#000',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Meddon',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 16,
  },
  profilePhotoContainer: {
    position: 'absolute',
    bottom: '20%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center'
  },
});