# AI Chat and Copilot Pattern

AI interfaces must make system state and user control explicit.

## Structure
Conversation/history -> composer -> attachments/context -> generation state -> result actions -> sources/tool state when relevant.

## Rules
- distinguish user content, model output, tool/system status and errors
- preserve editable/retry paths where product semantics permit
- show streaming/progress without excessive animated chrome
- long tasks need durable status rather than an endless spinner
- citations/sources must remain connected to supported claims
- destructive/external actions require appropriate confirmation
- never fabricate completion, source access or tool success

AI can be embedded contextually in a workspace rather than always occupying a standalone chat page. Prefer context-aware panels or commands when that better fits the task.