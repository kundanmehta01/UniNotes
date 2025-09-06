# UniNotesHub Design System - StudyHub Style

## Color Palette

### Primary Colors
- **Brand Blue**: `brand-500` (#0ea5e9) - Primary StudyHub blue for main actions
- **Academic Purple**: `academic-500` (#a855f7) - Accent color for academic content
- **Primary Blue**: `primary-500` (#3b82f6) - Secondary blue for system elements

### Semantic Colors
- **Success Green**: `success-500` (#22c55e) - Success states, approved content
- **Warning Orange**: `warning-500` (#f59e0b) - Warning states, pending content
- **Error Red**: `red-500` - Error states, rejected content

### Gray Scale
- **Text Colors**:
  - Primary text: `gray-900` (#0f172a)
  - Secondary text: `gray-600` (#475569)
  - Muted text: `gray-500` (#64748b)
- **Background Colors**:
  - Page background: `gray-50` (#f8fafc)
  - Card background: `white`
  - Subtle backgrounds: `gray-100` (#f1f5f9)

## Typography

### Font Stack
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, sans-serif

### Typography Scale
```css
.heading-1 { font-size: 3-6rem; font-weight: 700; } /* Hero headings */
.heading-2 { font-size: 1.875-2.25rem; font-weight: 700; } /* Page titles */
.heading-3 { font-size: 1.5rem; font-weight: 600; } /* Section headings */
.text-body { color: gray-600; line-height: 1.625; } /* Body text */
.text-muted { color: gray-500; font-size: 0.875rem; } /* Secondary text */
```

## Component Styles

### Buttons
```css
.btn-primary { /* Gradient brand button */ }
.btn-secondary { /* White button with brand border */ }
.btn-ghost { /* Transparent button */ }
```

### Cards
```css
.card { /* Basic card with shadow */ }
.card-interactive { /* Card with hover effects */ }
```

### Inputs
```css
.input-primary { /* Standard form input */ }
.input-search { /* Large search input */ }
```

### Badges
```css
.badge-primary { /* Brand colored badge */ }
.badge-success { /* Green success badge */ }
.badge-warning { /* Orange warning badge */ }
.badge-academic { /* Purple academic badge */ }
```

## Design Principles

### 1. Academic Professionalism
- Clean, professional appearance suitable for academic environments
- Emphasis on readability and accessibility
- Consistent spacing and typography hierarchy

### 2. StudyHub Inspiration
- Prominent search functionality
- Card-based layouts for content
- Subtle gradients and modern styling
- Intuitive navigation patterns

### 3. Color Usage Guidelines
- **Brand Blue** (`brand-500`): Primary actions, links, active states
- **Academic Purple** (`academic-500`): Academic content, special features
- **Success Green**: Approved content, positive actions
- **Warning Orange**: Pending content, caution states
- **Gray Scale**: Text hierarchy, backgrounds, borders

### 4. Spacing System
- Base unit: `0.25rem` (4px)
- Common spacing: `0.5rem`, `1rem`, `1.5rem`, `2rem`, `3rem`
- Component padding: `1.5rem` (24px) for cards
- Section padding: `2rem` (32px) for page sections

## Animation Guidelines

### Micro-Interactions
- Hover transitions: `200ms ease`
- Button interactions: Scale and shadow changes
- Card hovers: Lift effect with `translateY(-4px)`

### Page Transitions
- Fade in: `fadeIn 0.3s ease-out`
- Slide up: `slideUp 0.3s ease-out`
- Slide down: `slideDown 0.3s ease-out`

## Accessibility

### Focus States
- Visible focus rings: `2px solid brand-500`
- Focus offset: `2px`
- High contrast ratios maintained

### Color Contrast
- Text on white: Minimum AA compliance
- Interactive elements: Clear visual feedback
- Status indicators: Color + text/icon combinations

## Usage Examples

### Page Headers
```jsx
<h1 className="heading-2 text-gradient-brand mb-2">
  Browse Academic Papers
</h1>
<p className="text-body">
  Discover resources from top universities
</p>
```

### Cards
```jsx
<div className="card-interactive">
  <div className="p-6">
    <span className="badge-academic mb-3">Computer Science</span>
    <h3 className="heading-3 mb-2">Paper Title</h3>
    <p className="text-body">Description...</p>
  </div>
</div>
```

### Buttons
```jsx
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-ghost">Tertiary Action</button>
```

### Search Components
```jsx
<input className="input-search" placeholder="Search..." />
```

This design system ensures consistency across the UniNotesHub application while maintaining the StudyHub-inspired aesthetic and academic professionalism.
