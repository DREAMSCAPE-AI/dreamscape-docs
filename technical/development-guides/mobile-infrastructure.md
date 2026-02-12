# Mobile Infrastructure Documentation

This document describes the mobile optimization infrastructure created for DR-82 (US-UX-003 - Interface Mobile Optimisée).

## Overview

The mobile infrastructure provides:
- Responsive viewport detection
- Mobile navigation drawer with accordion menus
- Touch-optimized interactions
- Comprehensive mobile testing utilities
- Performance and responsive auditing tools

## Architecture

### Components

```
src/
├── components/
│   └── mobile/
│       ├── MobileDrawer.tsx      # Slide-in navigation drawer
│       ├── MobileNav.tsx          # Mobile navigation content
│       └── index.ts               # Exports
├── hooks/
│   ├── useViewport.ts             # Viewport detection
│   ├── useMobileNavigation.ts     # Mobile navigation state
│   └── useSwipe.ts                # Swipe gesture detection (in useMobileNavigation.ts)
└── store/
    └── mobileStore.ts             # Zustand store for mobile UI state
```

### Testing Infrastructure

```
cypress/
├── e2e/
│   └── mobile/
│       └── navigation.cy.ts       # Mobile navigation E2E tests
└── support/
    └── mobile-commands.ts         # Custom Cypress commands for mobile testing
```

### Audit Tools

```
scripts/
├── audit-responsive.js            # Component responsive analysis
└── performance-baseline.js        # Lighthouse mobile performance audits
```

## Usage

### 1. Viewport Detection

```tsx
import { useViewport } from '@/hooks/useViewport';

function MyComponent() {
  const { isMobile, isTablet, width, breakpoint } = useViewport();

  if (isMobile) {
    return <MobileLayout />;
  }

  return <DesktopLayout />;
}
```

**Available properties:**
- `width`, `height`: Current viewport dimensions
- `isMobile`: < 768px (md breakpoint)
- `isTablet`: 768px - 1024px (md to lg)
- `isDesktop`: 1024px - 1280px (lg to xl)
- `isLargeDesktop`: >= 1280px (xl+)
- `breakpoint`: Current breakpoint ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')
- `isPortrait`, `isLandscape`: Orientation

### 2. Mobile Navigation

```tsx
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

function Header() {
  const { isMobile, isDrawerOpen, toggleDrawer } = useMobileNavigation();

  return (
    <>
      {isMobile && (
        <button onClick={toggleDrawer}>
          Menu
        </button>
      )}
      <MobileDrawer isLoggedIn={isLoggedIn} onLogout={handleLogout} />
    </>
  );
}
```

**Available actions:**
- `openDrawer()`, `closeDrawer()`, `toggleDrawer()`
- `setActiveSection(section)`, `toggleSection(section)`
- `openSearchOverlay()`, `closeSearchOverlay()`

**Features:**
- Auto-closes on desktop viewport
- Escape key closes drawer
- Prevents body scroll when open
- Swipe-to-close gesture

### 3. Swipe Gestures

```tsx
import { useSwipe } from '@/hooks/useMobileNavigation';

function SwipeableComponent() {
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => nextItem(),
    onSwipeRight: () => previousItem(),
    threshold: 100, // Minimum distance in pixels
  });

  return (
    <div {...swipeHandlers}>
      Swipeable content
    </div>
  );
}
```

### 4. Touch Target Sizes

All interactive elements should meet the minimum 44x44px touch target size:

```tsx
import { useTouchTargetSize } from '@/hooks/useViewport';

function TouchButton() {
  const { minWidth, minHeight } = useTouchTargetSize();

  return (
    <button
      style={{ minWidth, minHeight }}
      className="flex items-center justify-center p-3"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}
```

Or use Tailwind classes:

```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
  <Icon className="w-5 h-5" />
</button>
```

## Testing

### Running Mobile Tests

```bash
# Run all E2E tests on mobile viewport (iPhone 12 Pro)
npm run test:mobile

# Open Cypress with mobile viewport
npm run test:mobile:open

# Run only mobile-specific tests
npm run test:devices
```

### Custom Cypress Commands

```typescript
// Set viewport to predefined device
cy.setMobileViewport('iphone-12');

// Check touch target size
cy.get('button').shouldHaveTouchTarget();

// Simulate swipe gesture
cy.get('.drawer').swipe('left', 150);

// Mobile drawer actions
cy.openMobileDrawer();
cy.closeMobileDrawer();
cy.mobileDrawerShouldBeVisible();
cy.mobileDrawerShouldBeHidden();

// Long press
cy.get('button').longPress(1000);
```

### Available Device Presets

- `iphone-se` (375x667)
- `iphone-12` (390x844)
- `iphone-14-pro-max` (430x932)
- `galaxy-s21` (360x800)
- `galaxy-s21-ultra` (412x915)
- `ipad-mini` (768x1024)
- `ipad-pro` (1024x1366)
- `foldable` (884x1104)

## Auditing

### Responsive Audit

Analyzes all React components for mobile optimization issues:

```bash
npm run audit:responsive
```

**Output:** `audit-report.json`

**Checks:**
- Mobile-first vs desktop-first patterns
- Touch target sizes
- Fixed widths causing overflow
- Responsive breakpoint usage
- Hover states (not mobile-friendly)

**Report includes:**
- Component priority (P0-P3)
- Optimization score
- Issue list with occurrences
- Status: good / fair / needs-work

### Performance Baseline

Runs Lighthouse audits for mobile performance:

```bash
npm run audit:performance
```

**Prerequisites:**
- Dev server running (`npm run dev`)
- Chrome/Chromium installed

**Output:**
- `performance-baseline.json` - JSON baseline report
- `lighthouse-reports/*.html` - Detailed HTML reports per page

**Audits:**
- Homepage, Flights, Hotels, Dashboard, Onboarding
- Mobile device emulation (iPhone 12 Pro)
- 4G network throttling
- Performance, Accessibility, Best Practices, SEO scores
- FCP, LCP, TBT, CLS, Speed Index metrics

**Targets:**
- Performance: 90+
- Accessibility: 95+
- FCP: < 1500ms
- LCP: < 2500ms
- CLS: < 0.1

### Run All Audits

```bash
npm run audit:all
```

## Mobile-First CSS Patterns

### ✅ Recommended (Mobile-First)

```tsx
// Default: mobile, override: desktop
<div className="block md:hidden">Mobile content</div>
<div className="hidden md:block">Desktop content</div>

// Stack on mobile, grid on desktop
<div className="flex flex-col md:grid md:grid-cols-3 gap-4">
  {/* Items */}
</div>

// Full width on mobile, constrained on desktop
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Content */}
</div>
```

### ❌ Avoid (Desktop-First)

```tsx
// Don't do this (hidden by default)
<div className="hidden md:block">Content</div>

// Don't use fixed widths without mobile consideration
<div className="w-[500px]">Content</div>
```

## Accessibility Guidelines

### Touch Targets

- **Minimum size:** 44x44px (iOS), 48x48px (Android recommendation)
- **Spacing:** 8px between touch targets
- **Implementation:** Use `min-h-[44px] min-w-[44px]`

### ARIA Attributes

```tsx
// Mobile drawer
<div role="dialog" aria-modal="true" aria-label="Mobile navigation menu">

// Accordion buttons
<button aria-expanded={isOpen}>

// Close buttons
<button aria-label="Close menu">
```

### Focus Management

- Trap focus within drawer when open
- Return focus to trigger button when closed
- Visible focus indicators

## Performance Considerations

### Code Splitting

Lazy load mobile-specific components:

```tsx
import { lazy, Suspense } from 'react';

const MobileDrawer = lazy(() => import('@/components/mobile/MobileDrawer'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <MobileDrawer />
    </Suspense>
  );
}
```

### Animation Performance

Use CSS transforms (GPU-accelerated) instead of layout properties:

```css
/* ✅ Good (GPU) */
.drawer {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

/* ❌ Bad (CPU) */
.drawer {
  left: -280px;
  transition: left 300ms ease-out;
}
```

### Debouncing

Resize events are debounced (150ms) in `useViewport` for better performance.

## Best Practices

1. **Always test on real devices** in addition to emulation
2. **Use mobile-first CSS** patterns (default mobile, override desktop)
3. **Implement touch feedback** (<100ms visual response)
4. **Optimize images** for mobile (WebP, srcset, lazy loading)
5. **Code split** large components/routes
6. **Test with slow network** (throttling enabled)
7. **Validate touch targets** using Cypress command
8. **Monitor performance** with Lighthouse CI

## Troubleshooting

### Drawer not closing on desktop

The drawer auto-closes when viewport switches from mobile to desktop. If this doesn't work:

```tsx
// Check that useMobileNavigation hook is used correctly
const { isMobile, isDrawerOpen, closeDrawer } = useMobileNavigation();

// Verify useEffect dependency array
useEffect(() => {
  if (!isMobile && isDrawerOpen) {
    closeDrawer();
  }
}, [isMobile, isDrawerOpen, closeDrawer]);
```

### Body scroll not preventing

The drawer should prevent body scroll when open. If scroll is still possible:

```tsx
// Check that overflow styles are applied
useEffect(() => {
  if (isDrawerOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}, [isDrawerOpen]);
```

### Cypress tests failing

Ensure data-testid attributes are added to components:

```tsx
<button data-testid="mobile-menu-button">Menu</button>
<div data-testid="mobile-drawer">...</div>
<button data-testid="mobile-drawer-close">Close</button>
```

## Related Documentation

- [DreamScape Frontend Architecture](../architecture/)
- [Web Client Testing Guide](./testing-guide.md)
- [Component Development Guide](./component-guide.md)
- [Accessibility Guidelines](../accessibility/)

## Implementation Reference

This infrastructure was developed as part of:
- **Epic:** US-UX-003 - Interface Mobile Optimisée
- **Ticket:** DR-82 - Comprehensive mobile-responsive optimization
- **Repository:** `dreamscape-frontend/web-client`
