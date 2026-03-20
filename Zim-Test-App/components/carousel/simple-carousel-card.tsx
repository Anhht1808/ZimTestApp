import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Preloads the video before card becomes current so it plays immediately.
  shouldPreload?: boolean;
};

export function SimpleCarouselCard({
  isCurrent = false,
  isHoverLoading = false,
  item,
  onHoverEnd,
  onHoverStart,
  onPress,
  shouldPreload = false,
}: SimpleCarouselCardProps) {
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const isCurrentRef = useRef(isCurrent);
  // Ref version avoids stale closure in Video callbacks.
  const hasVideoFirstFrameRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [hasVideoFirstFrame, setHasVideoFirstFrame] = useState(false);
  const [isVideoErrored, setIsVideoErrored] = useState(false);
  const [videoRetryKey, setVideoRetryKey] = useState(0);
  const [isPosterErrored, setIsPosterErrored] = useState(false);

  useEffect(() => {
    isCurrentRef.current = isCurrent;
  }, [isCurrent]);

  // Full reset when the item data changes (switching to a different story).
  useEffect(() => {
    hasVideoFirstFrameRef.current = false;
    setHasVideoFirstFrame(false);
    setIsVideoErrored(false);
    setVideoRetryKey(0);
    setIsPosterErrored(false);
    setIsPaused(false);
    imageOpacity.setValue(1);
    videoOpacity.setValue(0);
  }, [imageOpacity, item.id, videoOpacity]);

  const doImageToVideoCrossfade = useCallback(() => {
    Animated.parallel([
      Animated.timing(imageOpacity, { duration: 260, toValue: 0, useNativeDriver: true }),
      Animated.timing(videoOpacity, { duration: 260, toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [imageOpacity, videoOpacity]);

  // When card becomes current and video was already buffered during preload,
  // crossfade immediately without waiting for onReadyForDisplay.
  useEffect(() => {
    if (isCurrent && hasVideoFirstFrame) {
      doImageToVideoCrossfade();
    }
  }, [doImageToVideoCrossfade, hasVideoFirstFrame, isCurrent]);

  const handleVideoReady = useCallback(() => {
    // Guard against duplicate calls from the Video component.
    if (hasVideoFirstFrameRef.current) return;
    hasVideoFirstFrameRef.current = true;
    setHasVideoFirstFrame(true);
    setIsVideoErrored(false);
    // Only crossfade if currently active; isCurrent effect handles the preload case.
    if (isCurrentRef.current) {
      doImageToVideoCrossfade();
    }
  }, [doImageToVideoCrossfade]);

  const handleVideoError = useCallback(() => {
    hasVideoFirstFrameRef.current = false;
    setIsVideoErrored(true);
    setHasVideoFirstFrame(false);
    if (isCurrentRef.current) {
      imageOpacity.setValue(1);
      videoOpacity.setValue(0);
    }
  }, [imageOpacity, videoOpacity]);

  const handleCardPress = useCallback(() => {
    if (isCurrent && item.videoUri) {
      if (isVideoErrored) {
        hasVideoFirstFrameRef.current = false;
        setVideoRetryKey((previous) => previous + 1);
        setIsVideoErrored(false);
        setHasVideoFirstFrame(false);
        imageOpacity.setValue(1);
        videoOpacity.setValue(0);
        return;
      }
      if (!hasVideoFirstFrame) return;
      setIsPaused((previous) => !previous);
      return;
    }
    onPress?.();
  }, [hasVideoFirstFrame, imageOpacity, isCurrent, isVideoErrored, item.videoUri, onPress, videoOpacity]);

  const posterUri = isPosterErrored ? item.imageUri : item.thumbnailUri ?? item.imageUri;

  // Mount video early for preload so it buffers before the card becomes current.
  const shouldMountVideo = Boolean(item.videoUri && (isCurrent || shouldPreload));
  const shouldPlayVideo = Boolean(isCurrent && !isPaused);

  return (
    <Pressable onHoverIn={onHoverStart} onHoverOut={onHoverEnd} onPress={handleCardPress} style={styles.card}>
      <Animated.View style={[styles.imageLayer, { opacity: imageOpacity }]}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setIsPosterErrored(true)}
          placeholder={{ uri: posterUri }}
          source={{ uri: posterUri }}
          style={styles.image}
          transition={180}
        />
      </Animated.View>
      {shouldMountVideo ? (
        <Animated.View style={[styles.videoLayer, { opacity: videoOpacity }]}>
          <Video
            key={`video-${item.id}-${videoRetryKey}`}
            isLooping
            isMuted
            onError={handleVideoError}
            onReadyForDisplay={handleVideoReady}
            resizeMode={ResizeMode.COVER}
            shouldPlay={shouldPlayVideo}
            source={{ uri: item.videoUri }}
            style={styles.video}
            useNativeControls={false}
          />
        </Animated.View>
      ) : null}
      <View style={styles.overlay} />
      {isHoverLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#ffffff" size="small" />
        </View>
      ) : null}
      {isCurrent && item.videoUri && isVideoErrored ? (
        <View style={styles.videoErrorOverlay}>
          <ThemedText style={styles.videoErrorText}>Video error. Tap to retry.</ThemedText>
        </View>
      ) : null}
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.topTag}>
        {item.id}
      </ThemedText>
      {isCurrent && item.videoUri && hasVideoFirstFrame ? (
        <View style={styles.videoStateBadge}>
          <ThemedText style={styles.videoStateText}>{isPaused ? 'Play' : 'Pause'}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    borderWidth: 2,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    justifyContent: 'center',
  },
  videoErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  videoErrorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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
