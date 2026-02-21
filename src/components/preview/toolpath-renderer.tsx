"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Maximize2, ZoomIn, ZoomOut, Move } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToolpathRendererProps {
  currentPath: string;
  completedLines: number;
}

export function ToolpathRenderer({ currentPath, completedLines }: ToolpathRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  // Simplified simulation of toolpath rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 0.5;
      const step = 20 * zoom;
      for (let i = 0; i < canvas.width; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += step) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw Toolpath (Dummy data for visualization)
      ctx.strokeStyle = '#4a5568'; // Remaining path
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(200, 100);
      ctx.lineTo(200, 200);
      ctx.lineTo(100, 200);
      ctx.lineTo(100, 100);
      ctx.stroke();

      // Draw Completed Path
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(200, 100);
      ctx.stroke();

      // Draw current position
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(200, 100, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
  }, [zoom, currentPath, completedLines]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg border border-border overflow-hidden flex flex-col">
      <div className="absolute top-2 left-2 flex gap-1 z-10">
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setZoom(z => z + 0.1)}><ZoomIn className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80"><Move className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80"><Maximize2 className="w-4 h-4" /></Button>
      </div>
      
      <div className="absolute top-2 right-2 text-[10px] font-code bg-black/60 px-2 py-1 rounded text-green-500 border border-green-500/30">
        60 FPS LIVE
      </div>

      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="w-full h-full cursor-crosshair touch-none"
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
        <div className="bg-black/60 px-3 py-1 rounded border border-white/10 text-[10px] font-bold text-muted-foreground flex items-center gap-2">
          <span>ORIGIN (0,0,0)</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
