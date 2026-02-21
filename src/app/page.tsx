"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StatusMonitor } from '@/components/machine/status-monitor'
import { JogControls } from '@/components/machine/jog-controls'
import { ToolpathRenderer } from '@/components/preview/toolpath-renderer'
import { MachineConsole } from '@/components/machine/console'
import { ModeSwitcher } from '@/components/machine/mode-switcher'
import { PrecisionTestPanel } from '@/components/test/precision-test-panel'
import { JobQueue } from '@/components/machine/job-queue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Play, 
  Pause, 
  Square, 
  Power, 
  Usb,
  RefreshCw,
  Unlink,
  FolderOpen,
  LayoutDashboard,
  Terminal as TerminalIcon,
  ChevronDown,
  Cpu,
  Settings
} from 'lucide-react'
import { connectToArduino, getExistingPort, ArduinoConnection } from '@/lib/arduino-connection'
import { cn } from "@/lib/utils"

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

interface JobFile {
  name: string;
  handle: FileSystemFileHandle;
}

const ARDUINO_BOARDS = [
  { id: 'uno', name: 'Arduino Uno', icon: <Cpu className="w-3.5 h-3.5 mr-2" /> },
  { id: 'mega', name: 'Arduino Mega 2560', icon: <Cpu className="w-3.5 h-3.5 mr-2" /> },
  { id: 'nano', name: 'Arduino Nano', icon: <Cpu className="w-3.5 h-3.5 mr-2" /> },
  { id: 'leonardo', name: 'Arduino Leonardo', icon: <Cpu className="w-3.5 h-3.5 mr-2" /> },
];

export default function Dashboard() {
  const [machineState, setMachineState] = useState<'IDLE' | 'RUN' | 'HOLD' | 'ALARM' | 'HOME'>('IDLE');
  const [mode, setMode] = useState<MachineMode>('PLOTTER');
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [usbConnected, setUsbConnected] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(ARDUINO_BOARDS[0]);
  const [logs, setLogs] = useState<{ timestamp: string, type: 'sent' | 'received' | 'error' | 'warning', message: string }[]>([]);
  const [connection, setConnection] = useState<ArduinoConnection | null>(null);
  const [progress, setProgress] = useState(0);
  
  const [jobFolder, setJobFolder] = useState<string | null>(null);
  const [jobFiles, setJobFiles] = useState<JobFile[]>([]);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: 'sent' | 'received' | 'error' | 'warning', message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-49), { timestamp, type, message }]);
  }, []);

  const handleIncomingData = useCallback((data: string) => {
    addLog('received', data);
  }, [addLog]);

  useEffect(() => {
    const attemptAutoConnect = async () => {
      const conn = await getExistingPort(handleIncomingData);
      if (conn) {
        setConnection(conn);
        setUsbConnected(true);
        addLog('received', 'AUTO-LINK ESTABLISHED');
      }
    };
    attemptAutoConnect();
  }, [handleIncomingData, addLog]);

  useEffect(() => {
    if (machineState === 'RUN') {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setMachineState('IDLE');
            addLog('received', 'JOB CYCLE COMPLETE');
            return 100;
          }
          return prev + 0.5;
        });
        
        setPos(prev => ({
          ...prev,
          x: prev.x + (Math.random() - 0.5) * 2,
          y: prev.y + (Math.random() - 0.5) * 2
        }));
      }, 200);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  }, [machineState, addLog]);

  const handleStart = async () => {
    if (machineState === 'RUN') {
      setMachineState('HOLD');
      return;
    }
    setMachineState('RUN');
    if (progress >= 100) setProgress(0);
    
    if (connection) {
      await connection.send('G21 G90');
      addLog('sent', 'G21 G90 (INIT)');
    }
  };

  const handleStop = async () => {
    setMachineState('IDLE');
    setProgress(0);
    if (connection) {
      await connection.send('!'); 
      addLog('warning', 'EMERGENCY ABORT (E-STOP)');
    }
  };

  const handleMove = async (axis: string, amount: number) => {
    if (machineState !== 'IDLE' && machineState !== 'HOLD') return;
    const command = `${axis}${amount.toFixed(2)}`;
    if (connection) {
      await connection.send(command);
      addLog('sent', command);
    }
    setPos(prev => ({ 
      ...prev, 
      [axis.toLowerCase()]: prev[axis.toLowerCase() as keyof typeof prev] + amount 
    }));
  };

  const handleLoadFolder = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      setJobFolder(dirHandle.name);
      const files: JobFile[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.nc') || entry.name.endsWith('.gcode'))) {
          files.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }
      setJobFiles(files);
      addLog('received', `VAULT LINKED: ${files.length} ITEMS`);
    } catch (err) {
      addLog('error', 'VAULT ACCESS REJECTED');
    }
  };

  const handleConnect = async (board: typeof selectedBoard) => {
    setSelectedBoard(board);
    addLog('sent', `SYNCING WITH ${board.name}...`);
    const conn = await connectToArduino(handleIncomingData);
    if (conn) {
      setConnection(conn);
      setUsbConnected(true);
      addLog('received', `ONLINE: ${board.name}`);
    } else {
      addLog('error', 'SYNC FAILED');
    }
  };

  const handleDisconnect = async () => {
    if (connection) {
      await connection.disconnect();
      setConnection(null);
      setUsbConnected(false);
      addLog('warning', 'SYNC TERMINATED');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#040608] text-foreground overflow-hidden select-none touch-none overscroll-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-secondary/10 backdrop-blur-xl shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-sm transition-all duration-700 active-press shadow-2xl",
            usbConnected ? "bg-cyan-500 glow-cyan animate-neon-pulse" : "bg-primary"
          )}>
            <Power className={cn("w-4 h-4", usbConnected ? "text-black" : "text-white")} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none flex items-center gap-1">
              ProPlot <span className="text-cyan-400">CNC</span>
            </h1>
            <span className="text-[7px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">Control HUD</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {usbConnected ? (
            <div className="flex flex-col items-end mr-1">
               <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-red-600/20 border border-red-600/40 text-red-500 hover:bg-red-600 hover:text-white transition-all active-press"
                onClick={handleDisconnect}
              >
                <Unlink className="w-3.5 h-3.5 mr-2" />
                {selectedBoard.name}
              </Button>
              <span className="text-[6px] font-black text-cyan-400 uppercase tracking-widest mt-0.5 animate-pulse">Link Active</span>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 active-press neon-connection"
                >
                  <Usb className="w-3.5 h-3.5 mr-2" />
                  {selectedBoard.name}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0c0f14] border-white/10 w-48 backdrop-blur-2xl">
                <DropdownMenuLabel className="text-[9px] uppercase font-black text-muted-foreground p-3">Select Interface</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                {ARDUINO_BOARDS.map((board) => (
                  <DropdownMenuItem 
                    key={board.id} 
                    onClick={() => handleConnect(board)}
                    className="text-[10px] font-bold p-3 focus:bg-cyan-600/20 focus:text-cyan-400"
                  >
                    {board.icon}
                    {board.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden relative">
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
          <div className="px-3 py-1.5 bg-secondary/5 border-b border-white/5 lg:hidden shrink-0">
            <TabsList className="flex w-full bg-transparent h-8 gap-1">
              <TabsTrigger value="dashboard" className="flex-1 text-[9px] font-black uppercase tracking-tighter"><LayoutDashboard className="w-3 h-3 mr-1" /> HUD</TabsTrigger>
              <TabsTrigger value="control" className="flex-1 text-[9px] font-black uppercase tracking-tighter"><RefreshCw className="w-3 h-3 mr-1" /> JOG</TabsTrigger>
              <TabsTrigger value="files" className="flex-1 text-[9px] font-black uppercase tracking-tighter"><FolderOpen className="w-3 h-3 mr-1" /> JOBS</TabsTrigger>
              <TabsTrigger value="terminal" className="flex-1 text-[9px] font-black uppercase tracking-tighter"><TerminalIcon className="w-3 h-3 mr-1" /> LOG</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* Desktop Grid */}
            <div className="hidden lg:grid grid-cols-12 gap-4 h-full p-4 overflow-hidden">
              <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'OPTIMIZED GC GENERATED')} />
              </div>
              
              <div className="col-span-6 flex flex-col gap-4 h-full overflow-hidden">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 glass-panel rounded-lg overflow-hidden shadow-2xl relative">
                  <ToolpathRenderer currentPath="" completedLines={0} progress={progress} x={pos.x} y={pos.y} />
                </div>
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <Button size="lg" className={cn(
                    "h-16 uppercase font-black tracking-[0.2em] text-lg active-press transition-all border-none",
                    machineState === 'RUN' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500 glow-green'
                  )} onClick={handleStart}>
                    {machineState === 'RUN' ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Start Cycle</>}
                  </Button>
                  <Button size="lg" variant="destructive" className="h-16 uppercase font-black tracking-[0.2em] text-lg active-press glow-red border-none bg-red-600 hover:bg-red-500" onClick={handleStop}>
                    <Square className="mr-2 fill-current" /> Stop
                  </Button>
                </div>
              </div>

              <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                <JogControls mode={mode} onMove={handleMove} />
                <div className="flex-1 min-h-0 flex flex-col gap-4">
                  <div className="h-1/2 min-h-0"><JobQueue folderName={jobFolder} files={jobFiles} onLoadFolder={handleLoadFolder} /></div>
                  <div className="h-1/2 min-h-0"><MachineConsole logs={logs} /></div>
                </div>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden h-full flex flex-col bg-[#050709]">
              <TabsContent value="dashboard" className="flex-1 m-0 flex flex-col gap-3 p-3 overflow-hidden">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 glass-panel rounded-lg overflow-hidden relative shadow-2xl">
                  <ToolpathRenderer currentPath="" completedLines={0} progress={progress} x={pos.x} y={pos.y} />
                </div>
                <div className="grid grid-cols-2 gap-2 shrink-0 pb-safe">
                   <Button className={cn("h-14 uppercase font-black border-none text-[11px] tracking-widest", machineState === 'RUN' ? 'bg-orange-600' : 'bg-emerald-600')} onClick={handleStart}>
                     {machineState === 'RUN' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />} 
                     {machineState === 'RUN' ? 'Pause' : 'Start'}
                   </Button>
                   <Button variant="destructive" className="h-14 uppercase font-black border-none text-[11px] tracking-widest bg-red-600" onClick={handleStop}>
                     <Square className="w-4 h-4 mr-2" /> Stop
                   </Button>
                </div>
              </TabsContent>
              <TabsContent value="control" className="flex-1 m-0 p-3 space-y-4 overflow-y-auto pb-safe">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
                <JogControls mode={mode} onMove={handleMove} />
              </TabsContent>
              <TabsContent value="files" className="flex-1 m-0 p-3 space-y-4 overflow-y-auto pb-safe">
                <JobQueue folderName={jobFolder} files={jobFiles} onLoadFolder={handleLoadFolder} />
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'TEST LOADED')} />
              </TabsContent>
              <TabsContent value="terminal" className="flex-1 m-0 p-3 flex flex-col overflow-hidden pb-safe">
                <MachineConsole logs={logs} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="h-8 bg-secondary/80 border-t border-white/5 flex items-center justify-between px-4 text-[7px] font-black tracking-widest uppercase text-muted-foreground shrink-0 z-50">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", usbConnected ? 'bg-cyan-400 glow-cyan animate-pulse' : 'bg-red-500')} />
            <span className={usbConnected ? "text-cyan-400" : ""}>{usbConnected ? `${selectedBoard.name} ACTIVE` : 'DISCONNECTED'}</span>
          </div>
          <span className="opacity-30">GRBL-P v1.1h</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono opacity-50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </footer>
    </div>
  );
}
