import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';

const WHEEL_DELTA_THRESHOLD = 2;
const WHEEL_COOLDOWN_MS = 500;
const WHEEL_GESTURE_END_MS = 180;

type WheelCaptureProps = {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function useCarouselWheel(
  carouselRef: React.RefObject<ICarouselInstance | null>
): WheelCaptureProps {
  const isHoveringCarouselRef = useRef(false);
  const lastWheelTriggerTsRef = useRef(0);
  const isWheelGestureActiveRef = useRef(false);
  const gestureEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onWindowWheel = useCallback(
    (event: WheelEvent) => {
      if (!isHoveringCarouselRef.current) return;

      const deltaY = Number(event?.deltaY ?? 0);
      const deltaX = Number(event?.deltaX ?? 0);
      const dominantDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      if (Math.abs(dominantDelta) < WHEEL_DELTA_THRESHOLD) return;

      const currentTs = Date.now();
      // Intercept in capture phase to avoid carousel's own wheel handling
      // and ensure one gesture maps to one controlled slide change.
      event.preventDefault();
      event.stopPropagation();
      if (gestureEndTimerRef.current) {
        clearTimeout(gestureEndTimerRef.current);
      }
      gestureEndTimerRef.current = setTimeout(() => {
        isWheelGestureActiveRef.current = false;
      }, WHEEL_GESTURE_END_MS);

      if (isWheelGestureActiveRef.current) return;

      if (currentTs - lastWheelTriggerTsRef.current < WHEEL_COOLDOWN_MS) return;

      if (dominantDelta > 0) {
        carouselRef.current?.next();
      } else {
        carouselRef.current?.prev();
      }
      isWheelGestureActiveRef.current = true;
      lastWheelTriggerTsRef.current = currentTs;
    },
    [carouselRef]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    window.addEventListener('wheel', onWindowWheel, { capture: true, passive: false });
    return () => {
      window.removeEventListener('wheel', onWindowWheel, { capture: true });
      if (gestureEndTimerRef.current) {
        clearTimeout(gestureEndTimerRef.current);
      }
    };
  }, [onWindowWheel]);

  const onMouseEnter = useCallback(() => {
    isHoveringCarouselRef.current = true;
  }, []);

  const onMouseLeave = useCallback(() => {
    isHoveringCarouselRef.current = false;
    isWheelGestureActiveRef.current = false;
    if (gestureEndTimerRef.current) {
      clearTimeout(gestureEndTimerRef.current);
    }
  }, []);

  return useMemo(
    () => (Platform.OS === 'web' ? { onMouseEnter, onMouseLeave } : {}),
    [onMouseEnter, onMouseLeave]
  );
}
