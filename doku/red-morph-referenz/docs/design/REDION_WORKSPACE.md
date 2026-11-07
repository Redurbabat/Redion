# Redion Workspace — Agent 04

Branch: `agent/04-workspace`. All 20 named exports live in `app/src/components/workspace/WorkspaceGallery.tsx`; styles are local to `.rw-gallery` and `.rw-app`.

## Usage

```tsx
import WorkspaceGallery, { CompleteWorkspaceDemo, DenseDataTable } from './components/workspace/WorkspaceGallery'
<WorkspaceGallery />
<CompleteWorkspaceDemo />
<DenseDataTable rows={transactions} onSelect={setSelected} />
```

The gallery is deliberately self-contained and can be mounted by the application's route owner without modifying shared navigation. All financial records and charts are illustrative, not real banking data. Reuse React, native form controls, and the existing app's build stack; no new dependencies or global tokens.

## Components
OpticalFinanceDashboard, DenseDataTable, ContextualSidebar, WorkspaceOverview, CompactKPIStrip, InteractiveFilterBar, TransactionDetailSheet, ActivityTimeline, ResizablePanels, CommandSearch, AdaptiveInspector, WorkspaceSwitcher, TaskDetailPanel, BatchActionToolbar, SmartStatusChips, EditableDataGrid, NotificationCenter, DocumentPreview, ResponsiveAnalyticsLayout, CompleteWorkspaceDemo.

## Interaction and accessibility
Search, status filters, transaction details, editing, navigation, task completion, notifications, pagination and panel sizing are interactive. Tables use semantic headers, controls use labels, active navigation uses aria-current, and motion respects reduced-motion. The transaction dialog traps keyboard focus, restores trigger focus on close, supports Escape, and locks background scrolling. Hosting-router integration and browser-level accessibility tests remain recommended.

## QA
Run `cd app && npm ci && npm run build && npm run test:unit`. Tests for the gallery's component inventory are in `WorkspaceGallery.test.ts`.
