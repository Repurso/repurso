export const PLAN_LIMITS = {
  free: {
    generations: 20,
    rewrites: 20,
    characters: 2000,
  },

  creator: {
    generations: 300,
    rewrites: 500,
    characters: 5000,
  },

  pro: {
    generations: 1000,
    rewrites: 2000,
    characters: 10000,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.free;
}