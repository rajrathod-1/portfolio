/**
 * Rasterises text to a canvas and returns `count` points on its glyphs, sized
 * to fit `maxW` × `maxH` world units. One in ten points stays loose as dust so
 * the name never looks like a stencil.
 */
export function sampleText(
  lines: string[],
  font: string,
  count: number,
  maxW: number,
  maxH: number
): Float32Array {
  const size = 220;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `${size}px ${font}`;
  const lineH = size * 0.9;
  const pad = 20;
  const w = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2);
  const h = Math.ceil(lineH * lines.length + pad * 2);
  canvas.width = w;
  canvas.height = h;

  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => ctx.fillText(line, w / 2, pad + lineH * (i + 0.55)));

  const alpha = ctx.getImageData(0, 0, w, h).data;
  const hits: number[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (alpha[(y * w + x) * 4 + 3] > 128) hits.push(x, y);

  const scale = Math.min(maxW / w, maxH / h);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (hits.length === 0 || Math.random() < 0.1) {
      out[i * 3] = (Math.random() - 0.5) * maxW * 1.6;
      out[i * 3 + 1] = (Math.random() - 0.5) * maxH * 2.4;
      out[i * 3 + 2] = (Math.random() - 0.5) * 6;
      continue;
    }
    const j = Math.floor(Math.random() * (hits.length / 2)) * 2;
    out[i * 3] = (hits[j] + Math.random() - w / 2) * scale;
    out[i * 3 + 1] = -(hits[j + 1] + Math.random() - h / 2) * scale;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return out;
}
