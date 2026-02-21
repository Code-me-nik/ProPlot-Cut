
"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, ArrowUpLeft, RotateCcw, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

interface JogControlsProps {
  mode: MachineMode;
  onMove: (axis: string, amount: number) => void;
}

export function JogControls({ mode, onMove }: JogControlsProps) {
  const [stepSize, setStepSize] = useState(1);
  const [feedRate, setFeedRate] = useState(1000);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const steps = [0.1, 1, 10, 50];

  const startMoving = useCallback((axis: string, direction: number) => {
    onMove(axis, direction * stepSize);

    // Initial delay before continuous movement
    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        // Continuous steps are smaller for smoother feel if large steps are selected
        const continuousStep = stepSize > 1 ? stepSize / 5 : stepSize;
        onMove(axis, direction * continuousStep);
      }, 120);
    }, 350); 
  }, [onMove, stepSize]);

  const stopMoving = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 bg-secondary/30 rounded-lg border border-white/5 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Manual Jog
        </h3>
        <div className="flex bg-black/40 rounded-sm p-1 gap-1">
          {steps.map((s) => (
            <button
              key={s}
              onClick={() => setStepSize(s)}
              className={cn(
                "px-2 py-1 text-[9px] font-black rounded-sm transition-all active-press",
                stepSize === s ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto select-none p-1 bg-black/20 rounded-xl">
        <div />
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('Y', 1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-14 w-14 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 active-press"
        >
          <ChevronUp className="w-6 h-6" />
        </Button>
        <div />

        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('X', -1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-14 w-14 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 active-press"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" className="h-14 w-14 bg-cyan-500/5 border-cyan-500/20 text-cyan-400 active-press">
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('X', 1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-14 w-14 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 active-press"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        <div />
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('Y', -1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-14 w-14 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 active-press"
        >
          <ChevronDown className="w-6 h-6" />
        </Button>
        <div />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4">
        {/* Z-Axis Control */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center h-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Tool Height</span>
            <span className="text-[9px] font-code font-bold text-muted-foreground/60 uppercase">Z-Axis</span>
          </div>
          <div className="flex gap-2 h-10">
            <Button 
              variant="outline" 
              className="flex-1 h-full border-white/10 text-[9px] font-black active-press uppercase tracking-tighter" 
              onPointerDown={() => startMoving('Z', 1)}
              onPointerUp={stopMoving}
              onPointerLeave={stopMoving}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Lift
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-full border-white/10 text-[9px] font-black active-press uppercase tracking-tighter" 
              onPointerDown={() => startMoving('Z', -1)}
              onPointerUp={stopMoving}
              onPointerLeave={stopMoving}
            >
              <ArrowUpLeft className="w-3.5 h-3.5 mr-1" /> Drop
            </Button>
          </div>
        </div>
        
        {/* Feed Speed Control */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center h-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Feed Speed</span>
            <span className="text-[10px] font-code font-bold text-cyan-400">{feedRate}</span>
          </div>
          <div className="flex items-center h-10 w-full">
            <Slider 
              value={[feedRate]} 
              onValueChange={([v]) => setFeedRate(v)} 
              max={5000} 
              step={100} 
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
