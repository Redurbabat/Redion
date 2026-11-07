# Sheet Snap Physics

Sheets and drawers may have discrete meaningful snap points rather than arbitrary resting positions.

Examples: collapsed handle, compact controls, half/content preview, expanded/full.

Snap points derive from content, viewport, safe areas and task needs. Do not create stops merely for visual effect.

During drag, the sheet follows directly. On release, select the destination using position, velocity and allowed states. Preserve velocity into the settle animation.

Avoid rubber-band behavior around controls that require precision. Ensure content scrolling and sheet dragging have an explicit gesture arbitration rule.

Keyboard/switch users need equivalent expand/collapse controls. Reduced motion keeps direct movement but minimizes inertial settling.