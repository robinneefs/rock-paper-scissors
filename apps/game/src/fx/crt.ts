import Phaser from 'phaser';
import { tuning } from '../config/tuning';

/**
 * CRT look for the monitor: a WebGL post-effect on each monitor camera. Bright colours bleed a
 * soft glow into their neighbours (phosphor bloom), the edges darken (vignette), the corners round
 * off like curved glass, and a faint bright band rolls slowly down the screen. It works on whole
 * native pixels, so the pixel art itself is never warped or blurred. Fine scanlines are drawn
 * by a CSS overlay at device resolution (see CrtOverlay), since the canvas is at native size.
 */
const FRAG = `
#define SHADER_NAME RPS_CRT_FS
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec4 uViewport;
uniform float uTime;
uniform float uGlow;
uniform float uVignette;
uniform float uCorner;
uniform float uRoll;

varying vec2 outTexCoord;

void main() {
  vec4 base = texture2D(uMainSampler, outTexCoord);
  vec2 local = (gl_FragCoord.xy - uViewport.xy) / uViewport.zw;
  if (local.x < 0.0 || local.y < 0.0 || local.x > 1.0 || local.y > 1.0) {
    gl_FragColor = base;
    return;
  }
  vec2 px = 1.0 / uResolution;

  // phosphor glow: a 5x5 average of the neighbourhood, only its bright part, added on top
  vec3 sum = vec3(0.0);
  for (int i = -2; i <= 2; i++)
    for (int j = -2; j <= 2; j++)
      sum += texture2D(uMainSampler, outTexCoord + vec2(float(i), float(j)) * px).rgb;
  sum /= 25.0;
  vec3 col = base.rgb + max(sum - 0.3, 0.0) * uGlow;

  // vignette: darker towards the edges
  vec2 c = local - 0.5;
  col *= 1.0 - uVignette * dot(c, c) * 2.0;

  // rounded corners, like the curved glass of a tube
  vec2 d = max(abs(c) - (0.5 - uCorner), 0.0);
  col *= 1.0 - smoothstep(0.8, 1.0, length(d) / uCorner);

  // a faint brighter band rolling slowly down the screen
  float band = 1.0 - abs(fract(local.y + uTime * 0.12) - 0.5) * 2.0;
  col += uRoll * smoothstep(0.92, 1.0, band);

  gl_FragColor = vec4(col, base.a);
}
`;

export const CRT_PIPELINE = 'RpsCrt';

export class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({ game, name: CRT_PIPELINE, fragShader: FRAG });
  }

  override onDraw(target: Phaser.Renderer.WebGL.RenderTarget): void {
    const cam = this.gameObject as unknown as Phaser.Cameras.Scene2D.Camera | null;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const c = tuning.crt;
    this.set2f('uResolution', w, h);
    if (cam) this.set4f('uViewport', cam.x, h - cam.y - cam.height, cam.width, cam.height);
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set1f('uGlow', c.glow);
    this.set1f('uVignette', c.vignette);
    this.set1f('uCorner', c.cornerRadius);
    this.set1f('uRoll', c.roll);
    this.bindAndDraw(target);
  }
}

/** Registers the pipeline once; false on the Canvas renderer, where there are no shaders. */
export function registerCrt(game: Phaser.Game): boolean {
  const renderer = game.renderer;
  if (!(renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return false;
  if (!renderer.pipelines.postPipelineClasses.has(CRT_PIPELINE))
    renderer.pipelines.addPostPipeline(CRT_PIPELINE, CrtPipeline);
  return true;
}

/** Turns the effect on or off for one monitor camera. */
export function setCrt(cam: Phaser.Cameras.Scene2D.Camera, on: boolean): void {
  if (!(cam.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  const has = cam.getPostPipeline(CRT_PIPELINE);
  if (on && !(Array.isArray(has) ? has.length : has)) cam.setPostPipeline(CRT_PIPELINE);
  if (!on) cam.removePostPipeline(CRT_PIPELINE);
}
