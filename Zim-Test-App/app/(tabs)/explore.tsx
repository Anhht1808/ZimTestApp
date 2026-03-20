import { StyleSheet, View } from 'react-native';

import { SimpleCarouselTest } from '@/components/carousel/simple-carousel-test';

export default function TabTwoScreen() {
  return (
    <View style={styles.screen}>
      <SimpleCarouselTest />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#fff',
    flex: 1,
  },
});
