import { invoke } from "@tauri-apps/api/core";

export async function resizeWindow(width: number, height: number) {
  try {
    await invoke("resize_window", { width, height });
  } catch (e) {
    console.warn("Could not resize window:", e);
  }
}

export async function minimizeWindow() {
  try {
    await invoke("minimize_window");
  } catch (e) {
    console.warn("Could not minimize window:", e);
  }
}

export async function toggleMaximizeWindow() {
  try {
    await invoke("toggle_maximize_window");
  } catch (e) {
    console.warn("Could not toggle maximize window:", e);
  }
}

export async function closeWindow() {
  try {
    await invoke("close_window");
  } catch (e) {
    console.warn("Could not close window:", e);
  }
}

export async function setAlwaysOnTop(alwaysOnTop: boolean): Promise<boolean> {
  try {
    const res = await invoke<boolean>("set_always_on_top", { alwaysOnTop });
    return res;
  } catch (e) {
    console.warn("Could not set always on top via IPC:", e);
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setAlwaysOnTop(alwaysOnTop);
      return alwaysOnTop;
    } catch (err) {
      console.warn("Fallback setAlwaysOnTop failed:", err);
      return false;
    }
  }
}

export async function checkAlwaysOnTop(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_always_on_top");
  } catch {
    return false;
  }
}


export async function startWindowDragging() {
  try {
    await invoke("start_dragging");
  } catch {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch (e) {
      console.warn("Could not start window drag:", e);
    }
  }
}

export async function getTrackCover(path: string): Promise<string | null> {
  try {
    return await invoke<string | null>("get_track_cover", { path });
  } catch (e) {
    console.warn("Could not load track cover:", e);
    return null;
  }
}

