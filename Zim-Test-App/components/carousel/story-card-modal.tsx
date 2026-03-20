import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { type SimpleCarouselItem } from '@/hooks/use-simple-carousel';

type StoryCardModalProps = {
  isVisible: boolean;
  item: SimpleCarouselItem | null;
  onClose: () => void;
};

export function StoryCardModal({ isVisible, item, onClose }: StoryCardModalProps) {
  if (!item) return null;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={isVisible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Image contentFit="cover" source={{ uri: item.imageUri }} style={styles.image} />
          <View style={styles.overlay} />
          <View style={styles.content}>
            <ThemedText type="subtitle" style={styles.title}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeText}>Dong</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
    borderWidth: 2,
    height: '80%',
    maxHeight: 760,
    maxWidth: 440,
    overflow: 'hidden',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 12, 0.36)',
  },
  content: {
    bottom: 16,
    left: 14,
    position: 'absolute',
    right: 14,
  },
  title: {
    color: '#ffffff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
  },
  closeButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
