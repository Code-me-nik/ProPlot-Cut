"use client"

import React, { useState } from 'react'
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

  const steps = [0.1, 1, 10, 50];

  return (
    <div className="flex flex-col gap-4 p-4 bg-secondary/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="w-3 h-3" /> Manual Control (JOG)
        </h3>
        <div className="flex bg-muted rounded-sm p-0.5">
          {steps.map((s) => (
            <button
              key={s}
              onClick={() => setStepSize(s)}
              className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-colors ${
                stepSize === s ? "bg-primary text-white" : "hover:text-foreground text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        <div />
        <Button variant="outline" size="icon" onClick={() => onMove('Y', stepSize)} className="h-12 w-12 border-primary/20 hover:border-primary">
          <ChevronUp />
        </Button>
        <div />

        <Button variant="outline" size="icon" onClick={() => onMove('X', -stepSize)} className="h-12 w-12 border-primary/20 hover:border-primary">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" className="h-12 w-12 bg-primary/10 border-primary/40">
          <RotateCcw className="w-4 h-4 text-primary" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onMove('X', stepSize)} className="h-12 w-12 border-primary/20 hover:border-primary">
          <ChevronRight />
        </Button>

        <div />
        <Button variant="outline" size="icon" onClick={() => onMove('Y', -stepSize)} className="h-12 w-12 border-primary/20 hover:border-primary">
          <ChevronDown />
        </Button>
        <div />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase text-muted-foreground font-bold">Tool Z-Axis</span>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10 border-primary/20" onClick={() => onMove('Z', stepSize)}>
              <ArrowUpRight className="w-4 h-4 mr-1" /> Lift
            </Button>
            <Button variant="outline" className="flex-1 h-10 border-primary/20" onClick={() => onMove('Z', -stepSize)}>
              <ArrowUpLeft className="w-4 h-4 mr-1" /> Drop
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-muted-foreground font-bold">Feed Rate</span>
            <span className="text-[10px] font-mono">{feedRate} mm/m</span>
          </div>
          <Slider 
            value={[feedRate]} 
            onValueChange={([v]) => setFeedRate(v)} 
            max={5000} 
            step={100} 
            className="py-2"
          />
        </div>
      </div>
    </div>
  )
}
