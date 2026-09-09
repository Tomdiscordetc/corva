import { useEffect, useRef } from "react";

type ScenePhase = "idle" | "checking" | "granted";
type SceneControls = { phase: ScenePhase; paused: boolean };
type Mesh = { positions: WebGLBuffer; normals: WebGLBuffer; indices: WebGLBuffer; count: number };

const VERTEX = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  uniform mat4 uModel;
  uniform mat4 uViewProjection;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  void main() {
    vec4 world = uModel * vec4(aPosition, 1.0);
    vPosition = world.xyz;
    vNormal = mat3(uModel) * aNormal;
    vLocalNormal = aNormal;
    gl_Position = uViewProjection * world;
  }
`;

// Die Spiegelungen werden gerechnet, nicht geladen — so bleibt die Tiefe im Metall
// ohne eine einzige Fremddatei (Regel 6: nichts wird nachgeladen).
const FRAGMENT = `
  precision highp float;
  uniform vec3 uBase;
  uniform vec3 uMetal;
  uniform vec3 uLight;
  uniform vec3 uRim;
  uniform float uTime;
  uniform float uPhase;
  uniform float uEmission;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(vec3(0.0, 0.0, 7.8) - vPosition);
    vec3 reflection = reflect(-view, n);
    float facing = max(dot(n, view), 0.0);
    float rim = pow(1.0 - facing, 3.0);
    float softbox = pow(max(dot(reflection, normalize(vec3(-0.6, 0.9, 1.0))), 0.0), 14.0);
    float strip = pow(max(1.0 - abs(reflection.y + reflection.x * 0.37 - 0.24), 0.0), 32.0);
    float lowerStrip = pow(max(1.0 - abs(reflection.y - reflection.x * 0.18 + 0.58), 0.0), 42.0);
    float blueBox = pow(max(dot(reflection, normalize(vec3(1.0, -0.25, 0.55))), 0.0), 10.0);
    vec3 keyHalf = normalize(normalize(vec3(-3.0, 4.0, 6.0)) + view);
    float specular = pow(max(dot(n, keyHalf), 0.0), 100.0);
    float diffuse = max(dot(n, normalize(vec3(-0.7, 0.9, 0.6))), 0.0);
    float engravedEdge = pow(abs(vLocalNormal.z), 18.0);
    vec3 color = uBase * 0.34 + uMetal * (0.055 + diffuse * 0.14);
    color += uLight * (softbox * 1.25 + strip * 0.94 + lowerStrip * 0.35 + specular * 1.8);
    color += uRim * (blueBox * 0.82 + rim * 0.46 + engravedEdge * 0.065);
    float pulse = 0.86 + sin(uTime * 1.3 + vPosition.y * 1.8) * 0.14;
    color = mix(color, uRim * (0.75 + pulse * 0.35) + uLight * pow(facing, 8.0) * 0.5, uEmission);
    color += uRim * uPhase * (rim * 0.17 + engravedEdge * 0.05);
    color = color / (vec3(0.72) + color);
    gl_FragColor = vec4(pow(max(color, vec3(0.0)), vec3(0.78)), 1.0);
  }
`;

const BACKGROUND_VERTEX = `
  attribute vec2 aPosition;
  void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;
const BACKGROUND_FRAGMENT = `
  precision mediump float;
  uniform vec2 uResolution;
  uniform vec2 uCenter;
  uniform vec3 uRim;
  uniform float uRadius;
  uniform float uTime;
  uniform float uPhase;
  void main() {
    vec2 p = (gl_FragCoord.xy - uCenter * uResolution) / uRadius;
    float halo = exp(-dot(p, p) * 1.75) * 0.17;
    vec2 hazePoint = p - vec2(-0.24, 0.12);
    float haze = exp(-dot(hazePoint, hazePoint) * 0.38) * 0.025;
    float wave = 0.91 + sin(uTime * 0.5) * 0.09;
    float alpha = (halo + haze) * wave * (1.0 + uPhase * 0.32);
    gl_FragColor = vec4(uRim * alpha, alpha);
  }
`;
const PARTICLE_VERTEX = `
  attribute vec3 aPosition;
  uniform mat4 uViewProjection;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec3 point = aPosition;
    point.x += sin(uTime * 0.08 + point.y) * 0.13;
    point.y += sin(uTime * 0.06 + point.x) * 0.16;
    gl_Position = uViewProjection * vec4(point, 1.0);
    vAlpha = 0.2 + 0.24 * sin(point.x * 31.0 + uTime * 0.3) * sin(point.x * 31.0 + uTime * 0.3);
    gl_PointSize = uPixelRatio * (1.2 + fract(abs(point.x * 17.0)) * 1.7);
  }
`;
const PARTICLE_FRAGMENT = `
  precision mediump float;
  uniform vec3 uLight;
  varying float vAlpha;
  void main() {
    float distance = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(uLight, (1.0 - smoothstep(0.04, 0.5, distance)) * vAlpha);
  }
`;

function multiply(a: Float32Array, b: Float32Array) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return result;
}

function rotation(x: number, y: number, z: number) {
  const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  return new Float32Array([
    cy * cz, cx * sz + sx * sy * cz, sx * sz - cx * sy * cz, 0,
    -cy * sz, cx * cz - sx * sy * sz, sx * cz + cx * sy * sz, 0,
    sy, -sx * cy, cx * cy, 0,
    0, 0, 0, 1,
  ]);
}

function readColor(style: CSSStyleDeclaration, name: string, fallback: number[]) {
  const values = style.getPropertyValue(name).trim().split(/[\s,]+/).map(Number);
  return new Float32Array(values.length === 3 && values.every(Number.isFinite) ? values.map((v) => v / 255) : fallback.map((v) => v / 255));
}

/**
 * Dekorative 3D-Bühne ohne Bibliothek. Sie lebt nur auf der Anmeldeseite und
 * räumt beim Verlassen alles wieder ab: Puffer, Programme und alle Melder.
 */
export function LoginScene({ phase, paused }: SceneControls) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controls = useRef<SceneControls>({ phase, paused });
  const invalidate = useRef<() => void>(() => undefined);

  useEffect(() => {
    controls.current = { phase, paused };
    invalidate.current();
  }, [phase, paused]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    let gl: WebGLRenderingContext | null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true, depth: true, powerPreference: "low-power", premultipliedAlpha: true });
    } catch {
      gl = null;
    }
    if (!gl) {
      host.dataset.renderer = "fallback";
      host.dataset.ready = "true";
      host.dataset.paused = "true";
      return;
    }
    const context = gl;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    let reducedMotion = motionQuery.matches;
    let disposed = false;
    let contextLost = false;
    let animationFrame = 0;
    let previousTime = 0;
    let elapsed = 0;
    let width = 1, height = 1, pixelRatio = 1;
    let quality = 1;
    let slowFrames = 0;
    let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
    let buffers: WebGLBuffer[] = [];
    let shaders: WebGLShader[] = [];
    let programs: WebGLProgram[] = [];
    let objectProgram: WebGLProgram;
    let backgroundProgram: WebGLProgram;
    let particleProgram: WebGLProgram;
    let screenBuffer: WebGLBuffer;
    let particleBuffer: WebGLBuffer;
    let rings: Mesh[] = [];
    const enabledAttributes = new Set<number>();
    const uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
    let colors = {
      base: new Float32Array([5 / 255, 12 / 255, 25 / 255]),
      metal: new Float32Array([150 / 255, 177 / 255, 207 / 255]),
      light: new Float32Array([231 / 255, 246 / 255, 1]),
      rim: new Float32Array([58 / 255, 196 / 255, 1]),
    };

    function uniform(program: WebGLProgram, name: string) {
      let cache = uniforms.get(program);
      if (!cache) { cache = new Map(); uniforms.set(program, cache); }
      if (!cache.has(name)) cache.set(name, context.getUniformLocation(program, name));
      return cache.get(name) ?? null;
    }

    function program(vertex: string, fragment: string) {
      const result = context.createProgram();
      if (!result) throw new Error("WebGL-Programm nicht verfügbar");
      programs.push(result);
      for (const [type, source] of [[context.VERTEX_SHADER, vertex], [context.FRAGMENT_SHADER, fragment]] as const) {
        const shader = context.createShader(type);
        if (!shader) throw new Error("WebGL-Shader nicht verfügbar");
        shaders.push(shader);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error("WebGL-Shader ließ sich nicht übersetzen");
        context.attachShader(result, shader);
      }
      context.linkProgram(result);
      if (!context.getProgramParameter(result, context.LINK_STATUS)) throw new Error("WebGL-Programm ließ sich nicht binden");
      return result;
    }

    function buffer(data: Float32Array | Uint16Array, element = false) {
      const result = context.createBuffer();
      if (!result) throw new Error("WebGL-Puffer nicht verfügbar");
      buffers.push(result);
      const target = element ? context.ELEMENT_ARRAY_BUFFER : context.ARRAY_BUFFER;
      context.bindBuffer(target, result);
      context.bufferData(target, data, context.STATIC_DRAW);
      return result;
    }

    function torus(radius: number, tube: number, depth = 1) {
      const positions: number[] = [], normals: number[] = [], indices: number[] = [];
      const around = 160, section = 24;
      for (let i = 0; i <= around; i++) {
        const u = i / around * Math.PI * 2;
        for (let j = 0; j <= section; j++) {
          const v = j / section * Math.PI * 2;
          const nx = Math.cos(u) * Math.cos(v), ny = Math.sin(u) * Math.cos(v), nz = Math.sin(v);
          positions.push(Math.cos(u) * radius + tube * nx, Math.sin(u) * radius + tube * ny, tube * nz * depth);
          normals.push(nx, ny, nz / depth);
          if (i < around && j < section) {
            const a = i * (section + 1) + j, b = a + section + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        }
      }
      return { positions: buffer(new Float32Array(positions)), normals: buffer(new Float32Array(normals)), indices: buffer(new Uint16Array(indices), true), count: indices.length };
    }

    function disposeResources() {
      for (const item of buffers) context.deleteBuffer(item);
      for (const item of programs) context.deleteProgram(item);
      for (const item of shaders) context.deleteShader(item);
      buffers = []; programs = []; shaders = []; rings = [];
      uniforms.clear();
    }

    function initialize() {
      try {
        objectProgram = program(VERTEX, FRAGMENT);
        backgroundProgram = program(BACKGROUND_VERTEX, BACKGROUND_FRAGMENT);
        particleProgram = program(PARTICLE_VERTEX, PARTICLE_FRAGMENT);
        screenBuffer = buffer(new Float32Array([-1, -1, 3, -1, -1, 3]));
        rings = [torus(1.72, 0.205, 1.2), torus(1.46, 0.18, 1.15), torus(1.17, 0.135, 1.1), torus(0.83, 0.024), torus(2.25, 0.008)];
        let seed = 317;
        const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        const particles: number[] = [];
        for (let i = 0; i < 105; i++) particles.push((random() - 0.5) * 10, (random() - 0.5) * 8, -1.5 - random() * 4);
        particleBuffer = buffer(new Float32Array(particles));
        host!.dataset.renderer = "webgl";
        return true;
      } catch {
        disposeResources();
        host!.dataset.renderer = "fallback";
        return false;
      }
    }

    let available = initialize();

    function readPalette() {
      const style = getComputedStyle(host!);
      colors = {
        base: readColor(style, "--auth-scene-base-rgb", [5, 12, 25]),
        metal: readColor(style, "--auth-scene-metal-rgb", [150, 177, 207]),
        light: readColor(style, "--auth-scene-light-rgb", [231, 246, 255]),
        rim: readColor(style, "--auth-scene-rim-rgb", [58, 196, 255]),
      };
    }

    function resize() {
      const rect = host!.getBoundingClientRect();
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const budget = width < 900 ? 650_000 : 1_450_000;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6, Math.sqrt(budget / (width * height))) * quality;
      const nextWidth = Math.max(1, Math.round(width * pixelRatio)), nextHeight = Math.max(1, Math.round(height * pixelRatio));
      if (canvas!.width !== nextWidth || canvas!.height !== nextHeight) { canvas!.width = nextWidth; canvas!.height = nextHeight; }
      context.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function attribute(program: WebGLProgram, name: string, source: WebGLBuffer, size: number) {
      const location = context.getAttribLocation(program, name);
      if (location < 0) return;
      context.bindBuffer(context.ARRAY_BUFFER, source);
      context.enableVertexAttribArray(location);
      enabledAttributes.add(location);
      context.vertexAttribPointer(location, size, context.FLOAT, false, 0, 0);
    }

    function useProgram(program: WebGLProgram) {
      // Jeder Durchgang bringt seine eigenen Eingänge mit; alte Zeiger dürfen
      // nicht hängen bleiben.
      for (const location of enabledAttributes) context.disableVertexAttribArray(location);
      enabledAttributes.clear();
      context.useProgram(program);
    }

    function draw() {
      if (!available || disposed || contextLost || document.hidden) return;
      const mobile = width < 900;
      const centerX = mobile ? 0.5 : 0.29;
      const centerY = mobile ? 1 - Math.min(215, width * 0.48 + 20) / height : height < 800 ? 0.62 : 0.6;
      const radius = mobile ? Math.min(width * 0.43, 180) : Math.min(width * 0.218, height * (height < 800 ? 0.29 : 0.32));
      const focal = radius * 15.6 / (2.05 * height);
      const near = 0.1, far = 40;
      const projection = new Float32Array([
        focal / (width / height), 0, 0, 0,
        0, focal, 0, 0,
        -(centerX * 2 - 1), -(centerY * 2 - 1), -(far + near) / (far - near), -1,
        0, 0, -(2 * far * near) / (far - near), 0,
      ]);
      const view = rotation(0, 0, 0);
      view[14] = -7.8;
      const viewProjection = multiply(projection, view);
      const phaseAmount = controls.current.phase === "granted" ? 1 : controls.current.phase === "checking" ? 0.55 : 0;
      context.clearColor(0, 0, 0, 0);
      context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
      context.disable(context.DEPTH_TEST);
      context.disable(context.CULL_FACE);
      context.disable(context.BLEND);
      useProgram(backgroundProgram);
      attribute(backgroundProgram, "aPosition", screenBuffer, 2);
      context.uniform2f(uniform(backgroundProgram, "uResolution"), canvas!.width, canvas!.height);
      context.uniform2f(uniform(backgroundProgram, "uCenter"), centerX, centerY);
      context.uniform1f(uniform(backgroundProgram, "uRadius"), radius * pixelRatio);
      context.uniform3fv(uniform(backgroundProgram, "uRim"), colors.rim);
      context.uniform1f(uniform(backgroundProgram, "uTime"), elapsed);
      context.uniform1f(uniform(backgroundProgram, "uPhase"), phaseAmount);
      context.drawArrays(context.TRIANGLES, 0, 3);

      context.enable(context.BLEND);
      context.blendFunc(context.SRC_ALPHA, context.ONE);
      useProgram(particleProgram);
      attribute(particleProgram, "aPosition", particleBuffer, 3);
      context.uniformMatrix4fv(uniform(particleProgram, "uViewProjection"), false, viewProjection);
      context.uniform1f(uniform(particleProgram, "uTime"), elapsed);
      context.uniform1f(uniform(particleProgram, "uPixelRatio"), pixelRatio);
      context.uniform3fv(uniform(particleProgram, "uLight"), colors.light);
      context.drawArrays(context.POINTS, 0, 105);

      context.disable(context.BLEND);
      context.enable(context.DEPTH_TEST);
      context.enable(context.CULL_FACE);
      context.cullFace(context.BACK);
      useProgram(objectProgram);
      context.uniformMatrix4fv(uniform(objectProgram, "uViewProjection"), false, viewProjection);
      context.uniform3fv(uniform(objectProgram, "uBase"), colors.base);
      context.uniform3fv(uniform(objectProgram, "uMetal"), colors.metal);
      context.uniform3fv(uniform(objectProgram, "uLight"), colors.light);
      context.uniform3fv(uniform(objectProgram, "uRim"), colors.rim);
      context.uniform1f(uniform(objectProgram, "uTime"), elapsed);
      context.uniform1f(uniform(objectProgram, "uPhase"), phaseAmount);
      const t = elapsed * 0.12;
      const parent = rotation(easedY * 0.1, easedX * 0.14, -0.1);
      const orientations = [
        rotation(0.94 + Math.sin(t * 0.8) * 0.16, 0.34 + t * 0.24, 0.23 + t * 0.19),
        rotation(-0.66 + t * 0.31, 1.05 + Math.sin(t * 0.6) * 0.18, -0.46 - t * 0.22),
        rotation(1.24 - t * 0.22, 0.66 + t * 0.35, 0.61 + t * 0.28),
        rotation(0.12 + t * 0.19, 0.35 + t * 0.16, t * 0.11),
        rotation(1.24 + Math.sin(t * 0.4) * 0.08, -0.28 + t * 0.08, -0.24),
      ];
      for (let i = 0; i < rings.length; i++) {
        const mesh = rings[i];
        const model = multiply(parent, orientations[i]);
        model[13] = Math.sin(elapsed * 0.25) * 0.025;
        context.uniformMatrix4fv(uniform(objectProgram, "uModel"), false, model);
        context.uniform1f(uniform(objectProgram, "uEmission"), i >= 3 ? (i === 3 ? 0.9 : 0.5) : 0);
        attribute(objectProgram, "aPosition", mesh.positions, 3);
        attribute(objectProgram, "aNormal", mesh.normals, 3);
        context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, mesh.indices);
        context.drawElements(context.TRIANGLES, mesh.count, context.UNSIGNED_SHORT, 0);
      }
    }

    function shouldAnimate() { return available && !disposed && !contextLost && !document.hidden && !reducedMotion && !controls.current.paused; }

    function frame(now: number) {
      animationFrame = 0;
      if (!shouldAnimate()) { previousTime = 0; return; }
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
      if (previousTime && now - previousTime > 29) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 100 && quality > 0.65) { quality = Math.max(0.65, quality - 0.15); slowFrames = 0; resize(); }
      previousTime = now;
      elapsed += delta;
      const easing = 1 - Math.exp(-delta * 4);
      easedX += (pointerX - easedX) * easing;
      easedY += (pointerY - easedY) * easing;
      draw();
      animationFrame = window.requestAnimationFrame(frame);
    }

    function refresh() {
      if (disposed) return;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousTime = 0;
      draw();
      host!.dataset.ready = "true";
      host!.dataset.paused = String(!shouldAnimate());
      if (shouldAnimate()) animationFrame = window.requestAnimationFrame(frame);
    }

    function onResize() { if (!contextLost) resize(); refresh(); }
    function onThemeChange() { readPalette(); refresh(); }
    function onMotionChange() { reducedMotion = motionQuery.matches; pointerX = 0; pointerY = 0; easedX = 0; easedY = 0; refresh(); }
    function onPointer(event: PointerEvent) {
      if (!pointerQuery.matches || !shouldAnimate()) return;
      pointerX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, event.clientY / window.innerHeight * 2 - 1));
    }
    function onPointerLeave() { pointerX = 0; pointerY = 0; }
    function onContextLost(event: Event) { event.preventDefault(); contextLost = true; host!.dataset.renderer = "fallback"; refresh(); }
    function onContextRestored() { contextLost = false; disposeResources(); available = initialize(); readPalette(); onResize(); }
    const resizeObserver = new ResizeObserver(onResize);
    const themeObserver = new MutationObserver(onThemeChange);
    resizeObserver.observe(host);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
    motionQuery.addEventListener("change", onMotionChange);
    pointerQuery.addEventListener("change", onPointerLeave);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerout", onPointerLeave, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    invalidate.current = refresh;
    readPalette();
    resize();
    refresh();

    return () => {
      disposed = true;
      invalidate.current = () => undefined;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      pointerQuery.removeEventListener("change", onPointerLeave);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerout", onPointerLeave);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      disposeResources();
    };
  }, []);

  return (
    <div ref={hostRef} className="auth-scene" aria-hidden="true" data-renderer="fallback">
      <div className="auth-scene-fallback" />
      <canvas ref={canvasRef} className="auth-scene-canvas" />
    </div>
  );
}
