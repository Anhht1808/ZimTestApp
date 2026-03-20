# ZIM Story Carousel Demo

Dự án demo Story Carousel đa nền tảng sử dụng Expo (React Native), tập trung vào motion/hover, tương tác card và tối ưu hiệu năng trên cả web + mobile.

---

## 📱 Tải ứng dụng (APK)

Bạn có thể tải và trải nghiệm bản build Android tại đây:

👉 https://expo.dev/accounts/handez/projects/Zim-Test-App/builds/c5ea5b74-708a-4da7-bd0d-92e21947b148

Hoặc quét mã QR bên dưới để tải nhanh:

![QR Download](./qr-download.png)

> 📌 Lưu ý: Đảm bảo bạn đã bật cho phép cài đặt ứng dụng từ nguồn không xác định trên Android.

---

## 1) Cài đặt dependencies

Chọn một package manager:

```bash
# npm
npm install

# yarn
yarn install

# pnpm
pnpm install
```

---

## 2) Cách chạy dự án

### Cách 1 - Expo (khuyến nghị)

```bash
# start dev server
npx expo start

# hoặc dùng script
npm run start
```

Chạy nhanh theo platform:

```bash
npm run web
npm run android
npm run ios
```

---

### Cách 2 - React Native CLI (khi cần)

Sau khi prebuild native project:

```bash
npx expo prebuild
```

Chạy bằng React Native CLI:

```bash
npx react-native run-android
npx react-native run-ios
```

---

## 3) Hướng dẫn build ứng dụng

### Build APK (Android) bằng EAS

```bash
# login + configure 1 lần
npx eas-cli login
npx eas-cli build:configure --platform android

# build APK để test nhanh
npx eas-cli build -p android --profile preview
```

---

### Build production Android (AAB)

```bash
npx eas-cli build -p android --profile production
```

---

### Build iOS

```bash
npx eas-cli build -p ios --profile production
```

---

### Ghi chú

* File `eas.json` đã có profile `preview` (APK) và `production`.
* Nếu cần build native local sau khi prebuild, bạn có thể dùng Android Studio hoặc Xcode.

---

## 4) Mô tả giải pháp và lý do lựa chọn

* **Giải pháp chọn:** React Native Expo + `react-native-reanimated-carousel`.
* **Lý do:** Một codebase cho iOS/Android/Web, setup nhanh, dễ demo và dễ maintain.

---

## 5) Kỹ thuật chính

* Carousel loop + swipe + hỗ trợ navigation bằng wheel/touchpad.
* Backdrop cho các item không phải current item.
* Hover loading rồi navigate tới item tương ứng.
* Current item hỗ trợ:

  * Video autoplay.
  * Hiệu ứng fade từ image → video.
  * Pause/Play video.
* Preload video theo vùng lân cận của current index để giảm loading:

  * Sau 1s preload `index - 1` và `index + 1`.
  * Sau 2s preload `index - 2` và `index + 2`.
  * Có vòng lặp, nên tại `index = 0` vẫn preload được item cuối.
* Tối ưu tương tác để tránh hiện tượng jump/skip khi click nhanh.
* Responsive theo orientation.
* Card ratio `9:16`, chiều cao item theo viewport.
