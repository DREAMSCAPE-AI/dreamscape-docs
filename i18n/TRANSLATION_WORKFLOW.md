# Translation Workflow Guide

**Document Type**: Translator Guide
**Version**: 1.0
**Last Updated**: 2025-02-06
**Target Audience**: Translators, Content Managers, Localization Teams

## Overview

This guide covers the workflow for adding, editing, and maintaining translations for the DreamScape travel platform. All translations are stored as JSON files with a structured namespace system.

**Supported Languages**:
- English (en) - Primary language
- French (fr) - Français

**Total Namespaces**: 18

## File Locations

**Base Path**: `dreamscape-frontend/web-client/public/locales/`

```
locales/
├── en/                 English translations
│   ├── common.json     Global UI elements (nav, hero, footer, buttons)
│   ├── auth.json       Login, register, password reset
│   ├── dashboard.json  User dashboard
│   ├── flights.json    Flight search and results
│   ├── hotels.json     Hotel search and results
│   ├── destinations.json  Destination pages
│   ├── experiences.json   Experience pages
│   ├── activities.json    Activity search
│   ├── planner.json       Trip planner
│   ├── settings.json      User settings
│   ├── gdpr.json          GDPR consent and privacy
│   ├── support.json       Help and support
│   ├── onboarding.json    User onboarding
│   ├── about.json         About page
│   ├── checkout.json      Booking checkout
│   ├── bookings.json      Booking management
│   ├── tools.json         Travel tools
│   └── errors.json        Error messages
└── fr/                 French translations
    └── (same structure)
```

## Translation File Format

### JSON Structure

All translation files use JSON format with nested key-value pairs.

**Example** (`common.json`):
```json
{
  "nav": {
    "flights": "Flights",
    "hotels": "Hotels",
    "activities": "Activities",
    "userMenu": {
      "profile": "Profile",
      "settings": "Settings",
      "logout": "Logout"
    }
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit"
  }
}
```

### Nested Keys

Use dot-separated paths to organize related translations:

```json
{
  "search": {
    "title": "Find Your Flight",
    "origin": {
      "label": "From",
      "placeholder": "Departure city"
    },
    "destination": {
      "label": "To",
      "placeholder": "Arrival city"
    }
  }
}
```

**Access Path**: `search.origin.label` → "From"

### Key Naming Conventions

**Use camelCase for key names**:
```json
{
  "directFlightsOnly": "Direct flights only",
  "nearbyAirports": "Include nearby airports",
  "departureDate": "Departure Date"
}
```

**Use descriptive names**:
```json
// ❌ Bad
{
  "btn1": "Submit",
  "text1": "Enter name",
  "msg": "Error"
}

// ✅ Good
{
  "submitButton": "Submit",
  "enterNameLabel": "Enter name",
  "errorMessage": "An error occurred"
}
```

**Group related keys**:
```json
{
  "validation": {
    "emailRequired": "Email is required",
    "emailInvalid": "Please enter a valid email",
    "passwordTooShort": "Password must be at least 8 characters",
    "passwordMismatch": "Passwords do not match"
  }
}
```

## Interpolation

### Variable Substitution

Use `{{variableName}}` syntax for dynamic content that gets replaced at runtime.

**English** (`flights.json`):
```json
{
  "search": {
    "passengers": {
      "multiplePassengers": "{{count}} Passengers"
    }
  }
}
```

**French** (`flights.json`):
```json
{
  "search": {
    "passengers": {
      "multiplePassengers": "{{count}} Passagers"
    }
  }
}
```

**Important**: Variable names must match exactly between languages.

### Common Variables

| Variable | Usage | Example |
|----------|-------|---------|
| `{{count}}` | Numbers | "{{count}} results found" |
| `{{name}}` | User names | "Welcome back, {{name}}!" |
| `{{date}}` | Dates | "Departure: {{date}}" |
| `{{price}}` | Prices | "Total: {{price}}" |
| `{{city}}` | Locations | "Flights to {{city}}" |

### Multiple Variables

```json
{
  "booking": {
    "confirmation": "Your booking from {{origin}} to {{destination}} on {{date}} is confirmed."
  }
}
```

**Output Example**: "Your booking from Paris to New York on 2025-03-15 is confirmed."

### Variable Formatting

Variables are inserted as-is. Formatting (dates, numbers, currency) should be handled by the application before passing to translation.

**Application Code** (not in translation files):
```typescript
const formattedDate = new Date().toLocaleDateString('en-US');
const formattedPrice = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(price);

t('booking.confirmation', {
  date: formattedDate,    // "03/15/2025"
  price: formattedPrice   // "$1,234.56"
});
```

## Pluralization

### Automatic Pluralization

i18next handles pluralization automatically using the `_plural` suffix.

**English**:
```json
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}
```

**Usage**:
- `count: 0` → "0 items"
- `count: 1` → "1 item"
- `count: 5` → "5 items"

### French Pluralization

French has different pluralization rules. Generally, 0 and 1 are singular, 2+ are plural.

**French**:
```json
{
  "items": "{{count}} article",
  "items_plural": "{{count}} articles"
}
```

### Complex Pluralization

For languages with more complex rules (not needed for English/French):

```json
{
  "items_0": "No items",
  "items_1": "One item",
  "items_2": "A couple items",
  "items_plural": "{{count}} items"
}
```

## Adding New Translations

### Step 1: Identify the Namespace

Choose the appropriate namespace for your content:

| Content Type | Namespace | Example Keys |
|--------------|-----------|--------------|
| Navigation, footer, buttons | `common` | `nav.flights`, `buttons.save` |
| Login, registration | `auth` | `login.title`, `register.submit` |
| Flight search | `flights` | `search.origin.label` |
| Hotel search | `hotels` | `search.checkIn.label` |
| Destination pages | `destinations` | `hero.title` |
| Error messages | `errors` | `network.offline` |
| User dashboard | `dashboard` | `welcome.message` |
| Settings page | `settings` | `profile.edit` |

**When in doubt**: Use `common` for UI elements used across multiple pages.

### Step 2: Add to English First

Always start with the English translation (primary language).

**File**: `public/locales/en/{namespace}.json`

```json
{
  "search": {
    "advancedOptions": {
      "directFlightsOnly": "Direct flights only",
      "refundableOnly": "Refundable tickets only"
    }
  }
}
```

### Step 3: Add French Translation

**File**: `public/locales/fr/{namespace}.json`

```json
{
  "search": {
    "advancedOptions": {
      "directFlightsOnly": "Vols directs uniquement",
      "refundableOnly": "Billets remboursables uniquement"
    }
  }
}
```

### Step 4: Verify JSON Syntax

Use a JSON validator to ensure syntax is correct:
- No trailing commas
- All keys in double quotes
- All values in double quotes
- Proper nesting and brackets

**Common Errors**:
```json
// ❌ Trailing comma
{
  "title": "Welcome",
  "subtitle": "Hello", // ← Remove comma
}

// ✅ Correct
{
  "title": "Welcome",
  "subtitle": "Hello"
}
```

```json
// ❌ Single quotes
{
  'title': 'Welcome'
}

// ✅ Correct
{
  "title": "Welcome"
}
```

### Step 5: Test in Browser

1. Save the translation files
2. Reload the application (hard refresh: Ctrl+Shift+R)
3. Switch language using the language selector
4. Navigate to the page where the translation appears
5. Verify the text displays correctly in both languages

## Editing Existing Translations

### Locate the Translation

**Method 1**: Search by text

```bash
cd public/locales/en
grep -r "Find Your Flight" .
# Output: ./flights.json:  "title": "Find Your Flight",
```

**Method 2**: Search by key path

If you know the key path (e.g., from developer notes or error messages):

**File**: `public/locales/en/flights.json`

Find the nested key:
```json
{
  "search": {
    "title": "Find Your Flight" // ← Found at search.title
  }
}
```

### Update Both Languages

Always update translations in both `en/` and `fr/` folders.

**English** (`en/flights.json`):
```json
{
  "search": {
    "title": "Search for Flights" // ← Updated
  }
}
```

**French** (`fr/flights.json`):
```json
{
  "search": {
    "title": "Rechercher des vols" // ← Updated
  }
}
```

### Save and Verify

1. Save both files
2. Clear browser cache (Ctrl+Shift+R)
3. Test in both languages
4. Verify layout works with new text length

## Quality Assurance Checklist

### Before Submitting Translations

- [ ] **Completeness**: Every key in `en/` exists in `fr/` (and vice versa)
- [ ] **Syntax**: All JSON files are valid (no syntax errors)
- [ ] **Variables**: Interpolation variables match exactly between languages
- [ ] **Pluralization**: Plural forms are correctly implemented
- [ ] **Length**: Text length doesn't break UI layout
- [ ] **Context**: Translation makes sense in the UI context
- [ ] **Terminology**: Consistent use of product-specific terms
- [ ] **Tone**: Matches the brand voice (friendly, professional)

### Automated Validation

**Check for missing keys**:

```bash
# Run from dreamscape-frontend/web-client/
node scripts/validate-translations.js
```

**Expected Output**:
```
✓ All keys present in both languages
✓ No empty values
✓ Interpolation variables match
```

**Error Output**:
```
✗ Missing key in fr/flights.json: search.advancedOptions.directFlightsOnly
✗ Variable mismatch in bookings.json: "{{count}}" in EN, "{{nombre}}" in FR
```

### Manual Testing

**Test every translation**:
1. Launch the development server
2. Navigate to the page with new/edited content
3. Switch language using the language selector (globe icon in header)
4. Verify translation appears correctly
5. Check for truncation or overflow
6. Test on different screen sizes (mobile, tablet, desktop)

**Test with edge cases**:
- Very long names (e.g., "Internationalization")
- Numbers (0, 1, 2, 100)
- Special characters (accents, apostrophes)
- Empty states ("No results")

## Translation Style Guide

### Tone and Voice

**DreamScape Brand Voice**:
- Friendly and welcoming
- Professional but not formal
- Inspiring and adventurous
- Clear and concise

**Examples**:
```json
// ✅ Good: Friendly and clear
{
  "welcome": "Ready to explore the world?"
}

// ❌ Bad: Too formal
{
  "welcome": "We cordially invite you to commence your journey."
}
```

### Common Translations

**Buttons**:
| English | French |
|---------|--------|
| Save | Enregistrer |
| Cancel | Annuler |
| Submit | Soumettre / Envoyer |
| Edit | Modifier |
| Delete | Supprimer |
| Back | Retour |
| Next | Suivant |
| Close | Fermer |
| Confirm | Confirmer |

**Navigation**:
| English | French |
|---------|--------|
| Flights | Vols |
| Hotels | Hôtels |
| Activities | Activités |
| Destinations | Destinations |
| My Trips | Mes voyages |
| Settings | Paramètres |
| Logout | Déconnexion |

**Time and Dates**:
| English | French |
|---------|--------|
| Today | Aujourd'hui |
| Tomorrow | Demain |
| Yesterday | Hier |
| Departure | Départ |
| Arrival | Arrivée |
| Check-in | Enregistrement / Check-in |
| Check-out | Départ / Check-out |

**Errors and Validation**:
| English | French |
|---------|--------|
| Required | Obligatoire |
| Invalid | Invalide |
| Error | Erreur |
| Success | Succès |
| Loading | Chargement |
| Please try again | Veuillez réessayer |

### Capitalization

**English**: Capitalize first letter of each major word in titles
```json
{
  "title": "Find Your Perfect Flight"
}
```

**French**: Only capitalize the first letter
```json
{
  "title": "Trouvez votre vol parfait"
}
```

### Punctuation

**Quotation marks**:
- English: "double quotes"
- French: « guillemets » (with spaces)

**Example**:
```json
// English
{
  "message": "Click \"Save\" to continue"
}

// French
{
  "message": "Cliquez sur « Enregistrer » pour continuer"
}
```

**Ellipsis**:
- English: three dots (...)
- French: horizontal ellipsis (…) or three dots

### Special Characters

**French Accents**: Always include proper accents
- à, è, é, ê, ë, î, ï, ô, ù, û, ü, ÿ, ç

**Apostrophes**: Use straight apostrophes (') in JSON
```json
{
  "message": "L'avion décolle à 10h"
}
```

## Common Translation Patterns

### Forms

**Labels and Placeholders**:
```json
{
  "form": {
    "email": {
      "label": "Email",
      "placeholder": "Enter your email"
    },
    "password": {
      "label": "Password",
      "placeholder": "Enter your password"
    }
  }
}
```

**French**:
```json
{
  "form": {
    "email": {
      "label": "E-mail",
      "placeholder": "Entrez votre e-mail"
    },
    "password": {
      "label": "Mot de passe",
      "placeholder": "Entrez votre mot de passe"
    }
  }
}
```

### Validation Messages

**Pattern**: Use complete sentences with proper punctuation.

```json
{
  "validation": {
    "emailRequired": "Email is required.",
    "emailInvalid": "Please enter a valid email address.",
    "passwordTooShort": "Password must be at least 8 characters."
  }
}
```

**French**:
```json
{
  "validation": {
    "emailRequired": "L'e-mail est obligatoire.",
    "emailInvalid": "Veuillez saisir une adresse e-mail valide.",
    "passwordTooShort": "Le mot de passe doit contenir au moins 8 caractères."
  }
}
```

### Confirmation Messages

```json
{
  "confirmation": {
    "bookingCreated": "Your booking has been created successfully!",
    "settingsSaved": "Your settings have been saved.",
    "accountDeleted": "Your account has been deleted."
  }
}
```

**French**:
```json
{
  "confirmation": {
    "bookingCreated": "Votre réservation a été créée avec succès !",
    "settingsSaved": "Vos paramètres ont été enregistrés.",
    "accountDeleted": "Votre compte a été supprimé."
  }
}
```

### Error Messages

```json
{
  "errors": {
    "network": {
      "offline": "You are currently offline. Please check your internet connection.",
      "timeout": "The request timed out. Please try again.",
      "serverError": "A server error occurred. Please try again later."
    }
  }
}
```

**French**:
```json
{
  "errors": {
    "network": {
      "offline": "Vous êtes actuellement hors ligne. Veuillez vérifier votre connexion Internet.",
      "timeout": "La requête a expiré. Veuillez réessayer.",
      "serverError": "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
    }
  }
}
```

## Layout Considerations

### Text Expansion

French text is typically 20-30% longer than English. Consider this when translating.

**Example**:
| English | French | Expansion |
|---------|--------|-----------|
| Search (6 chars) | Rechercher (10 chars) | +67% |
| Book (4 chars) | Réserver (8 chars) | +100% |
| Settings (8 chars) | Paramètres (11 chars) | +38% |

**Tips for Translators**:
- Use concise wording when possible
- Avoid overly long phrases
- Alert developers if text significantly exceeds space

**Tips for Developers**:
- Use flexible layouts (flexbox, grid)
- Avoid fixed widths
- Test with both languages before finalizing UI

### Line Breaks

Avoid hard-coded line breaks in translations. Let the UI handle text wrapping.

```json
// ❌ Bad
{
  "message": "Welcome to DreamScape.\nYour journey starts here."
}

// ✅ Good
{
  "message": "Welcome to DreamScape. Your journey starts here."
}
```

## Tools and Resources

### JSON Editors

**Recommended Tools**:
- [Visual Studio Code](https://code.visualstudio.com/) - Free, with JSON syntax highlighting
- [JSONLint](https://jsonlint.com/) - Online JSON validator
- [i18n Manager](https://github.com/gilmarsquinelato/i18n-manager) - GUI for managing translations

### Translation Memory

Reuse existing translations for consistency.

**Search Existing Translations**:
```bash
cd public/locales/en
grep -r "flight" *.json
```

**Example Output**:
```
common.json:  "flights": "Flights",
flights.json:  "title": "Find Your Flight",
dashboard.json:  "upcomingFlights": "Upcoming Flights"
```

### Style Guides

**English**:
- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)

**French**:
- [Guide de rédaction Microsoft](https://learn.microsoft.com/fr-fr/style-guide/welcome/)
- [Banque de dépannage linguistique](http://bdl.oqlf.gouv.qc.ca/)

## Troubleshooting

### Issue: Translation Not Appearing

**Possible Causes**:
1. JSON syntax error (missing comma, bracket)
2. Key mismatch between EN and FR
3. Browser cache showing old version

**Solution**:
1. Validate JSON syntax using JSONLint
2. Verify key paths match exactly
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Variable Not Replaced

**Symptom**: UI shows `{{count}} items` instead of `5 items`

**Cause**: Variable syntax incorrect

**Solution**:
```json
// ❌ Wrong syntax
{
  "items": "{count} items"      // Missing double braces
}

// ✅ Correct syntax
{
  "items": "{{count}} items"    // Double braces required
}
```

### Issue: Special Characters Display Incorrectly

**Symptom**: `Hôtel` displays as `H├┤tel`

**Cause**: File encoding is not UTF-8

**Solution**:
1. Open file in text editor
2. Save with UTF-8 encoding (usually default in VS Code)
3. Verify: File should start with `{` not with BOM characters

### Issue: Key Not Found Error

**Symptom**: Browser console shows `i18next::translator: missingKey en flights search.newKey`

**Cause**: Key exists in code but not in translation file

**Solution**: Add the missing key to `public/locales/en/flights.json`

## Version Control

### Git Workflow

**Branch Naming**:
```bash
# For new translations
git checkout -b translations/add-checkout-page

# For translation updates
git checkout -b translations/update-error-messages
```

**Commit Messages**:
```bash
# Good commit messages
git commit -m "Add translations for checkout page (EN/FR)"
git commit -m "Update error messages in flights namespace"
git commit -m "Fix typo in French hotel search translations"

# Bad commit messages
git commit -m "translations"
git commit -m "update"
```

### Pull Request Checklist

When submitting translations for review:

- [ ] All files saved with UTF-8 encoding
- [ ] JSON syntax validated (no errors)
- [ ] Both EN and FR updated
- [ ] Variables match between languages
- [ ] Tested in browser (both languages)
- [ ] Screenshot attached showing changes
- [ ] Translation notes added (if needed)

**PR Template**:
```markdown
## Translation Changes

**Namespace**: flights
**Languages**: EN, FR

### Added Keys
- `search.advancedOptions.directFlightsOnly`
- `search.advancedOptions.refundableOnly`

### Updated Keys
- `search.title` - Changed from "Find Your Flight" to "Search for Flights"

### Testing
- [x] Validated JSON syntax
- [x] Tested in EN
- [x] Tested in FR
- [x] Verified layout works

### Screenshots
[Attach before/after screenshots]

### Notes
French translation reviewed by native speaker.
```

## Contact

**For Translation Questions**:
- Slack: #translations
- Email: translations@dreamscape.ai

**For Technical Issues**:
- Slack: #frontend-dev
- GitHub Issues: [dreamscape-frontend/issues](https://github.com/dreamscape-ai/dreamscape-frontend/issues)

## Related Documentation

- [i18n Architecture Guide](./I18N_GUIDE.md) - Technical implementation details
- [Frontend Style Guide](../guides/frontend-style-guide.md) - UI design guidelines
- [Brand Voice Guide](../product/brand-voice.md) - Tone and messaging

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-06 | Initial translation workflow documentation |
