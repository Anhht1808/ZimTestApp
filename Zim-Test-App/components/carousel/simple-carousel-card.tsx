import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import { ThemedText } from '@/components/themed-text';
import { SimpleCarouselItem } from '@/hooks/use-simple-carousel';

type SimpleCarouselCardProps = {
  isCurrent?: boolean;
  isHoverLoading?: boolean;
  item: SimpleCarouselItem;
  onHoverEnd?: () => void;
  onHoverStart?: () => void;
  onPress?: () => void;
};

export function SimpleCarouselCard({
  isCurrent = false,
  isHoverLoading = false,
  item,
  onHoverEnd,
  onHoverStart,
  onPress,
}: SimpleCarouselCardProps) {
  const inactiveBackdropOpacity = useRef(new Animated.Value(isCurrent ? 0 : 1)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    Animated.timing(inactiveBackdropOpacity, {
      duration: 240,
      toValue: isCurrent ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [inactiveBackdropOpacity, isCurrent]);

  useEffect(() => {
    if (!isCurrent) {
      setIsPaused(false);
      imageOpacity.setValue(1);
      videoOpacity.setValue(0);
    }
  }, [imageOpacity, isCurrent, videoOpacity]);

  const togglePauseCurrentVideo = () => {
    setIsPaused((previous) => !previous);
  };

  const handleCardPress = () => {
    if (isCurrent && item.videoUri) {
      togglePauseCurrentVideo();
      return;
    }
    onPress?.();
  };

  const handleVideoReady = () => {
    Animated.parallel([
      Animated.timing(imageOpacity, {
        duration: 260,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(videoOpacity, {
        duration: 260,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable onHoverIn={onHoverStart} onHoverOut={onHoverEnd} onPress={handleCardPress} style={styles.card}>
      <Animated.View style={[styles.imageLayer, { opacity: imageOpacity }]}>
        <Image contentFit="cover" source={{ uri: item.imageUri }} style={styles.image} />
      </Animated.View>
      {isCurrent && item.videoUri ? (
        <Animated.View style={[styles.videoLayer, { opacity: videoOpacity }]}>
          <Video
            isLooping
            isMuted
            onReadyForDisplay={handleVideoReady}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isPaused}
            source={{ uri: item.videoUri }}
            style={styles.video}
            useNativeControls={false}
          />
        </Animated.View>
      ) : null}
      <View style={styles.overlay} />
      <Animated.View pointerEvents="none" style={[styles.inactiveBackdrop, { opacity: inactiveBackdropOpacity }]} />
      {isHoverLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#ffffff" size="small" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      )}
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {item.subtitle}
        </ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.topTag}>
        {item.id}
      </ThemedText>
      {isCurrent && item.videoUri ? (
        <View style={styles.videoStateBadge}>
          <ThemedText style={styles.videoStateText}>
            {isPaused ? 'Play' : 'Pause'}
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    height: '100%',
    width: '100%',
  },
  videoLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 12, 0.35)',
  },
  inactiveBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  content: {
    bottom: 14,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  topTag: {
    color: '#ffffff',
    left: 12,
    position: 'absolute',
    top: 12,
  },
  videoStateBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderRadius: 999,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    right: 12,
  },
  videoStateText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
});

