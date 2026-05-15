export const QUALITY_MODES = [
  {
    id: "fast",
    name: "Fast",
    description: "Quick generation with shorter outputs.",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Higher quality and more detailed outputs.",
  },
  {
    id: "viral",
    name: "Viral",
    description: "Aggressive hooks and engagement optimization.",
  },
] as const;

export type QualityModeId = (typeof QUALITY_MODES)[number]["id"];

export const DEFAULT_QUALITY_MODE: QualityModeId = "premium";

export function isQualityMode(value: unknown): value is QualityModeId {
  return QUALITY_MODES.some((mode) => mode.id === value);
}