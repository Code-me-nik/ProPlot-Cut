"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Maximize2, ZoomIn, ZoomOut, Move, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ToolpathRendererProps {
  currentPath: string;
  completedLines: number;
  progress: number; // 0 to 100
}

export function ToolpathRenderer({ currentPath, completedLines, progress }: ToolpathRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle Resize and Fullscreen state
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size.width * window.devicePixelRatio;
    canvas.height = size.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const draw = () => {
      ctx.clearRect(0, 0, size.width, size.height);
      
      // Draw Grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 0.5;
      const step = 25 * zoom;
      for (let i = 0; i < size.width; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size.height); ctx.stroke();
      }
      for (let i = 0; i < size.height; i += step) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size.width, i); ctx.stroke();
      }

      // Origin Lines
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(size.width/2, 0); ctx.lineTo(size.width/2, size.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, size.height/2); ctx.lineTo(size.width, size.height/2); ctx.stroke();

      // Toolpath simulation
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const radius = 80 * zoom;

      // Planned path
      ctx.strokeStyle = '#333';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Completed Path
      if (progress > 0) {
        ctx.strokeStyle = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,255,0,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, (Math.PI * 2) * (progress / 100));
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Tool Head
      const currentAngle = (Math.PI * 2) * (progress / 100);
      const toolX = centerX + radius * Math.cos(currentAngle);
      const toolY = centerY + radius * Math.sin(currentAngle);

      ctx.fillStyle = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(255,0,0,0.8)';
      ctx.beginPath();
      ctx.arc(toolX, toolY, 5, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();
  }, [zoom, size, progress, currentPath, completedLines]);

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-full bg-[#050505] rounded-lg border border-white/5 overflow-hidden flex flex-col group transition-all",
        isFullscreen ? "rounded-none" : ""
      )}
    >
      {/* Progress Ribbon */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="h-1 w-full bg-white/5 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(63,81,181,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center px-3 py-1 bg-black/40 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Progress</span>
            <span className="text-[10px] sm:text-xs font-code font-bold text-primary">{progress.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] sm:text-[9px] font-bold text-green-500/80 animate-pulse">● LIVE FEED</span>
          </div>
        </div>
      </div>

      <div className="absolute top-12 left-2 flex flex-col gap-1 z-10 transition-opacity opacity-40 group-hover:opacity-100">
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setZoom(z => z + 0.2)}><ZoomIn className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}><ZoomOut className="w-4 h-4" /></Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-crosshair touch-none"
      />
      
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center pointer-events-none">
        <div className="bg-black/80 px-3 py-1.5 rounded-sm border border-white/10 text-[9px] font-bold text-muted-foreground flex items-center gap-2 backdrop-blur-sm">
          <Move className="w-3 h-3" />
          <span>REAL-TIME TRACKING</span>
        </div>
      </div>
    </div>
  )
}