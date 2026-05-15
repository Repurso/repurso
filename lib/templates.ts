export const PROMPT_TEMPLATES = [
  {
    id: "general",
    name: "General Repurpose",
    description: "Turn your content into platform-ready posts.",
  },
  {
    id: "linkedin-authority",
    name: "LinkedIn Authority",
    description: "Create a polished expert-style LinkedIn presence.",
  },
  {
    id: "viral-short-form",
    name: "Viral Short-Form",
    description: "Make your content punchy, fast, and scroll-stopping.",
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "Position your offer clearly and persuasively.",
  },
  {
    id: "educational-content",
    name: "Educational Content",
    description: "Explain ideas clearly with practical takeaways.",
  },
] as const;

export type PromptTemplateId = (typeof PROMPT_TEMPLATES)[number]["id"];

export const DEFAULT_PROMPT_TEMPLATE_ID: PromptTemplateId = "general";

export function isPromptTemplateId(value: unknown): value is PromptTemplateId {
  return PROMPT_TEMPLATES.some((template) => template.id === value);
}

export function getPromptTemplateName(templateId: PromptTemplateId): string {
  return (
    PROMPT_TEMPLATES.find((template) => template.id === templateId)?.name ??
    "General Repurpose"
  );
}