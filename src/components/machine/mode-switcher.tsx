"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { PencilLine, Scissors, Layers, Info } from "lucide-react"

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

interface ModeSwitcherProps {
  currentMode: MachineMode;
  onModeChange: (mode: MachineMode) => void;
  disabled?: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, disabled }: ModeSwitcherProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-lg border border-border/50 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Machine Mode
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary">
          <Info className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 flex-1">
        <Button 
          variant={currentMode === 'PLOTTER' ? 'default' : 'outline'}
          className={`h-full flex flex-col items-center justify-center gap-2 transition-all py-4 ${
            currentMode === 'PLOTTER' ? 'bg-primary border-primary glow-blue' : 'border-primary/20 hover:border-primary/60'
          }`}
          onClick={() => onModeChange('PLOTTER')}
          disabled={disabled}
        >
          <PencilLine className={`w-8 h-8 ${currentMode === 'PLOTTER' ? 'text-white' : 'text-muted-foreground'}`} />
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase">Plotter</span>
            <span className="text-[9px] opacity-60 font-medium">Pen & Ink Control</span>
          </div>
        </Button>

        <Button 
          variant={currentMode === 'STICKER' ? 'default' : 'outline'}
          className={`h-full flex flex-col items-center justify-center gap-2 transition-all py-4 ${
            currentMode === 'STICKER' ? 'bg-primary border-primary glow-blue' : 'border-primary/20 hover:border-primary/60'
          }`}
          onClick={() => onModeChange('STICKER')}
          disabled={disabled}
        >
          <Scissors className={`w-8 h-8 ${currentMode === 'STICKER' ? 'text-white' : 'text-muted-foreground'}`} />
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase">Sticker Cutter</span>
            <span className="text-[9px] opacity-60 font-medium">Die-Cut Pressure</span>
          </div>
        </Button>

        <Button 
          variant={currentMode === 'VINYL' ? 'default' : 'outline'}
          className={`h-full flex flex-col items-center justify-center gap-2 transition-all py-4 ${
            currentMode === 'VINYL' ? 'bg-primary border-primary glow-blue' : 'border-primary/20 hover:border-primary/60'
          }`}
          onClick={() => onModeChange('VINYL')}
          disabled={disabled}
        >
          <Layers className={`w-8 h-8 ${currentMode === 'VINYL' ? 'text-white' : 'text-muted-foreground'}`} />
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase">Vinyl Cutter</span>
            <span className="text-[9px] opacity-60 font-medium">Roll-Fed Decals</span>
          </div>
        </Button>
      </div>
    </div>
  )
}
