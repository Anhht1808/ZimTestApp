import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated as RNAnimated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ResizeMode, Video } from 'expo-av';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { SimpleCarouselItem } from '@/hooks/use-simple-carousel';
import type { SharedValue } from 'react-native-reanimated';

type SimpleCarouselCardProps = {
  animationValue: SharedValue<number>;
  isHoverLoading?: boolean;
  item: SimpleCarouselItem;
  onHoverEnd?: () => void;
  onHoverStart?: (itemId: string) => void;
  onPress?: (itemId: string) => void;
  pauseRequestId: number;
};

function SimpleCarouselCardComponent({
  animationValue,
  isHoverLoading = false,
  item,
  onHoverEnd,
  onHoverStart,
  onPress,
  pauseRequestId,
}: SimpleCarouselCardProps) {
  const isWeb = Platform.OS === 'web';
  const ACTIVE_SELECTION_DISTANCE = 0.35;
  const imageOpacity = useRef(new RNAnimated.Value(1)).current;
  const videoOpacity = useRef(new RNAnimated.Value(0)).current;
  const isSelectedRef = useRef(false);
  const wasSelectedRef = useRef(false);
  // Ref version avoids stale closure in Video callbacks.
  const hasVideoFirstFrameRef = useRef(false);

  const [isSelected, setIsSelected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectionSessionKey, setSelectionSessionKey] = useState(0);
  const [hasVideoFirstFrame, setHasVideoFirstFrame] = useState(false);
  const [isVideoErrored, setIsVideoErrored] = useState(false);
  const [videoRetryKey, setVideoRetryKey] = useState(0);
  const [hasPosterFallbackExhausted, setHasPosterFallbackExhausted] = useState(false);
  const [posterCandidateIndex, setPosterCandidateIndex] = useState(0);

  const posterCandidates = useMemo(() => {
    const orderedCandidates = isWeb
      ? [item.imageUri, item.thumbnailUri]
      : [item.thumbnailUri, item.imageUri];

    return Array.from(new Set(orderedCandidates.filter(Boolean))) as string[];
  }, [isWeb, item.imageUri, item.thumbnailUri]);

  useEffect(() => {
    const distance = Math.abs(animationValue.value);
    const nextIsSelected = distance < ACTIVE_SELECTION_DISTANCE;
    isSelectedRef.current = nextIsSelected;
    setIsSelected(nextIsSelected);
  }, [animationValue]);

  useAnimatedReaction(
    () => Math.abs(animationValue.value) < ACTIVE_SELECTION_DISTANCE,
    (nextIsSelected, previousIsSelected) => {
      if (previousIsSelected === null || nextIsSelected !== previousIsSelected) {
        runOnJS(setIsSelected)(nextIsSelected);
      }
    },
    [animationValue]
  );

  useEffect(() => {
    isSelectedRef.current = isSelected;
    if (isSelected && !wasSelectedRef.current) {
      setSelectionSessionKey((currentValue) => currentValue + 1);
    }
    wasSelectedRef.current = isSelected;
    if (!isSelected) {
      hasVideoFirstFrameRef.current = false;
      setHasVideoFirstFrame(false);
      setIsVideoErrored(false);
      imageOpacity.setValue(1);
      videoOpacity.setValue(0);
    }
  }, [imageOpacity, isSelected, videoOpacity]);

  useEffect(() => {
    if (!pauseRequestId || !isSelectedRef.current) return;
    setIsPaused(true);
  }, [pauseRequestId]);

  // Full reset when the item data changes (switching to a different story).
  useEffect(() => {
    hasVideoFirstFrameRef.current = false;
    setHasVideoFirstFrame(false);
    setIsVideoErrored(false);
    setVideoRetryKey(0);
    setHasPosterFallbackExhausted(false);
    setPosterCandidateIndex(0);
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

  // Once the selected card has its first video frame, fade from thumbnail to video.
  useEffect(() => {
    if (isSelected && hasVideoFirstFrame) {
      doImageToVideoCrossfade();
    }
  }, [doImageToVideoCrossfade, hasVideoFirstFrame, isSelected]);

  const handleVideoReady = useCallback(() => {
    // Guard against duplicate calls from the Video component.
    if (hasVideoFirstFrameRef.current) return;
    hasVideoFirstFrameRef.current = true;
    setHasVideoFirstFrame(true);
    setIsVideoErrored(false);
    if (isSelectedRef.current) {
      doImageToVideoCrossfade();
    }
  }, [doImageToVideoCrossfade]);

  const handleVideoError = useCallback(() => {
    hasVideoFirstFrameRef.current = false;
    setIsVideoErrored(true);
    setHasVideoFirstFrame(false);
    if (isSelectedRef.current) {
      imageOpacity.setValue(1);
      videoOpacity.setValue(0);
    }
  }, [imageOpacity, videoOpacity]);

  const handleCardPress = useCallback(() => {
    if (isSelected && item.videoUri) {
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
  }, [hasVideoFirstFrame, imageOpacity, isSelected, isVideoErrored, item.id, item.videoUri, onPress, videoOpacity]);

  const handleHoverStart = useCallback(() => {
    onHoverStart?.(item.id);
  }, [item.id, onHoverStart]);

  const posterUri = posterCandidates[posterCandidateIndex];

  const handlePosterError = useCallback(() => {
    setPosterCandidateIndex((currentIndex) => {
      if (currentIndex < posterCandidates.length - 1) {
        return currentIndex + 1;
      }
      setHasPosterFallbackExhausted(true);
      return currentIndex;
    });
  }, [posterCandidates.length]);

  const shouldMountVideo = Boolean(item.videoUri && isSelected);
  const shouldPlayVideo = Boolean(isSelected && !isPaused);
  const animatedFrameStyle = useAnimatedStyle(() => {
    const distance = Math.abs(animationValue.value);
    const scale = interpolate(distance, [0, 1, 2], [1, 0.98, 0.965], Extrapolation.CLAMP);
    return {
      borderColor: 'rgba(255,255,255,0.95)',
      opacity: interpolate(distance, [0, ACTIVE_SELECTION_DISTANCE, ACTIVE_SELECTION_DISTANCE + 0.05], [1, 1, 0], Extrapolation.CLAMP),
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
        {posterUri && !hasPosterFallbackExhausted ? (
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            onError={handlePosterError}
            source={{ uri: posterUri }}
            style={styles.image}
            transition={180}
          />
        ) : (
          <View style={styles.posterFallback} />
        )}
      </RNAnimated.View>
      {shouldMountVideo ? (
        <RNAnimated.View style={[styles.videoLayer, { opacity: videoOpacity }]}>
          <Video
            key={`video-${item.id}-${selectionSessionKey}-${videoRetryKey}`}
            isLooping
            isMuted
            onError={handleVideoError}
            onReadyForDisplay={handleVideoReady}
            resizeMode={isWeb ? ResizeMode.CONTAIN : ResizeMode.COVER}
            shouldPlay={shouldPlayVideo}
            source={{ uri: item.videoUri }}
            style={[styles.video, isWeb ? styles.webVideo : null]}
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
      {isSelected && item.videoUri && isVideoErrored ? (
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
      {isSelected && item.videoUri && hasVideoFirstFrame ? (
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
    previousProps.isHoverLoading === nextProps.isHoverLoading &&
    previousProps.animationValue === nextProps.animationValue &&
    previousProps.pauseRequestId === nextProps.pauseRequestId &&
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
  posterFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#202532',
  },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    height: '100%',
    width: '100%',
  },
  webVideo: {
    backgroundColor: '#05070c',
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
