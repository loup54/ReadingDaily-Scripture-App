# Common Components Documentation

## Text Component

The `Text` component is a convenience wrapper around React Native's Text that automatically applies typography variants and theme colors.

### Basic Usage

```tsx
import { Text } from '@/components/common';

// Basic heading
<Text variant="h1">Welcome</Text>

// Body text with secondary color
<Text variant="body" color={colors.text.secondary}>
  Subtitle
</Text>

// Centered caption
<Text variant="caption" center>
  Optional text
</Text>

// Bold button text
<Text variant="button" bold>
  Click me
</Text>
```

### Available Variants

#### Display Styles
- `displayLarge` - Extra large display text
- `displayMedium` - Large display text

#### Heading Styles
- `h1` - Primary heading (largest)
- `h2` - Secondary heading
- `h3` - Tertiary heading

#### Body Styles
- `bodyLarge` - Large body text (emphasized content)
- `body` - Standard body text (default)
- `bodySmall` - Small body text

#### UI Styles
- `button` - Button text (semibold)
- `label` - Label text
- `caption` - Small caption text

#### Display Styles
- `displayLarge` - Extra emphasis
- `displayMedium` - Large emphasis

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `TypographyVariant` | `'body'` | Typography variant to apply |
| `color` | `string` | `colors.text.primary` | Text color (hex or theme color) |
| `center` | `boolean` | `false` | Center text horizontally |
| `bold` | `boolean` | `false` | Make text bold (fontWeight: '600') |
| `semibold` | `boolean` | `false` | Make text semi-bold (fontWeight: '500') |
| `style` | `any` | - | Additional style overrides |
| `children` | `ReactNode` | - | Text content |

All standard React Native TextProps are also supported.

### Examples

#### Display Large Heading
```tsx
<Text variant="displayLarge">Welcome Back</Text>
```

#### Secondary Body Text
```tsx
<Text variant="body" color={colors.text.secondary}>
  This is secondary text
</Text>
```

#### Centered Caption
```tsx
<Text variant="caption" center>
  Optional caption text
</Text>
```

#### Bold Heading
```tsx
<Text variant="h2" bold>
  Important Heading
</Text>
```

#### Button-style Text
```tsx
<Text variant="button" bold color={colors.primary.blue}>
  Submit
</Text>
```

### Semantic Shorthand Components

For convenience, semantic component exports are available:

```tsx
import {
  Heading1, Heading2, Heading3,
  BodyText, BodyLarge, BodySmall,
  Caption, Label, ButtonText,
  Text
} from '@/components/common';

// Option 1: Use variant prop
<Text variant="h1">Heading</Text>

// Option 2: Use semantic component
<Heading1>Heading</Heading1>

// Both are equivalent and produce the same output
```

### Theme Integration

The Text component automatically uses theme colors via `useTheme()`:

```tsx
const MyComponent = () => {
  const { colors } = useTheme();

  return (
    <>
      {/* Automatically uses colors.text.primary */}
      <Text variant="h1">Heading</Text>

      {/* Can override with custom color */}
      <Text color={colors.text.secondary}>Secondary</Text>

      {/* Any valid color string works */}
      <Text color="#FF0000">Red text</Text>
    </>
  );
};
```

### Before and After

#### Before (Old Pattern)
```tsx
// Had to manually spread Typography and apply colors
<RNText style={[
  Typography.body,
  { color: colors.text.primary }
]}>
  Content
</RNText>
```

#### After (New Pattern)
```tsx
// Simple and semantic
<Text variant="body">Content</Text>
```

### Style Overrides

You can still override styles if needed:

```tsx
// Override line height
<Text variant="body" style={{ lineHeight: 28 }}>
  Custom line height
</Text>

// Combine with other props
<Text variant="h2" bold color={colors.accent.green} style={{ letterSpacing: 1 }}>
  Styled heading
</Text>
```

### TypeScript Support

Full TypeScript support with proper typing:

```tsx
import { Text, TextProps, TypographyVariant } from '@/components/common';

interface MyComponentProps {
  title: string;
  variant?: TypographyVariant;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  variant = 'h2'
}) => {
  return <Text variant={variant}>{title}</Text>;
};
```

### Best Practices

✅ **DO:**
- Use variant prop instead of hardcoding typography
- Use semantic component names for clarity
- Apply colors via useTheme() hook
- Use the Text component for all text in the app

❌ **DON'T:**
- Hardcode `fontSize` or `fontWeight`
- Manually spread `Typography` objects
- Use static `Colors` for text colors
- Create custom Text-like components

### Migration Guide

If you have existing code using the old pattern:

```tsx
// ❌ OLD
<Text style={[Typography.body, { color: colors.text.primary }]}>
  Hello
</Text>

// ✅ NEW
<Text variant="body">Hello</Text>
```

```tsx
// ❌ OLD
<Text style={[Typography.h1, { fontWeight: '600', color: colors.text.primary }]}>
  Heading
</Text>

// ✅ NEW
<Text variant="h1" bold>Heading</Text>
```

### Performance

The Text component is optimized for performance:
- Uses React.memo internally
- Minimal re-renders via useTheme hook
- All styles are applied efficiently
- No unnecessary style calculations

### Accessibility

The Text component inherits all accessibility props from React Native's Text:

```tsx
<Text
  variant="body"
  accessible
  accessibilityLabel="Main content"
  accessibilityHint="This is the main content area"
>
  Content
</Text>
```
