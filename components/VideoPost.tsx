// VideoPost.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Artist {
  id: string;
  name: string;
  avatar: any;
}

interface VideoPostProps {
  video: {
    id: string;
    url: any;
    artist: Artist;
  };
  onDoubleTap: () => void;
  isActive: boolean;
  onError?: (error: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function VideoPost({ 
  video, 
  onDoubleTap, 
  isActive, 
  onError: onErrorProp,
  isMuted,
  onToggleMute 
}: VideoPostProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<Video>(null);
  const lastTapRef = useRef<number>(0);
  const isLongPressing = useRef<boolean>(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Handle screen focus changes
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync();
          setIsPlaying(false);
          setUserInteracted(false);
        }
      };
    }, [])
  );

  // Handle video loading and errors
  const onLoadStart = () => {
    setIsLoading(true);
  };

  const onLoad = () => {
    setIsLoading(false);
  };

  const handleError = (error: string) => {
    setIsLoading(false);
    onErrorProp?.(error);
  };

  // Handle video status updates
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle error state
      if (status.error) {
        handleError(`Video playback error: ${status.error}`);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsLoading(false);
  };

  // Effect to handle active state changes
  useEffect(() => {
    const handlePlayback = async () => {
      if (!videoRef.current) return;

      try {
        if (isActive && !isLongPressing.current) {
          await videoRef.current.playAsync();
        } else {
          await videoRef.current.pauseAsync();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        handleError(`Failed to ${isActive ? 'play' : 'pause'} video: ${errorMessage}`);
      }
    };
    
    handlePlayback();
  }, [isActive]);

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      // Single tap - ONLY toggle mute globally
      onToggleMute();
      lastTapRef.current = now;
    }
  };

  const handleLongPress = async () => {
    if (!isLongPressing.current && videoRef.current) {
      isLongPressing.current = true;
      setUserInteracted(true);
      try {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await videoRef.current.pauseAsync();
        }
      } catch (error) {
        console.log('Error handling long press:', error);
      }
    }
  };

  const handlePressOut = async () => {
    if (isLongPressing.current && videoRef.current && isActive) {
      isLongPressing.current = false;
      setUserInteracted(false);
      try {
        await videoRef.current.playAsync();
      } catch (error) {
        console.log('Error handling press out:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={500}
      >
        <View style={styles.videoWrapper}>
          <Video
            ref={videoRef}
            source={video.url}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isActive && !userInteracted}
            isMuted={isMuted}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoadStart={onLoadStart}
            onLoad={onLoad}
            onError={(error) => handleError(error)}
          />
          {isLoading && (
            <View style={[StyleSheet.absoluteFillObject, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
       
      <View style={styles.profilePhotoContainer}>
        <Link href={`/artist/${video.artist.id}`} asChild>
          <View style={styles.artistContainer}>
            <Image
              source={video.artist.avatar}
              style={styles.avatar}
            />
          </View>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    top: 0,
    left: 0,
    borderRadius: 20,
  },
  profilePhotoContainer: {
    position: 'absolute',
    bottom: '20%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  artistContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#fff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});