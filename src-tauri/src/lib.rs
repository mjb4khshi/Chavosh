use lofty::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub id: u32,
    pub path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub year: Option<u32>,
    pub track_number: Option<u32>,
    pub genre: Option<String>,
}

struct LibraryState {
    tracks: Mutex<Vec<Track>>,
}

fn clean_title(raw: &str) -> String {
    let mut s = raw.to_string();
    for pattern in [
        "[Official Video]",
        "[Official Audio]",
        "[Official Music Video]",
        "(Official Video)",
        "(Official Audio)",
        "(Official Music Video)",
        "[HQ]",
        "[HD]",
        "[Lyrics]",
        "(Lyrics)",
        "[Lyric Video]",
        "(Lyric Video)",
        "[Audio]",
        "(Audio)",
        "[Music Video]",
        "(Music Video)",
    ] {
        s = s.replace(pattern, "");
    }
    while s.contains("  ") {
        s = s.replace("  ", " ");
    }
    s.trim().to_string()
}

fn scan_dir(dir: &Path, tracks: &mut Vec<Track>, next_id: &mut u32) {
    use walkdir::WalkDir;
    for entry in WalkDir::new(dir).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        if !matches!(
            ext.as_str(),
            "mp3" | "flac" | "ogg" | "m4a" | "wav" | "aac" | "opus" | "wma"
        ) {
            continue;
        }
        let tagged = match lofty::read_from_path(path) {
            Ok(t) => t,
            Err(_) => continue,
        };
        let primary = tagged.primary_tag().or_else(|| tagged.first_tag());
        let (title, artist, album, year, track_number, genre) = match primary {
            Some(tag) => {
                let t = tag.title().map(|s| s.to_string()).unwrap_or_default();
                let a = tag.artist().map(|s| s.to_string()).unwrap_or_default();
                let al = tag.album().map(|s| s.to_string()).unwrap_or_default();
                let y = tag.year();
                let tn = tag.track();
                let g = tag.get_string(&ItemKey::Genre).map(|s| s.to_string());
                (t, a, al, y, tn, g)
            }
            None => (String::new(), String::new(), String::new(), None, None, None),
        };
        let fallback_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown")
            .to_string();
        let title = if title.is_empty() {
            clean_title(&fallback_name)
        } else {
            clean_title(&title)
        };
        let artist = if artist.is_empty() {
            "Unknown Artist".into()
        } else {
            artist
        };
        let album = if album.is_empty() {
            "Unknown Album".into()
        } else {
            album
        };
        let duration = tagged.properties().duration().as_secs_f64();
        tracks.push(Track {
            id: *next_id,
            path: path.to_string_lossy().to_string(),
            title,
            artist,
            album,
            duration,
            year,
            track_number,
            genre,
        });
        *next_id += 1;
    }
}

#[tauri::command]
fn scan_folders(folders: Vec<String>, state: State<'_, LibraryState>) -> Result<Vec<Track>, String> {
    let mut new_tracks = Vec::new();
    let mut next_id = {
        let tracks = state.tracks.lock().map_err(|e| e.to_string())?;
        tracks.len() as u32 + 1
    };
    for folder in folders {
        let p = Path::new(&folder);
        if p.is_dir() {
            scan_dir(p, &mut new_tracks, &mut next_id);
        }
    }
    let mut all = state.tracks.lock().map_err(|e| e.to_string())?;
    all.extend(new_tracks.clone());
    Ok(new_tracks)
}

#[tauri::command]
fn get_library(state: State<'_, LibraryState>) -> Result<Vec<Track>, String> {
    let tracks = state.tracks.lock().map_err(|e| e.to_string())?;
    Ok(tracks.clone())
}

#[tauri::command]
fn clear_library(state: State<'_, LibraryState>) -> Result<(), String> {
    let mut tracks = state.tracks.lock().map_err(|e| e.to_string())?;
    tracks.clear();
    Ok(())
}

#[tauri::command]
fn resize_window(width: f64, height: f64, window: tauri::Window) -> Result<(), String> {
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize::new(width, height)))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn set_always_on_top(always_on_top: bool, window: tauri::Window) -> Result<bool, String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())?;
    Ok(always_on_top)
}

#[tauri::command]
fn is_always_on_top(window: tauri::Window) -> Result<bool, String> {
    window.is_always_on_top().map_err(|e| e.to_string())
}


#[tauri::command]
fn start_dragging(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_track_cover(path: String) -> Result<Option<String>, String> {
    use base64::prelude::*;
    let p = Path::new(&path);
    if !p.exists() {
        return Ok(None);
    }
    let tagged = match lofty::read_from_path(p) {
        Ok(t) => t,
        Err(_) => return Ok(None),
    };
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag());
    if let Some(tag) = tag {
        if let Some(pic) = tag.pictures().first() {
            let mime_str = match pic.mime_type() {
                Some(m) => m.as_str(),
                None => "image/jpeg",
            };
            let b64 = BASE64_STANDARD.encode(pic.data());
            return Ok(Some(format!("data:{};base64,{}", mime_str, b64)));
        }
    }
    Ok(None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(LibraryState {
            tracks: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            scan_folders,
            get_library,
            clear_library,
            resize_window,
            minimize_window,
            toggle_maximize_window,
            close_window,
            set_always_on_top,
            is_always_on_top,
            start_dragging,
            get_track_cover
        ])
        .run(tauri::generate_context!())
        .expect("error while running chavosh");
}

