# ZIM Story Carousel Demo (Expo)

Demo này dùng Expo + React Native Reanimated + `react-native-reanimated-carousel` để triển khai section story với hiệu ứng hover/motion mượt, ưu tiên transform/opacity và khả năng truy cập.

## 1) Cai dat dependencies

```bash
npm install
```

## 2) Cach chay du an

- Chay Expo dev server:

```bash
npm run start
```

- Chay tren web:

```bash
npm run web
```

- Chay tren Android emulator:

```bash
npm run android
```

- Chay tren iOS simulator:

```bash
npm run ios
```

- Hoac quet QR bang Expo Go (tu man hinh `expo start`).

## 3) Huong dan build

### Android APK (preview)

```bash
npx eas build -p android --profile preview
```

### Android production (AAB/APK theo profile)

```bash
npx eas build -p android --profile production
```

### iOS build

```bash
npx eas build -p ios --profile production
```

> Neu chua cau hinh EAS, chay `npx eas login` va `npx eas build:configure` truoc.

## 4) Mo ta giai phap

### Cong nghe lua chon

- **Huong B: React Native Expo**
- Ly do: mot codebase cho iOS/Android/Web, de demo nhanh, toi uu voi `expo-image` va `reanimated`.

### Nhung diem ky thuat da ap dung

- Hover motion cho item (lift + scale + overlay reveal) bang `transform` va `opacity`.
- Parallax nhe giua image/caption theo vi tri slide.
- 3D tilt nhe theo con tro tren web, co gioi han bien do, snap-back muot.
- Micro-interaction cho CTA icon/text trong card.
- Swipe story tren mobile + wheel/touchpad navigation tren web, co guard de khong skip nhieu slide.
- Ho tro `focus` de dieu huong ban phim, state focus ro rang.
- Ho tro `prefers-reduced-motion` / reduce motion (giam/tat animation).
- Card giu dung ti le `422x750`, chieu cao card bang `80%` viewport.

### Toi uu tai nguyen

- Anh su dung URL co `w` + `q` + `fm=webp`.
- Render anh bang `expo-image` voi `cachePolicy="memory-disk"` va transition nhe.
- Carousel `windowSize` gioi han de tranh render du.

## 5) Demo nhanh

- Expo project local: chay bang `npm run web` hoac Expo Go tu QR.
- Link public Snack/Expo va APK build: cap nhat sau khi publish EAS trong moi truong cua ban.
