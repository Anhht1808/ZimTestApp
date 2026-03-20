import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverLoadingItemId, setHoverLoadingItemId] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);
  const queuedTargetIndexRef = useRef<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelCaptureProps = useCarouselWheel(carouselRef);
  const carouselLayoutKey = useMemo(
    () => `carousel-${Math.round(sliderWidth)}x${Math.round(sliderHeight)}-${Math.round(itemWidth)}x${Math.round(itemHeight)}`,
    [itemHeight, itemWidth, sliderHeight, sliderWidth]
  );
  const fullScreenContainerStyle = useMemo(
    () => ({ height: sliderHeight, width: sliderWidth }),
    [sliderHeight, sliderWidth]
  );

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
    (item: SimpleCarouselItem) => {
      if (Platform.OS !== 'web') return;

      const targetIndex = items.findIndex((entry) => entry.id === item.id);
      if (targetIndex < 0 || targetIndex === activeIndexRef.current) return;

      clearHoverTimer();
      setHoverLoadingItemId(item.id);
      hoverTimerRef.current = setTimeout(() => {
        navigateToTargetIndex(targetIndex);
      }, HOVER_NAVIGATE_DELAY_MS);
    },
    [clearHoverTimer, items, navigateToTargetIndex]
  );

  const onCardHoverEnd = useCallback(() => {
    clearHoverTimer();
    setHoverLoadingItemId(null);
  }, [clearHoverTimer]);

  const renderItem = useCallback(
    ({ item }: { item: SimpleCarouselItem; index: number }) => (
      <SimpleCarouselCard
        isCurrent={items[activeIndex]?.id === item.id}
        isHoverLoading={hoverLoadingItemId === item.id}
        item={item}
        onHoverEnd={onCardHoverEnd}
        onHoverStart={() => onCardHoverStart(item)}
        onPress={() => {
          const targetIndex = items.findIndex((entry) => entry.id === item.id);
          navigateToTargetIndex(targetIndex);
        }}
      />
    ),
    [activeIndex, hoverLoadingItemId, items, navigateToTargetIndex, onCardHoverEnd, onCardHoverStart]
  );

  useEffect(() => {
    // Orientation/layout changes can leave loop/parallax internal cache stale.
    // Reset transient navigation state so remount starts from stable state.
    isNavigatingRef.current = false;
    queuedTargetIndexRef.current = null;
    setHoverLoadingItemId(null);
    clearHoverTimer();
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = null;
    }
  }, [carouselLayoutKey, clearHoverTimer]);

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
        key={carouselLayoutKey}
        ref={carouselRef}
        // autoPlay={Platform.OS === 'web'}
        data={items}
        defaultIndex={activeIndexRef.current}
        height={itemHeight}
        loop
        mode="parallax"
        onSnapToItem={(index) => {
          activeIndexRef.current = index;
          setActiveIndex(index);
          setHoverLoadingItemId(null);
          if (isNavigatingRef.current) {
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
  titleContainer: {
    left: 16,
    position: 'absolute',
    top: 18,
    zIndex: 10,
  },
  container: {
    alignSelf: 'center',
    backgroundColor: '#13141c',
    justifyContent: 'center',
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
