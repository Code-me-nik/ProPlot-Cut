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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setSize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match display size
    canvas.width = size.width * window.devicePixelRatio;
    canvas.height = size.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      ctx.clearRect(0, 0, size.width, size.height);
      
      // Draw Grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      const step = 20 * zoom;
      for (let i = 0; i < size.width; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size.height); ctx.stroke();
      }
      for (let i = 0; i < size.height; i += step) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size.width, i); ctx.stroke();
      }

      // Origin Lines
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(size.width/2, 0); ctx.lineTo(size.width/2, size.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, size.height/2); ctx.lineTo(size.width, size.height/2); ctx.stroke();

      // Toolpath simulation
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const radius = 50 * zoom;

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Completed simulation
      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 1.5);
      ctx.stroke();

      // Current Pos
      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(centerX + radius, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
  }, [zoom, size, currentPath, completedLines]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#050505] rounded-lg border border-white/5 overflow-hidden flex flex-col group">
      <div className="absolute top-2 left-2 flex gap-1 z-10 transition-opacity opacity-40 group-hover:opacity-100">
        <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80" onClick={() => setZoom(z => z + 0.1)}><ZoomIn className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80"><Move className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80"><Maximize2 className="w-4 h-4" /></Button>
      </div>
      
      <div className="absolute top-2 right-2 text-[8px] sm:text-[10px] font-code bg-black/60 px-2 py-0.5 sm:py-1 rounded text-green-500 border border-green-500/30">
        RENDERER ACTIVE
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-crosshair touch-none"
      />
      
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center pointer-events-none">
        <div className="bg-black/60 px-2 sm:px-3 py-1 rounded border border-white/10 text-[8px] sm:text-[10px] font-bold text-muted-foreground flex items-center gap-2">
          <span>ORIGIN (0,0,0)</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
