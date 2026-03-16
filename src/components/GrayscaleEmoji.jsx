import { useRef, useEffect } from 'react';

// Renders an emoji converted to true grayscale using canvas pixel manipulation.
// CSS filter: grayscale() doesn't desaturate color emoji fonts on iOS/Android.
export default function GrayscaleEmoji({ emoji, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = size * dpr;
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);
    ctx.font = `${Math.round(size * 0.72)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);
    const imgData = ctx.getImageData(0, 0, S, S);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
  }, [emoji, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}
