export interface Novel {
  id: number;
  title: string;
  author: string;
  description: string | null;
  status: "pending" | "translating" | "completed" | "error";
  total_chapters: number;
  translated_chapters: number;
  created_at: string;
  updated_at: string;
}

export interface NovelListResponse {
  novels: Novel[];
  total: number;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  content_cn: string;
  content_vi: string | null;
  status: "pending" | "translating" | "completed" | "error";
  created_at: string;
  updated_at: string;
}

export interface ChapterListItem {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  status: "pending" | "translating" | "completed" | "error";
  created_at: string;
}

export interface ChapterListResponse {
  chapters: ChapterListItem[];
  total: number;
}

export interface ChapterNavigation {
  current: Chapter;
  prev_id: number | null;
  next_id: number | null;
}

export interface CharacterMap {
  id: number;
  novel_id: number;
  cn_name: string;
  vi_name: string;
  created_at: string;
}

export interface CharacterMapListResponse {
  characters: CharacterMap[];
  total: number;
}

export interface TranslationStatus {
  novel_id: number;
  novel_title: string;
  status: string;
  total_chapters: number;
  translated_chapters: number;
  pending_chapters: number;
  translating_chapters: number;
  error_chapters: number;
}

export interface CrawlLatestChapterResponse {
  message: string;
  novel_id: number;
  chapter_id: number;
  chapter_number: number;
  title: string;
  created: boolean;
  translation_started: boolean;
}
