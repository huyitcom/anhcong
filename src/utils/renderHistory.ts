export interface RenderHistoryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  templateName: string;
  resolution: string;
  timestamp: string;
  type: 'background' | 'lighting' | 'shadow';
  prompt?: string;
}

const STORAGE_KEY = 'ai_render_history_v1';

export function saveRenderToHistory(item: Omit<RenderHistoryItem, 'id'>): void {
  try {
    const existing = getRenderHistory();
    const newItem: RenderHistoryItem = {
      id: `render_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...item,
    };
    // Keep last 30 renders and avoid exact duplicates at top
    const updated = [newItem, ...existing.filter((i) => i.imageUrl !== item.imageUrl)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[RenderHistory] Failed to save to local storage:', e);
  }
}

export function getRenderHistory(): RenderHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearRenderHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[RenderHistory] Failed to clear local history:', e);
  }
}
