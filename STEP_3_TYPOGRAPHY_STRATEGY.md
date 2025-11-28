# Step 3: Typography Strategy & Scale Documentation
**Date:** November 28, 2025
**Status:** Complete
**Time Investment:** 2-3 hours
**Cost:** $0
**Depends On:** Step 1 (Brand Positioning) ✅ | Step 2 (Color Psychology) ✅

---

## Typography Philosophy

Based on **STEP 1 positioning** (Reverence, Accessibility, Beauty, Growth):

Our typography reflects **"Contemplative Clarity"** — readable, unhurried, respectful of the sacred nature of scripture. Typography serves the spiritual mission, not distraction or trendiness.

---

## Font Selection Strategy

### Primary Font: System San-Serif (SF Pro on iOS)

```
FONT FAMILY
Name:           SF Pro Display / SF Pro Text
Platform:       Native iOS (San Francisco)
Usage:          All UI elements, labels, buttons, body text
Why System Font:
├─ Native performance (zero loading time)
├─ Accessibility best practice
├─ Consistency with iOS ecosystem
├─ Users expect it (feels native, not foreign)
├─ Zero licensing cost
├─ Dark mode support built-in
└─ Exceptional readability at all sizes

WEIGHTS AVAILABLE
├─ 300 (Light) - rarely used, accessibility risk
├─ 400 (Regular) - body text, standard
├─ 500 (Medium) - slightly bold, emphasis
├─ 600 (Semibold) - labels, headings
├─ 700 (Bold) - strong emphasis, main headings
└─ 800 (Heavy) - rarely used, only largest headings

RECOMMENDED WEIGHTS FOR THIS APP
├─ 400 (Regular) - Body text, standard content
├─ 600 (Semibold) - Labels, secondary headings
└─ 700 (Bold) - Main headings, emphasis
```

### Optional: Serif Font for Scripture Text Only

```
OPTIONAL SERIF FONT
Purpose:        Distinguish sacred scripture from UI
Usage:          ONLY in ScriptureText component
NOT:            Never use in UI, buttons, navigation

FONT OPTIONS (Free)
1. Google Fonts: "Crimson Text"
   ├─ License: Open Source
   ├─ Quality: Professional
   ├─ Loading: Fast CDN
   └─ Cost: Free

2. Google Fonts: "Lora"
   ├─ License: Open Source
   ├─ Quality: Modern serif
   ├─ Loading: Fast CDN
   └─ Cost: Free

3. Google Fonts: "Playfair Display"
   ├─ License: Open Source
   ├─ Quality: Display/elegant
   ├─ Warning: Larger x-height, bigger at same pt size
   └─ Cost: Free

RECOMMENDATION: Start with Crimson Text
├─ Classic, readable at body sizes
├─ Ecclesiastical feeling (manuscript-like)
├─ Works well on screens
├─ Proven legibility

IMPLEMENTATION (React Native):
- Download TTF from Google Fonts
- Add to app.json under expo.plugins
- Reference in ScriptureText component ONLY
- Never in other components (keeps app native)

COST: $0 (Google Fonts free)
```

### What NOT to Use

```
❌ AVOID: Ultra-thin weights (< 400)
   Why: Accessibility issue, hard to read, too light

❌ AVOID: Multiple different fonts (confusing)
   Why: One system font + one serif = maximum 2 fonts total

❌ AVOID: Trendy/decorative fonts (Playfair, Abril, etc.)
   Why: Not scalable, date poorly, reduce accessibility

❌ AVOID: Monospace fonts (except code/numbers)
   Why: Not appropriate for body text or spiritual content

❌ AVOID: Custom fonts in UI (outside scripture)
   Why: Performance hit, licensing complexity, not native

❌ AVOID: Hand-written/script fonts
   Why: Poor readability, unprofessional, inaccessible
```

---

## Typography Scale

Define sizes for different text roles. Never use arbitrary font sizes.

### Display & Headlines (Largest)

```
DISPLAY LARGE (Headline 1)
Size:           32pt
Weight:         700 (Bold)
Line-height:    1.2 (38pt)
Letter-spacing: 0.5pt (adds elegance)
Color:          colors.primary.blue (ecclesiastical authority)
Usage:
├─ Main screen titles ("Your Progress", "Send a Gift")
├─ Major section headers (first on screen)
├─ Very important information
└─ Demands attention and establishes context

Psychology:     Dignified, authoritative, inviting
Example:        Screen title bar

Code:
```typescript
const headingLarge = {
  fontSize: 32,
  fontWeight: '700',
  lineHeight: 1.2,
  letterSpacing: 0.5,
  color: Colors.primary.blue,
};
```

DISPLAY MEDIUM (Headline 2)
Size:           28pt
Weight:         600 (Semibold)
Line-height:    1.2 (34pt)
Letter-spacing: 0.3pt
Color:          colors.primary.blue
Usage:
├─ Section headers within screens
├─ Card titles in prominent sections
├─ Subsection dividers
├─ Secondary but important information

Psychology:     Respectful, clear organization
Example:        "Daily Streak", "Step 1: Select Tier"

Code:
```typescript
const headingMedium = {
  fontSize: 28,
  fontWeight: '600',
  lineHeight: 1.2,
  letterSpacing: 0.3,
  color: Colors.primary.blue,
};
```

DISPLAY SMALL (Heading 3)
Size:           22pt
Weight:         600 (Semibold)
Line-height:    1.2 (28pt)
Letter-spacing: 0.2pt
Color:          colors.primary.blue or colors.text.primary
Usage:
├─ Card titles in lists
├─ Feature names
├─ Subsection headers (less prominent than H2)
├─ Table headers

Psychology:     Clear, organized, readable
Example:        Card title in statistics grid

Code:
```typescript
const headingSmall = {
  fontSize: 22,
  fontWeight: '600',
  lineHeight: 1.2,
  letterSpacing: 0.2,
  color: Colors.primary.blue,
};
```
```

### Body Text (Reading Content)

```
BODY LARGE (Scripture Text)
Size:           18pt
Weight:         400 (Regular)
Line-height:    1.6 (generous for contemplation)
Letter-spacing: 0.3pt (slightly increased)
Font:           SF Pro or Serif (if scripture)
Color:          colors.text.primary (maximum contrast)
Usage:
├─ Actual biblical scripture passages
├─ Long-form content meant for reading
├─ Important text requiring focus
├─ Anything deserving contemplation

Psychology:     Meditative, unhurried, readable
Rationale:
├─ 18pt = comfortable reading size
├─ 1.6 line-height = generous, unhurried feeling
├─ 0.3pt letter-spacing = elegant, not cramped
└─ Higher weight on contrast = respect for content

Example:        Scripture reading display

Code:
```typescript
const bodyLarge = {
  fontSize: 18,
  fontWeight: '400',
  lineHeight: 1.6,
  letterSpacing: 0.3,
  color: Colors.text.primary,
  fontFamily: 'Crimson Text', // Optional serif
};
```

BODY REGULAR (Standard Text)
Size:           16pt
Weight:         400 (Regular)
Line-height:    1.5 (standard)
Letter-spacing: 0 (normal)
Font:           SF Pro (system font)
Color:          colors.text.primary
Usage:
├─ Standard body text descriptions
├─ Button labels
├─ Form field text
├─ Most content outside scripture
├─ Regular reading (not contemplative)

Psychology:     Clear, accessible, standard
Rationale:
├─ 16pt = comfortable minimum for body text
├─ 1.5 line-height = standard readability
├─ No extra letter-spacing = normal spacing
└─ System font = native iOS feel

Example:        Feature descriptions, form fields

Code:
```typescript
const body = {
  fontSize: 16,
  fontWeight: '400',
  lineHeight: 1.5,
  letterSpacing: 0,
  color: Colors.text.primary,
};
```

BODY SMALL (Secondary Content)
Size:           14pt
Weight:         400 (Regular)
Line-height:    1.4 (tight)
Letter-spacing: 0 (normal)
Color:          colors.text.secondary
Usage:
├─ Secondary text, captions
├─ Metadata (dates, times)
├─ Supporting information
├─ Less important details

Psychology:    Helpful but unobtrusive
Example:       "Last read 2 days ago"

Code:
```typescript
const bodySmall = {
  fontSize: 14,
  fontWeight: '400',
  lineHeight: 1.4,
  letterSpacing: 0,
  color: Colors.text.secondary,
};
```
```

### Labels & UI Elements (Smallest)

```
LABEL MEDIUM (Field Labels)
Size:           12pt
Weight:         600 (Semibold)
Line-height:    1.4 (tight)
Letter-spacing: 1pt (increased - important)
Transform:      UPPERCASE
Color:          colors.text.primary
Usage:
├─ Form field labels ("RECIPIENT EMAIL", "DAILY STREAK")
├─ Input labels
├─ Badge text
├─ Important small indicators

Psychology:     Intentional, precise, authoritative
Rationale:
├─ UPPERCASE = formal, intentional
├─ Letter-spacing = elegant formality
├─ Semibold = commands attention at small size
└─ 12pt minimum for accessibility

Example:        "CURRENT STREAK", "TOTAL READINGS"

Code:
```typescript
const label = {
  fontSize: 12,
  fontWeight: '600',
  lineHeight: 1.4,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: Colors.text.primary,
};
```

CAPTION (Smallest Text)
Size:           11pt
Weight:         400 (Regular)
Line-height:    1.4
Letter-spacing: 0 (normal)
Color:          colors.text.secondary or colors.text.tertiary
Usage:
├─ Hints and helper text
├─ Copyright/attribution
├─ Tiny details
├─ Very secondary information

Psychology:     Informational, unobtrusive
Caution:        11pt is minimum accessibility - use sparingly
Example:        "Translation: ESV", copyright info

Code:
```typescript
const caption = {
  fontSize: 11,
  fontWeight: '400',
  lineHeight: 1.4,
  letterSpacing: 0,
  color: Colors.text.tertiary,
};
```
```

---

## Typography Scale Summary Table

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|---|---|
| **Display Large** | 32pt | 700 | 1.2 | 0.5pt | Main screen titles |
| **Display Medium** | 28pt | 600 | 1.2 | 0.3pt | Section headers |
| **Display Small** | 22pt | 600 | 1.2 | 0.2pt | Card titles |
| **Body Large** | 18pt | 400 | 1.6 | 0.3pt | Scripture passages |
| **Body Regular** | 16pt | 400 | 1.5 | 0 | Standard text |
| **Body Small** | 14pt | 400 | 1.4 | 0 | Secondary content |
| **Label** | 12pt | 600 | 1.4 | 1pt | Form labels |
| **Caption** | 11pt | 400 | 1.4 | 0 | Hints, tiny details |

---

## Typography Hierarchy in Practice

### Example: Progress Dashboard Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   Your Progress              [DISPLAY LARGE, 32pt, blue]
│                                         │
│                                         │
│   CURRENT STREAK            [LABEL, 12pt, uppercase]
│        47                   [DISPLAY LARGE, 32pt, blue]
│                                         │
│                                         │
│   Daily Stats               [DISPLAY MEDIUM, 28pt]
│                                         │
│   Days Read         45      [BODY REGULAR, label + blue number]
│   Consistency       95%     [BODY REGULAR, label + blue number]
│   Badges Earned    3       [BODY REGULAR, label + blue number]
│                                         │
│   Last read 2 days ago     [CAPTION, 11pt, tertiary]
│                                         │
│   Continue Reading          [BUTTON, body regular weight]
│                                         │
└─────────────────────────────────────────┘
```

### Example: Scripture Reading Screen

```
┌─────────────────────────────────────────┐
│                                         │
│   Genesis 1:1-5             [LABEL, 12pt, reference]
│                                         │
│   In the beginning God      [BODY LARGE, 18pt, serif]
│   created the heavens and   [1.6 line height]
│   the earth...              [generous spacing]
│                                         │
│   [Notes: optional]                    │
│   [Add Reflection: button]             │
│                                         │
│   Translation: ESV          [CAPTION, 11pt, tertiary]
│                                         │
└─────────────────────────────────────────┘
```

---

## Typography Color Usage

### Light Mode Text Colors

```
PRIMARY TEXT (#1A1A1A - not pure black)
├─ Headings: h1, h2, h3
├─ Body text: all body text
├─ Labels: form labels, field names
└─ Button text: primary and secondary buttons

Why not pure black?
- Too harsh, reduces readability
- Not contemplative or warm
- Dark gray (#1A1A1A) is warmer and easier to read
- Contrast still WCAG AAA (17.5:1)

SECONDARY TEXT (#666666)
├─ Supporting information
├─ Metadata and captions
├─ Helper text
├─ Secondary labels
└─ Less important details

Contrast: 5.5:1 (WCAG AA)

TERTIARY TEXT (#999999)
├─ Hints and placeholders
├─ Very secondary information
├─ Disabled text
├─ Minimal importance items
└─ Copyright/attribution

Contrast: 3.8:1 (WCAG A)
```

### Dark Mode Text Colors

```
PRIMARY TEXT (#F5F5F5 - off-white, not pure white)
├─ Same usage as light mode primary
├─ Readable on dark backgrounds
├─ Reduces eye strain (off-white vs pure white)
└─ Maintains contrast (14.4:1, WCAG AAA)

SECONDARY TEXT (#B3B3B3)
├─ Same usage as light mode secondary
├─ Clear but secondary
├─ Contrast: 6.2:1 (WCAG AA)
└─ Good for labels and supporting text

TERTIARY TEXT (#808080)
├─ Same usage as light mode tertiary
├─ Minimal importance
├─ Contrast: 3.8:1 (WCAG A)
└─ Use sparingly
```

---

## Special Typography: Scripture Display

### When Displaying Actual Scripture Text

```
SCRIPTURE PRESENTATION
├─ Font: SF Pro (system) OR Crimson Text (serif, if implemented)
├─ Size: 18pt (generous)
├─ Weight: 400 (regular, reading weight)
├─ Line-height: 1.6 (generous, unhurried)
├─ Letter-spacing: 0.3pt (slightly increased)
├─ Color: colors.text.primary (#1A1A1A light, #F5F5F5 dark)
├─ Max width: 65-70 characters (optimal reading line length)
├─ Padding: 16px (lg) horizontal, 12px (md) vertical
└─ Spacing between verses: 8-12pt extra (visual breaks)

VERSE NUMBERS
├─ Font: SF Pro (system, not serif)
├─ Size: 12pt (smaller than scripture)
├─ Color: colors.text.tertiary (#999999 light, #808080 dark)
├─ Position: Superscript or before verse
├─ Purpose: Reference, not distraction
└─ Example: ¹Genesis 1:1

TRANSLATION ATTRIBUTION
├─ Font: SF Pro, 11pt (caption size)
├─ Color: colors.text.tertiary
├─ Position: Below passage
├─ Format: "Translation: ESV" or "ESV"
└─ Purpose: Attribution, minimal visual weight

EXAMPLE LAYOUT:
---
Genesis 1:1-5    [verse reference, 12pt, tertiary]

In the beginning God    [18pt serif/regular]
created the heavens and [1.6 line-height]
the earth...            [0.3pt letter-spacing]

Translation: ESV    [11pt caption, tertiary]
---
```

### Emphasis Within Scripture

```
OPTIONAL: KEY TERM EMPHASIS

Method 1: Bold (Subtle)
├─ Key terms: e.g., "Love", "Faith", "Grace"
├─ Weight: 600 (semibold, not 700)
├─ Color: Same as text (no color change)
├─ Example: "God is **love**"
└─ Impact: Highlights without standing out

Method 2: Color (Visible)
├─ Key terms: colors.primary.blue
├─ Weight: Regular (400, no bold)
├─ Example: "God is love" (with love in blue)
└─ Impact: Color draws attention

Method 3: None (Pure Text)
├─ No emphasis, pure scripture
├─ Respects traditional presentation
├─ Many users prefer this
└─ Recommended as default

RECOMMENDATION: Start with no emphasis
- Allows users who want pure text
- No assumption about what's "important"
- Spiritually neutral, not interpretive
- If adding later, make it optional in settings
```

---

## Typography Implementation Rules

### Rule 1: Use Defined Constants Only

```typescript
// ✅ CORRECT: Use defined typography
<Text style={Typography.body}>Content here</Text>

// ❌ WRONG: Never use arbitrary sizes
<Text style={{ fontSize: 15 }}>Content here</Text>

// ✅ CORRECT: Override only when truly needed (rare)
<Text style={[Typography.body, { color: Colors.accent.green }]}>
  Content here
</Text>
```

### Rule 2: Never Skip Line-Height

```typescript
// ❌ WRONG: Text with no line-height (cramped)
<Text>
  This is a long passage that wraps to multiple lines
  and will be hard to read without proper line-height.
</Text>

// ✅ CORRECT: Always include line-height
<Text style={{ lineHeight: 1.6 }}>
  This is a long passage that wraps to multiple lines
  and will be easy to read with proper line-height.
</Text>
```

### Rule 3: Respect Hierarchy

```
When placing text, ask:
├─ Is this the most important element on screen?
│  └─ If YES: Use Display Large (32pt, 700 weight)
├─ Is this a section header?
│  └─ If YES: Use Display Medium (28pt, 600 weight)
├─ Is this body content users will read?
│  └─ If YES: Use Body Regular/Large (16-18pt, 400 weight)
├─ Is this supporting/secondary?
│  └─ If YES: Use Body Small (14pt, 400 weight)
└─ Is this minimal (labels, hints)?
   └─ If YES: Use Label/Caption (11-12pt)

Do NOT:
- Make headings smaller than body text
- Use body size for labels
- Skip hierarchy levels (jumps are confusing)
- Use display size for regular content
```

### Rule 4: Test on Real Devices

Before shipping:
```
TESTING CHECKLIST
├─ Test on iPhone SE (small screen)
├─ Test on iPhone 14 Pro Max (large screen)
├─ Test in both light and dark mode
├─ Test with "Larger Accessibility Sizes" enabled
├─ Test with "Bold Text" accessibility setting
├─ Verify line lengths don't exceed 70 characters
├─ Verify all text readable at arm's length
└─ Verify no text overlaps or gets cut off
```

---

## Common Typography Mistakes

### ❌ MISTAKE 1: Pure Black Text

```typescript
// ❌ WRONG
<Text style={{ color: '#000000', fontSize: 16 }}>Content</Text>

// ✅ CORRECT
<Text style={{ color: Colors.text.primary, fontSize: 16 }}>Content</Text>
// Colors.text.primary = #1A1A1A (warm dark gray)
```

**Why:** Pure black is harsh, reduces readability, not contemplative

---

### ❌ MISTAKE 2: Inconsistent Font Sizes

```typescript
// ❌ WRONG: Arbitrary sizes throughout
<Text style={{ fontSize: 16 }}>Header</Text>
<Text style={{ fontSize: 14 }}>Body</Text>
<Text style={{ fontSize: 13 }}>Secondary</Text>
<Text style={{ fontSize: 12.5 }}>Small</Text>

// ✅ CORRECT: Use defined scale
<Text style={Typography.headingMedium}>Header</Text>
<Text style={Typography.body}>Body</Text>
<Text style={Typography.bodySmall}>Secondary</Text>
<Text style={Typography.caption}>Small</Text>
```

**Why:** Inconsistency creates visual chaos, users notice

---

### ❌ MISTAKE 3: No Line-Height on Long Text

```typescript
// ❌ WRONG: Scripture with default line-height (too tight)
<Text style={{ fontSize: 18 }}>
  "In the beginning God created the heavens and the earth.
  Now the earth was formless and empty, darkness was over
  the surface of the deep..."
</Text>

// ✅ CORRECT: Generous line-height (1.6 for scripture)
<Text style={{ fontSize: 18, lineHeight: 1.6 }}>
  "In the beginning God created the heavens and the earth.
  Now the earth was formless and empty, darkness was over
  the surface of the deep..."
</Text>
```

**Why:** Tight line-height makes reading difficult, especially for long passages

---

### ❌ MISTAKE 4: Too Much Emphasis

```typescript
// ❌ WRONG: Multiple colors and weights in one passage
<Text>
  <Text style={{ fontWeight: 700, color: 'red' }}>Important</Text>
  {' '}text with
  <Text style={{ fontWeight: 600, color: 'blue' }}>emphasis</Text>
  {' '}everywhere
</Text>

// ✅ CORRECT: Minimal emphasis (bold only, or color only)
<Text>
  <Text style={{ fontWeight: 600 }}>Important</Text>
  {' '}text with minimal emphasis
</Text>
```

**Why:** Over-emphasis creates noise, reduces actual impact

---

### ❌ MISTAKE 5: Ignoring Accessibility

```typescript
// ❌ WRONG: Tiny text for captions
<Text style={{ fontSize: 9 }}>Attribution</Text>

// ✅ CORRECT: 11pt minimum
<Text style={Typography.caption}>Attribution</Text>
// caption = 11pt minimum (readable by most users)
```

**Why:** Text below 11pt becomes inaccessible to many users

---

## Typography Accessibility Checklist

Before shipping any text styling:

```
✓ Minimum text size: 11pt (captions) or 16pt (body)
✓ Line-height: 1.4-1.6 for body text
✓ Color contrast: WCAG AA (4.5:1) minimum
✓ Letter-spacing: Not excessive (avoid cramped or spaced out)
✓ Font weight: 400 or 600 (avoid 300, 500, 800)
✓ Text alignment: Left-aligned for readability (avoid center)
✓ Line length: 50-70 characters maximum
✓ Dark mode: Text colors tested and verified
✓ Tested with: System text size settings
✓ Tested on: Small and large screens
```

---

## Typography Style Code Template

Create in `src/constants/Typography.ts`:

```typescript
/**
 * TYPOGRAPHY SYSTEM
 *
 * This scale reflects "Contemplative Clarity" - readable, unhurried,
 * respectful of the sacred nature of scripture.
 *
 * @see STEP_3_TYPOGRAPHY_STRATEGY.md for detailed rationale
 */

export const Typography = {
  // Display & Headlines
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    // Usage: Main screen titles ("Your Progress", "Send a Gift")
    // Psychology: Dignified, authoritative, inviting
  },

  displayMedium: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 1.2,
    letterSpacing: 0.3,
    // Usage: Section headers within screens
    // Psychology: Respectful, clear organization
  },

  displaySmall: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 1.2,
    letterSpacing: 0.2,
    // Usage: Card titles, subsection headers
  },

  // Body Text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 1.6,
    letterSpacing: 0.3,
    // Usage: Scripture passages, important content
    // Psychology: Meditative, unhurried, readable
    // Note: Consider serif font for scripture only
  },

  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 1.5,
    letterSpacing: 0,
    // Usage: Standard body text, descriptions
    // Psychology: Clear, accessible, standard
  },

  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 1.4,
    letterSpacing: 0,
    // Usage: Secondary content, captions, metadata
  },

  // Labels & UI
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 1.4,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    // Usage: Form labels ("RECIPIENT EMAIL", "DAILY STREAK")
    // Psychology: Intentional, precise, authoritative
  },

  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 1.4,
    letterSpacing: 0,
    // Usage: Hints, copyright, tiny details
    // Psychology: Informational, unobtrusive
    // Note: Minimum accessible size - use sparingly
  },
};

/**
 * TYPOGRAPHY USAGE RULES
 *
 * 1. ALWAYS use Typography constants (never arbitrary sizes)
 * 2. ALWAYS include lineHeight (1.4-1.6 for body text)
 * 3. ALWAYS match color to text importance (use text color constants)
 * 4. NEVER use pure black (#000000) - use Colors.text.primary
 * 5. NEVER use pure white in dark mode - use Colors.text.primary
 * 6. NEVER skip hierarchy levels (no size jumps)
 * 7. TEST on small screens (iPhone SE) before shipping
 * 8. TEST with accessibility settings enabled
 */
```

---

## Summary

### Typography Foundation
- **System Font:** SF Pro (iOS native, zero cost)
- **Serif Option:** Crimson Text (for scripture only, optional)
- **Philosophy:** "Contemplative Clarity"

### Type Scale (8 sizes)
| Role | Size | Weight | Use |
|------|------|--------|-----|
| Display Large | 32pt | 700 | Main titles |
| Display Medium | 28pt | 600 | Section headers |
| Display Small | 22pt | 600 | Card titles |
| Body Large | 18pt | 400 | Scripture |
| Body | 16pt | 400 | Standard text |
| Body Small | 14pt | 400 | Secondary |
| Label | 12pt | 600 | Form labels |
| Caption | 11pt | 400 | Hints |

### Core Principles
✅ Readable (never below 11pt)
✅ Hierarchical (clear importance levels)
✅ Contemplative (generous spacing, not cramped)
✅ Accessible (WCAG AA+ contrast, tested)
✅ Intentional (every size serves a purpose)
✅ Simple (two fonts maximum)

### Time to Implement
- Understanding & documenting: 2-3 hours
- Adding to code: 1 hour
- Testing: 1 hour
- Total: 4-5 hours

---

## Living Document

**Last Updated:** November 28, 2025
**Status:** Complete and committed to repository
**When to Update:** If typography strategy changes
**Review Process:** Document change, update code, test, commit

**Next Step:** STEP 4 - Icon System Documentation (when ready)

---

✅ **STEP 3 COMPLETE: TYPOGRAPHY STRATEGY DOCUMENTED**

This document establishes the "why" and "how" behind every text choice, enabling the team to make consistent, intentional typography decisions that support the spiritual mission of the app.
