import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { SimpleCarouselItem } from '@/hooks/use-simple-carousel';

type SimpleCarouselCardProps = {
  item: SimpleCarouselItem;
};

export function SimpleCarouselCard({ item }: SimpleCarouselCardProps) {
  return (
    <View style={styles.card}>
      <Image contentFit="cover" source={{ uri: item.imageUri }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {item.subtitle}
        </ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.topTag}>
        {item.id}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height:'100%'
  },
  image: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 12, 0.35)',
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
  title: {
    color: '#ffffff',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: '#ffffff',
    fontWeight: '700',
  },
  one: {
    backgroundColor: '#2563eb',
  },
  two: {
    backgroundColor: '#16a34a',
  },
  three: {
    backgroundColor: '#ea580c',
  },
  four: {
    backgroundColor: '#7c3aed',
  },
  five: {
    backgroundColor: '#dc2626',
    width: '100%',
  },
});

