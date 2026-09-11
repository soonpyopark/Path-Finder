export const PANEL_THEME_IDS = ["navy", "forest", "wine", "indigo"] as const;

export type PanelThemeId = (typeof PANEL_THEME_IDS)[number];

export const PANEL_THEMES: Array<{
  id: PanelThemeId;
  label: string;
  swatch: string;
}> = [
  { id: "navy", label: "네이비", swatch: "#3b82f6" },
  { id: "forest", label: "포레스트", swatch: "#0f766e" },
  { id: "wine", label: "와인", swatch: "#e11d48" },
  { id: "indigo", label: "인디고", swatch: "#6366f1" },
];

export const DEFAULT_PANEL_THEME: PanelThemeId = "navy";
export const PANEL_THEME_STORAGE_KEY = "path-finder-panel-theme";

export function isPanelThemeId(value: string | null): value is PanelThemeId {
  return PANEL_THEME_IDS.some((id) => id === value);
}
