# Bundle Size Optimization (CRITICAL)

Reduce JavaScript sent to the browser for faster initial loads and better performance.

## bundle-barrel-imports: Avoid Barrel Files

**Problem**: Importing from barrel files (`index.ts`) pulls in entire module

❌ **Bad**:

```typescript
// components/index.ts exports 50 components
export { Button } from './Button';
export { Modal } from './Modal';
export { Table } from './Table';
// ... 47 more

// Your component
import { Button } from '@/components'; // Pulls in all 50 components!
```

**Bundle impact**: Instead of 5KB, ships 200KB+

✅ **Good**:

```typescript
// Direct import
import { Button } from '@/components/Button';
// Or with path alias
import { Button } from '@/components/Button/Button';
```

**Bundle impact**: Only 5KB for Button

**When to use**: Always. Avoid barrel files for components.

**Exception**: Small shared utilities where tree-shaking works reliably.

---

## bundle-dynamic-imports: Use next/dynamic for Heavy Components

**Problem**: Large components loaded upfront even if not immediately needed

❌ **Bad**:

```typescript
import { Chart } from 'react-chartjs-2'; // 100KB+
import { Editor } from '@/components/RichTextEditor'; // 300KB+

export default function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && <Chart data={data} />}
      {/* Chart code loaded even when hidden! */}
    </div>
  );
}
```

**Bundle impact**: Initial bundle includes 400KB+ even before user clicks

✅ **Good**:

```typescript
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Chart), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Optionally disable SSR
});

const Editor = dynamic(() => import('@/components/RichTextEditor'), {
  loading: () => <div>Loading editor...</div>,
});

export default function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && <Chart data={data} />}
      {/* Chart code only loaded when showChart becomes true */}
    </div>
  );
}
```

**Bundle impact**: Initial bundle stays small, Chart loads on-demand (~100KB saved)

**When to use**:

- Modal/Dialog content
- Charts/visualizations
- Rich text editors
- Admin panels
- Any component >50KB

---

## bundle-defer-third-party: Load Non-Critical Scripts After Hydration

**Problem**: Analytics, chat widgets, etc. block initial load

❌ **Bad**:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js" />
        <script src="https://widget.intercom.io/widget/abc123" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Impact**: Delays Time to Interactive

✅ **Good**:

```typescript
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Load after page is interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js"
          strategy="lazyOnload" // Load after everything else
        />

        <Script
          src="https://widget.intercom.io/widget/abc123"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

**Impact**: Faster Time to Interactive

**Strategies**:

- `beforeInteractive` - Critical scripts (very rare)
- `afterInteractive` - Default, loads after page interactive
- `lazyOnload` - Load during idle time (analytics, chat, etc.)
- `worker` - Load in Web Worker (experimental)

---

## bundle-conditional: Load Modules Only When Feature Activated

**Problem**: Loading feature code for features user may never use

❌ **Bad**:

```typescript
import { handlePayment } from '@/lib/stripe';
import { sendEmail } from '@/lib/email';

export default function ProfilePage({ user }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <div>
      {showUpgrade && (
        <button onClick={() => handlePayment(user)}>
          Upgrade
        </button>
      )}
    </div>
  );
}
// Stripe SDK loaded even for free users who never upgrade!
```

✅ **Good**:

```typescript
export default function ProfilePage({ user }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleUpgrade = async () => {
    // Only load when user actually clicks
    const { handlePayment } = await import('@/lib/stripe');
    await handlePayment(user);
  };

  return (
    <div>
      {showUpgrade && (
        <button onClick={handleUpgrade}>
          Upgrade
        </button>
      )}
    </div>
  );
}
```

**When to use**:

- Premium features for free tier users
- Admin functionality
- Feature flags
- Locale-specific code

---

## bundle-preload: Preload on Hover for Perceived Speed

**Problem**: Dynamic imports feel slow when user clicks

✅ **Better**:

```typescript
import dynamic from 'next/dynamic';
import { useState } from 'react';

const Modal = dynamic(() => import('@/components/Modal'));

export default function Page() {
  const [showModal, setShowModal] = useState(false);

  return (
    <button
      onClick={() => setShowModal(true)}
      onMouseEnter={() => {
        // Preload on hover
        import('@/components/Modal');
      }}
      onFocus={() => {
        // Preload on focus (keyboard users)
        import('@/components/Modal');
      }}
    >
      Open Modal
    </button>
  );
}
```

**Impact**: Modal appears instantly when clicked (already loaded during hover)

---

## Quick Wins Checklist

Before committing:

- [ ] Any imports from `index.ts`? → Import directly
- [ ] Components >50KB? → Use `next/dynamic`
- [ ] Third-party scripts? → Use `next/script` with `lazyOnload`
- [ ] Feature-specific code? → Dynamic import on activation
- [ ] User interaction triggers? → Preload on hover/focus

## Measuring Bundle Size

```bash
# Build and analyze
npm run build

# Check .next/static/chunks to see bundle sizes

# Use bundle analyzer
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your config
});

# Run analysis
ANALYZE=true npm run build
```

## Common Bundle Bloat

| Package             | Size   | Alternative                |
| ------------------- | ------ | -------------------------- |
| moment.js           | 288KB  | date-fns (tree-shakeable)  |
| lodash              | 70KB   | lodash-es + direct imports |
| entire icon library | 500KB+ | Import specific icons only |

**Target**: First Load JS < 200KB for good performance
