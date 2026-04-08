// Adapted from OpenScreen (MIT): src/components/video-editor/videoPlayback/constants.ts
export const DEFAULT_FOCUS = { cx: 0.5, cy: 0.5 };

/** When guided focus jumps farther than this in one frame, ease-in pan speed from rest (modal open, etc.). */
export const CAMERA_GUIDED_JUMP_THRESHOLD = 0.092;
/** Frames over which pan speed ramps up after a guided jump (~ease-in). */
export const CAMERA_EASE_IN_FRAMES = 22;
/** Normalized distance below which pan slows for a soft landing (ease-out). */
export const CAMERA_EASE_OUT_NEAR = 0.1;

export const IDLE_ZOOM_SCALE = 1.0;
/** Lower = more UI (sidebars, full search bar) stays in frame during zoom. */
export const ACTIVE_ZOOM_SCALE = 1.12;
export const ACTIVE_WINDOW_MS = 1200;
