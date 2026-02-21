"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StatusMonitor } from '@/components/machine/status-monitor'
import { JogControls } from '@/components/machine/jog-controls'
import { ToolpathRenderer } from '@/components/preview/toolpath-renderer'
import { MachineConsole } from '@/components/machine/console'
import { ModeSwitcher } from '@/components/machine/mode-switcher'
import { PrecisionTestPanel } from '@/components/test/precision-test-panel'
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
  Download, 
  FileText, 
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
        addLog('received', 'Resumed existing Arduino connection.');
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
            addLog('received', 'Job sequence finalized.');
            return 100;
          }
          return prev + 0.5;
        });
        
        // Simulate movement during RUN for preview
        setPos(prev => ({
          ...prev,
          x: prev.x + (Math.random() - 0.5) * 2,
          y: prev.y + (Math.random() - 0.5) * 2
        }));
      }, 500);
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
      addLog('sent', 'G21 G90');
    }
  };

  const handleStop = async () => {
    setMachineState('IDLE');
    setProgress(0);
    if (connection) {
      await connection.send('!'); // GRBL Feed Hold
      addLog('warning', 'EMERGENCY STOP (E-STOP) TRIGGERED');
    }
  };

  const handleMove = async (axis: string, amount: number) => {
    if (machineState !== 'IDLE' && machineState !== 'HOLD') return;
    const command = `${axis}${amount.toFixed(2)}`;
    if (connection) {
      await connection.send(command);
      addLog('sent', command);
    } else {
      addLog('sent', `${command} (SIMULATED)`);
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
      addLog('received', `Source linked: ${dirHandle.name} (${files.length} items)`);
    } catch (err) {
      addLog('error', 'Storage access cancelled.');
    }
  };

  const handleConnect = async (board: typeof selectedBoard) => {
    setSelectedBoard(board);
    addLog('sent', `Establishing link to ${board.name}...`);
    const conn = await connectToArduino(handleIncomingData);
    if (conn) {
      setConnection(conn);
      setUsbConnected(true);
      addLog('received', `COMMUNICATIONS ESTABLISHED: ${board.name}`);
    } else {
      addLog('error', 'Serial handshake failed.');
    }
  };

  const handleDisconnect = async () => {
    if (connection) {
      await connection.disconnect();
      setConnection(null);
      setUsbConnected(false);
      addLog('warning', 'Link terminated by user.');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#040608] text-foreground transition-all">
      {/* Header - Industrial Navigation */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-secondary/10 backdrop-blur-xl shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-sm transition-all duration-700 active-press shadow-2xl",
            usbConnected ? "bg-cyan-500 glow-cyan animate-neon-pulse shadow-cyan-500/20" : "bg-primary shadow-primary/10"
          )}>
            <Power className={cn("w-4 h-4", usbConnected ? "text-black" : "text-white")} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none flex items-center gap-1">
              ProPlot <span className="text-cyan-400">CNC</span>
              <span className="text-[8px] bg-white/5 px-1 rounded-sm text-white/40 ml-1">v1.1h</span>
            </h1>
            <span className="text-[8px] text-muted-foreground font-black tracking-[0.2em] uppercase opacity-60">System Controller</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {usbConnected ? (
            <div className="flex flex-col items-end mr-2">
               <Button 
                variant="destructive" 
                size="sm" 
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-red-600/20 border border-red-600/40 text-red-500 hover:bg-red-600 hover:text-white transition-all active-press shadow-red-500/10"
                onClick={handleDisconnect}
              >
                <Unlink className="w-3.5 h-3.5 mr-2" />
                {selectedBoard.name}
              </Button>
              <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest mt-1 opacity-80 neon-text-cyan">Serial Port Active</span>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 active-press neon-connection"
                >
                  <Usb className="w-3.5 h-3.5 mr-2" />
                  {selectedBoard ? selectedBoard.name : 'Link Device'}
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0c0f14] border-white/10 w-56 backdrop-blur-2xl">
                <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground p-3">Available Interfaces</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                {ARDUINO_BOARDS.map((board) => (
                  <DropdownMenuItem 
                    key={board.id} 
                    onClick={() => handleConnect(board)}
                    className="text-[11px] font-bold p-3 focus:bg-cyan-600/20 focus:text-cyan-400 transition-colors"
                  >
                    {board.icon}
                    {board.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white/5 h-9 w-9"><Settings className="w-4 h-4" /></Button>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
          <div className="px-3 py-1.5 bg-secondary/5 border-b border-white/5 lg:hidden overflow-x-auto no-scrollbar">
            <TabsList className="flex w-full bg-transparent h-9 gap-1">
              <TabsTrigger value="dashboard" className="flex-1 data-[state=active]:bg-primary/20 text-[10px] font-black uppercase tracking-tighter h-full"><LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> HUD</TabsTrigger>
              <TabsTrigger value="control" className="flex-1 data-[state=active]:bg-primary/20 text-[10px] font-black uppercase tracking-tighter h-full"><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Jog</TabsTrigger>
              <TabsTrigger value="files" className="flex-1 data-[state=active]:bg-primary/20 text-[10px] font-black uppercase tracking-tighter h-full"><FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Disk</TabsTrigger>
              <TabsTrigger value="terminal" className="flex-1 data-[state=active]:bg-primary/20 text-[10px] font-black uppercase tracking-tighter h-full"><TerminalIcon className="w-3.5 h-3.5 mr-1.5" /> Log</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* Desktop: Industrial Multi-Panel Grid */}
            <div className="hidden lg:grid grid-cols-12 gap-4 h-full p-4 overflow-hidden">
              <div className="col-span-3 flex flex-col gap-4 min-h-0">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'AI Sequence Optimized')} />
              </div>
              
              <div className="col-span-6 flex flex-col gap-4 h-full">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 glass-panel rounded-lg overflow-hidden shadow-2xl relative">
                  <ToolpathRenderer currentPath="" completedLines={0} progress={progress} x={pos.x} y={pos.y} />
                </div>
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <Button size="lg" className={cn(
                    "h-16 uppercase font-black tracking-[0.2em] text-lg active-press transition-all border-none",
                    machineState === 'RUN' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-emerald-600 hover:bg-emerald-500 glow-green'
                  )} onClick={handleStart}>
                    {machineState === 'RUN' ? <><Pause className="mr-2" /> Hold</> : <><Play className="mr-2" /> Cycle Start</>}
                  </Button>
                  <Button size="lg" variant="destructive" className="h-16 uppercase font-black tracking-[0.2em] text-lg active-press glow-red border-none bg-red-600 hover:bg-red-500" onClick={handleStop}>
                    <Square className="mr-2 fill-current" /> Stop
                  </Button>
                </div>
              </div>

              <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                <JogControls mode={mode} onMove={handleMove} />
                <JobQueue folderName={jobFolder} files={jobFiles} onLoadFolder={handleLoadFolder} />
                <div className="flex-1 min-h-0">
                  <MachineConsole logs={logs} />
                </div>
              </div>
            </div>

            {/* Mobile/Tablet: Tabbed Viewport */}
            <div className="lg:hidden h-full flex flex-col bg-[#050709]">
              <TabsContent value="dashboard" className="flex-1 m-0 flex flex-col gap-3 p-3 overflow-hidden">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 glass-panel rounded-lg overflow-hidden relative shadow-2xl">
                  <ToolpathRenderer currentPath="" completedLines={0} progress={progress} x={pos.x} y={pos.y} />
                </div>
                <div className="grid grid-cols-2 gap-2 shrink-0 pb-safe">
                   <Button className={cn("h-14 uppercase font-black border-none text-[12px] tracking-widest", machineState === 'RUN' ? 'bg-orange-600' : 'bg-emerald-600 shadow-lg')} onClick={handleStart}>
                     {machineState === 'RUN' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />} 
                     {machineState === 'RUN' ? 'Pause' : 'Start Cycle'}
                   </Button>
                   <Button variant="destructive" className="h-14 uppercase font-black border-none text-[12px] tracking-widest bg-red-600 shadow-lg" onClick={handleStop}>
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
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'AI Test Loaded')} />
              </TabsContent>
              <TabsContent value="terminal" className="flex-1 m-0 p-3 flex flex-col overflow-hidden pb-safe">
                <MachineConsole logs={logs} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Footer - Live Status Bar */}
      <footer className="h-10 bg-secondary/80 border-t border-white/5 flex items-center justify-between px-4 text-[9px] font-black tracking-widest uppercase text-muted-foreground shrink-0 z-50">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full shadow-lg transition-all duration-300", usbConnected ? 'bg-cyan-400 animate-pulse glow-cyan' : 'bg-red-500')} />
              <span className={usbConnected ? "neon-text-cyan" : ""}>{usbConnected ? `${selectedBoard.name} CONNECTED` : 'NO DEVICE LINKED'}</span>
            </div>
            {usbConnected && <span className="text-[7px] text-cyan-400/60 mt-0.5 ml-3.5 tracking-[0.2em]">Active Serial Link: /dev/ttyUSB0</span>}
          </div>
          <div className="hidden md:flex gap-6 opacity-40">
            <span>BAUD: 115200</span>
            <span>FR: 1000 MM/M</span>
            <span>VER: GRBL-P v1.1</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-foreground/50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </footer>
    </div>
  );
}

function JobQueue({ folderName, files, onLoadFolder }: { folderName: string | null, files: JobFile[], onLoadFolder: () => void }) {
  return (
    <div className="bg-secondary/20 p-4 rounded-lg border border-white/5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> Local Vault
        </h3>
        {folderName && <span className="text-[9px] font-mono text-cyan-400 truncate max-w-[140px] opacity-60">/{folderName}</span>}
      </div>
      
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {files.length > 0 ? (
          files.map((file, i) => (
            <div key={i} className="bg-black/40 p-2.5 rounded border border-white/5 flex items-center justify-between hover:border-cyan-500/40 cursor-pointer transition-all active-press">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-cyan-500/50" />
                <span className="text-[10px] font-bold truncate tracking-tight">{file.name}</span>
              </div>
              <Download className="w-3.5 h-3.5 text-muted-foreground/60" />
            </div>
          ))
        ) : (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-lg">
            <span className="text-[9px] text-muted-foreground/40 font-bold italic">LINK STORAGE FOR G-CODE ACCESS</span>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onLoadFolder} className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-dashed bg-white/5 hover:bg-white/10 border-white/10 transition-all active-press">
        <FolderOpen className="w-4 h-4 mr-2" /> {folderName ? 'Sync Storage' : 'Link Job Directory'}
      </Button>
    </div>
  );
}
