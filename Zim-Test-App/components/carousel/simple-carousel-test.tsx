import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';

import { ThemedText } from '@/components/themed-text';
import { useCarouselWheel } from '@/hooks/use-carousel-wheel';
import { useSimpleCarousel, type SimpleCarouselItem } from '@/hooks/use-simple-carousel';

import { SimpleCarouselCard } from './simple-carousel-card';

const NAVIGATION_FALLBACK_UNLOCK_MS = 900;
const HOVER_NAVIGATE_DELAY_MS = 1000;
const PRELOAD_RANGE_WEB = 2;
const PRELOAD_RANGE_NATIVE = 1;
const MOUNTED_VIDEO_RANGE = 2;

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
  const currentItemId = items[activeIndex]?.id;
  const preloadRange = Platform.OS === 'web' ? PRELOAD_RANGE_WEB : PRELOAD_RANGE_NATIVE;
  const itemIndexById = useMemo(() => new Map(items.map((item, index) => [item.id, index])), [items]);

  // Set of item IDs that should buffer their video before becoming current.
  const preloadItemIds = useMemo(() => {
    if (!items.length) return new Set<string>();
    const total = items.length;
    const ids = new Set<string>();
    for (let offset = 1; offset <= preloadRange; offset++) {
      const prevId = items[(activeIndex - offset + total) % total]?.id;
      const nextId = items[(activeIndex + offset) % total]?.id;
      if (prevId) ids.add(prevId);
      if (nextId) ids.add(nextId);
    }
    return ids;
  }, [activeIndex, items, preloadRange]);

  const mountedVideoItemIds = useMemo(() => {
    if (!items.length) return new Set<string>();
    const total = items.length;
    const ids = new Set<string>();
    ids.add(items[activeIndex]?.id ?? '');
    for (let offset = 1; offset <= MOUNTED_VIDEO_RANGE; offset++) {
      const prevId = items[(activeIndex - offset + total) % total]?.id;
      const nextId = items[(activeIndex + offset) % total]?.id;
      if (prevId) ids.add(prevId);
      if (nextId) ids.add(nextId);
    }
    ids.delete('');
    return ids;
  }, [activeIndex, items]);

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

  const renderItem = useCallback(
    ({ item }: { item: SimpleCarouselItem; index: number }) => (
      <SimpleCarouselCard
        isCurrent={currentItemId === item.id}
        isHoverLoading={hoverLoadingItemId === item.id}
        item={item}
        onHoverEnd={onCardHoverEnd}
        onHoverStart={onCardHoverStart}
        onPress={onCardPress}
        shouldKeepVideoMounted={mountedVideoItemIds.has(item.id)}
        shouldPreload={preloadItemIds.has(item.id)}
      />
    ),
    [currentItemId, hoverLoadingItemId, mountedVideoItemIds, onCardHoverEnd, onCardHoverStart, onCardPress, preloadItemIds]
  );

  useEffect(() => {
    // Orientation/layout changes can leave loop/parallax internal cache stale.
    // Reset transient navigation state so remount starts from a clean state.
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
