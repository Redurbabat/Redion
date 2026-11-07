# Accessibility Motion Audit

Check every expressive interaction for:
- prefers-reduced-motion path
- no essential information encoded only by animation
- no hover-only functionality
- focus remains visible during/after transitions
- zoom/text scaling does not break animated geometry
- flashing/strobing is avoided
- parallax/large camera movement can be reduced
- transparency has legible fallback
- keyboard operation reaches the same outcomes
- touch targets remain stable even when visuals transform

Reduced motion means redesigning the motion, not simply multiplying all durations by 0.1.