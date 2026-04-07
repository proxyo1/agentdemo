This directory includes logic adapted from OpenScreen:

- Repository: [https://github.com/siddharthvaddem/openscreen](https://github.com/siddharthvaddem/openscreen)
- License: MIT
- Copyright: Siddharth Vaddem

Adapted modules:

- `src/components/video-editor/videoPlayback/mathUtils.ts`
- `src/components/video-editor/videoPlayback/cursorFollowUtils.ts`
- `src/components/video-editor/videoPlayback/focusUtils.ts`
- `src/components/video-editor/videoPlayback/zoomTransform.ts`
- `src/components/video-editor/videoPlayback/constants.ts`
- `src/components/video-editor/videoPlayback/zoomRegionUtils.ts`
- `src/lib/exporter/videoExporter.ts` (resilience patterns)
- `src/lib/exporter/streamingDecoder.ts` (resilience patterns)

AutoDemo uses adapted logic for:

- cursor interpolation/smoothing
- focus clamping
- Screen Studio-style easing
- zoom transform computation
- event-clustered zoom regions and strength ramps
- motion-aware blur gating samples
- resilient fallback export execution