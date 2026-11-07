# States and Feedback

## Component states
Consider default, hover, focus-visible, pressed, selected/active, disabled, loading, success and error as applicable.

## Page/data states
Consider initial loading, refreshing, empty, filtered-empty, partial data, offline, permission denied, recoverable error, fatal error.

## Loading
Very short operations should not flash a loader. Longer operations need progress/skeleton/status appropriate to certainty. Preserve layout to reduce shift.

## Empty
Explain what is empty and provide the most useful next action. Do not use huge decorative illustrations by default.

## Success
Small reversible actions usually need subtle toast/inline confirmation. Do not interrupt with a success modal unless the event warrants it.

## Errors
State what happened in user terms, what remains safe, and what can be done next. Preserve user work. Technical details can be secondary.

## Disabled
Use disabled only when an action truly cannot run; when useful, explain why. Do not hide actions solely to avoid explaining permissions/state.
