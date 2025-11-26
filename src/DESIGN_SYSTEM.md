# Design System Guide

**ReadingDaily Scripture App**
**Version**: 1.0
**Last Updated**: November 24, 2025

---

## Overview

This guide documents the standardized design system used across the ReadingDaily app. It covers colors, typography, spacing, icons, and component patterns to ensure consistency and maintainability.

**Current Maturity**: 8.75/10

---

## Core Principles

### 1. Theme-Aware Colors (Always Dynamic)
**Rule**: All colors must come from `useTheme()` hook. Never hardcode color strings.

✅ **CORRECT**
```typescript
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background.primary }} />
```

❌ **WRONG**
```typescript
<View style={{ backgroundColor: '#FFFFFF' }} />
<View style={{ backgroundColor: Colors.background.primary }} />
```

**Why**: Hardcoded colors don't update on theme change. Static imports won't respect user's light/dark mode preference.

---

### 2. Layout in StyleSheet, Colors in JSX
**Rule**: Use StyleSheet for layout/spacing/typography. Apply colors dynamically in JSX.

✅ **CORRECT**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});

export const MyComponent = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background.card }]}>
      ...
    </View>
  );
};
```

❌ **WRONG**
```typescript
const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.background.card,  // ❌ Won't update
  },
});
```

**Why**: StyleSheet is created once. Theme colors need to update dynamically.

---

### 3. Use Semantic Components Over Styled Elements
**Rule**: Use Text, Button, Card components instead of building custom styles.

✅ **CORRECT**
```typescript
import { Text, Button } from '@/components/common';

<Text variant="h1">Heading</Text>
<Button title="Submit" onPress={handleSubmit} />
```

❌ **WRONG**
```typescript
<RNText style={[Typography.h1, { color: colors.text.primary }]}>
  Heading
</RNText>
<TouchableOpacity onPress={handleSubmit}>
  <Text>Submit</Text>
</TouchableOpacity>
```

**Why**: Semantic components ensure consistency and reduce boilerplate.

---

### 4. Icon Standards (Size + Color)
**Rule**: Use IconSizes constants for all icon dimensions. Use theme colors for all icon colors.

✅ **CORRECT**
```typescript
import { IconSizes } from '@/constants/icons';

const { colors } = useTheme();

<Ionicons size={IconSizes.MEDIUM} color={colors.primary.blue} />
```

❌ **WRONG**
```typescript
<Ionicons size={24} color="#4A90E2" />
```

**Why**: Hardcoded sizes aren't standardized. Hardcoded colors don't respect theme.

---

## Token Reference

### Colors

#### Primary Colors
```typescript
colors.primary.blue     // Brand color
colors.accent.green     // Success/positive
colors.accent.red       // Error/negative
colors.accent.yellow    // Warning
```

#### Background Colors
```typescript
colors.background.primary      // Main background
colors.background.secondary    // Secondary background
colors.background.card         // Card/elevated surfaces
colors.tabs.background        // Tab bar background
```

#### Text Colors
```typescript
colors.text.primary     // Main text
colors.text.secondary   // Secondary text
colors.text.tertiary    // Disabled/hint text
colors.text.inverted    // On dark backgrounds
colors.text.placeholder // Placeholder text
colors.text.white       // White text (for contrast)
```

#### Border Colors
```typescript
colors.ui.border        // Default borders
colors.ui.error         // Error state
```

---

### Typography

#### Display Styles
```typescript
Typography.displayLarge     // Extra large display
Typography.displayMedium    // Large display
```

#### Heading Styles
```typescript
Typography.h1   // Primary heading (28px, bold)
Typography.h2   // Secondary heading (22px, semibold)
Typography.h3   // Tertiary heading (18px, semibold)
```

#### Body Styles
```typescript
Typography.bodyLarge    // Emphasized body (16px)
Typography.body         // Standard body (14px) - DEFAULT
Typography.bodySmall    // Small body (12px)
```

#### UI Styles
```typescript
Typography.button   // Button text (semibold)
Typography.label    // Label text
Typography.caption  // Small caption
```

**Usage**:
```typescript
// Option 1: Spread Typography (old pattern)
<Text style={[Typography.h1, { color: colors.text.primary }]}>
  Heading
</Text>

// Option 2: Use Text component (new pattern)
<Text variant="h1">Heading</Text>
```

---

### Spacing

```typescript
Spacing.xs        // 4px   - Minimal spacing
Spacing.sm        // 8px   - Small spacing
Spacing.md        // 12px  - Medium spacing (standard)
Spacing.lg        // 16px  - Large spacing
Spacing.xl        // 20px  - Extra large spacing
Spacing.xxl       // 24px  - Double extra large
```

**Usage**:
```typescript
<View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.md }}>
  Content
</View>
```

---

### Icons

#### Sizes
```typescript
IconSizes.SMALL         // 20px - UI controls, badges
IconSizes.MEDIUM        // 24px - Navigation, tabs
IconSizes.LARGE         // 28px - Featured icons
IconSizes.EXTRA_LARGE   // 32px - Splash screens, hero
```

#### Contexts
```typescript
IconContexts.TAB_ICON         // 24px, primary/tertiary
IconContexts.BUTTON_ICON      // 20px, primary
IconContexts.LIST_ICON        // 24px, secondary
IconContexts.HEADER_ICON      // 24px, primary
IconContexts.FAB_ICON         // 28px, inverted
IconContexts.EMPTY_STATE_ICON // 32px, tertiary
IconContexts.STATUS_ICON      // 20px, success
IconContexts.ERROR_ICON       // 20px, error
```

---

### Shadows

```typescript
Shadows.none      // No shadow
Shadows.sm        // Small shadow
Shadows.md        // Medium shadow
Shadows.lg        // Large shadow
Shadows.elevated  // Elevated/prominent shadow
```

---

## Dark Mode

### How It Works

1. **ThemeContext** provides `colors` object
2. Theme toggle calls `setTheme('dark')` or `setTheme('light')`
3. `useTheme()` hook returns appropriate color values
4. All components using `useTheme()` re-render with new colors

### Implementation

```typescript
// In any component
const { colors, isDark } = useTheme();

return (
  <View style={{ backgroundColor: colors.background.primary }}>
    {/* Automatically updates on theme change */}
  </View>
);
```

### Critical Requirement

**Never use static Colors import for rendering colors**. Always use `useTheme()`.

❌ **Won't update on theme toggle**:
```typescript
<View style={{ backgroundColor: Colors.background.primary }} />
```

✅ **Will update on theme toggle**:
```typescript
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background.primary }} />
```

---

## Component Patterns

### Text Component

```typescript
import { Text } from '@/components/common';

// Basic usage
<Text variant="h1">Heading</Text>

// With customization
<Text variant="body" color={colors.text.secondary} bold center>
  Custom text
</Text>

// Semantic shorthand
<Heading1>Heading</Heading1>
<BodyText>Body</BodyText>
<Caption>Caption</Caption>
```

### Button Component

```typescript
import { Button } from '@/components/common';

<Button
  title="Submit"
  variant="primary"  // primary, secondary, outline, text, accent
  size="md"          // sm, md, lg
  onPress={handleSubmit}
  disabled={loading}
  loading={loading}
/>
```

### Input Component

```typescript
import { Input } from '@/components/common';

<Input
  label="Email"
  placeholder="Enter email"
  icon="mail"
  error={errors.email}
  onChangeText={handleChange}
/>
```

### Card Component

```typescript
import { Card } from '@/components/common';

<Card>
  {/* Content automatically gets spacing and rounded corners */}
</Card>
```

### Icons

```typescript
import { IconSizes } from '@/constants/icons';
import { useTheme } from '@/hooks/useTheme';

const { colors } = useTheme();

// Correct pattern
<Ionicons
  name="home"
  size={IconSizes.MEDIUM}
  color={colors.primary.blue}
/>

// Context-based pattern
const config = getContextIconConfig('TAB_ICON', colors, isActive);
<Ionicons name="home" size={config.size} color={config.color} />
```

---

## Best Practices

### ✅ DO

1. **Use design tokens for everything**
   ```typescript
   padding: Spacing.lg  // ✅ Good
   padding: 16         // ❌ Bad
   ```

2. **Use semantic components**
   ```typescript
   <Text variant="h1">Title</Text>          // ✅ Good
   <Text style={{ fontSize: 28, ... }}>    // ❌ Bad
   ```

3. **Apply colors from useTheme()**
   ```typescript
   const { colors } = useTheme();
   backgroundColor: colors.background.primary  // ✅ Good
   backgroundColor: Colors.background.primary   // ❌ Bad
   ```

4. **Use icon size constants**
   ```typescript
   size={IconSizes.MEDIUM}  // ✅ Good
   size={24}               // ❌ Bad
   ```

5. **Keep styles in StyleSheet**
   ```typescript
   const styles = StyleSheet.create({
     container: { padding: Spacing.lg }  // ✅ Good
   });
   ```

6. **Apply dynamic values in JSX**
   ```typescript
   style={[styles.container, { backgroundColor: colors.background.card }]}  // ✅ Good
   ```

### ❌ DON'T

1. **Don't hardcode colors**
   ```typescript
   backgroundColor: '#FFFFFF'  // ❌ Won't update on theme
   ```

2. **Don't use Colors import for rendering**
   ```typescript
   color: Colors.text.primary  // ❌ Won't update on theme
   ```

3. **Don't hardcode sizes**
   ```typescript
   padding: 16           // ❌ Should use Spacing
   fontSize: 14          // ❌ Should use Typography
   size: 24              // ❌ Should use IconSizes
   ```

4. **Don't spread Typography in JSX**
   ```typescript
   style={Typography.body}  // ❌ Use Text component instead
   ```

5. **Don't create custom Button/Text wrappers**
   ```typescript
   // ❌ Bad - duplicates existing components
   export const MyButton = styled...

   // ✅ Good - use Button component with props
   <Button variant="custom" />
   ```

---

## Migration from Old Code

### Typography

**Old**:
```typescript
<Text style={[Typography.h1, { color: colors.text.primary }]}>
  Heading
</Text>
```

**New**:
```typescript
<Text variant="h1">Heading</Text>
```

### Colors

**Old**:
```typescript
<View style={{ backgroundColor: Colors.background.card }} />
```

**New**:
```typescript
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background.card }} />
```

### Icons

**Old**:
```typescript
<Ionicons size={24} color="#4A90E2" />
```

**New**:
```typescript
const { colors } = useTheme();
<Ionicons size={IconSizes.MEDIUM} color={colors.primary.blue} />
```

---

## Accessibility

### Color Contrast
- Text on backgrounds must have sufficient contrast
- Use semantic color names that ensure contrast
- Test colors in both light and dark modes

### Font Sizes
- Never go below 12px for body text
- Use Typography variants instead of custom sizes

### Touch Targets
- Minimum 48px touch target size
- Use appropriate Spacing values

### Icons
- Always provide text labels for icon-only buttons
- Use `accessibilityLabel` prop

---

## Performance

### Theme Updates
- Theme changes trigger re-render only in components using `useTheme()`
- Wrap heavy components with memo if needed
- Keep styles in StyleSheet for memoization

### Colors
- Theme colors are objects, compare by reference
- Avoid creating new color objects in render

---

## Testing

### Light Mode
- Test all components in light theme
- Verify text contrast
- Check color visibility

### Dark Mode
- Test all components in dark theme
- Verify text contrast
- Check color visibility

### Theme Toggle
- Verify components update instantly
- Check for flashing or delays
- Test all interactive elements

---

## Tools & Utilities

### useTheme Hook
```typescript
import { useTheme } from '@/hooks/useTheme';

const { colors, isDark, toggleTheme } = useTheme();
```

### Icon Utilities
```typescript
import { IconSizes, IconColorMap } from '@/constants/icons';
import { getIconColor, getContextIconConfig } from '@/utils/iconUtils';

// Get color from path
const color = getIconColor('primary.blue', colors);

// Get config for context
const config = getContextIconConfig('TAB_ICON', colors, isActive);
```

---

## Common Patterns

### Themed View
```typescript
const { colors } = useTheme();

<View style={[
  styles.container,
  { backgroundColor: colors.background.card }
]}>
  <Text variant="h2">Title</Text>
</View>
```

### Themed Button
```typescript
<Button
  title="Submit"
  variant="primary"
  onPress={handleSubmit}
/>
```

### Themed Input
```typescript
const { colors } = useTheme();

<Input
  label="Email"
  icon="mail"
  error={error}
  onChangeText={setText}
/>
```

### Themed List Item
```typescript
const { colors } = useTheme();

<View style={[
  styles.item,
  { borderBottomColor: colors.ui.border }
]}>
  <Text variant="body">Item</Text>
  <Ionicons
    name="chevron-forward"
    size={IconSizes.MEDIUM}
    color={colors.text.tertiary}
  />
</View>
```

---

## Frequently Asked Questions

### Q: Can I hardcode a color?
**A**: Only in edge cases (like loading placeholders). Always try to use theme colors first.

### Q: Should I create custom components?
**A**: No. Use existing Button, Text, Card components with props instead. Custom components make it hard to enforce standards.

### Q: What if the design requires a color not in the theme?
**A**: Add it to the theme colors file in collaboration with design team. Don't hardcode it.

### Q: How do I handle state colors (active/inactive)?
**A**: Use conditional logic with theme colors:
```typescript
color={isActive ? colors.primary.blue : colors.text.tertiary}
```

### Q: Can I use the Colors import?
**A**: Only for design token values (Spacing, BorderRadius, etc.). Never for color values in render.

---

## Resources

- **Colors**: `/src/constants/colors.ts`
- **Typography**: `/src/constants/typography.ts`
- **Spacing**: `/src/constants/spacing.ts`
- **Icons**: `/src/constants/icons.ts`
- **useTheme Hook**: `/src/hooks/useTheme.ts`
- **Text Component**: `/src/components/common/Text.tsx`
- **Component Docs**: `/src/components/README.md`

---

**Last Updated**: November 24, 2025
**Version**: 1.0
**Maintainer**: Design System Team
