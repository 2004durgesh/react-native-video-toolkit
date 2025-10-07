<div align="center">
  <h1>react-native-video-toolkit</h1>
  <img src="./assets/icon.png" width="100" height="100" alt="react-native-video-toolkit logo" />
</div>

My **first ever real OSS project** 😭. Be kind, I’m still figuring this out.
A flexible and customizable video player UI toolkit for React Native.

👉 Full Documentation: [https://react-native-video-toolkit-docs.vercel.app/](https://react-native-video-toolkit-docs.vercel.app/)

<a href="https://www.npmjs.com/package/react-native-video-toolkit">
  <img src="https://img.shields.io/npm/v/react-native-video-toolkit" alt="npm version" />
</a>
<a href="https://github.com/2004durgesh/react-native-video-toolkit/blob/main/LICENSE">
  <img src="https://img.shields.io/github/license/2004durgesh/react-native-video-toolkit" alt="license" />
</a>
<a href="https://github.com/2004durgesh/react-native-video-toolkit/actions/workflows/ci.yml">
  <img
    src="https://img.shields.io/github/actions/workflow/status/2004durgesh/react-native-video-toolkit/ci.yml?label=ci"
    alt="CI Workflow Status"
  />
</a>

<a href="https://react-native-video-toolkit-docs.vercel.app/">
  <img src="https://deploy-badge.vercel.app/vercel/react-native-video-toolkit-docs?name=docs" alt="Docs Status" />
</a>
<a href="https://discord.gg/n7xVPxbG4R">
  <img
    src="https://img.shields.io/discord/1387063063223599265?color=7289da&label=discord&logo=discord&logoColor=7289d"
    alt="discord"
  />
</a>

---

## 📑 Table of Contents

- [📱 Demo](#-demo)
- [✨ Features](#-features)
- [✅ Platform Compatibility](#-platform-compatibility)
- [🗺️ Roadmap](#-roadmap)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [🐛 Issues](#-issues)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 📱 Demo

> [!TIP]  
> The demo app is available in the `example` folder.  
> Clone the repo and run `yarn example start` inside the `example` directory to see the latest changes.  
> You can also download the demo app from the [release builds](https://github.com/2004durgesh/react-native-video-toolkit/releases/latest).

| Mode                          | Preview                                               |
| ----------------------------- | ----------------------------------------------------- |
| **Portrait**                  | <img src="./assets/mobile-portrait.png" height="300"> |
| **Landscape**                 | <img src="./assets/mobile-land-1.png" width="300">    |
| **Landscape (with settings)** | <img src="./assets/mobile-land-2.png" width="300">    |

---

## ✨ Features

- **Fully Customizable UI** – Build your own video player experience with modular components.
- **Theming Support** – Light, dark, or your own custom theme.
- **Pre-built Layouts** – Includes `DefaultLayout` to get started quickly.
- **Gesture Handling** – Tap, double-tap, and other common playback gestures.
- **Rich Component Library** – Controls like `PlayButton`, `ProgressBar`, `TimeDisplay`, `FullscreenButton`, `MuteButton`, and more.
- **Hooks-based API** – Access player state and control playback, settings, and gestures.

---

## ✅ Platform Compatibility

| Platform   | Tested |
| ---------- | :----: |
| Android    |   ✅   |
| iOS        |   ❌   |
| Android TV |   ✅   |
| Apple TV   |   ❌   |
| Web        |   ✅   |

---

## 🗺️ Roadmap

- [x] Core Player component
- [x] Customizable controls
- [x] Theming support
- [x] Gesture handling
- [x] Settings menu
- [x] Layout presets (`DefaultLayout`)
- [x] Fullscreen support
- [x] Landscape mode support
- [ ] TV support (D-pad navigation)
- [ ] Picture-in-Picture (PiP) mode
- [ ] More advanced layouts (YouTube/Netflix-style)

---

## 📦 Installation

```bash
npm install react-native-video-toolkit
# or
yarn add react-native-video-toolkit
```

---

## 🚀 Usage

```tsx
import { VideoPlayer, DefaultLayout } from 'react-native-video-toolkit';

const App = () => {
  return (
    <VideoPlayer source={{ uri: 'https://example.com/video.mp4' }}>
      <DefaultLayout />
    </VideoPlayer>
  );
};
```

For more docs:
👉 [Documentation website](https://react-native-video-toolkit-docs.vercel.app/).

---

## 🐛 Issues

Yes, there are bugs. Probably lots.
👉 [Open an issue](https://github.com/2004durgesh/react-native-video-toolkit/issues).
It makes the project look active, so actually… thanks in advance.

---

## 🤝 Contributing

Wanna help? Please? 🙏
Check the [contributing guide](CONTRIBUTING.md). I’ll try to review your PR before I spiral into existential dread.

---

## 📜 License

MIT – because lawyers are scary.

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
Thanks to [wuxnz](https://github.com/wuxnz) for motivation (and maybe trauma)
Thanks to [zach](https://github.com/founded-labs/react-native-reusables/tree/main/apps/docs) for the docs template

Made with ❤️, caffeine, and way too many Chrome tabs by [Durgesh](https://github.com/2004durgesh)
