export const ROUTES = {
  splash: '/' as any,
  login: '/login' as any,
  home: '/home' as any,
  signup: '/signup' as any,
  resetPassword: '/resetPassword' as any,
  map: '/map' as any,
  instruction: '/instruction' as any,
  settings: '/settings' as any,
  journey: '/journey' as any,
  review: '/review' as any,
  drafts: '/drafts' as any,
  projects: '/projects' as any,
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
