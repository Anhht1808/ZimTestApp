import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { SimpleCarouselItem } from '@/hooks/use-simple-carousel';
import type { SharedValue } from 'react-native-reanimated';

type SimpleCarouselCardProps = {
  animationValue: SharedValue<number>;
  isCurrent?: boolean;
  isHoverLoading?: boolean;
  item: SimpleCarouselItem;
  onHoverEnd?: () => void;
  onHoverStart?: (itemId: string) => void;
  onPress?: (itemId: string) => void;
  shouldKeepVideoMounted?: boolean;
  // Preloads the video before card becomes current so it plays immediately.
  shouldPreload?: boolean;
};

function SimpleCarouselCardComponent({
  animationValue,
  isCurrent = false,
  isHoverLoading = false,
  item,
  onHoverEnd,
  onHoverStart,
  onPress,
  shouldKeepVideoMounted = false,
  shouldPreload = false,
}: SimpleCarouselCardProps) {
  const imageOpacity = useRef(new RNAnimated.Value(1)).current;
  const videoOpacity = useRef(new RNAnimated.Value(0)).current;
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
    if (isCurrent) {
      setIsPaused(false);
    } else {
      imageOpacity.setValue(1);
      videoOpacity.setValue(0);
    }
  }, [imageOpacity, isCurrent, videoOpacity]);

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
    RNAnimated.parallel([
      RNAnimated.timing(imageOpacity, { duration: 260, toValue: 0, useNativeDriver: true }),
      RNAnimated.timing(videoOpacity, { duration: 260, toValue: 1, useNativeDriver: true }),
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
    onPress?.(item.id);
  }, [hasVideoFirstFrame, imageOpacity, isCurrent, isVideoErrored, item.id, item.videoUri, onPress, videoOpacity]);

  const handleHoverStart = useCallback(() => {
    onHoverStart?.(item.id);
  }, [item.id, onHoverStart]);

  const posterUri = isPosterErrored ? item.imageUri : item.thumbnailUri ?? item.imageUri;

  // Keep nearby videos mounted for smoother activation, but only the current item is allowed to play.
  const shouldMountVideo = Boolean(item.videoUri && (isCurrent || shouldPreload || shouldKeepVideoMounted));
  const shouldPlayVideo = Boolean(isCurrent && !isPaused);
  const animatedFrameStyle = useAnimatedStyle(() => {
    const distance = Math.abs(animationValue.value);
    const borderOpacity = interpolate(distance, [0, 1, 2], [0.95, 0.45, 0.18], Extrapolation.CLAMP);
    const scale = interpolate(distance, [0, 1, 2], [1, 0.98, 0.965], Extrapolation.CLAMP);
    return {
      borderColor: `rgba(255,255,255,${borderOpacity})`,
      opacity: interpolate(distance, [0, 1.5], [1, 0.75], Extrapolation.CLAMP),
      transform: [{ scale }],
    };
  }, [animationValue]);
  const animatedOverlayStyle = useAnimatedStyle(() => {
    const distance = Math.abs(animationValue.value);
    return {
      backgroundColor: `rgba(8, 8, 12, ${interpolate(distance, [0, 1, 2], [0.18, 0.32, 0.42], Extrapolation.CLAMP)})`,
    };
  }, [animationValue]);

  return (
    <Pressable onHoverIn={handleHoverStart} onHoverOut={onHoverEnd} onPress={handleCardPress} style={styles.card}>
      <RNAnimated.View style={[styles.imageLayer, { opacity: imageOpacity }]}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setIsPosterErrored(true)}
          placeholder={{ uri: posterUri }}
          source={{ uri: posterUri }}
          style={styles.image}
          transition={180}
        />
      </RNAnimated.View>
      {shouldMountVideo ? (
        <RNAnimated.View style={[styles.videoLayer, { opacity: videoOpacity }]}>
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
        </RNAnimated.View>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.overlay, animatedOverlayStyle]} />
      <Animated.View pointerEvents="none" style={[styles.activeFrame, animatedFrameStyle]} />
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

function areItemsEqual(previous: SimpleCarouselItem, next: SimpleCarouselItem) {
  return (
    previous.id === next.id &&
    previous.title === next.title &&
    previous.subtitle === next.subtitle &&
    previous.imageUri === next.imageUri &&
    previous.thumbnailUri === next.thumbnailUri &&
    previous.videoUri === next.videoUri
  );
}

export const SimpleCarouselCard = memo(SimpleCarouselCardComponent, (previousProps, nextProps) => {
  return (
    previousProps.isCurrent === nextProps.isCurrent &&
    previousProps.isHoverLoading === nextProps.isHoverLoading &&
    previousProps.shouldKeepVideoMounted === nextProps.shouldKeepVideoMounted &&
    previousProps.shouldPreload === nextProps.shouldPreload &&
    previousProps.animationValue === nextProps.animationValue &&
    areItemsEqual(previousProps.item, nextProps.item)
  );
});

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
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
  },
  activeFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
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
