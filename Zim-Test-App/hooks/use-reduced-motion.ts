import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReducedMotion() {
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (isMounted) {
        setIsReducedMotionEnabled(Boolean(value));
      }
    });

    const reducedMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => {
        setIsReducedMotionEnabled(Boolean(value));
      }
    );

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const updateFromMediaQuery = () => {
        setIsReducedMotionEnabled(motionQuery.matches);
      };
      updateFromMediaQuery();
      motionQuery.addEventListener('change', updateFromMediaQuery);

      return () => {
        isMounted = false;
        reducedMotionSubscription.remove();
        motionQuery.removeEventListener('change', updateFromMediaQuery);
      };
    }

    return () => {
      isMounted = false;
      reducedMotionSubscription.remove();
    };
  }, []);

  return isReducedMotionEnabled;
}
