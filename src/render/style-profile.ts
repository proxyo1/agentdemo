export type RenderStyle = "polished" | "classic";

export interface CameraStyleProfile {
  transitionWindowMs: number;
  zoomInTransitionWindowMs: number;
  cameraPanMaxSpeed: number;
  cameraGuidedJumpThreshold: number;
  cameraEaseInFrames: number;
  cameraEaseOutNear: number;
  activeZoomScale: number;
}

export interface FrameStyleProfile {
  marginRatio: number;
  marginMin: number;
  marginMax: number;
  windowRadius: number;
  shadowAlpha: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  rippleAlpha: number;
  rippleStrokeWidth: number;
}

export interface CursorStyleProfile {
  clickScale: number;
  clickDurationMs: number;
  doubleClickDurationMs: number;
  clickMaxRadius: number;
  doubleClickMaxRadius: number;
  arcAmplitudeFactor: number;
  arcAmplitudeMax: number;
}

export interface MotionStyleProfile {
  peakVelocity: number;
  velocityThreshold: number;
  maxBlur: number;
  blurCurveFactor: number;
  zoomInVelocityScale: number;
}

export interface StyleProfile {
  camera: CameraStyleProfile;
  frame: FrameStyleProfile;
  cursor: CursorStyleProfile;
  motion: MotionStyleProfile;
}

const CLASSIC_PROFILE: StyleProfile = {
  camera: {
    transitionWindowMs: 1015.05,
    zoomInTransitionWindowMs: 1522.575,
    cameraPanMaxSpeed: 0.33,
    cameraGuidedJumpThreshold: 0.092,
    cameraEaseInFrames: 22,
    cameraEaseOutNear: 0.1,
    activeZoomScale: 1.12
  },
  frame: {
    marginRatio: 0.065,
    marginMin: 56,
    marginMax: 120,
    windowRadius: 14,
    shadowAlpha: 0.45,
    shadowOffsetX: 6,
    shadowOffsetY: 14,
    shadowBlur: 0,
    rippleAlpha: 0.55,
    rippleStrokeWidth: 2.5
  },
  cursor: {
    clickScale: 0.92,
    clickDurationMs: 320,
    doubleClickDurationMs: 420,
    clickMaxRadius: 40,
    doubleClickMaxRadius: 52,
    arcAmplitudeFactor: 0.05,
    arcAmplitudeMax: 14
  },
  motion: {
    peakVelocity: 2200,
    velocityThreshold: 90,
    maxBlur: 0.42,
    blurCurveFactor: 0.75,
    zoomInVelocityScale: 420
  }
};

const POLISHED_PROFILE: StyleProfile = {
  camera: {
    transitionWindowMs: 1180,
    zoomInTransitionWindowMs: 1720,
    cameraPanMaxSpeed: 0.24,
    cameraGuidedJumpThreshold: 0.082,
    cameraEaseInFrames: 28,
    cameraEaseOutNear: 0.13,
    activeZoomScale: 1.1
  },
  frame: {
    marginRatio: 0.074,
    marginMin: 64,
    marginMax: 148,
    windowRadius: 18,
    shadowAlpha: 0.34,
    shadowOffsetX: 7,
    shadowOffsetY: 16,
    shadowBlur: 24,
    rippleAlpha: 0.42,
    rippleStrokeWidth: 2.2
  },
  cursor: {
    clickScale: 0.95,
    clickDurationMs: 360,
    doubleClickDurationMs: 470,
    clickMaxRadius: 34,
    doubleClickMaxRadius: 46,
    arcAmplitudeFactor: 0.035,
    arcAmplitudeMax: 10
  },
  motion: {
    peakVelocity: 2450,
    velocityThreshold: 110,
    maxBlur: 0.28,
    blurCurveFactor: 0.58,
    zoomInVelocityScale: 320
  }
};

export function getStyleProfile(style: RenderStyle): StyleProfile {
  return style === "classic" ? CLASSIC_PROFILE : POLISHED_PROFILE;
}
