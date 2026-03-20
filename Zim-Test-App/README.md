# ZIM Story Carousel Demo

Du an demo story carousel da nen tang Expo (React Native), tap trung vao motion/hover, tuong tac card, va toi uu hieu nang tren web + mobile.

## 1) Cai dat dependencies

Chon 1 package manager:

```bash
# npm
npm install

# yarn
yarn install

# pnpm
pnpm install
```

## 2) Cach chay du an

### Cach 1 - Expo (khuyen nghi)

```bash
# start dev server
npx expo start

# hoac dung script
npm run start
```

Chay nhanh theo platform:

```bash
npm run web
npm run android
npm run ios
```

### Cach 2 - React Native CLI command (khi can)

Sau khi prebuild native project:

```bash
npx expo prebuild
```

Chay bang RN CLI:

```bash
npx react-native run-android
npx react-native run-ios
```

## 3) Huong dan build ung dung

### Build APK (Android) bang EAS

```bash
# login + configure 1 lan
npx eas-cli login
npx eas-cli build:configure --platform android

# build apk de test nhanh
npx eas-cli build -p android --profile preview
```

### Build production Android (AAB)

```bash
npx eas-cli build -p android --profile production
```

### Build iOS

```bash
npx eas-cli build -p ios --profile production
```

Ghi chu:
- File `eas.json` da co profile `preview` (APK) va `production`.
- Neu can build local native sau prebuild, ban co the dung Android Studio/Xcode.

## 4) Mo ta giai phap va ly do lua chon

- **Giai phap chon:** React Native Expo + `react-native-reanimated-carousel`.
- **Ly do:** 1 codebase cho iOS/Android/Web, setup nhanh, de demo va de maintain.
- **Ky thuat chinh:**
  - Carousel loop + swipe + wheel/touchpad navigation.
  - Backdrop cho non-current item, hover loading roi navigate toi item.
  - Current item ho tro video autoplay, fade image -> video, pause/play.
  - Tuong tac duoc toi uu de tranh jump/skip khi click nhanh.
  - Responsive theo orientation, card ratio `9:16`, item height theo viewport.
