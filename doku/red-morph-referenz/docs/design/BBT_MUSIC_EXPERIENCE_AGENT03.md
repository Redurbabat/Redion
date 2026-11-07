# BBT-Bit Music Experience — Agent 03

Branch: `agent/03-music-experience`. This module is deliberately isolated from global routes and configuration to avoid conflicts with other agents.

## Integration

Import `MusicExperienceGallery` from `app/src/components/bbt-music/MusicExperience` into an existing route or render any named component independently. CSS is imported by the module. The gallery is not wired into the global App route in this branch.

```tsx
import { FloatingMiniPlayer, MusicExperienceGallery } from './components/bbt-music/MusicExperience'
<MusicExperienceGallery />
<FloatingMiniPlayer />
```

## Components

1. `ArtworkToPlayerMorph` — Artwork-to-Player Morph
2. `InteractiveAlbumWall` — Interactive Album Wall
3. `FloatingMiniPlayer` — Floating Mini-Player
4. `LiquidPlaybackControls` — Liquid Playback Controls
5. `ArtworkColorExtraction` — Artwork Color Extraction
6. `FullScreenNowPlaying` — Full-Screen Now Playing
7. `SwipeableQueue` — Swipeable Queue
8. `SpatialAlbumCarousel` — Spatial Album Carousel
9. `CompactLyricsOverlay` — Compact Lyrics Overlay
10. `AlbumDetailExpansion` — Album Detail Expansion
11. `FloatingVolumeLens` — Floating Volume Lens
12. `PlaybackProgressScrubber` — Playback Progress Scrubber
13. `ContextualMusicMenu` — Contextual Music Menu
14. `DynamicArtworkBackground` — Dynamic Artwork Background
15. `SearchToAlbumTransition` — Search-to-Album Transition
16. `ArtistHeroPage` — Artist Hero Page
17. `RecentlyPlayedGrid` — Recently Played Grid
18. `QueueReorderInteraction` — Queue Reorder Interaction
19. `PlaylistCoverComposer` — Playlist Cover Composer
20. `CompleteMusicPlayerDemo` — Complete Music Player Demo

All named components accept `MusicExperienceProps`: optional `tracks`, `initialIndex`, and `className`. Tracks have id, title, artist, album, duration in seconds, color, and optional artwork URL.

## Interaction and accessibility

All 20 studies render distinct compositions from shared primitives (Artwork, Controls, Progress, Volume, Queue). Controls support keyboard activation; sliders use native range inputs; current queue item is identified; focus rings remain visible; reduced-motion preference disables transitions. The queue supports accessible up/down reorder controls, not pointer-only drag. Search filters album cards; the composer edits a cover locally. The artwork color comes from explicit track metadata rather than pixel extraction, which avoids cross-origin canvas restrictions. Playback is a UI-state simulation: there is no audio source, streaming, automatic clock progression, or synchronized lyrics.

## Validation

`cd app && npm run test:unit && npm run build`. Tests cover catalog uniqueness, time formatting and immutable queue reorder. A browser review should cover 390px and 1280px, keyboard navigation, reduced motion, contrast and touch targets.

## Reuse and boundaries

Existing BBT Motion Lab, BBT Interaction Lab and Touch Kit informed component boundaries; no global configuration, application router, shared tokens or existing component files are changed. A future integration can replace simulated player state with a real audio adapter and artwork-color extraction with a safe image-analysis service.
