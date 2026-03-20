import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type SimpleCarouselItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  thumbnailUri?: string;
  videoUri?: string;
};

const BASE_ITEMS: SimpleCarouselItem[] = [
  {
    id: '1',
    title: 'ZIM Academy',
    subtitle: 'Lop hoc buoi toi',
    imageUri:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: '2',
    title: 'Tu hoc cung ban',
    subtitle: 'On bai theo nhom',
    imageUri:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80', // UPDATED
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: '3',
    title: 'Thu vien IELTS',
    subtitle: 'Tai lieu luyen thi',
    imageUri:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: '4',
    title: 'Speaking Practice',
    subtitle: 'Luyen noi moi ngay',
    imageUri:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: '5',
    title: 'Doc hieu nhanh',
    subtitle: 'Tang toc do Reading',
    imageUri:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: '6',
    title: 'Writing Task 1',
    subtitle: 'Mo ta bieu do',
    imageUri:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    id: '7',
    title: 'Writing Task 2',
    subtitle: 'Luyen essay',
    imageUri:
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
  {
    id: '8',
    title: 'Listening Boost',
    subtitle: 'Nghe moi ngay',
    imageUri:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    id: '9',
    title: 'Flashcard Tu vung',
    subtitle: 'Nho nhanh tu moi',
    imageUri:
      'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=900&q=80',
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  },
  {
    id: '10',
    title: 'Mock Test',
    subtitle: 'Thi thu IELTS',
    imageUri:
      'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80', // UPDATED
    videoUri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
];
const CARD_RATIO_WIDTH = 9;
const CARD_RATIO_HEIGHT = 16;

function createVideoThumbnailUri(videoUri?: string) {
  if (!videoUri) return undefined;
  const fileName = videoUri.split('/').pop()?.replace('.mp4', '');
  if (!fileName) return undefined;
  return `https://storage.googleapis.com/gtv-videos-bucket/sample/images/${fileName}.jpg`;
}

export function useSimpleCarousel() {
  const { width: sliderWidth, height: sliderHeight } = useWindowDimensions();
  const items = useMemo(
    () =>
      BASE_ITEMS.map((item) => ({
        ...item,
        thumbnailUri: createVideoThumbnailUri(item.videoUri),
      })),
    []
  );
  const scaleValue = useMemo(() => (sliderWidth > 500 ? 0.9 : 0.8), [sliderWidth]);
  // Keep story cards in a fixed portrait ratio (9:16) across devices.
  const itemHeight = useMemo(() => Math.floor(sliderHeight * scaleValue), [sliderHeight, scaleValue]);
  const itemWidth = useMemo(
    () => Math.floor((itemHeight * CARD_RATIO_WIDTH) / CARD_RATIO_HEIGHT),
    [itemHeight]
  );

  return {
    items,
    itemHeight,
    itemWidth,
    sliderHeight,
    sliderWidth,
  };
}
