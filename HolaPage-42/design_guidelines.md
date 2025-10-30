# Design Guidelines: Ultra-Minimal Dark Glassmorphism Landing

## Design Approach
**Selected Approach**: Custom aesthetic with dark glassmorphism as specified. This is a minimal utility page requiring refined elegance over functionality. Reference points: Apple's dark mode philosophy meets premium glassmorphism effects.

**Core Principle**: Create atmospheric depth through layered glass effects, subtle lighting, and precise typography in an ultra-dark environment.

---

## Design Elements

### Typography
**Primary Font**: "Inter" (Google Fonts) - 700 weight for "array"
- Display size: 96px desktop (text-8xl), 64px mobile (text-6xl)
- Letter spacing: Tight (-0.05em) for refined feel
- Color: Pure white (#FFFFFF) with subtle glow effect

**Icon**: Heroicons "X" mark (outline variant)
- Size: 24px standard, scales to 32px on interaction

---

### Layout System
**Spacing Primitives**: Tailwind units 4, 6, 8 for consistency

**Page Structure**:
- Full viewport height (100vh) - single screen experience
- Centered vertical and horizontal alignment (flex centering)
- No sections needed - single focal point design

**Component Positioning**:
- "array" text: Exact center
- Cross icon: Positioned 40px (p-10) from top-right corner
- Maintain 24px (p-6) minimum mobile edge spacing

---

### Glassmorphism Implementation

**Background Treatment**:
- Base layer: Very dark gradient (#0a0a0f to #161620)
- Noise texture overlay: 2% opacity for depth
- Radial gradient spotlight effect centered, subtle purple/blue tint (#1a1a2e)

**Glass Card for "array"**:
- Background: rgba(255, 255, 255, 0.03) - extremely subtle
- Backdrop blur: 40px (backdrop-blur-3xl)
- Border: 1px solid rgba(255, 255, 255, 0.08)
- Border radius: 24px (rounded-3xl)
- Padding: 48px horizontal, 32px vertical (px-12 py-8)
- Box shadow: Multi-layer
  - Inner glow: inset 0 1px 0 0 rgba(255,255,255,0.1)
  - Outer depth: 0 20px 60px rgba(0,0,0,0.5)

**Cross Icon Glass Container**:
- Background: rgba(255, 255, 255, 0.05)
- Backdrop blur: 20px (backdrop-blur-xl)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Size: 56px × 56px (w-14 h-14)
- Border radius: 16px (rounded-2xl)
- Box shadow: 0 8px 32px rgba(0,0,0,0.4)

---

### Interactive States

**Cross Icon Animation**:
- Default: Static with subtle pulse (scale animation 1.0 to 1.02, 3s duration, infinite)
- Touch/Hover: Scale to 1.1, rotate 90 degrees (transform transition 400ms ease-out)
- Active: Scale to 0.95
- Glow effect on interaction: 0 0 20px rgba(255,255,255,0.3)

**"array" Text Effect**:
- Subtle text-shadow glow: 0 0 40px rgba(255,255,255,0.15)
- No interaction states - static elegance

---

### Component Library

**Primary Components**:
1. **Glass Card Container** - Hosting "array" text
2. **Icon Button** - Cross mark with glass treatment
3. **Ambient Background** - Layered gradient with noise

**Responsive Behavior**:
- Desktop: Full scale as specified
- Mobile: Scale text to 64px, icon container to 48px, maintain proportions
- Icon button maintains top-right position on all viewports

---

### Animations

**Minimal Animation Strategy**:
- Cross icon pulse: 3-second loop, barely perceptible breathing effect
- Touch interaction: Single smooth 400ms transform
- Page load: 600ms fade-in for entire composition (opacity 0 to 1)
- No scroll animations (single viewport page)
- No background animations

---

### Technical Specifications

**Color Palette**:
- Background dark: #0a0a0f
- Background gradient end: #161620
- Accent tint: #1a1a2e
- Glass white: rgba(255, 255, 255, 0.03-0.1)
- Text: #FFFFFF
- Border: rgba(255, 255, 255, 0.08-0.1)

**Z-Index Hierarchy**:
- Background: 0
- Glass card: 10
- Text: 20
- Icon button: 30

**Performance Considerations**:
- Use CSS backdrop-filter with webkit prefix
- Single noise texture (SVG or small PNG)
- Optimize glass blur radius for mobile performance

---

### Images
**Hero Image**: None required. This page uses gradient backgrounds and atmospheric effects only.

---

### Accessibility
- Cross icon includes aria-label="Close" or "Exit"
- Maintain 4.5:1 contrast ratio for white text on dark glass
- Focus visible state for icon button: 2px white outline offset by 2px
- Keyboard navigation: Icon button focusable and activatable