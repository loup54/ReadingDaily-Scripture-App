# Component Development Checklist

**ReadingDaily Scripture App**
**Version**: 1.0
**Last Updated**: November 24, 2025

---

## Overview

This checklist ensures all new components follow the design system standards and best practices. Use this before submitting any component for review.

---

## Pre-Development

### ✅ Planning
- [ ] Component has clear purpose and scope
- [ ] Component solves a real problem (not adding unnecessary complexity)
- [ ] Component can be reused across multiple screens
- [ ] Component fits into existing architecture
- [ ] Similar components don't already exist (check `/src/components/common/`)

### ✅ Design Alignment
- [ ] Design approved by design team
- [ ] Design follows Material Design 3 guidelines
- [ ] All colors match design system tokens
- [ ] All typography matches design system variants
- [ ] All spacing matches design system values
- [ ] All icons match design system standards

---

## Implementation

### ✅ Colors & Theme

- [ ] All colors come from `useTheme()` hook (never hardcoded)
- [ ] No hardcoded hex colors like `#FFFFFF` in code
- [ ] No static `Colors` imports used for rendering (only for tokens)
- [ ] StyleSheet contains NO color properties
- [ ] Colors applied dynamically in JSX:
  ```typescript
  const { colors } = useTheme();
  style={[styles.container, { backgroundColor: colors.background.card }]}
  ```
- [ ] Tested in both light and dark modes
- [ ] Colors update immediately on theme toggle (no restart needed)

### ✅ Typography & Scaling

- [ ] Uses `Text` component for all text (from `@/components/common`)
- [ ] No manual `Typography` spreading
- [ ] Text uses appropriate variant prop:
  - Headings: `h1`, `h2`, `h3`
  - Body text: `body`, `bodyLarge`, `bodySmall`
  - Special: `caption`, `label`, `button`, `displayLarge`, `displayMedium`
- [ ] Default text color uses theme (no custom color prop)
- [ ] Custom text colors use theme colors (not hardcoded)
- [ ] Font sizes never hardcoded (always use Typography variants)
- [ ] Font weights never hardcoded (use `bold` or `semibold` props)

**Dynamic Font Scaling** (WCAG 2.1 Accessibility):
- [ ] Text component used (automatically scales with system preferences)
- [ ] Layout tested at 150% and 200% text scales
- [ ] No text truncation at larger scales
- [ ] `disableScaling` only used for design-critical text (badges, codes)
- [ ] Spacing/padding adjusted for larger text if needed
- [ ] Line height maintained at all scales (automatic via Text component)

### ✅ Spacing

- [ ] All spacing uses `Spacing` constants:
  - `Spacing.xs` (4px)
  - `Spacing.sm` (8px)
  - `Spacing.md` (12px)
  - `Spacing.lg` (16px)
  - `Spacing.xl` (20px)
  - `Spacing.xxl` (24px)
- [ ] No hardcoded pixel values (like `padding: 16`)
- [ ] Spacing applied in StyleSheet (not inline styles)
- [ ] Consistent spacing patterns between similar components

### ✅ Icons

- [ ] Icon sizes use `IconSizes` constants:
  - `IconSizes.SMALL` (20px) - UI controls, badges
  - `IconSizes.MEDIUM` (24px) - Navigation, tabs
  - `IconSizes.LARGE` (28px) - Featured icons
  - `IconSizes.EXTRA_LARGE` (32px) - Splash screens
- [ ] No hardcoded icon sizes (like `size={24}`)
- [ ] Icon colors use theme colors (from `useTheme()`)
- [ ] No hardcoded icon colors
- [ ] Icon-only buttons have `accessibilityLabel` prop
- [ ] Icons use appropriate context colors (via `getContextIconConfig()`)

### ✅ Layout & Structure

- [ ] Uses StyleSheet for layout (from `react-native`)
- [ ] Proper component folder structure:
  ```
  /src/components/
    /common/          # Shared components
    /[Feature]/       # Feature-specific components
  ```
- [ ] Component is a function component (not class-based)
- [ ] Component accepts appropriate props
- [ ] Component exports proper TypeScript interfaces

### ✅ TypeScript

- [ ] Component has proper TypeScript types
- [ ] Props interface defined and exported:
  ```typescript
  export interface MyComponentProps extends ViewProps {
    title: string;
    variant?: 'primary' | 'secondary';
  }
  ```
- [ ] Uses `React.FC<Props>` for type safety
- [ ] No `any` types (only when absolutely necessary)
- [ ] All imports have proper types

### ✅ Performance

- [ ] Component uses `StyleSheet.create()` (not inline styles)
- [ ] Component wrapped with `React.memo` if it receives many props
- [ ] Uses `useCallback` for event handlers if needed
- [ ] No unnecessary re-renders from theme changes
- [ ] No memory leaks from subscriptions

### ✅ Accessibility (WCAG 2.1 Level AA)

**Screen Reader Support**:
- [ ] All interactive elements have `accessible={true}`
- [ ] All interactive elements have `accessibilityLabel` (not empty, <= 100 chars)
- [ ] All interactive elements have `accessibilityRole` (button, link, switch, etc.)
- [ ] Icon-only buttons have descriptive labels (use `a11y.iconButton()` helper)
- [ ] Complex elements have `accessibilityHint` explaining interaction
- [ ] Labels are action-oriented ("Play", "Save", "Delete", not "Button")

**Visual Accessibility**:
- [ ] Text contrast meets WCAG AA standards (4.5:1 for normal, 3:1 for large text)
- [ ] Colors not used as only indicator (use icons, text, patterns too)
- [ ] Focus indicators visible and distinct
- [ ] Touch targets are minimum 48pt (Material Design 3)

**Interaction Accessibility**:
- [ ] Component works with screen readers (iOS VoiceOver, Android TalkBack)
- [ ] Keyboard navigation works properly (if web component)
- [ ] Component respects `prefers-reduced-motion` setting (no auto-animations)
- [ ] Loading states announced to screen readers
- [ ] Error/success states announced to screen readers

**Testing**:
- [ ] Tested with VoiceOver (iOS) or TalkBack (Android)
- [ ] All functionality accessible without color vision
- [ ] Tested at 150% and 200% text scaling
- [ ] Tested with touch targets at system minimum size

**Accessibility Helpers** (from `@/utils/accessibility`):
- [ ] Use `a11y.button()` for text buttons
- [ ] Use `a11y.iconButton()` for icon-only buttons (REQUIRED)
- [ ] Use `a11y.link()` for navigation
- [ ] Use `a11y.toggle()` for switches/toggles
- [ ] Use `a11y.listItem()` for list items with position

### ✅ Keyboard Navigation (WCAG 2.1 2.1.1)

- [ ] Component supports Tab key for focus management
- [ ] Focus is visible with clear indicator (3:1 contrast minimum)
- [ ] Focus order is logical and intuitive
- [ ] Focus indicators are not obscured by other content
- [ ] For form inputs: Tab moves to next field
- [ ] For buttons: Enter/Space activates on web
- [ ] For modals/dialogs: Tab focus is trapped within modal
- [ ] For menus: Arrow keys navigate items
- [ ] No keyboard traps (user can always exit using Tab or Escape)
- [ ] Skip links available for web (jump to main content)
- [ ] Keyboard shortcuts follow standard conventions (Ctrl+S = Save, etc.)
- [ ] Focus visible even at 200% zoom level
- [ ] Tested on web platform (Expo web)

### ✅ Reduced Motion Support (WCAG 2.1 2.3.3)

- [ ] Animations checked: Component has no animations OR respects reduced motion setting
- [ ] Uses `usePrefersReducedMotion()` hook if animations present
- [ ] Animations disabled when `prefersReducedMotion` is true
- [ ] Duration becomes 0ms when reduced motion enabled
- [ ] No auto-playing animations on load
- [ ] Transitions use motion-safe durations (0ms vs normal)
- [ ] Spring animations respect reduced motion (disabled if true)
- [ ] Celebratory animations (confetti, bouncing) disabled for reduced motion
- [ ] Pulsing/idle animations use motion-safe timing
- [ ] Decorative animations can be disabled without breaking functionality
- [ ] Critical animations (state changes) still visible but instant when reduced
- [ ] Tested with device "Reduce Motion" setting enabled
- [ ] Tested on iOS (Settings > Accessibility > Motion > Reduce Motion)
- [ ] Tested on Android (Settings > Accessibility > Display > Remove Animations)

### ✅ Code Quality

- [ ] No console.log statements in production code
- [ ] No commented-out code
- [ ] No unused imports
- [ ] Component follows naming conventions
- [ ] No typos in variable/function names
- [ ] Code is readable and self-documenting

### ✅ Documentation

- [ ] Component has JSDoc comments:
  ```typescript
  /**
   * MyComponent displays formatted content
   * @example
   * <MyComponent title="Hello" variant="primary" />
   */
  ```
- [ ] Props documented with descriptions
- [ ] Return type documented
- [ ] Complex logic has inline comments
- [ ] Component added to component documentation (`/src/components/README.md`)
- [ ] Usage examples provided

---

## Integration

### ✅ Exports

- [ ] Component exported from `/src/components/common/index.ts` (if common)
- [ ] TypeScript types exported alongside component
- [ ] Barrel exports used for better organization

### ✅ Dependencies

- [ ] Only uses approved libraries
- [ ] No circular imports
- [ ] Imports follow alias paths (`@/constants/`, `@/hooks/`, etc.)
- [ ] Component dependencies are minimal

### ✅ Testing

- [ ] Component renders without errors
- [ ] Component works in light mode
- [ ] Component works in dark mode
- [ ] Component works on different screen sizes
- [ ] Component handles edge cases (empty states, loading, errors)
- [ ] Interactive elements respond to user input

---

## Design System Compliance

### ✅ Design Tokens

- [ ] Uses only approved colors from design system
- [ ] Uses only approved typography variants
- [ ] Uses only approved spacing values
- [ ] Uses only approved icon sizes
- [ ] Uses only approved shadows (if applicable)

### ✅ Component Patterns

- [ ] Component follows established patterns
- [ ] Component doesn't duplicate existing components
- [ ] Component integrates with other components smoothly
- [ ] Component hierarchy makes sense

### ✅ Dark Mode

- [ ] Component tested in dark mode
- [ ] All colors have dark mode equivalents
- [ ] No colors appear inverted/wrong in dark mode
- [ ] Text contrast works in both modes
- [ ] Theme toggle works smoothly

### ✅ Color Contrast (WCAG 2.1 AA)

- [ ] All text colors from design system colors token
- [ ] Text on backgrounds: ≥4.5:1 contrast (normal text)
- [ ] Text on backgrounds: ≥3:1 contrast (large text 18pt+)
- [ ] Accent colors used appropriately:
  - [ ] `accent.green` / `accent.greenForText`: Use greenForText for text on white
  - [ ] `accent.red`: AAA for large text only; use for backgrounds/icons on white
  - [ ] `accent.yellow`: Never use for text on white; backgrounds only
- [ ] Text primary (#1A1A1A light / #FFFFFF dark): ✅ AAA (17.4:1 / 18.7:1)
- [ ] Text secondary (#666666 light / #B3B3B3 dark): ✅ AA/AAA (5.74:1 / 8.93:1)
- [ ] Text tertiary (#757575 light / #909090 dark): ✅ AA (4.54:1 / 5.30:1)
- [ ] Text placeholder (#767676 light / #8A8A8A dark): ✅ AA (4.51:1 / 4.63:1)
- [ ] Status colors meet WCAG: ✅ Error (AA+), Success (AAA+), Warning (AAA+), Info (AA+)
- [ ] Tested in both light and dark modes
- [ ] No low-contrast text combinations

---

## Pre-Review Checklist

### ✅ Final Verification

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Code formatting consistent (`prettier` if available)
- [ ] No linting errors
- [ ] Component imports correctly in other files
- [ ] No breaking changes to existing components
- [ ] Git diff looks clean (no unnecessary changes)
- [ ] Commit message is descriptive

### ✅ Code Review Ready

- [ ] Component is production-ready
- [ ] All checklist items completed
- [ ] Ready for peer review
- [ ] Can be merged to main branch

---

## Common Mistakes to Avoid

❌ **Don't**:
1. Hardcode colors - Always use `useTheme()`
2. Hardcode sizes - Use `Spacing`, `IconSizes`, `Typography`
3. Manually spread `Typography` - Use `Text` component with `variant` prop
4. Create custom Button/Text wrappers - Use existing components
5. Use static `Colors` for rendering - Only use for design tokens
6. Skip TypeScript types - Type everything
7. Forget accessibility - Always add labels and keyboard support
8. Create huge components - Split into smaller, reusable pieces
9. Use inline styles - Always use `StyleSheet.create()`
10. Skip documentation - Always add JSDoc and examples

✅ **Do**:
1. Use theme colors via `useTheme()` hook
2. Use design tokens for all values
3. Use semantic components (Text, Button, Card)
4. Type everything with TypeScript
5. Document with JSDoc comments
6. Test in light and dark modes
7. Support accessibility features
8. Keep components small and focused
9. Use established patterns
10. Follow design system guidelines

---

## Review Questions

When reviewing your component, ask yourself:

- [ ] Would a new developer understand this component immediately?
- [ ] Does the component follow design system patterns?
- [ ] Are all colors, sizes, and spacing from the design system?
- [ ] Would this component work well in dark mode?
- [ ] Is the code maintainable and readable?
- [ ] Are there any hardcoded values?
- [ ] Is the component tested across different scenarios?
- [ ] Does the component match the approved design?
- [ ] Are TypeScript types complete and strict?
- [ ] Is documentation clear and helpful?

---

## Sign-Off

Once all items are checked:

1. **Developer**: All items completed and verified
2. **Self-Review**: Component meets all standards
3. **Peer Review**: Ready for team review

---

**Last Updated**: November 24, 2025
**Version**: 1.0

