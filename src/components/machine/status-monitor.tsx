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
      case 'PLOTTER': return 'PLOTTER';
      case 'STICKER': return 'STICKER CUT';
      case 'VINYL': return 'VINYL CUT';
      default: return mode;
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full p-4 bg-secondary/80 rounded-lg border border-primary/30 glow-blue">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
          <Link2 className="w-3 h-3" /> Connection
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${usbConnected ? 'bg-green-500 glow-green' : 'bg-red-500'}`} />
          <span className="text-sm font-bold">{usbConnected ? 'GRBL 1.1h Ready' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
          <Activity className="w-3 h-3" /> Machine State
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor()} border-none text-white px-3 py-0 text-[10px] font-black`}>
            {state}
          </Badge>
          <span className="text-[10px] font-bold text-primary italic uppercase">{getModeDisplay()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
          <Cpu className="w-3 h-3" /> Machine Coordinates
        </div>
        <div className="flex gap-4 items-baseline">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black text-primary">X</span>
            <span className="text-xl font-code font-bold tracking-tight">{x.toFixed(3)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black text-primary">Y</span>
            <span className="text-xl font-code font-bold tracking-tight">{y.toFixed(3)}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black text-primary">Z</span>
            <span className="text-xl font-code font-bold tracking-tight">{z.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
