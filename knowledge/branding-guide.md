# Campus Pulse Branding Guide

## Overview

Campus Pulse is a modern, accessible issue triage portal for Jamia Hamdard. The visual identity emphasizes clarity, trust, and efficiency through a clean, minimal design language.

---

## Color System

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `oklch(0.765 0.177 163.2)` | Primary actions, links, focus states (Emerald 500) |
| `--primary-foreground` | `oklch(0.985 0 0)` | Text on primary backgrounds |

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--background` | `oklch(0.985 0 0)` | `oklch(0.141 0.005 285.823)` | Page backgrounds |
| `--foreground` | `oklch(0.141 0.005 285.823)` | `oklch(0.985 0 0)` | Primary text |
| `--muted` | `oklch(0.967 0.001 286.375)` | `oklch(0.274 0.006 286.033)` | Secondary backgrounds |
| `--muted-foreground` | `oklch(0.552 0.016 285.938)` | `oklch(0.705 0.015 286.067)` | Secondary text |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error states, delete actions |

### Status Colors

| Status | Color | Hex Equivalent |
|--------|-------|----------------|
| Open | Amber | `#f59e0b` |
| In Progress | Blue | `#3b82f6` |
| Resolved | Emerald | `#10b981` |

### Priority Colors

| Priority | Color | Usage |
|----------|-------|-------|
| Critical | Red | Highest urgency issues |
| High | Orange | High priority issues |
| Medium | Yellow | Standard priority |
| Low | Green | Low priority issues |

---

## Typography

### Font Families

- **Primary (Sans)**: Geist Sans - Used for all body text, headings, and UI elements
- **Monospace**: Geist Mono - Used for metrics, data values, and code

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 3rem (48px) | 700 | 1.1 | Hero headlines |
| H1 | 2.25rem (36px) | 600 | 1.2 | Page titles |
| H2 | 1.875rem (30px) | 600 | 1.25 | Section headers |
| H3 | 1.5rem (24px) | 600 | 1.3 | Card titles |
| H4 | 1.25rem (20px) | 500 | 1.4 | Subsections |
| Body | 1rem (16px) | 400 | 1.5 | Paragraphs |
| Small | 0.875rem (14px) | 400 | 1.5 | Captions, labels |
| Tiny | 0.75rem (12px) | 500 | 1.4 | Badges, metadata |

---

## Spacing

### Base Unit

The spacing system uses a 4px base unit for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Inline element spacing |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page section margins |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Major section breaks |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 0.375rem (6px) | Badges, small chips |
| `--radius-md` | 0.5rem (8px) | Inputs, small buttons |
| `--radius-lg` | 0.625rem (10px) | Cards, modals |
| `--radius-xl` | 1rem (16px) | Large containers |
| `--radius-full` | 9999px | Circular avatars, pills |

---

## Shadows

| Level | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |

---

## Design Principles

### 1. Clarity First

- Use clear, descriptive labels
- Maintain consistent visual hierarchy
- Avoid ambiguous icons without labels

### 2. Generous Whitespace

- Give elements room to breathe
- Use spacing to group related content
- Avoid cluttered layouts

### 3. Progressive Disclosure

- Show essential information first
- Use expandable sections for details
- Don't overwhelm users with options

### 4. Immediate Feedback

- Respond to user actions instantly
- Show loading states for async operations
- Provide clear success/error messages

### 5. Accessibility

- Maintain WCAG 2.1 AA contrast ratios
- Support keyboard navigation
- Use semantic HTML elements
- Provide focus indicators

---

## Component Guidelines

### Buttons

- **Primary**: Green background, white text - Main actions
- **Secondary**: Gray background - Alternative actions
- **Outline**: Border only - Tertiary actions
- **Destructive**: Red - Delete/cancel actions
- **Ghost**: No background - Subtle actions

### Cards

- White background (dark: dark gray)
- Subtle border or shadow
- Consistent padding (20px)
- Clear content hierarchy

### Forms

- Labels above inputs
- Placeholder text for hints (not labels)
- Inline validation messages
- Clear required field indicators

### Status Badges

- Rounded pill shape
- Color-coded backgrounds
- Uppercase or capitalized text
- Small, consistent sizing

---

## Iconography

- **Library**: Lucide React
- **Size**: 16px (small), 20px (medium), 24px (large)
- **Style**: Outline/stroke icons (2px stroke)
- **Color**: Inherit from text color

---

## Motion

### Transitions

- **Duration**: 150ms (micro), 200ms (standard), 300ms (emphasis)
- **Easing**: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes

### Principles

- Use motion purposefully
- Keep animations subtle
- Respect reduced motion preferences

---

## Brand Assets

### Logo Usage

- Campus Pulse wordmark in Geist Sans Bold
- Green accent on "Pulse" or icon
- Minimum clear space: 16px on all sides

### Institutional Affiliation

- "A Jamia Hamdard Initiative" tagline
- University branding in footer only
