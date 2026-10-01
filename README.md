# FOCUS ENGINE

Focus Engine is a high-performance, minimalist mobile productivity application engineered with React Native, Expo SDK 57, and Reanimated. Built with Swiss graphic design and Apple Human Interface Guidelines in mind, it provides an uncluttered environment for deep cognitive focus, custom session intervals, procedural audio tonalities, and physical haptic resonance.

---

### Tech Stack & Core Dependencies

<p align="left">
  <img src="https://img.shields.io/badge/React_Native_0.86-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript_Strict-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Reanimated_4-0A84FF?style=for-the-badge&logo=speedtest&logoColor=white" alt="Reanimated" />
  <img src="https://img.shields.io/badge/MMKV_Storage-4B0082?style=for-the-badge&logo=sqlite&logoColor=white" alt="MMKV" />
  <img src="https://img.shields.io/badge/Apple_Haptics-333333?style=for-the-badge&logo=apple&logoColor=white" alt="Haptics" />
  <img src="https://img.shields.io/badge/Procedural_Audio-00C7BE?style=for-the-badge&logo=airplayaudio&logoColor=white" alt="Audio Engine" />
</p>

---

### Interface & Flow Showcase

<table>
  <tr>
    <td align="center" width="50%">
      <b>01 // 3D Gyroscope Focus Core</b><br/><br/>
      <img src="assets/screenshots/01_onboarding_core.png" width="100%" alt="Focus Core Onboarding" />
    </td>
    <td align="center" width="50%">
      <b>02 // Precision Rhythm Selection</b><br/><br/>
      <img src="assets/screenshots/02_onboarding_rhythm.png" width="100%" alt="Rhythm Selector" />
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>03 // Sensory Feedback Protocols</b><br/><br/>
      <img src="assets/screenshots/03_onboarding_sensory.png" width="100%" alt="Sensory Protocols" />
    </td>
    <td align="center" width="50%">
      <b>04 // Minimalist Focus Timer</b><br/><br/>
      <img src="assets/screenshots/04_main_timer.png" width="100%" alt="Main Timer Display" />
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <b>05 // Architectural Control Drawer</b><br/><br/>
      <img src="assets/screenshots/05_drawer_menu.png" width="50%" alt="Settings Drawer Menu" />
    </td>
  </tr>
</table>

---

### Key Architectural Pillars

#### 1. 3D Spatial Transitions & Gesture Physics
- Interactive 3D carousel transitions leveraging `react-native-reanimated` worklets running directly on the native rendering thread.
- Native perspective projection, continuous horizontal inertia, and smooth mathematical rotations without garbage collection overhead or frame drops.

#### 2. Procedural Audio Synthesis (528Hz & 432Hz)
- Completely local acoustic tone generation for timer ticks and completion chimes.
- Operates zero-network and zero-dependency on external audio CDN files, generating harmonic sine waves and meditation intervals dynamically.

#### 3. Apple Taptic Engine Integration
- Precise tactile communication mapped to timer lifecycle events (start, interval ticks, reset, pause, and step selection).
- Multi-tier feedback patterns using Light, Medium, and Notification haptics.

#### 4. Custom Native SVG Toggle Architecture
- Engineered `ModernSwitch` component utilizing custom SVG crosshairs and checkmark paths.
- Spring-driven physical travel mechanics with dual-state interpolation for OLED dark and high-contrast light environments.

#### 5. Cross-Platform Local Persistence
- Fast key-value persistence with `react-native-mmkv` on iOS/Android and seamless asynchronous fallback on Web runtimes.
- Preserves theme preferences, notification grants, audio states, and cumulative focus analytics across cold boots.

---

### Project Structure

```
focus-engine/
├── assets/
│   └── screenshots/           # High-resolution application captures
├── src/
│   ├── audio/
│   │   └── soundEngine.ts     # Procedural harmonic sound engine
│   ├── components/
│   │   ├── onboarding/
│   │   │   ├── AmbientGlow.tsx        # Ambient spatial lighting layer
│   │   │   ├── Artwork3D.tsx          # 3D gyro and sensory control stages
│   │   │   ├── OnboardingScreen.tsx   # Master onboarding coordinator
│   │   │   ├── OnboardingSlide3D.tsx  # 3D perspective worklet container
│   │   │   └── types.ts               # Strict TypeScript interface contracts
│   │   ├── ui/
│   │   │   ├── KineticGradientButton.tsx # Multi-layer rotating gradient CTA
│   │   │   └── ModernSwitch.tsx          # Custom animated SVG toggle
│   │   ├── LineSidebar.tsx    # Left-edge vertical navigation indicator
│   │   └── MainFocus3D.tsx    # Kinetic core chronometer
│   ├── notifications/         # Multi-platform notification scheduler
│   └── storage/               # MMKV and Web local persistence drivers
├── App.tsx                    # Root application entry & state machine
└── package.json
```

---

### Getting Started

#### Prerequisites
- Node.js (v18.0 or newer)
- npm or bun
- Expo Go application on iOS/Android or a configured mobile emulator

#### Installation
```bash
git clone https://github.com/sandrotonal/focus-engine.git
cd focus-engine
npm install
```

#### Development Server
```bash
# Start standard Expo Metro bundler
npx expo start

# Run targeting specific platforms
npx expo start --ios
npx expo start --android
npx expo start --web
```

#### Quality Assurance
```bash
# Static typecheck
npx tsc --noEmit

# Code analysis and linting
npx expo lint
```

---

### License
Distributed under the MIT License. Designed and developed with focus-driven precision.
