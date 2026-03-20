import { useCallback, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Carousel, { type ICarouselInstance } from 'react-native-reanimated-carousel';
import type { SharedValue } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useCarouselWheel } from '@/hooks/use-carousel-wheel';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useSimpleCarousel, type SimpleCarouselItem } from '@/hooks/use-simple-carousel';

import { SimpleCarouselCard } from './simple-carousel-card';

export function SimpleCarouselTest() {
  const { items, itemHeight, itemWidth, sliderHeight, sliderWidth } = useSimpleCarousel();
  const carouselRef = useRef<ICarouselInstance>(null);
  const isReducedMotionEnabled = useReducedMotion();
  const wheelCaptureProps = useCarouselWheel(carouselRef);
  const fullScreenContainerStyle = useMemo(
    () => ({ height: sliderHeight, width: sliderWidth }),
    [sliderHeight, sliderWidth]
  );

  const renderItem = useCallback(
    ({ item, animationValue }: { item: SimpleCarouselItem; animationValue: SharedValue<number> }) => (
      <SimpleCarouselCard
        animationValue={animationValue}
        cardHeight={itemHeight}
        isReducedMotionEnabled={isReducedMotionEnabled}
        item={item}
      />
    ),
    [isReducedMotionEnabled, itemHeight]
  );

  return (
    <View style={[styles.container, fullScreenContainerStyle]} {...wheelCaptureProps}>
      <View style={styles.titleContainer}>
        <ThemedText type="subtitle" style={styles.title}>
        Carousel style stories
        </ThemedText>
      </View>
      <Carousel
        ref={carouselRef}
        autoPlay={Platform.OS === 'web'}
        autoPlayInterval={6000}
        data={items}
        height={itemHeight}
        loop
        mode="parallax"
        pagingEnabled
        scrollAnimationDuration={isReducedMotionEnabled ? 360 : 520}
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
