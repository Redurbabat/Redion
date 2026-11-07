# Magnetic Controls

Magnetic response is an expressive pointer enhancement for selected high-value controls.

## Algorithm
Define an attraction radius larger than the visual control. Within it, map pointer delta through a smooth bounded falloff. Translate the visual content only a small fraction of the delta. Keep the actual hit target stable.

## Rules
- use on very few controls
- never move destructive actions toward the pointer
- no magnetic navigation lists, form fields or dense tables
- restore to neutral with a responsive spring
- keyboard/touch behavior remains conventional
- never require magnetism to discover or activate the control

Optional icon/content movement may be slightly stronger than container movement, but text must stay readable.