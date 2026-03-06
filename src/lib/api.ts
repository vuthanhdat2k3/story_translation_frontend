import {
  Novel,
  NovelListResponse,
  ChapterListResponse,
  ChapterNavigation,
  CharacterMap,
  CharacterMapListResponse,
  TranslationStatus,
  Chapter,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ── Novel API ──────────────────────────────────────────────
export async function fetchNovels(skip = 0, limit = 20): Promise<NovelListResponse> {
  return fetchAPI<NovelListResponse>(`/api/novels?skip=${skip}&limit=${limit}`);
}

export async function fetchNovel(id: number): Promise<Novel> {
  return fetchAPI<Novel>(`/api/novels/${id}`);
}

export async function createNovel(payload: { title: string; author: string; description?: string }): Promise<Novel> {
  return fetchAPI<Novel>("/api/novels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadChapters(novelId: number, formData: FormData): Promise<Novel> {
  return fetchAPI<Novel>(`/api/novels/${novelId}/chapters/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function pasteChapters(novelId: number, payload: { text: string; auto_translate: boolean }): Promise<Novel> {
  return fetchAPI<Novel>(`/api/novels/${novelId}/chapters/paste`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteNovel(id: number): Promise<void> {
  await fetchAPI(`/api/novels/${id}`, { method: "DELETE" });
}

// ── Chapter API ────────────────────────────────────────────
export async function fetchChapters(novelId: number): Promise<ChapterListResponse> {
  return fetchAPI<ChapterListResponse>(`/api/novels/${novelId}/chapters`);
}

export async function fetchChapter(id: number): Promise<Chapter> {
  return fetchAPI<Chapter>(`/api/chapters/${id}`);
}

export async function fetchChapterNavigation(id: number): Promise<ChapterNavigation> {
  return fetchAPI<ChapterNavigation>(`/api/chapters/${id}/navigate`);
}

export async function deleteChapter(id: number): Promise<void> {
  await fetchAPI(`/api/chapters/${id}`, { method: "DELETE" });
}

export async function retranslateChapter(id: number): Promise<{ message: string }> {
  return fetchAPI(`/api/translate/chapter/${id}/retranslate`, { method: "POST" });
}

// ── Translation API ────────────────────────────────────────
export async function startNovelTranslation(novelId: number): Promise<{ message: string }> {
  return fetchAPI(`/api/translate/novel/${novelId}`, { method: "POST" });
}

export async function startChapterTranslation(chapterId: number): Promise<{ message: string }> {
  return fetchAPI(`/api/translate/chapter/${chapterId}`, { method: "POST" });
}

export async function fetchTranslationStatus(novelId: number): Promise<TranslationStatus> {
  return fetchAPI<TranslationStatus>(`/api/translate/status/${novelId}`);
}

// ── Character Map API ──────────────────────────────────────
export async function fetchCharacterMaps(novelId: number): Promise<CharacterMapListResponse> {
  return fetchAPI<CharacterMapListResponse>(`/api/novels/${novelId}/characters`);
}

export async function createCharacterMap(
  novelId: number,
  data: { cn_name: string; vi_name: string }
): Promise<CharacterMap> {
  return fetchAPI<CharacterMap>(`/api/novels/${novelId}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateCharacterMap(
  id: number,
  data: { cn_name?: string; vi_name?: string }
): Promise<CharacterMap> {
  return fetchAPI<CharacterMap>(`/api/characters/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteCharacterMap(id: number): Promise<void> {
  await fetchAPI(`/api/characters/${id}`, { method: "DELETE" });
}
