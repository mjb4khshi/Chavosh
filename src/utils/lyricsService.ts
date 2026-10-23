import { invoke } from "@tauri-apps/api/core";
import { type Track } from "../stores/playerStore";
import { isTauri } from "./browserAudio";
import { parseLrc, type LyricsData } from "./lyrics";

interface TauriTrackLyrics {
  synced: string | null;
  plain: string | null;
  source: string;
}

const SAMPLE_CHAVOSH_DAWN = `[00:00.00] ♪ (Intro - نوای دل‌انگیز چاووش) ♪
[00:06.50] سحر بلبل حکایت با صبا کرد
[00:13.50] که عشق روی گل با ما چه‌ها کرد
[00:21.00] خوشا آن دم که از چاووش مستی
[00:28.00] دل از بند غم گیتی رها کرد
[00:36.00] ♪ (تکنوازی شورانگیز تار) ♪
[00:44.00] بیا تا گل برافشانیم و می در ساغر اندازیم
[00:52.00] فلک را سقف بشکافیم و طرحی نو دراندازیم
[01:00.00] اگر غم لشکر انگیزد که خون عاشقان ریزد
[01:08.00] من و ساقی به هم تازیم و بنیادش براندازیم
[01:15.00] ♪ (فرود چاووش - پایان قطعه) ♪`;

const SAMPLE_MIDNIGHT_BREEZE = `[00:00.00] ♪ (Gentle acoustic guitar & ambient breeze) ♪
[00:08.00] Whispers drifting in the midnight breeze
[00:16.00] Silver moonlight dances through the trees
[00:24.00] Far beyond the neon lights of town
[00:32.00] Where the starry river settles down
[00:40.00] In the quiet heartbeat of the night
[00:48.00] Every shadow turns into the light
[00:56.00] Chavosh plays the soundtrack of our soul
[01:04.00] Turning scattered pieces into whole
[01:12.00] ♪ (Harmonic fade out) ♪`;

const SAMPLE_SILK_ROAD_BEATS = `[00:00.00] ♪ (ریتم کوبه‌ای دف و تنبک در کاروانسرای باستانی) ♪
[00:10.00] گام بر گام در مسیر جاده ابریشم
[00:18.00] طنین دف و هلهله کاروان
[00:26.00] از نیشابور تا سمرقند و بخارا
[00:34.00] ساز و ترانه در گذر زمان
[00:42.00] ♪ (تکنوازی بربط و کمانچه) ♪
[00:50.00] چاووش عشق، راهنمای دل‌های مشتاق
[00:58.00] در کاروانسرای مهر و دوستی
[01:06.00] ♪ (ریتم پرشور پایانی) ♪`;

const SAMPLE_TRACK_LYRICS: Record<string, string> = {
  "chavosh-ambient": SAMPLE_CHAVOSH_DAWN,
  "Chavosh Dawn": SAMPLE_CHAVOSH_DAWN,
  "طلوع چاووش": SAMPLE_CHAVOSH_DAWN,
  "Persian Ambient": SAMPLE_CHAVOSH_DAWN,

  "chavosh-chill": SAMPLE_MIDNIGHT_BREEZE,
  "Midnight Breeze": SAMPLE_MIDNIGHT_BREEZE,
  "نسیم نیمه‌شب": SAMPLE_MIDNIGHT_BREEZE,
  "Karaj": SAMPLE_MIDNIGHT_BREEZE,

  "chavosh-lofi": SAMPLE_SILK_ROAD_BEATS,
  "Silk Road Beats": SAMPLE_SILK_ROAD_BEATS,
  "ضرب‌آهنگ": SAMPLE_SILK_ROAD_BEATS,
  "Shemiran": SAMPLE_SILK_ROAD_BEATS,
};

// Global in-memory cache
const memoryLyricsCache = new Map<string, LyricsData>();

const PERSISTENT_LYRICS_STORAGE_PREFIX = "chavosh_lrc_";

/**
 * Returns a stable unique identifier for a track for persistent lyrics caching
 */
export function getLyricsCacheKey(track: Track): string {
  if (track.path && track.path.length > 3) {
    return `p:${track.path}`;
  }
  const cleanTitle = (track.title || "").toLowerCase().trim();
  const cleanArtist = (track.artist || "").toLowerCase().trim();
  return `m:${cleanArtist}_${cleanTitle}`;
}

/**
 * Retrieves cached lyrics from memory or persistent localStorage
 */
export function getCachedLyrics(track: Track): LyricsData | null {
  const key = getLyricsCacheKey(track);
  if (memoryLyricsCache.has(key)) {
    return memoryLyricsCache.get(key)!;
  }

  // Check persistent localStorage cache
  try {
    const raw = localStorage.getItem(`${PERSISTENT_LYRICS_STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed: LyricsData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.lines)) {
        memoryLyricsCache.set(key, parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve lyrics from localStorage:", err);
  }

  return null;
}

/**
 * Permanently saves lyrics to both memory and localStorage so it never wastes bandwidth again
 */
export function saveLyricsToCache(track: Track, lyrics: LyricsData) {
  const key = getLyricsCacheKey(track);
  memoryLyricsCache.set(key, lyrics);

  try {
    localStorage.setItem(
      `${PERSISTENT_LYRICS_STORAGE_PREFIX}${key}`,
      JSON.stringify(lyrics)
    );
  } catch (err) {
    console.warn("Failed to persist lyrics to localStorage:", err);
  }
}

export interface CleanedTrackMetadata {
  cleanTitle: string;
  cleanArtist: string;
  primaryArtist: string;
  featuredArtists: string[];
  queries: string[];
  exactPairs: Array<{ artist: string; title: string }>;
}

/**
 * Cleans web advertising watermarks and promo links from lyrics while preserving actual verses
 */
export function cleanSpamFromLyrics(raw: string): string {
  if (!raw) return "";
  const lines = raw.split(/\r?\n/);
  const spamPatterns = [
    /دانلود\s+(?:آهنگ|موزیک|نوحه|مداحی|ترانه|آلبوم)/i,
    /کانال\s+(?:تلگرام|رسمی|ایتا)/i,
    /telegram\.me|t\.me/i,
    /www\.[a-z0-9\-]+\.[a-z]{2,6}/i,
    /[a-z0-9\-]+\.(?:ir|com|org|net|biz|cc|me)\b/i,
    /کیفیت\s+(?:۳۲۰|۱۲۸|320|128)/i,
    /رسانه\s+(?:موزیک|موزیکفا|آپ\s*موزیک|پاپ\s*موزیک|نکس\s*وان|رادیوجوان)/i,
    /radio\s*javan|bia2music|musicfa|nex1music|nex1|pop-music/i,
  ];

  const cleaned = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return !spamPatterns.some((pat) => pat.test(trimmed));
  });

  return cleaned.join("\n").trim();
}

/**
 * Detects whether an embedded file lyric tag is ONLY an ad / website watermark / useless spam
 */
export function isSpamOrBogusLyrics(content: string): boolean {
  if (!content) return true;
  const trimmed = content.trim();
  if (trimmed.length < 15) return true;

  // If it contains timed timestamps like [00:12.34], it is almost certainly a legitimate synced lyric
  const hasTimestamps = /\[\d{1,2}:\d{2}/.test(trimmed);
  if (hasTimestamps) return false;

  const cleaned = cleanSpamFromLyrics(trimmed);
  // If after stripping ads, we still have reasonable poetry/lyrics text (> 20 chars), it's legitimate!
  if (cleaned.length >= 20) {
    return false;
  }

  return true;
}

/**
 * Converts VTT / TimedText caption strings to standard LRC format
 */
export function convertVttToLrc(vttText: string): string {
  const lines = vttText.split("\n");
  const lrcLines: string[] = [];
  const timeRegex = /(\d{2}):(\d{2}):(\d{2})[.,](\d{2,3}) --> (\d{2}):(\d{2}):(\d{2})[.,](\d{2,3})/;

  for (let i = 0; i < lines.length; i++) {
    const match = timeRegex.exec(lines[i]);
    if (match) {
      const min = parseInt(match[1]) * 60 + parseInt(match[2]);
      const sec = match[3];
      const ms = match[4].slice(0, 2);
      const minStr = String(min).padStart(2, "0");
      const text = (lines[i + 1] || "").trim();
      if (text && !text.startsWith("WEBVTT") && !text.startsWith("NOTE")) {
        lrcLines.push(`[${minStr}:${sec}.${ms}] ${text}`);
      }
    }
  }
  return lrcLines.join("\n");
}

/**
 * Searches public YouTube mirrors for timed video subtitles/captions
 */
export async function fetchYouTubeCaptions(track: Track): Promise<LyricsData | null> {
  const { cleanTitle, primaryArtist } = extractCleanMetadata(track);
  const queryStr = primaryArtist && cleanTitle ? `${primaryArtist} ${cleanTitle}` : cleanTitle || track.title;
  if (!queryStr) return null;

  const instances = [
    "https://inv.nadeko.net",
    "https://yewtu.be",
    "https://invidious.jing.rocks",
    "https://yt.artemislena.eu",
    "https://invidious.nerdvpn.de",
  ];

  for (const instance of instances) {
    try {
      const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(queryStr)}&type=video`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(searchUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const videoId = list[0].videoId;
          if (videoId) {
            const captionRes = await fetch(`${instance}/api/v1/captions/${videoId}`);
            if (captionRes.ok) {
              const capData = await captionRes.json();
              if (capData && Array.isArray(capData.captions) && capData.captions.length > 0) {
                const chosen =
                  capData.captions.find((c: any) => c.languageCode === "fa" || c.languageCode === "en") ||
                  capData.captions[0];
                if (chosen && chosen.url) {
                  const subRes = await fetch(`${instance}${chosen.url}`);
                  if (subRes.ok) {
                    const vtt = await subRes.text();
                    const lrc = convertVttToLrc(vtt);
                    if (lrc.length > 30) {
                      const data = parseLrc(lrc, "lrclib");
                      data.title = track.title;
                      data.artist = track.artist;
                      saveLyricsToCache(track, data);
                      return data;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Try next instance
    }
  }

  return null;
}

export function normalizePersianText(str: string): string {
  if (!str) return "";
  return str
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u200C/g, " ") // replace half-space (ZWNJ) with space for broad index matching
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Intelligent Music Title & Artist Cleaner:
 * - Separates primary artist from featured artists (Ft., Feat., Featuring, &, x, با همکاری, به همراه, etc.)
 * - Cleans titles containing (Ft. ...), [Feat ...], remixes, bitrates, web links, track numbers
 * - Generates high-probability exact matching pairs and fuzzy queries
 */
export function extractCleanMetadata(track: Track): CleanedTrackMetadata {
  let title = (track.title || "").trim();
  let artist = (track.artist || "").trim();

  // If title is missing or generic, fallback to filename
  if (
    !title ||
    title.toLowerCase() === "unknown" ||
    title.toLowerCase() === "track" ||
    title.toLowerCase() === "untitled"
  ) {
    const filename = track.path ? track.path.split(/[/\\]/).pop() || "" : "";
    title = filename.replace(/\.[^/.]+$/, "");
  }

  // Replace underscores and extra hyphens with spaces
  title = title.replace(/_+/g, " ");
  artist = artist.replace(/_+/g, " ");

  // Remove common website advertising, web links, audio bitrates & tags
  const noisePatterns = [
    /https?:\/\/\S+/gi,
    /www\.[a-z0-9\-]+\.[a-z]{2,6}/gi,
    /[a-z0-9\-]+\.(com|ir|org|net|co|biz|info|cc|me)/gi,
    /\[(?:320|128|flac|hq|hd|remix|official|video|audio|lyrics|lyric video|radio javan|musicfa|upmusic|nex1|pop-music)\]/gi,
    /\((?:320|128|flac|hq|hd|remix|official|video|audio|lyrics|lyric video|radio javan|musicfa|upmusic|nex1|pop-music)\)/gi,
    /\b(?:320kbps|128kbps|320|128|flac|lossless|cd-rip|mp3)\b/gi,
    /\b(?:official video|official audio|music video|lyric video|official lyrics|full audio|original track|video clip)\b/gi,
    /\.(mp3|wav|flac|m4a|ogg|aac|opus|wma)$/gi,
  ];

  for (const pat of noisePatterns) {
    title = title.replace(pat, " ");
    artist = artist.replace(pat, " ");
  }

  // Strip leading track numbers e.g. "01. ", "01 - ", "1. ", "1 - ", "01 "
  title = title.replace(/^\s*\d{1,3}\s*[\.\-_]\s*/, "");
  title = title.replace(/^\s*\d{1,3}\s+/, "");

  // If artist is missing or generic, attempt to parse "Artist - Title" or "Artist – Title"
  if (!artist || artist === "Unknown Artist" || artist === "Unknown") {
    const splitMatch = title.split(/\s*[-–—]\s*/);
    if (splitMatch.length >= 2) {
      artist = splitMatch[0].trim();
      title = splitMatch.slice(1).join(" - ").trim();
    }
  }

  // ── Extract Featured Artists from Title ──
  // Matches "(Ft. Sina Sarlak)", "[Feat Post Malone]", "(با همکاری سینا سرلک)"
  const featuredArtists: string[] = [];
  const titleFeatPattern =
    /\s*[\(\[\{]\s*(?:ft\.?|feat\.?|featuring|with|با\s*همکاری|با\s*همراهی|به\s*همراه|با\s*حضور)\s+([^\)\]\}]+)[\)\]\}]/gi;

  let featMatch;
  while ((featMatch = titleFeatPattern.exec(title)) !== null) {
    if (featMatch[1]) {
      const names = featMatch[1].split(/\s*(?:&|x|X|,|\/|و)\s*/).map((n) => n.trim()).filter(Boolean);
      featuredArtists.push(...names);
    }
  }
  title = title.replace(titleFeatPattern, " ").trim();

  // Also check "Title - Ft Artist"
  const titleDashFeat = /\s*[-–—]\s*(?:ft\.?|feat\.?|featuring|with)\s+(.+)$/gi;
  const dashMatch = titleDashFeat.exec(title);
  if (dashMatch && dashMatch[1]) {
    const names = dashMatch[1].split(/\s*(?:&|x|X|,|\/|و)\s*/).map((n) => n.trim()).filter(Boolean);
    featuredArtists.push(...names);
    title = title.replace(titleDashFeat, " ").trim();
  }

  // ── Extract Featured Artists from Artist Field ──
  // Splits "Mohsen Chavoshi Ft. Sina Sarlak", "Shayea x Mehrad Hidden", "Ebi & Siavash"
  let primaryArtist = artist;
  const artistFeatPattern =
    /\s+(?:ft\.?|feat\.?|featuring|with|&|x|X|vs\.?|با\s*همکاری|به\s*همراه|با\s*همراهی|با\s*حضور|\/|,)\s+/i;

  if (artistFeatPattern.test(artist)) {
    const parts = artist.split(artistFeatPattern).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      primaryArtist = parts[0];
      featuredArtists.push(...parts.slice(1));
    }
  }

  // Cleanup whitespace
  title = title.replace(/\s+/g, " ").trim();
  artist = artist.replace(/\s+/g, " ").trim();
  primaryArtist = primaryArtist.replace(/\s+/g, " ").trim();

  if (artist === "Unknown Artist" || artist === "Unknown") {
    artist = "";
    primaryArtist = "";
  }

  // Deduplicate featured artists and remove primary
  const uniqueFeatured = Array.from(new Set(featuredArtists))
    .filter((f) => f && f.toLowerCase() !== primaryArtist.toLowerCase());

  // ── Build Exact Matching Pairs for LRCLIB / Providers ──
  const exactPairs: Array<{ artist: string; title: string }> = [];

  // 1. Primary Artist + Clean Title (Highest success rate)
  if (primaryArtist && title) {
    exactPairs.push({ artist: primaryArtist, title });
  }

  // 2. Full Artist String + Clean Title
  if (artist && artist !== primaryArtist && title) {
    exactPairs.push({ artist, title });
  }

  // 3. Featured Artist + Clean Title
  for (const feat of uniqueFeatured) {
    if (feat && title) {
      exactPairs.push({ artist: feat, title });
    }
  }

  // 4. Reversed: Title as Artist, Artist as Title (common mis-tagging)
  if (primaryArtist && title && primaryArtist.length < 30) {
    exactPairs.push({ artist: title, title: primaryArtist });
  }

  // ── Build Fuzzy Queries in Priority Order ──
  const queries: string[] = [];

  if (primaryArtist && title) {
    queries.push(`${primaryArtist} ${title}`);
    queries.push(`${title} ${primaryArtist}`);
  }

  if (uniqueFeatured.length > 0 && primaryArtist && title) {
    queries.push(`${primaryArtist} ${uniqueFeatured[0]} ${title}`);
  }

  if (title) {
    queries.push(title);
  }

  // Persian normalized variants
  const normTitle = normalizePersianText(title);
  const normPrimary = normalizePersianText(primaryArtist);
  if (normTitle !== title || normPrimary !== primaryArtist) {
    if (normPrimary && normTitle) {
      queries.push(`${normPrimary} ${normTitle}`);
    }
    if (normTitle) {
      queries.push(normTitle);
    }
  }

  // Raw title fallback
  const rawClean = track.title.replace(/\.[^/.]+$/, "").trim();
  if (rawClean && !queries.includes(rawClean)) {
    queries.push(rawClean);
  }

  return {
    cleanTitle: title,
    cleanArtist: artist,
    primaryArtist,
    featuredArtists: uniqueFeatured,
    queries: Array.from(new Set(queries.filter((q) => q.length > 1))),
    exactPairs,
  };
}

export async function fetchLyricsForTrack(
  track: Track,
  forceOnline: boolean = false
): Promise<LyricsData | null> {
  // 0. Check Persistent Local & In-Memory Cache first (Zero network bandwidth unless forceOnline)
  if (!forceOnline) {
    const cached = getCachedLyrics(track);
    if (cached) {
      return cached;
    }
  }

  // 1. Check built-in sample track demo lyrics
  if (!forceOnline) {
    const titleLow = track.title.toLowerCase();
    const pathLow = (track.path || "").toLowerCase();
    for (const [sampleKey, lrcContent] of Object.entries(SAMPLE_TRACK_LYRICS)) {
      const kLow = sampleKey.toLowerCase();
      if (titleLow.includes(kLow) || pathLow.includes(kLow)) {
        const data = parseLrc(lrcContent, "sample");
        data.title = track.title;
        data.artist = track.artist;
        saveLyricsToCache(track, data);
        return data;
      }
    }
  }

  // 2. Check native Tauri backend (companion .lrc file or embedded ID3 tags)
  if (!forceOnline && isTauri() && track.path) {
    try {
      const res = await invoke<TauriTrackLyrics | null>("get_track_lyrics", {
        path: track.path,
      });
      if (res) {
        const rawContent = res.synced || res.plain;
        // Verify that the local tag is not purely an ad/watermark
        if (rawContent && !isSpamOrBogusLyrics(rawContent)) {
          const cleanedContent = cleanSpamFromLyrics(rawContent);
          const finalContent = cleanedContent.length >= 20 ? cleanedContent : rawContent;
          const data = parseLrc(
            finalContent,
            res.source as LyricsData["source"]
          );
          data.title = track.title;
          data.artist = track.artist;
          saveLyricsToCache(track, data);
          return data;
        } else if (rawContent) {
          console.info("[Chavosh] Local embedded lyric tag identified as spam/watermark, falling back to online search:", rawContent.slice(0, 35));
        }
      }
    } catch (e) {
      console.warn("Failed to query native lyrics from Tauri:", e);
    }
  }

  // 3. Automated Online Search using Featuring-Aware Parsing
  const metadata = extractCleanMetadata(track);
  const { cleanTitle, primaryArtist, exactPairs, queries } = metadata;

  // A. Try exact match on LRCLIB using candidate artist/title pairs
  for (const pair of exactPairs) {
    try {
      const params = new URLSearchParams({
        track_name: pair.title,
        artist_name: pair.artist,
      });
      if (track.duration > 0) {
        params.append("duration", Math.round(track.duration).toString());
      }
      if (track.album && track.album !== "Unknown Album") {
        params.append("album_name", track.album);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
        headers: { "User-Agent": "Chavosh Music Player v1.0.0" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const item = await res.json();
        if (item.syncedLyrics) {
          const data = parseLrc(item.syncedLyrics, "lrclib");
          data.title = track.title;
          data.artist = track.artist;
          saveLyricsToCache(track, data);
          return data;
        }
        if (item.plainLyrics) {
          const data = parseLrc(item.plainLyrics, "lrclib");
          data.title = track.title;
          data.artist = track.artist;
          saveLyricsToCache(track, data);
          return data;
        }
      }
    } catch {
      // Try next exact pair
    }
  }

  // B. Iterate through auto-generated queries on LRCLIB Search
  for (const q of queries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`,
        {
          headers: { "User-Agent": "Chavosh Music Player v1.0.0" },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (searchRes.ok) {
        const list = await searchRes.json();
        if (Array.isArray(list) && list.length > 0) {
          // Find first result with syncedLyrics, or fallback to first plain
          const bestSynced = list.find((it: any) => it.syncedLyrics);
          const chosen = bestSynced || list[0];

          if (chosen.syncedLyrics) {
            const data = parseLrc(chosen.syncedLyrics, "lrclib");
            data.title = track.title;
            data.artist = track.artist;
            saveLyricsToCache(track, data);
            return data;
          }
          if (chosen.plainLyrics) {
            const data = parseLrc(chosen.plainLyrics, "lrclib");
            data.title = track.title;
            data.artist = track.artist;
            saveLyricsToCache(track, data);
            return data;
          }
        }
      }
    } catch {
      // Try next query
    }
  }

  // C. Fallback: Query lyrics.ovh (clean plain lyrics) with primary artist
  if (primaryArtist && cleanTitle) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const ovhRes = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTitle)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics && ovhData.lyrics.trim()) {
          const data = parseLrc(ovhData.lyrics, "lrclib");
          data.title = track.title;
          data.artist = track.artist;
          saveLyricsToCache(track, data);
          return data;
        }
      }
    } catch {
      // Final fallback reached
    }
  }

  // D. Fallback: Query YouTube timed subtitles/captions
  try {
    const ytData = await fetchYouTubeCaptions(track);
    if (ytData) {
      saveLyricsToCache(track, ytData);
      return ytData;
    }
  } catch {
    // End of pipeline
  }

  return null;
}
