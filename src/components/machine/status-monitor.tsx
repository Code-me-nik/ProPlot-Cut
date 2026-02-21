"use client"

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Cpu, Activity, Link2 } from "lucide-react"

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

interface StatusMonitorProps {
  x: number;
  y: number;
  z: number;
  state: 'IDLE' | 'RUN' | 'HOLD' | 'ALARM' | 'HOME';
  usbConnected: boolean;
  mode: MachineMode;
}

export function StatusMonitor({ x, y, z, state, usbConnected, mode }: StatusMonitorProps) {
  const getStatusColor = () => {
    switch(state) {
      case 'IDLE': return 'bg-blue-500';
      case 'RUN': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse';
      case 'HOLD': return 'bg-orange-500';
      case 'ALARM': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      default: return 'bg-gray-500';
    }
  }

  const getModeDisplay = () => {
    switch(mode) {
      case 'PLOTTER': return 'PLOT';
      case 'STICKER': return 'STICKER';
      case 'VINYL': return 'VINYL';
      default: return mode;
    }
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full p-3 bg-secondary/60 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(63,81,181,0.1)]">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground uppercase font-black tracking-widest">
          <Link2 className="w-2.5 h-2.5" /> LINK
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            usbConnected ? 'bg-green-500 animate-pulse glow-green' : 'bg-red-500'
          )} />
          <span className="text-xs font-black truncate">{usbConnected ? 'GRBL 1.1h' : 'NO CONN'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground uppercase font-black tracking-widest">
          <Activity className="w-2.5 h-2.5" /> STATE
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className={`${getStatusColor()} border-none text-white px-1.5 py-0 text-[9px] font-black h-4`}>
            {state}
          </Badge>
          <span className="text-[9px] font-black text-primary truncate uppercase">{getModeDisplay()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 col-span-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground uppercase font-black tracking-widest">
          <Cpu className="w-2.5 h-2.5" /> COORDINATES
        </div>
        <div className="flex gap-3 items-center overflow-x-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-primary">X</span>
            <span className="text-sm font-code font-bold tabular-nums">{x.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-primary">Y</span>
            <span className="text-sm font-code font-bold tabular-nums">{y.toFixed(2)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-black text-primary">Z</span>
            <span className="text-sm font-code font-bold tabular-nums">{z.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { cn } from "@/lib/utils"
