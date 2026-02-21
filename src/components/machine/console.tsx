"use client"

import React, { useEffect, useRef } from 'react'
import { Terminal } from "lucide-react"

interface ConsoleProps {
  logs: { timestamp: string, type: 'sent' | 'received' | 'error' | 'warning', message: string }[];
}

export function MachineConsole({ logs }: ConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black/80 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-secondary border-b border-border">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <Terminal className="w-3 h-3" /> Serial Console
        </div>
        <div className="flex gap-2">
           <span className="text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">USB ACTIVE</span>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-code text-[11px] space-y-0.5 scroll-smooth">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 leading-tight">
            <span className="text-muted-foreground/40 shrink-0">[{log.timestamp}]</span>
            <span className={`shrink-0 font-bold ${
              log.type === 'sent' ? 'text-blue-400' : 
              log.type === 'error' ? 'text-red-500' : 
              log.type === 'warning' ? 'text-orange-400' : 'text-green-400'
            }`}>
              {log.type === 'sent' ? '>>' : '<<'}
            </span>
            <span className={`break-all ${log.type === 'error' ? 'font-bold underline' : ''}`}>
              {log.message}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-muted-foreground/40 italic">Waiting for machine connection...</div>
        )}
      </div>
    </div>
  )
}
