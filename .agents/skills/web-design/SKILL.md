---
name: universal-web-design
description: Universal UI/UX decision system for websites, web apps, dashboards, productivity tools, e-commerce, documentation, portfolios, and interactive experiences.
---

# Universal Web Design Skill

## Mission
Design the interface that fits the product. Never force every project into the same visual style.

Use this decision order:
**Purpose -> users -> tasks -> information hierarchy -> product archetype -> interaction model -> components -> visual language -> motion -> responsive behavior -> validation.**

Before implementation, inspect the existing product, components, tokens, routes, styles, dependencies, and interaction patterns. Reuse coherent systems before creating new ones.

## Reference loading
This file is the router. Load only the references relevant to the current task.

### Foundations
- Semantic design tokens -> `foundations/tokens.md`
- Typography -> `foundations/typography.md`
- Color and semantic states -> `foundations/color.md`
- Spacing/layout rhythm -> `foundations/spacing-layout.md`
- Elevation/radius -> `foundations/elevation-radius.md`
- Iconography -> `foundations/iconography.md`

### Component and interaction references
- Buttons/actions -> `references/buttons.md`
- Special/premium/magnetic/morphing buttons -> `references/special-buttons.md`
- Cards/content containers -> `references/cards.md`
- Forms/inputs/selection -> `references/forms.md`
- Navigation architecture -> `references/navigation.md`
- Navigation/shortcut source of truth -> `references/navigation-source-of-truth.md`
- Contextual shortcut resolution -> `references/contextual-shortcut-resolution.md`
- Interaction scope model -> `references/interaction-scope-model.md`
- Tree navigation/keyboard model -> `references/tree-navigation.md`
- Sidebars/inspectors -> `references/sidebars.md`
- Tabs/accordions -> `references/tabs-accordions.md`
- Mobile navigation -> `references/mobile-navigation.md`
- Mobile bottom navigation -> `references/mobile-bottom-navigation.md`
- Virtual keyboard/visual viewport -> `references/virtual-keyboard-layout.md`
- Hero/header/footer -> `references/hero-header-footer.md`
- Toolbars/docks/floating palettes -> `references/toolbars-docks.md`
- Scrollable tool strips -> `references/scrollable-tool-strips.md`
- Icon size vs hit target -> `references/icon-hit-target-separation.md`
- Contextual action rails -> `references/contextual-action-rails.md`
- Duplicate actions across chrome -> `references/action-deduplication.md`
- Menus/popovers/drawers/modals -> `references/overlays.md`
- Context menus -> `references/context-menus.md`
- Sheets/bottom sheets -> `references/sheets.md`
- Tooltips -> `references/tooltips.md`
- Notifications/toasts/banners -> `references/notifications.md`
- Tables/lists/trees -> `references/tables-lists.md`
- Data visualization -> `references/data-visualization.md`
- File browser -> `references/file-browser.md`
- Collection/content aggregation -> `references/content-aggregation.md`
- Editor/canvas -> `references/editor-canvas.md`
- Focused document/workspace shell -> `references/document-mode-shell.md`
- Drag/drop -> `references/drag-drop.md`
- Base animation/hover -> `references/motion.md`
- Springs/physics/velocity/interruptibility -> `references/motion-physics.md`
- Morphing/shared-element transitions -> `references/shared-transitions.md`
- Page/view transitions -> `references/page-transitions.md`
- Scroll-linked motion -> `references/scroll-motion.md`
- Gestures/drag/touch/stylus -> `references/gestures-direct-manipulation.md`
- Stylus/pen/ink -> `references/stylus-pen.md`
- Tool favorites/presets -> `references/tool-favorites.md`
- Multi-surface selection -> `references/multi-surface-selection.md`
- Connectors/diagram relationships -> `references/connectors-diagramming.md`
- Haptics/sound -> `references/haptics-sound.md`
- Spatial UI -> `references/spatial-ui.md`
- Advanced 3D rendering -> `references/advanced-3d-rendering.md`
- Glass/translucency/material hierarchy -> `references/materials-glass.md`
- 3D/spatial/parallax -> `references/3d-spatial.md`
- Responsive/accessibility -> `references/responsive-accessibility.md`
- Loading/empty/error/success/disabled feedback -> `references/states-feedback.md`
- Upload/download/sync transfer state -> `references/transfer-status.md`
- Share/export/print -> `references/share-export-print.md`
- Offline/degraded state -> `references/offline-degraded-states.md`
- Async result contracts/UI truth -> `references/async-result-contracts.md`
- Favorites/recents/usage history -> `references/favorites-recents.md`

### High-craft recipes
Load recipes only when the interaction warrants the extra craft.
- Spring behavior profiles -> `recipes/spring-profiles.md`
- Liquid-glass component recipes -> `recipes/liquid-glass-components.md`
- Pointer dock magnification -> `recipes/dock-magnification.md`
- Magnetic controls -> `recipes/magnetic-controls.md`
- Morphing menus/palettes -> `recipes/morphing-menus.md`
- Drag/release physics -> `recipes/drag-physics.md`
- Loading/progress feedback -> `recipes/loading-feedback.md`
- Microinteraction state machines -> `recipes/microinteraction-state-machines.md`
- Pointer/cursor physics -> `recipes/pointer-cursor-physics.md`
- Navigation choreography -> `recipes/navigation-choreography.md`
- Responsive motion choreography -> `recipes/responsive-motion.md`

### Implementation references
Load only for implementation tasks in the matching runtime.
- CSS motion -> `implementation/css-motion.md`
- Web Animations API -> `implementation/web-animations.md`
- Shared-transition architecture -> `implementation/shared-transition-architecture.md`
- 60/90/120 Hz motion and frame pacing -> `implementation/high-refresh-motion.md`
- Pointer/mouse/touch/stylus event architecture -> `implementation/pointer-event-architecture.md`
- Interactive gesture progress controller -> `implementation/gesture-progress-controller.md`
- React motion architecture -> `implementation/react-motion.md`
- Interaction performance budget -> `implementation/performance-budget.md`

### Platform modes
Load a platform file when the target is known. Platform conventions override generic aesthetics, not baseline accessibility.
- iOS/iPadOS/macOS -> `platforms/apple.md`
- Android -> `platforms/android.md`
- Windows/desktop -> `platforms/windows-desktop.md`

For Apple-specific implementation or review, consult current Apple HIG or an installed Apple-HIG routing skill. Do not copy mirrored proprietary guideline corpora into this skill.

### Product pattern references
- Marketing/landing -> `patterns/landing-page.md`
- Dashboard/admin -> `patterns/dashboard.md`
- Productivity/desktop-like/editor -> `patterns/productivity-app.md`
- E-commerce -> `patterns/ecommerce.md`
- Documentation/knowledge -> `patterns/documentation.md`
- Portfolio/creative/showcase -> `patterns/portfolio-showcase.md`
- Authentication -> `patterns/auth.md`
- Onboarding -> `patterns/onboarding.md`
- Pricing -> `patterns/pricing.md`
- Settings -> `patterns/settings.md`
- Search results -> `patterns/search-results.md`
- AI chat/copilot -> `patterns/ai-chat.md`
- Command center/palette -> `patterns/command-center.md`
- Adaptive desktop/tablet/phone shell -> `patterns/adaptive-shell.md`

Before completion, use `quality/design-review.md` as the final review gate. When auditing an existing product, use `quality/evidence-first-ui-audit.md`; for responsive legacy/fixed-value work also use `quality/responsive-fixed-value-audit.md`. For visual acceptance use `quality/visual-regression-measurement.md`; for touch/stylus/viewport-sensitive behavior use `quality/real-device-validation.md`. During design-system cleanup use `quality/css-dead-rule-audit.md` and `quality/design-token-drift-audit.md`. For file/document interchange use `quality/import-export-fidelity.md`. For hardware/native/runtime-dependent features use `quality/capability-truth.md`. For complex interaction audits also use `quality/input-modality-matrix.md`, `quality/focus-return-audit.md`, `quality/idle-motion-audit.md`, and `quality/interaction-test-contracts.md`, and `quality/shared-transition-audit.md`, `quality/spatial-continuity-audit.md`, `quality/motion-frame-pacing-audit.md`, `quality/gesture-conflict-audit.md`, `quality/transition-fallback-audit.md`, `quality/history-recovery-audit.md`, `quality/offline-conflict-audit.md`. If motion, glass, gesture, morphing, scroll effects or 3D are present, also use `quality/motion-review.md` and `quality/accessibility-motion-audit.md`. For platform-specific work, also use `quality/platform-consistency.md`.

Do not load every reference mechanically. Select the smallest relevant set after classifying the task. External research provenance and rights notes live in `SOURCES.md`.

## 1. Classify the product first
Choose the closest archetype and adapt when a product spans several.

- **Marketing / landing:** storytelling, strong hierarchy, clear CTA, expressive brand moments, controlled scroll motion.
- **Dashboard / admin:** scanability, density, tables, filters, persistent navigation, restrained motion.
- **Productivity / desktop-like app:** compact controls, keyboard access, contextual tools, sidebars, command palette, fast workflows.
- **E-commerce:** product imagery, price, variants, availability, trust, filters, purchase path.
- **Portfolio / studio:** visual authorship, projects, typography, imagery; experimental motion is allowed when purposeful.
- **Documentation / knowledge:** readability, search, hierarchy, deep links, code/content navigation.
- **Editor / canvas:** workspace-first, tools recede until needed, contextual inspectors, direct manipulation.
- **Immersive / showcase:** spatial or advanced motion may be central, but usability remains intact.

Do not assume dark mode, glassmorphism, gradients, cards, sidebars, or animation before classification.

## 2. Define design intent
Before coding a new surface, establish:
- primary user and job-to-be-done
- primary action
- content priority
- expected session length and information density
- desktop/touch/mobile targets
- brand personality: e.g. calm, editorial, technical, playful, premium, utilitarian
- motion level 0–3
- accessibility constraints

If the project already defines these, follow it.

## 3. Foundations
Prefer project tokens. If none exist, establish a small semantic token layer before proliferating raw values.

### Spacing
Use a consistent 4px-based scale such as 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Exceptions require a layout reason.

### Typography
Typography communicates hierarchy before decoration. Keep body copy readable; use compact typography for dense tools and larger display type for marketing/editorial surfaces. Avoid excessive font sizes and weights.

### Radius
Use radius by role, not randomly:
- compact controls: 6–10px
- cards/panels: 10–16px
- floating panels: 12–20px
- pills: only when the shape has semantic or visual purpose

### Borders and shadows
Borders separate adjacent surfaces. Shadows communicate elevation. Do not use heavy shadows on every container.

### Color
Use semantic roles: background, surface, elevated, text, muted, border, accent, success, warning, danger. Accent color communicates priority/state; do not scatter it decoratively.

## 4. Material selection
- **Flat:** dense apps, tables, navigation, document trees, settings.
- **Elevated:** menus, popovers, command palettes, temporary inspectors.
- **Glass/translucent:** optional for floating transient controls when the background context matters. Never default every card to glass.
- **Document/canvas:** content is visually dominant; application chrome recedes.
- **Expressive:** marketing/portfolio/showcase only when aligned with brand.

## 5. Component decision system

### Buttons
Choose by function:
- **Primary:** one dominant action in a local context.
- **Secondary:** meaningful alternative.
- **Ghost:** toolbar/navigation/low-priority action.
- **Icon:** frequent compact action with a recognizable icon; provide accessible label/tooltip.
- **Destructive:** destructive action only.

Do not place several visually dominant primary buttons in one action group.

States: default, hover when applicable, focus-visible, pressed, disabled, loading. Loading must not cause layout jump.

### Cards
Use a card only when content forms an independent semantic unit. Do not wrap every section in a card.
- document/project/product/article -> card can aid recognition
- dozens of homogeneous records -> list/table is usually better
- metrics -> compact metric panel
- action without independent content -> usually button/menu item, not card

Clickable cards receive hover/pressed feedback. Static cards should not pretend to be interactive.

### Inputs and forms
Use persistent labels for important fields. Show validation close to the field. Preserve entered data on errors. Use sensible autocomplete/input types. Focus must be visible.

### Navigation
Select navigation from information architecture:
- small site -> top navigation
- large content site -> structured header + secondary navigation
- dashboard -> sidebar or compact rail
- desktop-like app -> activity rail + optional contextual sidebar
- deep hierarchy -> tree/breadcrumbs
- many commands -> command palette in addition to visible navigation
- mobile primary destinations -> compact/bottom navigation where appropriate

### Tabs
Use for peer views of the same context, not general site navigation.

### Tables
Use when comparison across columns matters. Support sorting/filtering only when useful. Keep row density appropriate. On narrow screens, redesign rather than blindly shrinking.

### Menus, popovers, modals
- tooltip -> short explanation
- dropdown/menu -> compact choice/action set
- popover -> contextual temporary controls
- modal -> focused decision or task that must interrupt current context
- drawer -> secondary workflow needing more room without losing context

Prefer the least disruptive container that fits the task.

### Feedback
- success for small actions -> toast/inline confirmation
- validation error -> near source
- system failure -> explain what happened and recovery action
- destructive confirmation -> only when consequence warrants friction

## 6. Motion system
Motion communicates cause, hierarchy, continuity, and direct manipulation. It is not decoration by default.

### Motion levels
- **0 Static:** critical/regulated/high-focus surfaces. Only essential state changes.
- **1 Functional:** dashboards, documentation, enterprise/productivity. Hover, press, open/close, drag feedback.
- **2 Expressive:** modern SaaS/consumer/premium products. Subtle springs, depth, reveal motion.
- **3 Experimental:** portfolios, studios, showcases. 3D, magnetic response, choreography or physics are allowed if usability/performance remain strong.

Typical timing:
- micro interaction: 80–160ms
- popover/menu: 120–200ms
- panel: 180–280ms
- page/view transition: 200–350ms
- drag/direct manipulation: track input directly
- physics/springs: use for spatial relationships, not arbitrary decoration

Avoid perpetual bounce, gratuitous glow, random rotation, page-wide cursor effects, and animation that delays common actions. Respect reduced-motion preferences.

## 7. Hover and pointer behavior
Hover is enhancement, never the sole access path. Good uses include affordance, tool preview, resize, drag feedback, contextual actions, and restrained proximity effects in specialized docks. Touch must have an equivalent path.

Do not make every card tilt or make the whole background chase the pointer.

## 8. Layout
Start from content hierarchy, not a gallery of fashionable sections.
- establish page/container widths intentionally
- align related content
- use whitespace to group and separate
- avoid excessive nested containers
- keep primary actions close to the content they affect
- let work surfaces use available space
- keep reading surfaces at readable line lengths

## 9. Responsive behavior
Responsive design is recomposition, not only shrinking.
Check at minimum:
- navigation transformation
- column collapse/reorder
- table strategy
- toolbar overflow
- touch target sizes
- text wrapping
- modal/popover placement
- fixed/sticky elements
- keyboard and viewport interactions

Never hide essential functionality on mobile without an alternative.

## 10. States
Every meaningful component must consider:
default, hover, focus, active/selected, pressed, disabled, loading, empty, error, success, offline when relevant, and permission-denied when relevant.

Do not ship controls that visually imply functionality but do nothing unless clearly identified as prototype/demo UI.

## 11. Accessibility
Use semantic HTML first. Support keyboard navigation, visible focus, appropriate labels/names, sufficient contrast, logical heading structure, reduced motion, and touch targets suitable for the target device. Do not rely on color alone to communicate state.

## 12. Performance
Avoid unnecessary global pointer listeners, continuous animations, expensive blur layers, duplicated observers, huge DOM trees, and avoidable rerenders. Use requestAnimationFrame for continuous visual pointer work when needed and clean up listeners/observers/timers/frames.

## 13. Page patterns

### Landing page
Typical hierarchy: navigation -> hero/value proposition -> proof -> benefits/features -> product evidence -> objections/trust -> CTA -> footer. Do not force every section if content does not need it.

### Dashboard
Persistent navigation -> page header/actions -> filters/context -> primary data -> supporting data. Favor scanability over decorative hero sections.

### Productivity app
Stable shell -> navigation -> context -> work surface -> contextual controls. Optimize repeated actions and keyboard workflows.

### E-commerce
Discovery -> filtering/search -> product evaluation -> variant/availability -> trust -> purchase. Keep purchase state unambiguous.

### Documentation
Global search/navigation -> local hierarchy -> readable content -> related navigation. Deep links and predictable information architecture matter more than decorative motion.

### Portfolio/showcase
Establish a distinct art direction. Let work dominate. Experimental motion is acceptable only when it strengthens presentation and remains navigable.

## 14. Contextual tools
Frequently used tools should be quickly reachable. Secondary settings should appear when relevant rather than remain permanently visible.

Example:
select tool -> activate immediately
select active tool again / secondary action -> reveal its options
change option -> preserve context
switch tool -> replace irrelevant controls

For dense tool docks, horizontal overflow, drag/trackpad scrolling, keyboard access, and restrained proximity magnification may be appropriate. Never require hover for touch use.

## 15. AI decision checklist
Before creating a component or page answer:
1. What user task does this serve?
2. What is the information/action priority?
3. Is this permanent or contextual?
4. Which component pattern best matches the semantics?
5. Does an existing project component already solve it?
6. What visual material fits the product archetype?
7. What motion level fits the product?
8. What states are required?
9. How does it work with keyboard, pointer, touch, and narrow screens?
10. What can be removed without harming the task?

If a design choice cannot be justified by function, hierarchy, brand, or comprehension, remove it.

## 16. Anti-patterns
Avoid generic AI-generated UI:
- card grids for everything
- gradients/glow without brand reason
- excessive rounded containers
- enormous headings in utility apps
- fake analytics
- decorative badges with no meaning
- excessive glassmorphism
- unnecessary floating islands
- animation on every element
- inconsistent icon families
- random spacing/radius values
- duplicated components instead of system reuse
- placeholder controls presented as complete features

## 17. Implementation workflow
1. Read project instructions.
2. Inspect existing architecture and design system.
3. Classify product/page.
4. Identify user task and hierarchy.
5. Choose components using this skill.
6. Reuse or extend tokens/components.
7. Implement complete interaction states.
8. Test responsive behavior and accessibility.
9. Run available typecheck/build/tests/lint.
10. Review visually at representative viewport sizes.
11. Report truthfully what was and was not validated.

## 18. Design review gate
Before calling UI work complete, verify:
- purpose and hierarchy are immediately understandable
- primary action is clear but not competing with multiple primaries
- components match their semantics
- spacing/type/radius/color are systematic
- interaction states are complete
- keyboard/focus behavior works
- responsive layout is intentional
- motion has a purpose and respects reduced motion
- no unnecessary card/glass/glow patterns were introduced
- existing design language was preserved unless redesign was requested
- no fake/nonfunctional production controls were added

## 19. Project overrides
This is a universal skill. A project-specific design specification may override aesthetic choices such as palette, typography, density, material, motion level, navigation model, and component variants.

Project overrides should NOT silently remove baseline accessibility, truthful states, responsive behavior, or validation requirements.

## 20. Core principle
**Do not make every interface look the same. Make every interface feel intentionally designed for its purpose.**

Function chooses the pattern.
Hierarchy chooses prominence.
Context chooses material.
Brand chooses expression.
Motion explains interaction.
Accessibility keeps it usable.
