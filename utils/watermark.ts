
export const WATERMARK_TEXT = "ai-shop.thedigitalgentry.co.uk";

/**
 * Draws the watermark text on a given Canvas Context.
 * Locations: Top Right and Bottom Center.
 */
export const drawWatermarkOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Dynamic font size based on image width
  const fontSize = Math.max(14, width * 0.025);
  ctx.font = `bold ${fontSize}px sans-serif`;
  
  // Style: White text with semi-transparent black stroke for visibility on all backgrounds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = fontSize / 8;
  
  const padding = width * 0.02;

  // 1. Top Right
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.strokeText(WATERMARK_TEXT, width - padding, padding);
  ctx.fillText(WATERMARK_TEXT, width - padding, padding);

  // 2. Bottom Center (Footer)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.strokeText(WATERMARK_TEXT, width / 2, height - padding);
  ctx.fillText(WATERMARK_TEXT, width / 2, height - padding);
};

/**
 * Takes a base64 image string, draws watermarks, and returns the new base64 string.
 */
export const addWatermarkToImage = (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        drawWatermarkOnCanvas(ctx, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(base64Image); // Fallback
      }
    };
    img.onerror = () => resolve(base64Image); // Fallback
  });
};
