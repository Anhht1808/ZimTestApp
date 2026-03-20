import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type SimpleCarouselItem = {
  ctaLabel: string;
  id: string;
  linkUrl: string;
  title: string;
  subtitle: string;
  imageUri: string;
};

const BASE_ITEMS: SimpleCarouselItem[] = [
  {
    id: '1',
    title: 'ZIM Academy',
    subtitle: 'Lop hoc buoi toi',
    ctaLabel: 'Xem chi tiet',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '2',
    title: 'Tu hoc cung ban',
    subtitle: 'On bai theo nhom',
    ctaLabel: 'Xem lop',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '3',
    title: 'Thu vien IELTS',
    subtitle: 'Tai lieu luyen thi',
    ctaLabel: 'Doc ngay',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '4',
    title: 'Speaking Practice',
    subtitle: 'Luyen noi moi ngay',
    ctaLabel: 'Bat dau',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '5',
    title: 'Doc hieu nhanh',
    subtitle: 'Tang toc do Reading',
    ctaLabel: 'Luyen ngay',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '6',
    title: 'Writing Task 1',
    subtitle: 'Mo ta bieu do',
    ctaLabel: 'Xem de mau',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '7',
    title: 'Writing Task 2',
    subtitle: 'Luyen essay',
    ctaLabel: 'Xem goi y',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '8',
    title: 'Listening Boost',
    subtitle: 'Nghe moi ngay',
    ctaLabel: 'Thu nghe',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '9',
    title: 'Flashcard Tu vung',
    subtitle: 'Nho nhanh tu moi',
    ctaLabel: 'Xem bo the',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
  {
    id: '10',
    title: 'Mock Test',
    subtitle: 'Thi thu IELTS',
    ctaLabel: 'Vao thi',
    linkUrl: 'https://zim.vn',
    imageUri:
      'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=70&fm=webp',
  },
];
const CARD_RATIO_WIDTH = 422;
const CARD_RATIO_HEIGHT = 750;

export function useSimpleCarousel() {
  const { width, height } = useWindowDimensions();
  const items = useMemo(() => BASE_ITEMS, []);
  const sliderWidth = useMemo(() => Math.max(width, 320), [width]);
  const sliderHeight = useMemo(() => Math.max(height, 560), [height]);
  const itemHeight = useMemo(() => Math.floor(sliderHeight * 0.8), [sliderHeight]);
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
