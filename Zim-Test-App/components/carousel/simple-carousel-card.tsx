import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { SimpleCarouselItem } from '@/hooks/use-simple-carousel';

type SimpleCarouselCardProps = {
  animationValue: SharedValue<number>;
  cardHeight: number;
  isReducedMotionEnabled: boolean;
  item: SimpleCarouselItem;
};

const TILT_MAX_DEG = 5;
const MOTION_DURATION = 220;

export function SimpleCarouselCard({
  animationValue,
  cardHeight,
  isReducedMotionEnabled,
  item,
}: SimpleCarouselCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrimedForOpen, setIsPrimedForOpen] = useState(false);
  const cardWidthRef = useRef(1);
  const cardHeightRef = useRef(1);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const revealValue = useSharedValue(0);
  const tiltXValue = useSharedValue(0);
  const tiltYValue = useSharedValue(0);
  const ctaValue = useSharedValue(0);
  const isInteractiveReveal = isHovered || isFocused || isPrimedForOpen;

  useEffect(() => {
    const targetValue = isInteractiveReveal ? 1 : 0;
    const duration = isReducedMotionEnabled ? 0 : MOTION_DURATION;
    revealValue.value = withTiming(targetValue, { duration });
    ctaValue.value = withTiming(targetValue, { duration: isReducedMotionEnabled ? 0 : 280 });
  }, [ctaValue, isInteractiveReveal, isReducedMotionEnabled, revealValue]);

  const resetTilt = useCallback(() => {
    tiltXValue.value = withTiming(0, { duration: isReducedMotionEnabled ? 0 : 200 });
    tiltYValue.value = withTiming(0, { duration: isReducedMotionEnabled ? 0 : 200 });
  }, [isReducedMotionEnabled, tiltXValue, tiltYValue]);

  const flushPointer = useCallback(() => {
    const pointer = pendingPointerRef.current;
    rafIdRef.current = null;
    if (!pointer || isReducedMotionEnabled || Platform.OS !== 'web') return;

    const xRatio = pointer.x / cardWidthRef.current;
    const yRatio = pointer.y / cardHeightRef.current;
    const tiltX = (xRatio - 0.5) * 2 * TILT_MAX_DEG;
    const tiltY = (0.5 - yRatio) * 2 * TILT_MAX_DEG;
    tiltXValue.value = withTiming(tiltX, { duration: 80 });
    tiltYValue.value = withTiming(tiltY, { duration: 80 });
  }, [isReducedMotionEnabled, tiltXValue, tiltYValue]);

  const onPointerMove = useCallback(
    (event: any) => {
      if (Platform.OS !== 'web' || isReducedMotionEnabled) return;
      pendingPointerRef.current = {
        x: Number(event?.nativeEvent?.locationX ?? 0),
        y: Number(event?.nativeEvent?.locationY ?? 0),
      };

      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(flushPointer);
    },
    [flushPointer, isReducedMotionEnabled]
  );

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const onCardPress = useCallback(() => {
    if (!isPrimedForOpen) {
      setIsPrimedForOpen(true);
      return;
    }
    if (item.linkUrl) {
      Linking.openURL(item.linkUrl);
    }
  }, [isPrimedForOpen, item.linkUrl]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const baseScale = interpolate(animationValue.value, [-1, 0, 1], [0.94, 1, 0.94], Extrapolation.CLAMP);
    const animatedOpacity = interpolate(animationValue.value, [-1, 0, 1], [0.72, 1, 0.72], Extrapolation.CLAMP);
    const revealScale = interpolate(revealValue.value, [0, 1], [1, 1.018], Extrapolation.CLAMP);
    const revealLift = interpolate(revealValue.value, [0, 1], [0, -6], Extrapolation.CLAMP);

    return {
      opacity: animatedOpacity,
      transform: [
        { perspective: 900 },
        { translateY: revealLift },
        { scale: baseScale * revealScale },
        { rotateX: `${isReducedMotionEnabled ? 0 : tiltYValue.value}deg` },
        { rotateY: `${isReducedMotionEnabled ? 0 : tiltXValue.value}deg` },
      ],
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const parallaxY = interpolate(animationValue.value, [-1, 0, 1], [-8, 0, 8], Extrapolation.CLAMP);
    const revealZoom = interpolate(revealValue.value, [0, 1], [1, 1.05], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: isReducedMotionEnabled ? 0 : parallaxY }, { scale: revealZoom }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealValue.value, [0, 1], [0.42, 0.62], Extrapolation.CLAMP),
  }));

  const captionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealValue.value, [0, 1], [0.88, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(revealValue.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaValue.value,
    transform: [{ translateY: interpolate(ctaValue.value, [0, 1], [8, 0], Extrapolation.CLAMP) }],
  }));

  const cardFocusStyle = useMemo(
    () => (isFocused ? [styles.card, styles.cardFocusVisible] : [styles.card]),
    [isFocused]
  );

  return (
    <Animated.View style={[containerAnimatedStyle, { height: cardHeight }]}>
      <Pressable
        accessibilityHint="Nhan lan dau de hien thi thong tin, lan hai de mo lien ket."
        accessibilityLabel={`${item.title}. ${item.subtitle}`}
        accessibilityRole="button"
        onBlur={() => {
          setIsFocused(false);
          setIsPrimedForOpen(false);
          resetTilt();
        }}
        onFocus={() => setIsFocused(true)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => {
          setIsHovered(false);
          setIsPrimedForOpen(false);
          resetTilt();
        }}
        onLayout={(event) => {
          cardWidthRef.current = Math.max(event.nativeEvent.layout.width, 1);
          cardHeightRef.current = Math.max(event.nativeEvent.layout.height, 1);
        }}
        onPointerMove={onPointerMove}
        onPress={onCardPress}
        style={cardFocusStyle}>
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={item.id}
            source={{ uri: item.imageUri }}
            style={styles.image}
            transition={isReducedMotionEnabled ? 0 : 180}
          />
        </Animated.View>
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
        <Animated.View style={[styles.content, captionAnimatedStyle]}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
          <Animated.View style={[styles.ctaRow, ctaAnimatedStyle]}>
            <ThemedText style={styles.ctaText}>{item.ctaLabel}</ThemedText>
            <View style={styles.ctaIconDot}>
              <ThemedText style={styles.ctaIcon}>→</ThemedText>
            </View>
          </Animated.View>
        </Animated.View>
        <View style={styles.tagPill}>
          <ThemedText type="defaultSemiBold" style={styles.topTag}>
            {item.id}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  cardFocusVisible: {
    borderColor: '#ffffff',
    shadowColor: '#84ccff',
    shadowOpacity: 0.75,
    shadowRadius: 16,
  },
  imageContainer: {
    height: '100%',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 20, 0.76)',
  },
  content: {
    bottom: 14,
    left: 12,
    position: 'absolute',
    right: 12,
  },
  topTag: {
    color: '#ffffff',
    fontSize: 12,
  },
  tagPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: 12,
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
  ctaRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  ctaIconDot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  ctaIcon: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 11,
  },
});
