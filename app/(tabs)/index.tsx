// HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, StatusBar, ViewToken, ListRenderItemInfo, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FlatList } from 'react-native-gesture-handler';
import VideoPost from '../../components/VideoPost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions and add extra padding to ensure proper spacing
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Remove the fixed TAB_BAR_HEIGHT and calculate content height dynamically
const getContentHeight = (insets: { top: number; bottom: number }) => {
  return SCREEN_HEIGHT - insets.bottom;
};

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

interface Video {
  id: string;
  url: any;
  artist: {
    id: string;
    name: string;
    avatar: any;
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const CONTENT_HEIGHT = getContentHeight(insets);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const videos = [
    {
      id: '1',
      url: require('../../assets/videos/sample_1.mp4'),
      artist: {
        id: '1',
        name: 'John Doe',
        avatar: require('../../assets/images/image.png'),
      },
    },
    {
      id: '2',
      url: require('../../assets/videos/sample_2.mp4'),
      artist: {
        id: '2',
        name: 'Jane Doe',
        avatar: require('../../assets/images/icon.png'),
      },
    },
    // Add more videos if needed
  ];

  // Enhanced viewability configuration for better performance
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 300,
    waitForInteraction: true
  });

  const onViewableItemsChanged = useCallback(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentIndex(newIndex);
      
      // Preload the next video if available
      const nextIndex = newIndex + 1;
      if (nextIndex < videos.length) {
        // You could implement video preloading here if needed
        console.log(`Preloading video ${nextIndex}`);
      }
    }
  }, [videos.length]);

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
        video={item}
        onDoubleTap={() => {
          console.log('Double tap detected');
        }}
        isActive={index === currentIndex}
        onError={(error) => handleVideoError(item.id, error)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />
    </View>
  ), [currentIndex, handleVideoError, isMuted, handleToggleMute]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
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
          }}
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
    height: SCREEN_HEIGHT ,
    backgroundColor: '#000',
  },
});