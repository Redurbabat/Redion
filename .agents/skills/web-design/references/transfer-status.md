# Upload, Download and Transfer Status

Transfer UI must reflect real transfer state.

## States
waiting, preparing, transferring, paused when supported, completed, failed, cancelled. Sync may additionally need offline, blocked, conflict or up-to-date.

Use determinate progress only when trustworthy byte/item totals exist. Otherwise use indeterminate activity plus truthful status text. Never advance progress with a decorative timer.

Expose filename/item, progress, current state and recovery action where useful. Large/background transfers should remain discoverable after the initiating popover closes.

Cancellation and retry must map to real capabilities. Completion should not imply server persistence until that is actually confirmed.