# Shopee Stats Extension - AI Coding Instructions

## Project Overview
Chrome extension (Manifest V3) that analyzes Shopee.vn order history and displays comprehensive spending statistics. **Version 2.0** rebuilt with **TypeScript, React, and Vite** for better maintainability, type safety, and modern development experience.

## Tech Stack
- **TypeScript 5.9+** - Strict type checking enabled
- **React 19** - Functional components with hooks
- **Vite 6** - Build tool and dev server
- **Chrome Extension Manifest V3** - Latest extension API
- **No external libraries** - Pure vanilla implementations for stats logic

## Architecture

### Layered Structure
```
src/
├── components/        # React UI components
├── pages/            # Extension pages (popup)
├── services/         # Business logic layer (not used in content scripts)
├── types/            # TypeScript type definitions
└── utils/            # Helper functions

public/
├── manifest.json      # Extension manifest
├── icons/            # Extension icons
└── content/          # Vanilla JS content scripts
    ├── content-source.js  # Source (uses chrome.runtime)
    └── bridge.js          # Bridge script (ISOLATED world)
```

### Data Flow Pattern
```
User clicks → Popup (React) → Inject bridge.js (ISOLATED) + content.js (MAIN)
→ MAIN world: Fetch API with cookies → window.postMessage
→ ISOLATED world: Receive postMessage → chrome.runtime.sendMessage
→ Popup: Display statistics with persistent storage
```

## Critical Implementation Details

### 1. Build System (Vite + Plugin)
**Location**: [vite.config.ts](../vite.config.ts)

```typescript
// Single entry for popup + custom plugin for content scripts
rollupOptions: {
  input: {
    popup: 'src/pages/popup/index.html',    // React app only
  }
}

plugins: [
  react(),
  {
    name: 'copy-and-patch-extension-assets',
    closeBundle() {
      // 1. Copy manifest.json and icons/
      // 2. Copy bridge.js as-is
      // 3. Patch content-source.js:
      //    - chrome.runtime → window.postMessage
      //    - 'progress' → 'SHOPEE_STATS_PROGRESS'
      //    Output: dist/content/content.js
    }
  }
]
```

**Build commands**:
- `npm run build` - TypeScript compile + Vite build + auto-patch content scripts
- `./build.sh` - Simple wrapper for `npm run build` (15 lines)

**Output structure**: 
- `dist/src/pages/popup/` - React popup
- `dist/content/` - Patched vanilla JS scripts (bridge.js + content.js)
- `dist/manifest.json` + `dist/icons/`

**Key concept**: Vite plugin handles ALL copying and patching. Build.sh is just a wrapper.

### 2. TypeScript Types System
**Location**: [src/types/shopee.ts](../src/types/shopee.ts)

Critical types:
- `ShopeeOrderResponse` - API response structure
- `ShopeeOrder` - Single order with nested structure
- `Statistics` - Complete statistics data model
- `ChromeMessage` - Extension message protocol

**Type pattern**: Use `type` for unions/primitives, `interface` for objects that may be extended

### 3. Shopee API Integration
**Service**: [src/services/shopee-stats.service.ts](../src/services/shopee-stats.service.ts)

```typescript
class ShopeeStatsService {
  private static readonly API_URL = 'https://shopee.vn/api/v4/order/get_order_list';
  private static readonly PAGE_SIZE = 20;
  private static readonly PRICE_DIVIDER = 100000;  // API prices × 100,000
}
```

**Key methods**:
- `collectStatistics()` - Main async entry point, returns `Promise<Statistics>`
- `processOrder()` - Process single order, update aggregations
- `displayReport()` - Output to console with styling

**Pagination**: Recursive fetching until `orders.length < PAGE_SIZE`

### 4. React Component Architecture
**Main component**: [src/components/Popup.tsx](../src/components/Popup.tsx)

```typescript
// State management pattern
const [status, setStatus] = useState<Status>('idle' | 'loading' | 'success' | 'error');
const [progress, setProgress] = useState<string>('');
const [message, setMessage] = useState<Message | null>(null);
```

**Chrome API usage**:
```typescript
// Inject content script dynamically
await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['content/content.js']
});

// Message listener
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'progress') { /* update UI */ }
});
```

### 5. Content Script Architecture (Bridge Pattern)
**Source files**: 
- [public/content/content-source.js](../public/content/content-source.js) - Vanilla JS with chrome.runtime calls
- [public/content/bridge.js](../public/content/bridge.js) - Message forwarder (ISOLATED world)

**Build process**: Vite plugin patches content-source.js → dist/content/content.js

**MAIN world (content.js)**:
```javascript
// Runs immediately, has cookie access for Shopee API
xemBaoCaoThongKe().then(() => {
  window.postMessage({  // Patched from chrome.runtime
    type: 'SHOPEE_STATS_COMPLETE',
    data: { tongDonHang, tongtienhang, ... }
  }, '*');
});
```

**ISOLATED world (bridge.js)**:
```javascript
// Safely forwards messages to popup
window.addEventListener('message', e => {
  if (e.data.type === 'SHOPEE_STATS_COMPLETE') {
    safeSendMessage({ type: 'complete', data: e.data.data });
  }
});

function safeSendMessage(msg) {
  if (!chrome.runtime?.id) return;  // Handle context invalidation
  chrome.runtime.sendMessage(msg).catch(...);
}
```

**Why bridge pattern**: MAIN world can't use chrome APIs, ISOLATED world can't access cookies. Bridge solves both.

### 6. Console Reporter
**Utilities**: [src/utils/console-reporter.ts](../src/utils/console-reporter.ts)

Static class with formatted output methods:
```typescript
ConsoleReporter.printHeader();
ConsoleReporter.printOverview(total, orders, products, savings, assessment);
ConsoleReporter.printTimeBasedStats('1 THÁNG GẦN NHẤT', stats);
```

Uses `console.log('%c...', 'style')` for colored output with emojis

## Development Workflow

### Local Development
```bash
npm install          # Install dependencies
npm run type-check   # Verify TypeScript
npm run build        # Build everything (Vite + auto-patch)
# OR
./build.sh           # Wrapper script (same as npm run build)
```

### Testing Extension
1. Build: `npm run build` or `./build.sh`
2. Load `dist/` folder in Chrome (`chrome://extensions/`)
3. Navigate to `shopee.vn` (must be logged in)
4. Click extension → "Bắt Đầu Thống Kê"
5. Open Console (F12) to see content script logs
6. Check popup for statistics display

### Hot Reload Limitations
- Vite HMR doesn't work with Chrome extensions
- Always rebuild after changes: `npm run build`
- **CRITICAL**: After reload, close ALL Shopee tabs and open new ones
- Old tabs have cached VM scripts that won't update

## Code Conventions

### TypeScript Patterns
- **Strict mode enabled** - No implicit any, unused locals/params checked
- **Path aliases**: Use `@/` for src imports (configured in tsconfig.json)
- **Type imports**: Use `import type { ... }` for type-only imports
- **Async/await**: Preferred over `.then()` chains

### Naming Conventions
- **Vietnamese variable names** preserved from original:
  - `tongDonHang` = total orders
  - `tongTienTietKiem` = total savings
  - `thongKeTheoThang/Nam` = statistics by month/year
- **English for types/interfaces**: `ShopeeOrder`, `Statistics`, `TimeBasedStats`
- **React components**: PascalCase, functional with hooks

### File Organization
- **One component per file**
- **Co-locate styles**: `Popup.tsx` + `Popup.css`
- **Services are stateful classes**: Use `new ShopeeStatsService()` per session
- **Utils are static functions**: Pure helpers, no side effects

## Common Modifications

### Add New Time Period
1. Update `Statistics` interface in [src/types/shopee.ts](../src/types/shopee.ts)
2. Add date calculation in `ShopeeStatsService.collectStatistics()`
3. Update `processOrder()` to track new period
4. Add display in `ConsoleReporter.printTimeBasedStats()`

### Change API Parameters
Modify constants in `ShopeeStatsService`:
```typescript
private static readonly PAGE_SIZE = 20;  // Change batch size
```

### Customize UI
- Colors: Edit [src/components/Popup.css](../src/components/Popup.css) (Shopee orange: #ee4d2d)
- Layout: Modify JSX in [src/components/Popup.tsx](../src/components/Popup.tsx)
- Console output: Update [src/utils/console-reporter.ts](../src/utils/console-reporter.ts)

### Add New Statistics
1. Define type in `Statistics` interface
2. Initialize in `ShopeeStatsService` constructor
3. Calculate in `processOrder()` method
4. Display in `ConsoleReporter` or `Popup`

## Debugging Strategies

### TypeScript Errors
- Run `npm run type-check` to see all errors
- Check path alias resolution in `tsconfig.json`
- Verify Chrome types: `import type { ... } from 'chrome'`

### Build Issues
- Clear cache: `rm -rf dist node_modules && npm install`
- Check Vite plugin in vite.config.ts
- Verify public/content/ files exist
- Check dist/content/ for patched output

### Extension Not Working
- **Console errors**: 
  - Popup: Right-click popup → Inspect
  - Content: F12 on Shopee page
  - Look for bridge logs: "🌉 [Bridge] ..."
- **API errors**: Verify Shopee login, check Network tab
- **Message not received**: 
  - Check bridge.js loaded: See ISOLATED world log
  - Check content.js loaded: See MAIN world log
  - Verify message types match: SHOPEE_STATS_COMPLETE vs complete
- **Extension context invalidated**:
  - Normal when extension reloads
  - Bridge has error handling: logs warning instead of crash
  - Close all Shopee tabs after extension reload

### Common Pitfalls
- **Forgetting to rebuild**: `npm run build` required after any change
- **Old tab cached scripts**: Must close tabs, not just reload
- **Wrong message world**: MAIN uses window.postMessage, ISOLATED uses chrome.runtime
- **Missing data fields**: content.js must send all 7 fields in complete message
- **State in popup**: React state + chrome.storage.local for persistence

## Vietnamese Language Notes
- UI text is Vietnamese for user-facing strings
- Code comments can be English for maintainability
- Variable names mixed (Vietnamese for domain terms, English for tech terms)
- Console output fully Vietnamese with emojis

## External Dependencies
Minimal dependencies philosophy:
- **React/ReactDOM**: UI framework only
- **TypeScript**: Compile-time only
- **Vite**: Build tool only
- **No runtime libraries**: All logic is custom code

## Project Evolution Notes
- **v1.0**: Vanilla JS, no build system, console-only output
- **v2.0**: Complete TypeScript + React refactor
  - Added type safety for popup code
  - Modernized build system with Vite
  - Improved component architecture with React
  - Better error handling and state management
  - **Bridge pattern**: MAIN world (cookies) + ISOLATED world (chrome APIs)
  - **Hybrid approach**: React for UI, vanilla JS for content scripts
  - **Popup UI**: Replaced console output with persistent statistics display
  - **Build automation**: Vite plugin handles all patching automatically
  - Maintained all original functionality + added data persistence

## Key Files Reference
- [vite.config.ts](../vite.config.ts) - Build config with copy-and-patch plugin
- [build.sh](../build.sh) - Simple 15-line wrapper for npm build
- [public/content/content-source.js](../public/content/content-source.js) - Vanilla JS source (chrome.runtime)
- [public/content/bridge.js](../public/content/bridge.js) - Bridge script with error handling
- [shopee-stats.js](../shopee-stats.js) - Original vanilla JS (kept for reference)
- [src/components/Popup.tsx](../src/components/Popup.tsx) - React popup UI
- [src/types/shopee.ts](../src/types/shopee.ts) - Type definitions
- [src/utils/console-reporter.ts](../src/utils/console-reporter.ts) - Console output formatter
- [public/manifest.json](../public/manifest.json) - Extension manifest
