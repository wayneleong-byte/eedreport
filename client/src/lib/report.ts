import { createContext, useContext } from "react";
import type { Section, ItemView } from "@shared/schema";

export interface ReportData {
  sections: Section[];
  items: ItemView[];
}

// Edit-secret context: held only in React memory. Never persisted to
// localStorage / sessionStorage / cookies.
export interface EditAuthState {
  secret: string | null;
  setSecret: (s: string | null) => void;
  isEditor: boolean;
}

export const EditAuthContext = createContext<EditAuthState>({
  secret: null,
  setSecret: () => {},
  isEditor: false,
});

export function useEditAuth() {
  return useContext(EditAuthContext);
}

export function authHeaders(secret: string | null): Record<string, string> {
  return secret ? { "x-edit-secret": secret } : {};
}

export function itemsForSection(data: ReportData | undefined, sectionId: number): ItemView[] {
  if (!data) return [];
  return data.items
    .filter((i) => i.sectionId === sectionId)
    .sort((a, b) => a.position - b.position || a.id - b.id);
}

export function emptyItem(sectionId: number): Omit<ItemView, "id"> {
  return {
    sectionId,
    title: "",
    meta: "",
    description: "",
    status: "",
    images: [],
    audioUrl: "",
    videoUrl: "",
    attachmentUrl: "",
    position: 999,
  };
}

export const AUDIO_PLACEHOLDER =
  "尚未加入聲音檔；在 EDITOR 填入 MP3 連結後會在此直接播放。";
export const IMAGE_PLACEHOLDER =
  "尚未加入相片，可於 EDITOR 補上 最多 8 張圖片網址、聲音或影片連結。";
