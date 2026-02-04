export const ROUTES = {
  splash: '/' as const,
  login: '/login' as const,
  home: '/home' as const,
  signup: '/signup' as const,
  resetPassword: '/resetPassword' as const,
  map: '/map' as const,
  instruction: '/instruction' as const,
  settings: '/settings' as const,
  journey: '/journey' as const,
  review: '/review' as const,
  drafts: '/drafts' as const,
  projects: '/projects' as const,
};

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
