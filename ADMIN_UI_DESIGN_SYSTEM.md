# Admin Panel UI Design System

## Color Palette

### Primary Colors
```css
/* Main Admin Theme */
--admin-primary: #7E3AF2;      /* Purple */
--admin-primary-hover: #6C2BD9; /* Darker Purple */
--admin-background: #EDE4FF;    /* Light Purple Background */

/* Status Colors */
--status-active: #10B981;       /* Green */
--status-active-bg: #D1FAE5;    /* Light Green */

--status-pending: #F59E0B;      /* Yellow/Orange */
--status-pending-bg: #FEF3C7;   /* Light Yellow */

--status-resolved: #6B7280;     /* Gray */
--status-resolved-bg: #F3F4F6;  /* Light Gray */

--status-error: #EF4444;        /* Red */
--status-error-bg: #FEE2E2;     /* Light Red */
```

### Gradient Variants
```css
/* Success/Active */
.gradient-green {
  background: linear-gradient(to bottom right, #D1FAE5, #A7F3D0);
  border-color: #6EE7B7;
}

/* Warning/Pending */
.gradient-yellow {
  background: linear-gradient(to bottom right, #FEF3C7, #FDE68A);
  border-color: #FCD34D;
}

/* Info/Neutral */
.gradient-blue {
  background: linear-gradient(to bottom right, #DBEAFE, #BFDBFE);
  border-color: #93C5FD;
}

/* Premium/Purple */
.gradient-purple {
  background: linear-gradient(to bottom right, #EDE9FE, #DDD6FE);
  border-color: #C4B5FD;
}
```

## Typography

### Headings
```css
/* Page Title */
.heading-1 {
  font-size: 1.875rem;  /* 30px */
  font-weight: 700;
  color: #111827;
}

/* Section Title */
.heading-2 {
  font-size: 1.5rem;    /* 24px */
  font-weight: 700;
  color: #1F2937;
}

/* Card Title */
.heading-3 {
  font-size: 1.125rem;  /* 18px */
  font-weight: 600;
  color: #374151;
}
```

### Body Text
```css
/* Primary */
.text-primary {
  font-size: 0.875rem;  /* 14px */
  color: #4B5563;
}

/* Secondary/Caption */
.text-secondary {
  font-size: 0.75rem;   /* 12px */
  color: #6B7280;
}

/* Label */
.text-label {
  font-size: 0.875rem;  /* 14px */
  font-weight: 600;
  color: #374151;
}
```

## Components

### Card Component
```tsx
<div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
  {/* Content */}
</div>
```

**Variants**:
- Default: White background, subtle border
- Gradient: Colored gradient background for stats
- Hover: Add `hover:border-[#7E3AF2] hover:shadow-md transition`

### Tab Navigation
```tsx
<div className="flex items-center gap-1 border-b border-gray-200">
  <button className={`
    flex items-center gap-2 px-4 py-3 border-b-2 transition-colors
    ${active 
      ? 'border-[#7E3AF2] text-[#7E3AF2] font-medium' 
      : 'border-transparent text-gray-600 hover:text-gray-900'}
  `}>
    <Icon size={16} />
    <span className="text-sm">Tab Label</span>
  </button>
</div>
```

### Metric Card
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
  <div className="flex items-center justify-between mb-2">
    <div className="text-xs text-gray-500 font-medium">Metric Label</div>
    <Icon size={16} className="text-gray-400" />
  </div>
  <div className="text-2xl font-bold text-gray-900">1,234</div>
  {/* Optional trend indicator */}
  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
    <ArrowUp size={12} />
    <span>+12.5%</span>
  </div>
</div>
```

### Status Badge
```tsx
{/* Active/Open */}
<span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Active
</span>

{/* Pending */}
<span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
  Pending
</span>

{/* Resolved */}
<span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
  Resolved
</span>
```

### Search Input
```tsx
<div className="relative w-full max-w-md">
  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm 
               focus:outline-none focus:ring-2 focus:ring-[#7E3AF2] focus:border-transparent"
  />
</div>
```

### Primary Button
```tsx
<button className="
  flex items-center gap-2 px-4 py-2 
  bg-[#7E3AF2] text-white rounded-lg 
  hover:bg-[#6C2BD9] transition 
  font-medium text-sm
  disabled:opacity-60
">
  <Icon size={16} />
  Button Text
</button>
```

### Secondary Button
```tsx
<button className="
  flex items-center gap-2 px-4 py-2 
  bg-white text-[#7E3AF2] border border-[#7E3AF2] rounded-lg 
  hover:bg-purple-50 transition 
  font-medium text-sm
">
  <Icon size={16} />
  Button Text
</button>
```

## Layouts

### Page Layout
```tsx
<div className="min-h-screen" style={{ backgroundColor: '#EDE4FF' }}>
  <div className="max-w-7xl mx-auto py-8 px-4">
    {/* Header */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
      <p className="text-sm text-gray-600 mt-1">Page description</p>
    </div>

    {/* Main Card Container */}
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* Content */}
    </div>
  </div>
</div>
```

### Grid Layouts
```tsx
{/* 5-column grid for stats */}
<div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
  {/* Cards */}
</div>

{/* 3-column grid for cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

{/* 2-column grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Cards */}
</div>
```

### Table Layout
```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 border-b-2 border-gray-200">
      <tr>
        <th className="text-left py-3 px-4 font-semibold text-gray-700">Header</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4 text-gray-600">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Spacing System

```css
/* Consistent spacing */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */

/* Common patterns */
.card-padding: 1.5rem;      /* 24px - p-6 */
.section-gap: 1.5rem;       /* 24px - gap-6 */
.page-padding: 2rem 1rem;   /* py-8 px-4 */
```

## Border Radius

```css
/* Consistent rounding */
--radius-sm: 0.5rem;    /* 8px - rounded-lg */
--radius-md: 0.75rem;   /* 12px - rounded-xl */
--radius-lg: 1.5rem;    /* 24px - rounded-3xl */
--radius-full: 9999px;  /* Full circle - rounded-full */
```

## Shadow System

```css
/* Card shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);          /* shadow-sm */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);        /* shadow-md */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);      /* shadow-lg */
```

## Icon System

### Size Guidelines
```tsx
// Small (inline with text)
<Icon size={14} />

// Medium (buttons, cards)
<Icon size={16} />

// Large (headings)
<Icon size={20} />

// Extra Large (empty states)
<Icon size={24} />
```

### Common Icons (lucide-react)
- **TrendingUp**: Metrics, growth
- **Users**: User-related features
- **Store**: Markets
- **Activity**: Bets, actions
- **DollarSign**: Money, volume
- **Clock**: Pending, time
- **CheckCircle**: Resolved, success
- **AlertTriangle**: Warnings
- **Plus**: Create actions
- **Search**: Search functionality
- **RefreshCw**: Sync/reload
- **ChevronRight**: Navigation, links

## Animation & Transitions

```css
/* Standard transition */
.transition {
  transition-property: all;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover states */
.hover-scale {
  transition: transform 150ms;
}
.hover-scale:hover {
  transform: scale(1.02);
}
```

## Responsive Breakpoints

```css
/* Mobile First */
sm:  640px   /* Small devices */
md:  768px   /* Medium devices */
lg:  1024px  /* Large devices */
xl:  1280px  /* Extra large devices */
2xl: 1536px  /* 2X large devices */
```

### Usage Examples
```tsx
{/* Stack on mobile, 2 cols on medium, 3 cols on large */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Full width on mobile, constrained on larger screens */}
<div className="w-full max-w-md">

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
```

## Best Practices

### Consistency
1. Always use the admin purple theme (`#7E3AF2`)
2. Use `rounded-3xl` for main cards
3. Use `rounded-xl` for nested cards
4. Maintain consistent spacing (multiples of 4px)

### Accessibility
1. Minimum text size: 12px (0.75rem)
2. Sufficient color contrast (WCAG AA)
3. Focus states on all interactive elements
4. Icon + text for better comprehension

### Performance
1. Use Tailwind classes instead of inline styles
2. Minimize custom CSS
3. Lazy load heavy components
4. Optimize images and icons

### User Experience
1. Clear visual hierarchy
2. Consistent navigation patterns
3. Immediate feedback on actions
4. Loading states for async operations
5. Error messages with context
