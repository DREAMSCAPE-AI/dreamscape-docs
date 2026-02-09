# i18n Architecture Guide

**Document Type**: Developer Guide
**Version**: 1.0
**Last Updated**: 2025-02-06
**Target Audience**: Frontend Developers, Technical Writers

## Overview

DreamScape's web client implements comprehensive internationalization (i18n) using react-i18next, supporting French (FR) and English (EN) with an extensible architecture for additional languages.

**Current Languages**:
- English (en) - Default
- French (fr) - Français

**Key Features**:
- Lazy-loaded translation namespaces
- Automatic language detection from browser
- Persistent language preference in localStorage
- Real-time language switching without page reload
- Backend synchronization of user language preference
- Document-level language attribute synchronization

## Architecture

### Core Libraries

```json
{
  "i18next": "^23.7.6",
  "react-i18next": "^13.5.0",
  "i18next-browser-languagedetector": "^7.2.0",
  "i18next-http-backend": "^2.4.2"
}
```

**Library Responsibilities**:
- `i18next`: Core i18n engine with interpolation, pluralization, and nesting
- `react-i18next`: React bindings with hooks and HOC
- `i18next-browser-languagedetector`: Automatic language detection from browser/localStorage
- `i18next-http-backend`: Lazy-loading of translation files via HTTP

### Configuration

**Location**: `dreamscape-frontend/web-client/src/i18n/index.ts`

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    ns: [
      'common',      // Global UI elements
      'auth',        // Login, register, password reset
      'dashboard',   // User dashboard
      'flights',     // Flight search and results
      'hotels',      // Hotel search and results
      'destinations',// Destination pages
      'experiences', // Experience pages
      'activities',  // Activity search
      'planner',     // Trip planner
      'settings',    // User settings
      'gdpr',        // GDPR consent and privacy
      'support',     // Help and support
      'onboarding',  // User onboarding
      'about',       // About page
      'checkout',    // Booking checkout
      'bookings',    // Booking management
      'tools',       // Travel tools
      'errors',      // Error messages
    ],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'dreamscape-language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: true, // Enable React Suspense for loading
    },
  });

export default i18n;
```

**Key Configuration Options**:
- `fallbackLng`: Default language when user's preferred language is unavailable
- `supportedLngs`: Whitelist of supported languages (add new languages here)
- `ns`: Namespace list (lazy-loaded on demand)
- `defaultNS`: Namespace used when none specified in `t()` calls
- `backend.loadPath`: URL pattern for loading translation files
- `detection.order`: Priority order for language detection
- `detection.lookupLocalStorage`: localStorage key for persisting language
- `react.useSuspense`: Use React Suspense for loading states

### Entry Point

**Location**: `dreamscape-frontend/web-client/src/main.tsx`

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n'; // ← Initialize i18n BEFORE App
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Important**: The i18n configuration must be imported before the App component to ensure translations are available on initial render.

### Translation File Structure

**Location**: `dreamscape-frontend/web-client/public/locales/{lang}/{namespace}.json`

```
public/locales/
├── en/
│   ├── common.json       (142 lines - nav, hero, footer, buttons)
│   ├── auth.json         (Login, register, password reset)
│   ├── dashboard.json    (User dashboard elements)
│   ├── flights.json      (Flight search and results)
│   ├── hotels.json       (Hotel search and results)
│   ├── destinations.json (Destination pages)
│   ├── experiences.json  (Experience pages)
│   ├── activities.json   (Activity search)
│   ├── planner.json      (Trip planner)
│   ├── settings.json     (User settings)
│   ├── gdpr.json         (GDPR consent and privacy)
│   ├── support.json      (Help and support)
│   ├── onboarding.json   (User onboarding)
│   ├── about.json        (About page)
│   ├── checkout.json     (Booking checkout)
│   ├── bookings.json     (Booking management)
│   ├── tools.json        (Travel tools)
│   └── errors.json       (Error messages)
└── fr/
    └── (same structure)
```

**Namespace Selection Guidelines**:
- `common`: UI elements used across multiple pages (nav, hero, footer, buttons)
- Feature-specific: Use the namespace matching the feature area
- `errors`: All error messages and validation failures
- When in doubt, use `common` for shared elements

### Language Mapping Utilities

**Location**: `dreamscape-frontend/web-client/src/i18n/languageMapping.ts`

```typescript
export const languageCodeToName: Record<string, string> = {
  en: 'English',
  fr: 'French',
};

export const languageNameToCode: Record<string, string> = {
  English: 'en',
  French: 'fr',
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'fr', name: 'Français', flag: 'FR' },
];
```

**Purpose**: Bidirectional mapping between language codes (en/fr) and display names (English/French) for use in UI components and backend communication.

**Usage Example**:
```typescript
import { languageCodeToName, supportedLanguages } from '@/i18n/languageMapping';

// Convert code to name
const displayName = languageCodeToName[i18n.language]; // 'English'

// Use in LanguageSelector
supportedLanguages.map(lang => (
  <option key={lang.code} value={lang.name}>
    {lang.name}
  </option>
))
```

### Language Synchronization Hook

**Location**: `dreamscape-frontend/web-client/src/i18n/useLanguageSync.ts`

```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = 'ltr'; // Future RTL support
  }, [i18n.language]);
}
```

**Purpose**: Synchronizes the HTML document's `lang` attribute with the current i18n language for accessibility and SEO.

**Usage**: Import and call in the root App component:

```typescript
import { useLanguageSync } from '@/i18n/useLanguageSync';

function App() {
  useLanguageSync(); // Automatically syncs document.lang

  return <Router>...</Router>;
}
```

## Developer Usage

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('flights'); // Specify namespace

  return (
    <div>
      <h1>{t('search.title')}</h1>
      <p>{t('search.origin.label')}</p>
    </div>
  );
}
```

**Result** (English):
```html
<div>
  <h1>Find Your Flight</h1>
  <p>From</p>
</div>
```

### Translation with Interpolation

**Translation file** (`public/locales/en/flights.json`):
```json
{
  "search": {
    "passengers": {
      "multiplePassengers": "{{count}} Passengers"
    }
  }
}
```

**Component**:
```tsx
const { t } = useTranslation('flights');

<span>{t('search.passengers.multiplePassengers', { count: 3 })}</span>
// Output: "3 Passengers"
```

**French** (`public/locales/fr/flights.json`):
```json
{
  "search": {
    "passengers": {
      "multiplePassengers": "{{count}} Passagers"
    }
  }
}
```

**Output (French)**: "3 Passagers"

### Multiple Namespaces in One Component

```tsx
const { t } = useTranslation(['flights', 'common']);

<div>
  <h1>{t('search.title')}</h1>          // From 'flights'
  <button>{t('common:buttons.save')}</button>  // From 'common'
</div>
```

**Note**: Use the `namespace:key.path` syntax to explicitly reference a namespace other than the first one in the array.

### Dynamic Translation Keys

```tsx
const status = 'confirmed'; // Dynamic value
const { t } = useTranslation('bookings');

<span>{t(`status.${status}`)}</span>
// Looks up bookings:status.confirmed
```

**Translation file**:
```json
{
  "status": {
    "confirmed": "Confirmed",
    "pending": "Pending",
    "cancelled": "Cancelled"
  }
}
```

### Pluralization

**Translation file**:
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

**Usage**:
```tsx
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 items"
```

**Note**: i18next automatically uses the `_plural` suffix when count !== 1.

### Default Values

```tsx
// Fallback if key is missing
t('missing.key', 'Default text')

// With interpolation
t('missing.key', 'Hello {{name}}', { name: 'John' })
```

**Best Practice**: Avoid using default values in production code. All keys should exist in translation files.

## Components

### LanguageSelector

**Location**: `dreamscape-frontend/web-client/src/components/common/LanguageSelector.tsx`

**Variants**:
1. `compact`: Icon + language code (Header)
2. `full`: Icon + full language name (Footer)
3. `settings`: Dropdown select (Settings page)

**Usage**:

```tsx
import LanguageSelector from '@/components/common/LanguageSelector';

// In Header
<LanguageSelector variant="compact" />

// In Footer
<LanguageSelector variant="full" />

// In Settings page
<LanguageSelector variant="settings" />
```

**Component Features**:
- Click outside to close dropdown (compact/full variants)
- Visual indicator for current language (checkmark)
- Flag emoji indicators (🇺🇸 for English, 🇫🇷 for French)
- Automatic i18n.changeLanguage() call on selection
- Persists selection to localStorage automatically

**Implementation Details**:
```typescript
const handleLanguageChange = (code: string) => {
  i18n.changeLanguage(code); // Updates i18n, triggers re-render
  setIsOpen(false);
};
```

## Language Persistence

### localStorage (Client-Side)

**Key**: `dreamscape-language`
**Managed By**: i18next-browser-languagedetector

**Automatic Behavior**:
1. User selects language via LanguageSelector
2. i18n.changeLanguage(code) is called
3. LanguageDetector automatically saves to localStorage
4. On next page load, LanguageDetector reads from localStorage
5. Language is restored before React renders

**Manual Access** (if needed):
```typescript
// Read
const storedLang = localStorage.getItem('dreamscape-language'); // 'en' | 'fr'

// Write (not recommended, use i18n.changeLanguage instead)
localStorage.setItem('dreamscape-language', 'fr');
```

### Backend Synchronization

**User Profile Field**: `UserSettings.language` (stores language name: "English" or "French")

**Settings Page Flow**:
1. User selects language in SettingsPage
2. Frontend calls `UserService.updateLanguage(languageName)`
3. Backend updates `UserSettings.language` field
4. On login, language is restored from user profile

**Implementation** (from Settings page):
```typescript
import { languageCodeToName, languageNameToCode } from '@/i18n/languageMapping';

// On save
const languageName = languageCodeToName[i18n.language]; // 'English'
await UserService.updateLanguage(languageName);

// On login (restore from profile)
const savedLanguageName = userSettings.language; // 'English'
const languageCode = languageNameToCode[savedLanguageName]; // 'en'
i18n.changeLanguage(languageCode);
```

**Backend Endpoint**:
```
PUT /api/v1/user/settings/language
Content-Type: application/json

{
  "language": "English"
}
```

**Database Model**:
```prisma
model UserSettings {
  id       String @id @default(cuid())
  userId   String @unique
  language String @default("English") // "English" | "French"
  // ...other fields
}
```

## Adding Translation Keys

### Step-by-Step Process

1. **Choose the appropriate namespace**:
   - Common UI element? → `common`
   - Feature-specific? → Use feature namespace (e.g., `flights`, `hotels`)
   - Error message? → `errors`

2. **Add the key to both language files**:

   **English** (`public/locales/en/flights.json`):
   ```json
   {
     "search": {
       "advancedOptions": {
         "directFlightsOnly": "Direct flights only"
       }
     }
   }
   ```

   **French** (`public/locales/fr/flights.json`):
   ```json
   {
     "search": {
       "advancedOptions": {
         "directFlightsOnly": "Vols directs uniquement"
       }
     }
   }
   ```

3. **Use in component**:
   ```tsx
   import { useTranslation } from 'react-i18next';

   function FlightSearch() {
     const { t } = useTranslation('flights');

     return (
       <label>
         <input type="checkbox" />
         {t('search.advancedOptions.directFlightsOnly')}
       </label>
     );
   }
   ```

4. **Test in both languages**:
   - Switch language using LanguageSelector
   - Verify translation appears correctly
   - Check for layout issues (French text is often longer)

### Naming Conventions

**Use dot-separated paths**:
```json
{
  "search": {
    "filters": {
      "price": "Price"
    }
  }
}
```
Access: `t('search.filters.price')`

**Use camelCase for keys**:
```json
{
  "directFlightsOnly": "Direct flights only",
  "nearbyAirports": "Include nearby airports"
}
```

**Group related keys**:
```json
{
  "validation": {
    "enterDeparture": "Please enter a departure city",
    "enterArrival": "Please enter an arrival city",
    "selectDeparture": "Please select a departure date"
  }
}
```

**Use descriptive key names**:
```json
// ❌ Bad
{
  "btn1": "Submit",
  "txt1": "Enter name"
}

// ✅ Good
{
  "submitButton": "Submit",
  "enterNameLabel": "Enter name"
}
```

## Adding a New Language

### 1. Create Translation Files

Create a new folder for the language code:

```bash
mkdir public/locales/de  # German example
```

Copy all 18 namespace files from `en/` or `fr/`:

```bash
cp public/locales/en/*.json public/locales/de/
```

Translate each file:

```json
// public/locales/de/common.json
{
  "nav": {
    "flights": "Flüge",
    "hotels": "Hotels",
    "activities": "Aktivitäten"
  }
}
```

### 2. Update Language Mapping

**File**: `src/i18n/languageMapping.ts`

```typescript
export const languageCodeToName: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German', // ← Add new language
};

export const languageNameToCode: Record<string, string> = {
  English: 'en',
  French: 'fr',
  German: 'de', // ← Add new language
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' }, // ← Add new language
];
```

### 3. Update i18n Configuration

**File**: `src/i18n/index.ts`

```typescript
i18n.init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'de'], // ← Add new language code
  // ...rest of config
});
```

### 4. Update LanguageSelector Component

**File**: `src/components/common/LanguageSelector.tsx`

Add flag emoji mapping if needed:

```typescript
// In the component, update flag display logic
<span className="text-lg">
  {language.flag === 'US' ? '🇺🇸' :
   language.flag === 'FR' ? '🇫🇷' :
   language.flag === 'DE' ? '🇩🇪' : '🌐'}
</span>
```

Or use a more scalable approach with a flag mapping object:

```typescript
const flagEmojis: Record<string, string> = {
  US: '🇺🇸',
  FR: '🇫🇷',
  DE: '🇩🇪',
};

<span className="text-lg">{flagEmojis[language.flag]}</span>
```

### 5. Update Backend (Optional)

If language is stored in user settings, update validation:

```typescript
// Backend validation enum
enum Language {
  ENGLISH = 'English',
  FRENCH = 'French',
  GERMAN = 'German', // ← Add new language
}
```

### 6. Test

1. Clear localStorage: `localStorage.removeItem('dreamscape-language')`
2. Reload page
3. Select new language from LanguageSelector
4. Navigate through all pages to verify translations
5. Check for missing keys (will display key path if missing)

## Best Practices

### 1. Always Provide Translations for All Languages

Every key in `en/` must exist in `fr/` (and vice versa).

**Validation Script** (recommended):
```bash
# Check for missing keys
npm run i18n:validate
```

### 2. Use Namespaces to Reduce Bundle Size

Namespaces are lazy-loaded only when needed.

```tsx
// ❌ Bad: Loads all translations
const { t } = useTranslation();

// ✅ Good: Loads only 'flights' namespace
const { t } = useTranslation('flights');
```

### 3. Avoid Hardcoded Text

```tsx
// ❌ Bad
<button>Submit</button>

// ✅ Good
const { t } = useTranslation('common');
<button>{t('buttons.submit')}</button>
```

### 4. Keep Keys Organized

Use logical nesting to group related translations:

```json
{
  "form": {
    "labels": {
      "email": "Email",
      "password": "Password"
    },
    "validation": {
      "emailRequired": "Email is required",
      "passwordTooShort": "Password must be at least 8 characters"
    }
  }
}
```

### 5. Use Interpolation for Dynamic Content

```tsx
// ❌ Bad: String concatenation
const message = `Welcome back, ${userName}!`;

// ✅ Good: Interpolation
const { t } = useTranslation('common');
const message = t('welcome.message', { userName });
```

**Translation file**:
```json
{
  "welcome": {
    "message": "Welcome back, {{userName}}!"
  }
}
```

### 6. Test Layout with Longer Translations

French text is typically 20-30% longer than English.

**Example**:
- English: "Search" (6 chars)
- French: "Rechercher" (10 chars)

**Solution**: Use flexible layouts (flexbox, grid) and avoid fixed widths:

```css
/* ❌ Bad: Fixed width */
.button {
  width: 100px;
}

/* ✅ Good: Flexible width */
.button {
  padding: 0.5rem 1rem;
  min-width: 100px;
}
```

### 7. Use Suspense for Loading States

The i18n configuration has `react.useSuspense: true`, which means components will suspend while translations load.

**Wrap in Suspense boundary**:
```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Routes />
      </Router>
    </Suspense>
  );
}
```

### 8. Avoid Empty Translation Values

```json
// ❌ Bad
{
  "title": "",
  "subtitle": null
}

// ✅ Good
{
  "title": "Welcome",
  "subtitle": "Your journey starts here"
}
```

## Debugging

### Check Current Language

```tsx
import { useTranslation } from 'react-i18next';

function DebugLanguage() {
  const { i18n } = useTranslation();

  console.log('Current language:', i18n.language); // 'en' | 'fr'
  console.log('Available languages:', i18n.languages); // ['en', 'fr']
  console.log('Loaded namespaces:', i18n.options.ns);

  return null;
}
```

### View Missing Translation Keys

Enable debug mode in development:

**File**: `src/i18n/index.ts`

```typescript
i18n.init({
  debug: process.env.NODE_ENV === 'development', // ← Add this
  // ...rest of config
});
```

**Console output**:
```
i18next::translator: missingKey en common nav.newKey
```

### Force Language for Testing

```tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage('fr'); // Force French for testing
  }, []);

  return <Router>...</Router>;
}
```

### Inspect Translation Files

Open DevTools Network tab and filter by `locales`:

```
Request: /locales/en/flights.json
Status: 200 OK
Response: { "search": { ... } }
```

If a file fails to load, check the file path and JSON syntax.

## Performance Optimization

### Lazy Loading

Namespaces are loaded on-demand when first used:

```tsx
// Only loads 'flights' namespace when FlightSearch renders
function FlightSearch() {
  const { t } = useTranslation('flights');
  return <div>{t('search.title')}</div>;
}
```

### Preload Critical Namespaces

Preload namespaces that are always needed:

```tsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Preload namespaces for faster rendering
    i18n.loadNamespaces(['common', 'auth', 'dashboard']);
  }, []);

  return <Router>...</Router>;
}
```

### Cache Translation Files

Translation files are served from `/public/locales/` and cached by the browser.

**Bust cache on updates**:
- Update translation file
- Build with Vite (generates new hash)
- Browser fetches new file automatically

## Common Issues

### Issue: Translation Not Updating

**Cause**: Browser cached old translation file

**Solution**: Clear cache or hard refresh (Ctrl+Shift+R)

### Issue: Key Not Found

**Symptom**: UI displays `flights:search.title` instead of translated text

**Cause**: Missing key in translation file

**Solution**: Add the key to both `en/` and `fr/` files

### Issue: Interpolation Not Working

**Symptom**: UI displays `Welcome {{userName}}` instead of `Welcome John`

**Cause**: Variable not passed to `t()` function

**Solution**:
```tsx
// ❌ Wrong
t('welcome.message')

// ✅ Correct
t('welcome.message', { userName: 'John' })
```

### Issue: Language Not Persisting

**Cause**: localStorage disabled or blocked

**Solution**: Check browser privacy settings and ensure localStorage is enabled

### Issue: French Text Overflowing

**Cause**: Fixed-width containers

**Solution**: Use flexible layouts and test with both languages

## Related Documentation

- [Translation Workflow Guide](./TRANSLATION_WORKFLOW.md) - For translators and content managers
- [LanguageSelector Component](../../dreamscape-frontend/web-client/src/components/common/LanguageSelector.tsx) - Source code
- [User Settings API](../api/user-service/README.md) - Backend language persistence
- [i18next Documentation](https://www.i18next.com/) - Official i18next docs
- [react-i18next Documentation](https://react.i18next.com/) - React bindings

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-06 | Initial documentation - 18 namespaces, EN/FR support |
