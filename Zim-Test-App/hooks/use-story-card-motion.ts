import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const TILT_MAX_DEG = 5;
const MOTION_DURATION = 220;

type UseStoryCardMotionParams = {
  animationValue: SharedValue<number>;
  isReducedMotionEnabled: boolean;
  linkUrl: string;
};

export function useStoryCardMotion({
  animationValue,
  isReducedMotionEnabled,
  linkUrl,
}: UseStoryCardMotionParams) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrimedForOpen, setIsPrimedForOpen] = useState(false);
  const cardWidthValue = useSharedValue(1);
  const cardHeightValue = useSharedValue(1);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const revealValue = useSharedValue(0);
  const tiltXValue = useSharedValue(0);
  const tiltYValue = useSharedValue(0);
  const ctaValue = useSharedValue(0);
  const pointerXValue = useSharedValue(0);
  const pointerYValue = useSharedValue(0);

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

  const onCardLayout = useCallback(
    (event: any) => {
      cardWidthValue.value = Math.max(event.nativeEvent.layout.width, 1);
      cardHeightValue.value = Math.max(event.nativeEvent.layout.height, 1);
    },
    [cardHeightValue, cardWidthValue]
  );

  const applyPointerTilt = useCallback(() => {
    rafIdRef.current = null;
    if (Platform.OS !== 'web' || isReducedMotionEnabled || !pendingPointerRef.current) return;

    pointerXValue.value = pendingPointerRef.current.x;
    pointerYValue.value = pendingPointerRef.current.y;
    const xRatio = pointerXValue.value / cardWidthValue.value;
    const yRatio = pointerYValue.value / cardHeightValue.value;

    tiltXValue.value = withTiming((xRatio - 0.5) * 2 * TILT_MAX_DEG, { duration: 80 });
    tiltYValue.value = withTiming((0.5 - yRatio) * 2 * TILT_MAX_DEG, { duration: 80 });
  }, [cardHeightValue, cardWidthValue, isReducedMotionEnabled, pointerXValue, pointerYValue, tiltXValue, tiltYValue]);

  const onPointerMove = useCallback(
    (event: any) => {
      if (Platform.OS !== 'web' || isReducedMotionEnabled) return;

      pendingPointerRef.current = {
        x: Number(event?.nativeEvent?.locationX ?? 0),
        y: Number(event?.nativeEvent?.locationY ?? 0),
      };

      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(applyPointerTilt);
    },
    [applyPointerTilt, isReducedMotionEnabled]
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
    if (linkUrl) {
      Linking.openURL(linkUrl);
    }
  }, [isPrimedForOpen, linkUrl]);

  const onCardBlur = useCallback(() => {
    setIsFocused(false);
    setIsPrimedForOpen(false);
    resetTilt();
  }, [resetTilt]);

  const onCardHoverOut = useCallback(() => {
    setIsHovered(false);
    setIsPrimedForOpen(false);
    resetTilt();
  }, [resetTilt]);

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
    const parallaxY = interpolate(animationValue.value, [-1, 0, 1], [-4, 0, 4], Extrapolation.CLAMP);
    const revealZoom = interpolate(
      revealValue.value,
      [0, 1],
      [isReducedMotionEnabled ? 1 : 1.06, isReducedMotionEnabled ? 1 : 1.09],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateY: isReducedMotionEnabled ? 0 : parallaxY }, { scale: revealZoom }],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealValue.value, [0, 1], [0.42, 0.62], Extrapolation.CLAMP),
  }));

  const captionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(revealValue.value, [0, 1], [0.88, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(revealValue.value, [0, 1], [10, 0], Extrapolation.CLAMP) }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaValue.value,
    transform: [{ translateY: interpolate(ctaValue.value, [0, 1], [8, 0], Extrapolation.CLAMP) }],
  }));

  return {
    captionAnimatedStyle,
    containerAnimatedStyle,
    ctaAnimatedStyle,
    imageAnimatedStyle,
    isFocused,
    onCardBlur,
    onCardHoverOut,
    onCardLayout,
    onCardPress,
    onCardPointerMove: onPointerMove,
    onFocus: () => setIsFocused(true),
    onHoverIn: () => setIsHovered(true),
    overlayAnimatedStyle,
  };
}
