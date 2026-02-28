import React, { useRef, useEffect, useState, useCallback } from "react";

interface RevealCanvasProps {
  imageSrc: string;
  revealedCircles: { x: number; y: number; radius: number }[];
  revealMode: "bubbles" | "blur";
  blurLevel: number;
  width: number;
  height: number;
}

const RevealCanvas: React.FC<RevealCanvasProps> = ({
  imageSrc,
  revealedCircles,
  revealMode,
  blurLevel,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = Math.min(width / image.width, height / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    ctx.clearRect(0, 0, width, height);

    if (revealMode === "blur") {
      // Blur reveal: draw image with decreasing blur
      ctx.filter = blurLevel > 0 ? `blur(${blurLevel}px)` : "none";
      ctx.drawImage(image, offsetX, offsetY, drawW, drawH);
      ctx.filter = "none";
    } else {
      // Bubble reveal: blurred background + circle cutouts
      ctx.filter = "blur(40px) brightness(0.3)";
      ctx.drawImage(image, offsetX, offsetY, drawW, drawH);
      ctx.filter = "none";

      // Dark overlay
      ctx.fillStyle = "rgba(15, 20, 35, 0.7)";
      ctx.fillRect(0, 0, width, height);

      // Question marks pattern
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.font = "bold 40px Fredoka";
      for (let x = 20; x < width; x += 80) {
        for (let y = 40; y < height; y += 80) {
          ctx.fillText("?", x, y);
        }
      }

      // Reveal circles with clear image
      if (revealedCircles.length > 0) {
        ctx.save();
        ctx.beginPath();
        revealedCircles.forEach((circle) => {
          const cx = offsetX + circle.x * drawW;
          const cy = offsetY + circle.y * drawH;
          const r = circle.radius * Math.min(drawW, drawH);
          ctx.moveTo(cx + r, cy);
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
        });
        ctx.clip();
        ctx.drawImage(image, offsetX, offsetY, drawW, drawH);
        ctx.restore();

        // Draw circle borders
        revealedCircles.forEach((circle) => {
          const cx = offsetX + circle.x * drawW;
          const cy = offsetY + circle.y * drawH;
          const r = circle.radius * Math.min(drawW, drawH);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = "hsl(16, 90%, 58%)";
          ctx.lineWidth = 3;
          ctx.shadowColor = "hsl(16, 90%, 58%)";
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });
      }
    }
  }, [image, revealedCircles, revealMode, blurLevel, width, height]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-2xl border-2 border-border max-w-full"
      style={{ maxHeight: height }}
    />
  );
};

export default RevealCanvas;
