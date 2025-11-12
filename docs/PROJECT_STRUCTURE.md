# Project Structure

This document explains the folder structure of the Waterways project and what goes where.

## Root Level

```
waterways/
├── apps/              # Application packages (mobile & web)
├── packages/          # Shared packages and libraries
├── docs/              # Project documentation
├── supabase/          # Supabase backend configuration
├── tests/             # Integration and E2E tests
├── node_modules/      # Dependencies (auto-generated)
├── package.json       # Root package configuration
├── tsconfig.json      # TypeScript configuration
├── jest.config.js     # Jest testing configuration
├── eslint.config.js   # ESLint configuration
└── yarn.lock          # Dependency lock file
```

## Apps Directory (`/apps`)

Contains the actual applications that users interact with.

### Mobile App (`/apps/mobile`)

React Native application for iOS and Android.

```
mobile/
├── src/
│   ├── components/    # React Native UI components specific to mobile
│   ├── screens/       # Screen components (pages/views)
│   ├── navigation/    # Navigation configuration (React Navigation)
│   ├── services/      # Mobile-specific services (camera, location, etc.)
│   ├── hooks/         # Custom React hooks for mobile
│   ├── utils/         # Utility functions specific to mobile
│   ├── types/         # TypeScript type definitions for mobile
│   ├── constants/     # Constants and configuration for mobile
│   └── assets/        # Images, fonts, and other static assets
│       ├── images/    # Image files
│       └── fonts/     # Font files
├── App.tsx            # Root mobile application component
├── index.ts           # Entry point
├── app.json           # Expo/React Native configuration
├── package.json       # Mobile app dependencies
└── tsconfig.json      # Mobile TypeScript config
```

**What goes in mobile:**
- **components/**: Reusable UI components like buttons, cards, lists (mobile-specific styling)
- **screens/**: Full screen components like HomeScreen, MapScreen, ProfileScreen
- **navigation/**: Stack navigators, tab navigators, navigation config
- **services/**: Camera access, GPS, push notifications, device-specific APIs
- **hooks/**: useLocation, useCamera, usePushNotifications
- **utils/**: Mobile-specific helpers, formatters, validators
- **types/**: Type definitions for navigation props, screen params
- **constants/**: Colors, dimensions, API endpoints, config values
- **assets/**: App icons, splash screens, images, custom fonts

### Web App (`/apps/web`)

React web application.

```
web/
├── src/
│   ├── components/    # React UI components specific to web
│   ├── pages/         # Page components (routes)
│   ├── services/      # Web-specific services (analytics, auth, etc.)
│   ├── hooks/         # Custom React hooks for web
│   ├── utils/         # Utility functions specific to web
│   ├── types/         # TypeScript type definitions for web
│   ├── constants/     # Constants and configuration for web
│   ├── styles/        # Global styles, themes, CSS/SCSS files
│   └── assets/        # Images, fonts, and other static assets
│       ├── images/    # Image files
│       └── fonts/     # Font files
├── App.tsx            # Root web application component
├── index.ts           # Entry point
├── app.json           # Web app configuration
├── package.json       # Web app dependencies
└── tsconfig.json      # Web TypeScript config
```

**What goes in web:**
- **components/**: Reusable UI components (web-specific styling with responsive design)
- **pages/**: Full page components like HomePage, MapPage, ProfilePage
- **services/**: Analytics, SEO, web-specific APIs, local storage
- **hooks/**: useMediaQuery, useLocalStorage, useDebounce
- **utils/**: Web-specific helpers, URL parsing, browser APIs
- **types/**: Type definitions for routes, API responses
- **constants/**: Breakpoints, colors, API endpoints, config
- **styles/**: Global CSS, theme files, styled-components themes
- **assets/**: Favicons, images, web fonts, SVGs

## Packages Directory (`/packages`)

Contains shared code that can be used by multiple applications.

### Shared Package (`/packages/shared`)

Common code shared between mobile and web applications.

```
shared/
├── src/
│   ├── components/    # Platform-agnostic UI components
│   ├── services/      # Business logic and API services
│   ├── hooks/         # Reusable React hooks
│   ├── utils/         # Helper functions and utilities
│   ├── types/         # Shared TypeScript type definitions
│   ├── constants/     # Shared constants and enums
│   └── api/           # API client and endpoint definitions
├── dist/              # Compiled output (auto-generated)
├── package.json       # Shared package dependencies
└── tsconfig.json      # Shared TypeScript config
```

**What goes in shared:**
- **components/**: Truly reusable components that work on both platforms (business logic components)
- **services/**: API calls, data fetching, business logic, state management
- **hooks/**: useAuth, useData, useForm, useFetch (platform-agnostic)
- **utils/**: Date formatters, validators, parsers, converters
- **types/**: Data models (User, WaterQuality, Location), API response types
- **constants/**: API base URLs, error messages, status codes, enums
- **api/**: Axios/fetch configurations, API client, endpoint definitions

## Other Directories

### Documentation (`/docs`)

Project documentation including:
- Architecture decisions
- API documentation
- Setup guides
- This structure document

### Supabase (`/supabase`)

Backend configuration for Supabase:
- Database migrations
- Functions
- Storage policies
- Authentication config

### Tests (`/tests`)

Cross-application integration and end-to-end tests:
- E2E test suites
- Integration tests
- Test utilities and fixtures

## Best Practices

### When to Put Code in Shared vs App-Specific

**Use `/packages/shared` when:**
- Code is used by both mobile and web
- Business logic that doesn't depend on platform-specific features
- Data models and API types
- Pure utility functions
- Platform-agnostic state management

**Use app-specific folders when:**
- Code uses platform-specific APIs (camera, GPS, DOM, etc.)
- UI components with platform-specific styling
- Navigation/routing logic
- Platform-specific optimizations
- Different UX patterns between platforms

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`, `MapView.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`, `useLocation.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `User.ts`, `ApiResponse.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`, `MAX_RETRIES`)

### File Organization

- Keep files focused and single-purpose
- Group related files in subdirectories when a folder gets too large
- Use index files to simplify imports
- Co-locate tests with source files or in `__tests__` directories

### Import Guidelines

```typescript
// Import from shared package
import { useAuth, formatDate } from '@waterways/shared';

// App-specific imports
import { HomeScreen } from './screens/HomeScreen';
import { theme } from './constants/theme';
```

## Adding New Features

When adding a new feature, ask yourself:

1. **Is this feature platform-specific?** → Put in respective app folder
2. **Does it interact with device hardware?** → Put in app-specific services
3. **Is it business logic or data processing?** → Put in shared/services
4. **Is it a reusable UI component?** → Consider if it needs platform-specific styling
5. **Is it a type definition for API data?** → Put in shared/types

## Questions?

If you're unsure where to put something, consider:
- Will another app need this exact code?
- Does this depend on platform-specific APIs?
- Is this business logic or presentation logic?

When in doubt, start app-specific and refactor to shared when you need it elsewhere.
