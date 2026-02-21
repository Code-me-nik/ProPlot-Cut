"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpRight, ArrowUpLeft, RotateCcw, Zap } from "lucide-react"

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
    // Initial move on press
    onMove(axis, direction * stepSize);

    // After a delay, start continuous small steps
    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        const continuousStep = stepSize > 1 ? stepSize / 5 : stepSize;
        onMove(axis, direction * continuousStep);
      }, 100);
    }, 300); 
  }, [onMove, stepSize]);

  const stopMoving = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-secondary/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="w-3 h-3" /> Manual Control (JOG)
        </h3>
        <div className="flex bg-muted rounded-sm p-0.5">
          {steps.map((s) => (
            <button
              key={s}
              onClick={() => setStepSize(s)}
              className={`px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold rounded-sm transition-colors ${
                stepSize === s ? "bg-primary text-white" : "hover:text-foreground text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[180px] sm:max-w-[200px] mx-auto select-none">
        <div />
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('Y', 1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary active:bg-primary/20"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
        <div />

        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('X', -1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary active:bg-primary/20"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 border-primary/40">
          <RotateCcw className="w-4 h-4 text-primary" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('X', 1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary active:bg-primary/20"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        <div />
        <Button 
          variant="outline" 
          size="icon" 
          onPointerDown={() => startMoving('Y', -1)}
          onPointerUp={stopMoving}
          onPointerLeave={stopMoving}
          className="h-10 w-10 sm:h-12 sm:w-12 border-primary/20 hover:border-primary active:bg-primary/20"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
        <div />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase text-muted-foreground font-black">Tool Z-Axis</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 h-9 sm:h-10 border-primary/20 text-[10px] font-bold" 
              onPointerDown={() => startMoving('Z', 1)}
              onPointerUp={stopMoving}
              onPointerLeave={stopMoving}
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Lift
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-9 sm:h-10 border-primary/20 text-[10px] font-bold" 
              onPointerDown={() => startMoving('Z', -1)}
              onPointerUp={stopMoving}
              onPointerLeave={stopMoving}
            >
              <ArrowUpLeft className="w-3.5 h-3.5 mr-1" /> Drop
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase text-muted-foreground font-black">Feed</span>
            <span className="text-[9px] font-mono font-bold">{feedRate}</span>
          </div>
          <Slider 
            value={[feedRate]} 
            onValueChange={([v]) => setFeedRate(v)} 
            max={5000} 
            step={100} 
            className="py-1"
          />
        </div>
      </div>
    </div>
  )
}
