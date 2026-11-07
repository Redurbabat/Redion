# Sheets and Bottom Sheets

Sheets preserve context while presenting a focused secondary task.

## Phone
Bottom sheets work well for contextual choices, filters, compact editors and action sets. Support safe areas and keyboard movement. Use detents only when intermediate heights provide real utility.

## Tablet/Desktop
Prefer popover, side inspector, dialog or panel when those better preserve spatial relationship. Do not force phone-style bottom sheets onto wide desktop layouts.

Gesture-driven sheets should track touch directly and use velocity-aware settle/dismiss behavior. Critical destructive confirmation should not be dismissible ambiguously.

Reduced motion uses shorter, simpler presentation while preserving hierarchy.