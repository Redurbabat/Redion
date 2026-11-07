# High-Refresh Motion

Design interactive animation to remain convincing on 60 Hz and high-refresh displays such as 90/120 Hz.

Do not encode animation in fixed frame counts. Use time-based or physics-based progression tied to the browser/runtime animation clock.

Prefer transform and opacity for frequent motion. Minimize synchronous layout reads/writes, expensive backdrop filters, large paint regions and per-frame DOM churn.

Pointer/stylus movement may arrive faster than rendering; consume events without assuming one input event equals one frame. Use coalesced samples when they materially improve drawing/direct manipulation.

Measure frame pacing on representative hardware. A nominal short duration does not guarantee smooth motion.