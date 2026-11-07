# Motion Frame-Pacing Audit

Evaluate smoothness by frame pacing and interaction latency, not by animation duration alone.

Check representative low/mid/high hardware and at least standard and high-refresh displays when the product targets them.

Look for:
- long main-thread tasks during motion;
- layout/paint triggered every frame;
- multiple large blur/backdrop layers;
- dropped frames during scroll + animation;
- pointer lag during direct manipulation;
- animation that continues offscreen or at idle;
- performance degradation with realistic content volume.

Test reduced motion separately; it should reduce movement and often work, not merely set duration to a tiny nonzero value.