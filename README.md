<div align="center">

<img src="./chavosh%20banner.png" alt="Chavosh Banner" width="100%" style="border-radius: 16px; margin-bottom: 24px;" />

<img src="./chavosh%20logo.png" alt="Chavosh Logo" width="100" height="100" style="border-radius: 22px; box-shadow: 0 8px 32px rgba(0, 102, 164, 0.4);" />

# Chavosh (چاووش)
### Modern, Ultra-Smooth Desktop Audio Experience Powered by Tauri v2 & Sarv UI

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-24C8D8?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)
[![React 19](https://img.shields.io/badge/React-v19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Native_Audio-DEA584?style=for-the-badge&logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Sarv UI](https://img.shields.io/badge/Design_System-Sarv_UI-0066A4?style=for-the-badge)](https://github.com/mjb4khshi/chavosh)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A state-of-the-art desktop music player blending vintage vinyl aesthetics with futuristic mini widgets and high-performance native audio playback.</b>
  <br><br>
  <a href="#-key-features"><b>Features</b></a> •
  <a href="#-five-distinct-listening-modes"><b>Player Modes</b></a> •
  <a href="#-keyboard-shortcuts"><b>Shortcuts</b></a> •
  <a href="#-getting-started"><b>Installation</b></a> •
  <a href="./README_FA.md"><b>🇮🇷 نسخه فارسی (Persian Docs)</b></a>
</p>

</div>

---

## ✨ Key Features

- ⚡ **Native Rust Audio Engine**: Blazing fast, low-memory playback powered by Rodio and Symphonia with zero-latency seeking.
- 🎨 **Sarv UI Design System**: Built with modern tokens, glassmorphic frosted glass, and responsive 4px spacing.
- 📀 **Authentic Vinyl & CD Physics**: Real turntable tonearm animation and iridescent CD reflections.
- 🎯 **5 Versatile Player Modes**: From full desktop library to frameless desktop widgets and Dynamic Island pills.
- 🔊 **Dynamic Iconsax Volume**: Authentic linear iconography with live wave count adapting to volume intensity.
- 🌈 **Cover Art Adaptive Palette**: Real-time extraction of vibrant color palettes synchronized with turntable widgets.
- 🎛️ **Live Remix Engine**: On-the-fly tempo, pitch, and playback rate adjustments.
- 🔍 **Instant Search & Hotkeys**: Ultra-fast fuzzy search with Persian and English support (`Ctrl + K`).

---

## 🎛️ Five Distinct Listening Modes

| Mode | Window Size | Description |
| :--- | :--- | :--- |
| **1. Desktop Library** | `1180 × 780` | Complete collection browser with Bento statistics, album covers, playlists, search, queue drawer, and lyrics. |
| **2. Vinyl Room** | Overlay | Fullscreen 3D-inspired turntable experience with spinning grooves, tonearm physics, and smooth crossfade transitions. |
| **3. Gramophone Widget** | Floating | Transparent desktop vinyl widget with size scaling (80%–130%), color matching, hover controls, and popover volume slider. |
| **4. Dynamic Island** | `356 × 48` | Nano capsule with live 3-bar animated EQ, scrolling ticker, hairline progress bar, and micro playback controls. |
| **5. Compact Mini Player** | `416 × 106` | Card player with ambient artwork backlight glow, inline volume slider, and timeline scrubber. |

---

## 🎨 Themes & Design Tokens (Sarv UI)

Chavosh comes with **8 handcrafted color palettes**:
- 🌌 **Chavosh Dark** *(Default Deep Indigo)*
- 🌊 **Midnight Abyss** *(Pure OLED Blue-Black)*
- 🌲 **Emerald Woods** *(Rich Forest Mint)*
- 🌹 **Ruby Rose** *(Warm Crimson Velvet)*
- 🌅 **Sunset Horizon** *(Vibrant Twilight Amber)*
- ⚡ **Cyberpunk Neon** *(Electric Purple & Cyan)*
- ☀️ **Clean Light** *(Crisp Modern Daylight)*
- 🏛️ **Porcelain Studio** *(Warm Minimalist White)*

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>→</kbd> / <kbd>MediaNext</kbd> | Next Track |
| <kbd>←</kbd> / <kbd>MediaPrev</kbd> | Previous Track |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Volume Up / Down (5% steps) |
| <kbd>M</kbd> | Toggle Mute |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Instant Search Bar |
| <kbd>P</kbd> | Toggle Window Pin (Always on Top) |
| <kbd>Esc</kbd> | Exit Overlays & Return to Library |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust & Cargo](https://rustup.rs/) (latest stable)

### Development
```bash
# Clone the repository
git clone https://github.com/mjb4khshi/chavosh.git
cd chavosh

# Install dependencies
npm install

# Run in desktop development mode (Tauri v2 + Vite)
npm run tauri dev
```

### Production Build
```bash
# Build optimized binaries and installers (NSIS EXE, MSI, Standalone)
npm run tauri build
```
Binaries will be generated in `src-tauri/target/release/bundle/`.

---

## 📦 Direct Downloads (v0.1.0)

- **Windows Setup Installer (Recommended)**: [Chavosh_0.1.0_x64-setup.exe](https://github.com/mjb4khshi/Chavosh/releases/download/v0.1.0/Chavosh_0.1.0_x64-setup.exe)
- **Portable ZIP Package**: [Chavosh_0.1.0_Portable.zip](https://github.com/mjb4khshi/Chavosh/releases/download/v0.1.0/Chavosh_0.1.0_Portable.zip)
- **Windows MSI Package**: [Chavosh_0.1.0_x64_en-US.msi](https://github.com/mjb4khshi/Chavosh/releases/download/v0.1.0/Chavosh_0.1.0_x64_en-US.msi)
- **Standalone Portable Executable**: [chavosh.exe](https://github.com/mjb4khshi/Chavosh/releases/download/v0.1.0/chavosh.exe)

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

<div align="center">
  <sub>Built with ❤️ and craftsmanship for audiophiles and open-source lovers.</sub>
</div>
