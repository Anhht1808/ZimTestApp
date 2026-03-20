import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Carousel, {
  type CarouselRenderItem,
  type ICarouselInstance,
} from 'react-native-reanimated-carousel';

import { ThemedText } from '@/components/themed-text';
import { useCarouselWheel } from '@/hooks/use-carousel-wheel';
import { useSimpleCarousel, type SimpleCarouselItem } from '@/hooks/use-simple-carousel';

import { SimpleCarouselCard } from './simple-carousel-card';

const NAVIGATION_FALLBACK_UNLOCK_MS = 900;
const HOVER_NAVIGATE_DELAY_MS = 1000;

export function SimpleCarouselTest() {
  const { items, itemHeight, itemWidth, sliderHeight, sliderWidth } = useSimpleCarousel();
  const carouselRef = useRef<ICarouselInstance>(null);
  const activeIndexRef = useRef(0);
  const [hoverLoadingItemId, setHoverLoadingItemId] = useState<string | null>(null);
  const [pauseRequestId, setPauseRequestId] = useState(0);
  const isNavigatingRef = useRef(false);
  const queuedTargetIndexRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelCaptureProps = useCarouselWheel(carouselRef);

  const fullScreenContainerStyle = useMemo(
    () => ({ height: sliderHeight, width: sliderWidth }),
    [sliderHeight, sliderWidth]
  );
  const itemIndexById = useMemo(() => new Map(items.map((item, index) => [item.id, index])), [items]);

  const getCurrentCarouselIndex = useCallback(() => {
    const runtimeIndex = carouselRef.current?.getCurrentIndex?.();
    if (typeof runtimeIndex === 'number' && Number.isFinite(runtimeIndex)) {
      return runtimeIndex;
    }
    return activeIndexRef.current;
  }, []);

  const navigateToTargetIndex = useCallback(
    (targetIndex: number) => {
      if (targetIndex < 0) return;

      if (isNavigatingRef.current) {
        // Queue only the latest target while current transition is running.
        queuedTargetIndexRef.current = targetIndex;
        return;
      }

      const total = items.length;
      const currentIndex = getCurrentCarouselIndex();
      const forwardSteps = (targetIndex - currentIndex + total) % total;
      const backwardSteps = (currentIndex - targetIndex + total) % total;
      const stepCount = forwardSteps <= backwardSteps ? forwardSteps : -backwardSteps;
      if (!stepCount) return;

      setHoverLoadingItemId(null);
      isNavigatingRef.current = true;
      carouselRef.current?.scrollTo({ animated: true, count: stepCount });

      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
      // Fallback unlock in case onSnapToItem is skipped during orientation transitions.
      unlockTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
        const queuedTarget = queuedTargetIndexRef.current;
        queuedTargetIndexRef.current = null;
        if (queuedTarget !== null && queuedTarget !== getCurrentCarouselIndex()) {
          navigateToTargetIndex(queuedTarget);
        }
      }, NAVIGATION_FALLBACK_UNLOCK_MS);
    },
    [getCurrentCarouselIndex, items.length]
  );

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const onCardHoverStart = useCallback(
    (itemId: string) => {
      if (Platform.OS !== 'web') return;

      const targetIndex = itemIndexById.get(itemId) ?? -1;
      if (targetIndex < 0 || targetIndex === activeIndexRef.current) return;

      clearHoverTimer();
      setHoverLoadingItemId(itemId);
      hoverTimerRef.current = setTimeout(() => {
        // Hover preview: after delay, navigate carousel to hovered card.
        navigateToTargetIndex(targetIndex);
      }, HOVER_NAVIGATE_DELAY_MS);
    },
    [clearHoverTimer, itemIndexById, navigateToTargetIndex]
  );

  const onCardHoverEnd = useCallback(() => {
    clearHoverTimer();
    setHoverLoadingItemId(null);
  }, [clearHoverTimer]);

  const onCardPress = useCallback(
    (itemId: string) => {
      const targetIndex = itemIndexById.get(itemId) ?? -1;
      navigateToTargetIndex(targetIndex);
    },
    [itemIndexById, navigateToTargetIndex]
  );

  const requestPauseCurrentVideo = useCallback(() => {
    setPauseRequestId((currentValue) => currentValue + 1);
  }, []);

  const renderItem = useCallback<CarouselRenderItem<SimpleCarouselItem>>(
    ({ animationValue, item }) => (
      <SimpleCarouselCard
        animationValue={animationValue}
        isHoverLoading={hoverLoadingItemId === item.id}
        item={item}
        onHoverEnd={onCardHoverEnd}
        onHoverStart={onCardHoverStart}
        onPress={onCardPress}
        pauseRequestId={pauseRequestId}
      />
    ),
    [hoverLoadingItemId, onCardHoverEnd, onCardHoverStart, onCardPress, pauseRequestId]
  );

  useEffect(() => {
    // Layout changes can leave gesture/timer state stale; reset transient state
    // and sync back to the current index without remounting the whole carousel.
    isNavigatingRef.current = false;
    queuedTargetIndexRef.current = null;
    setHoverLoadingItemId(null);
    clearHoverTimer();
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }

    const frameId = requestAnimationFrame(() => {
      carouselRef.current?.scrollTo({ animated: false, index: activeIndexRef.current });
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [clearHoverTimer, itemHeight, itemWidth, sliderHeight, sliderWidth]);

  useEffect(() => {
    return () => {
      clearHoverTimer();
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, [clearHoverTimer]);

  return (
    <View style={[styles.container, fullScreenContainerStyle]} {...wheelCaptureProps}>
      <View style={styles.titleContainer}>
        <ThemedText type="subtitle" style={styles.title}>
          Carousel style stories
        </ThemedText>
      </View>
      <Carousel
        ref={carouselRef}
        data={items}
        defaultIndex={activeIndexRef.current}
        height={itemHeight}
        loop
        mode="parallax"
        onScrollStart={requestPauseCurrentVideo}
        onSnapToItem={(index) => {
          activeIndexRef.current = index;
          setHoverLoadingItemId(null);
          if (isNavigatingRef.current) {
            // Snap callback is the source of truth that the move finished.
            isNavigatingRef.current = false;
            if (unlockTimerRef.current) {
              clearTimeout(unlockTimerRef.current);
            }
            const queuedTarget = queuedTargetIndexRef.current;
            queuedTargetIndexRef.current = null;
            if (queuedTarget !== null && queuedTarget !== index) {
              navigateToTargetIndex(queuedTarget);
            }
          }
        }}
        pagingEnabled
        renderItem={renderItem}
        style={styles.carousel}
        windowSize={5}
        width={itemWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#13141c',
    justifyContent: 'center',
  },
  titleContainer: {
    left: 16,
    position: 'absolute',
    top: 18,
    zIndex: 10,
  },
  title: {
    color: '#f3f4f6',
  },
  carousel: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
