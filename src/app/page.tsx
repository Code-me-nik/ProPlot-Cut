"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { StatusMonitor } from '@/components/machine/status-monitor'
import { JogControls } from '@/components/machine/jog-controls'
import { ToolpathRenderer } from '@/components/preview/toolpath-renderer'
import { MachineConsole } from '@/components/machine/console'
import { ModeSwitcher } from '@/components/machine/mode-switcher'
import { PrecisionTestPanel } from '@/components/test/precision-test-panel'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Play, 
  Pause, 
  Square, 
  Power, 
  Download, 
  HelpCircle, 
  FileText, 
  AlertTriangle,
  Usb,
  RefreshCw,
  Search,
  Unlink,
  Info,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Terminal as TerminalIcon
} from 'lucide-react'
import { connectToArduino, getExistingPort, ArduinoConnection } from '@/lib/arduino-connection'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

interface JobFile {
  name: string;
  handle: FileSystemFileHandle;
}

export default function Dashboard() {
  const [machineState, setMachineState] = useState<'IDLE' | 'RUN' | 'HOLD' | 'ALARM' | 'HOME'>('IDLE');
  const [mode, setMode] = useState<MachineMode>('PLOTTER');
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 });
  const [progress, setProgress] = useState(0);
  const [usbConnected, setUsbConnected] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState('uno');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<{ timestamp: string, type: 'sent' | 'received' | 'error' | 'warning', message: string }[]>([]);
  const [connection, setConnection] = useState<ArduinoConnection | null>(null);
  
  // File System State
  const [jobFolder, setJobFolder] = useState<string | null>(null);
  const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
  const [activeJob, setActiveJob] = useState<string | null>(null);

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

  const handleStart = async () => {
    setMachineState('RUN');
    const commands = ['G21', 'G90', 'X0'];
    
    if (connection) {
      for (const cmd of commands) {
        await connection.send(cmd);
        addLog('sent', cmd);
      }
    } else {
      addLog('sent', 'Simulation sequence started');
    }
  };

  const handleStop = async () => {
    setMachineState('IDLE');
    setProgress(0);
    if (connection) {
      await connection.send('STOP');
      addLog('sent', 'STOP (E-Stop Command)');
    }
    addLog('warning', 'Machine stopped by user.');
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
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      setJobFolder(dirHandle.name);
      const files: JobFile[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file' && (entry.name.endsWith('.nc') || entry.name.endsWith('.gcode') || entry.name.endsWith('.txt'))) {
          files.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }
      setJobFiles(files);
      addLog('received', `Loaded ${files.length} jobs from ${dirHandle.name}`);
    } catch (err) {
      addLog('error', 'Folder access denied or cancelled.');
    }
  };

  const handleConnect = async () => {
    setIsScanning(true);
    addLog('sent', 'Requesting Arduino Serial Port...');
    const conn = await connectToArduino(handleIncomingData);
    setIsScanning(false);
    if (conn) {
      setConnection(conn);
      setUsbConnected(true);
      addLog('received', `Connected to Arduino Uno @ 115200 baud`);
    } else {
      addLog('error', 'Connection failed or cancelled.');
    }
  };

  const handleDisconnect = async () => {
    if (connection) {
      await connection.disconnect();
      setConnection(null);
      setUsbConnected(false);
      addLog('warning', 'Serial port disconnected.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] text-foreground overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-white/5 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-sm transition-all duration-500",
            usbConnected ? "bg-cyan-500 neon-connection animate-neon shadow-[0_0_20px_rgba(6,182,212,0.5)]" : "bg-primary"
          )}>
            <Power className={cn("w-4 h-4", usbConnected ? "text-black" : "text-white")} />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none">ProPlot <span className="text-primary">CNC</span></h1>
            <span className="text-[8px] text-muted-foreground font-bold tracking-widest uppercase">v2.4.0 MOBILE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={usbConnected ? "destructive" : "default"} 
            size="sm" 
            className={cn(
              "h-8 text-[10px] font-black uppercase px-3",
              usbConnected ? "shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-cyan-600 hover:bg-cyan-500 neon-connection"
            )}
            onClick={usbConnected ? handleDisconnect : handleConnect}
          >
            {usbConnected ? <Unlink className="w-3 h-3 mr-1" /> : <Usb className="w-3 h-3 mr-1" />}
            {usbConnected ? 'Off' : 'Connect'}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
          <div className="px-3 py-1 bg-secondary/10 border-b border-white/5 md:hidden">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-9">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary/20 text-[10px] uppercase font-bold"><LayoutDashboard className="w-3 h-3 mr-1" /> Main</TabsTrigger>
              <TabsTrigger value="control" className="data-[state=active]:bg-primary/20 text-[10px] uppercase font-bold"><RefreshCw className="w-3 h-3 mr-1" /> Jog</TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-primary/20 text-[10px] uppercase font-bold"><FolderOpen className="w-3 h-3 mr-1" /> Jobs</TabsTrigger>
              <TabsTrigger value="terminal" className="data-[state=active]:bg-primary/20 text-[10px] uppercase font-bold"><TerminalIcon className="w-3 h-3 mr-1" /> Log</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden p-3 relative">
            {/* Desktop Layout (Standard Grid) */}
            <div className="hidden md:grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'Test G-Code loaded')} />
              </div>
              <div className="col-span-6 flex flex-col gap-4">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 bg-black/40 rounded-lg border border-white/5"><ToolpathRenderer currentPath="" completedLines={0} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <Button size="lg" className={cn("h-14 uppercase font-black tracking-widest text-lg", machineState === 'RUN' ? 'bg-orange-500' : 'bg-green-600 glow-green')} onClick={machineState === 'RUN' ? () => setMachineState('HOLD') : handleStart}>
                    {machineState === 'RUN' ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Start</>}
                  </Button>
                  <Button size="lg" variant="destructive" className="h-14 uppercase font-black tracking-widest text-lg glow-red" onClick={handleStop}><Square className="mr-2 fill-current" /> Stop</Button>
                </div>
              </div>
              <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pl-1">
                <JogControls mode={mode} onMove={handleMove} />
                <JobQueue folderName={jobFolder} files={jobFiles} onLoadFolder={handleLoadFolder} />
                <MachineConsole logs={logs} />
              </div>
            </div>

            {/* Mobile View with Tabs */}
            <div className="md:hidden h-full">
              <TabsContent value="dashboard" className="h-full m-0 flex flex-col gap-3">
                <StatusMonitor x={pos.x} y={pos.y} z={pos.z} state={machineState} usbConnected={usbConnected} mode={mode} />
                <div className="flex-1 min-h-0 bg-black/40 rounded-lg border border-white/5 overflow-hidden"><ToolpathRenderer currentPath="" completedLines={0} /></div>
                <div className="grid grid-cols-2 gap-2 pb-2">
                   <Button className={cn("h-12 uppercase font-black", machineState === 'RUN' ? 'bg-orange-500' : 'bg-green-600')} onClick={handleStart}>
                     {machineState === 'RUN' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {machineState === 'RUN' ? 'Pause' : 'Start'}
                   </Button>
                   <Button variant="destructive" className="h-12 uppercase font-black" onClick={handleStop}><Square className="w-4 h-4 mr-2" /> Stop</Button>
                </div>
              </TabsContent>
              <TabsContent value="control" className="h-full m-0 space-y-4 overflow-y-auto">
                <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
                <JogControls mode={mode} onMove={handleMove} />
              </TabsContent>
              <TabsContent value="files" className="h-full m-0 space-y-4 overflow-y-auto">
                <JobQueue folderName={jobFolder} files={jobFiles} onLoadFolder={handleLoadFolder} />
                <PrecisionTestPanel onGenerated={(gc) => addLog('received', 'Test G-Code loaded')} />
              </TabsContent>
              <TabsContent value="terminal" className="h-full m-0">
                <MachineConsole logs={logs} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-secondary/80 border-t border-white/5 flex items-center justify-between px-3 text-[9px] font-bold text-muted-foreground shrink-0 overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", usbConnected ? 'bg-cyan-400 animate-pulse glow-blue' : 'bg-red-500')} />
            <span className={usbConnected ? "neon-text-blue" : ""}>{usbConnected ? 'USB ACTIVE' : 'NO DEVICE'}</span>
          </div>
          <div className="hidden xs:block">CPU: 12% | RAM: 242MB</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-foreground">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </footer>
    </div>
  );
}

function JobQueue({ folderName, files, onLoadFolder }: { folderName: string | null, files: JobFile[], onLoadFolder: () => void }) {
  return (
    <div className="bg-secondary/50 p-3 rounded-lg border border-border/50 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <FileText className="w-3 h-3" /> Job Storage
        </h3>
        {folderName && <span className="text-[9px] font-mono text-cyan-500 truncate max-w-[80px]">/{folderName}</span>}
      </div>
      
      <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
        {files.length > 0 ? (
          files.map((file, i) => (
            <div key={i} className="bg-black/20 p-2 rounded border border-white/5 flex items-center justify-between hover:border-primary/40 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span className="text-[10px] font-bold truncate">{file.name}</span>
              </div>
              <Download className="w-3 h-3 text-muted-foreground" />
            </div>
          ))
        ) : (
          <div className="p-4 text-center border border-dashed border-white/10 rounded">
            <span className="text-[9px] text-muted-foreground italic">No local directory linked</span>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={onLoadFolder} className="w-full h-8 text-[9px] uppercase font-black border-dashed bg-primary/5 hover:bg-primary/10 border-primary/20">
        <FolderOpen className="w-3 h-3 mr-2" /> {folderName ? 'Sync Folder' : 'Link Job Directory'}
      </Button>
    </div>
  );
}
