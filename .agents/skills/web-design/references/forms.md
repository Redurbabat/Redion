# Forms, Inputs and Selection Controls

## Selection
- free text -> text input/textarea
- known small set -> radio/select/segmented control depending context
- boolean immediate state -> switch/toggle
- independent multiple choices -> checkboxes
- command/action -> button, not switch
- search -> search input with clear/reset behavior

## Labels
Important fields use persistent visible labels. Placeholder is example/hint, not replacement for a label.

## Validation
Validate at a useful time. Put actionable errors near the field and provide summary/focus management for large forms when needed. Never erase valid user input after failure.

## States
Default, hover where relevant, focus-visible, filled, disabled, read-only, error, success when useful, loading/async validation when relevant.

## Layout
Group related fields, keep labels and help text close, avoid unnecessarily long forms, reveal conditional fields progressively.

## Mobile
Use correct input types, autocomplete, keyboard hints, touch targets, and avoid layouts hidden by the virtual keyboard.

## Avoid
Floating-label complexity without need, red-only error communication, disabling paste, mystery validation, tiny checkboxes, giant form cards for every field group.
