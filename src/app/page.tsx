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
  Unlink
} from 'lucide-react'
import { connectToArduino, getExistingPort, ArduinoConnection } from '@/lib/arduino-connection'

export type MachineMode = 'PLOTTER' | 'STICKER' | 'VINYL';

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

  const addLog = useCallback((type: 'sent' | 'received' | 'error' | 'warning', message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-49), { timestamp, type, message }]);
  }, []);

  // Handle incoming serial data
  const handleIncomingData = useCallback((data: string) => {
    addLog('received', data);
    // Basic logic for parsing GRBL status messages could go here
    if (data.toLowerCase().includes('ok')) {
      // Logic for queue processing
    }
  }, [addLog]);

  // Automatic connection attempt on mount
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

  // Simulation of real-time state updates (only if simulated or just for UI feel)
  useEffect(() => {
    if (machineState === 'RUN' && !connection) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setMachineState('IDLE');
            addLog('received', 'Simulation job complete.');
            return 100;
          }
          return prev + 0.5;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [machineState, connection, addLog]);

  const handleStart = async () => {
    setMachineState('RUN');
    const commands = ['$H', 'G21', 'G90', 'G0 X0 Y0 Z0'];
    
    if (connection) {
      for (const cmd of commands) {
        await connection.send(cmd);
        addLog('sent', cmd);
      }
    } else {
      addLog('sent', '$H (Homing Simulated)');
      addLog('received', 'ok');
    }
  };

  const handleStop = async () => {
    setMachineState('IDLE');
    setProgress(0);
    if (connection) {
      await connection.send('!'); // GRBL Feed Hold
      await connection.send('M5'); // Stop spindle/pen
      addLog('sent', '! (Feed Hold)');
    }
    addLog('warning', 'Machine stopped by user.');
  };

  const handleMove = async (axis: string, amount: number) => {
    if (machineState !== 'IDLE') return;
    const gcode = `G91 G0 ${axis}${amount}`;
    
    if (connection) {
      await connection.send(gcode);
    }
    
    addLog('sent', gcode);
    setPos(prev => ({ ...prev, [axis.toLowerCase()]: prev[axis.toLowerCase() as keyof typeof prev] + amount }));
    
    if (!connection) {
      addLog('received', 'ok (simulated)');
    }
  };

  const handleGenTest = (gcode: string) => {
    addLog('received', 'Custom test G-Code loaded.');
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
      addLog('error', 'Connection failed or cancelled by user.');
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
    <div className="flex flex-col h-screen bg-[#0a0c10] text-foreground p-4 gap-4 overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-sm glow-blue">
            <Power className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none italic">ProPlot <span className="text-primary">CNC</span></h1>
            <span className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase">Enterprise Controller v2.4.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Arduino Selection & Connect */}
          <div className="flex items-center gap-2 bg-secondary/40 p-1 rounded-md border border-white/10">
            <div className="flex items-center gap-2 px-2 text-muted-foreground">
              <Usb className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">Device</span>
            </div>
            <Select value={selectedBoard} onValueChange={setSelectedBoard} disabled={machineState === 'RUN' || usbConnected}>
              <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold bg-black/40 border-none">
                <SelectValue placeholder="Select Board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uno">Arduino Uno</SelectItem>
                <SelectItem value="mega">Arduino Mega 2560</SelectItem>
                <SelectItem value="nano">Arduino Nano</SelectItem>
                <SelectItem value="leonardo">Arduino Leonardo</SelectItem>
                <SelectItem value="esp32">ESP32 Dev Module</SelectItem>
              </SelectContent>
            </Select>
            {usbConnected ? (
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 gap-2 text-[10px] font-black uppercase"
                onClick={handleDisconnect}
                disabled={machineState === 'RUN'}
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 gap-2 text-[10px] font-black uppercase hover:bg-primary/20"
                onClick={handleConnect}
                disabled={isScanning || machineState === 'RUN'}
              >
                {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {isScanning ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4 bg-secondary/80 px-4 py-1.5 rounded-full border border-white/5">
             <div className="flex flex-col items-center">
                <span className="text-[9px] text-muted-foreground uppercase font-black">Memory</span>
                <span className="text-xs font-mono font-bold">128MB/2GB</span>
             </div>
             <div className="w-px h-6 bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-[9px] text-muted-foreground uppercase font-black">CPU Load</span>
                <span className="text-xs font-mono font-bold text-green-400">12%</span>
             </div>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground"><HelpCircle className="w-5 h-5" /></Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        
        {/* Left Column - Controls */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
          <ModeSwitcher currentMode={mode} onModeChange={setMode} disabled={machineState === 'RUN'} />
          <JogControls mode={mode} onMove={handleMove} />
          <PrecisionTestPanel onGenerated={handleGenTest} />
        </div>

        {/* Center Column - Visualization & Status */}
        <div className="col-span-6 flex flex-col gap-4">
          <StatusMonitor 
            x={pos.x} 
            y={pos.y} 
            z={pos.z} 
            state={machineState} 
            usbConnected={usbConnected}
            mode={mode}
          />
          <div className="flex-1 min-h-0">
            <ToolpathRenderer currentPath="" completedLines={0} />
          </div>
          
          {/* Main Action Bar */}
          <div className="grid grid-cols-4 gap-4">
            <Button 
              size="lg" 
              className={`col-span-1 h-14 uppercase font-black tracking-widest text-lg transition-all ${
                machineState === 'RUN' ? 'bg-orange-500 hover:bg-orange-600 glow-orange' : 'bg-green-600 hover:bg-green-500 glow-green'
              }`}
              onClick={machineState === 'RUN' ? () => setMachineState('HOLD') : handleStart}
            >
              {machineState === 'RUN' ? <><Pause className="mr-2" /> Pause</> : <><Play className="mr-2" /> Start</>}
            </Button>
            
            <Button 
              size="lg" 
              variant="destructive" 
              className="col-span-1 h-14 uppercase font-black tracking-widest text-lg glow-red"
              onClick={handleStop}
            >
              <Square className="mr-2 fill-current" /> Stop
            </Button>

            <div className="col-span-2 bg-secondary/40 rounded-lg border border-white/5 p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Job Progress</span>
                <span className="text-xs font-code font-bold text-primary">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-black/40" />
              <div className="flex justify-between items-center mt-1 text-[9px] text-muted-foreground font-medium">
                <span>FILE: CALIBRATION_V1.GCODE</span>
                <span>EST: 02:45 LEFT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Console & Files */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pl-1">
          <div className="flex-1 min-h-[300px]">
            <MachineConsole logs={logs} />
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3 h-3" /> Job Queue
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6"><Download className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2">
              <div className="bg-primary/20 p-2 rounded border border-primary/30 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold truncate">calib_step_01.nc</span>
                </div>
                <span className="text-[8px] bg-primary text-white px-1 rounded">ACTIVE</span>
              </div>
              <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                  <span className="text-[10px] font-bold truncate">logo_vector_hires.gcode</span>
                </div>
              </div>
              <div className="bg-black/20 p-2 rounded border border-white/5 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                  <span className="text-[10px] font-bold truncate">bracket_l_support.tap</span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 h-8 text-[10px] uppercase font-black border-dashed">
              + Load New Job
            </Button>
          </div>

          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
             <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-red-500 leading-none">Safety Warning</span>
                <span className="text-[9px] text-muted-foreground leading-tight mt-1">Keep enclosure closed during operation. Eye protection mandatory.</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Footer Status Bar */}
      <footer className="h-6 bg-secondary border-t border-border flex items-center justify-between px-4 text-[9px] font-bold text-muted-foreground">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${usbConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>USB OTG: {usbConnected ? `ARDUINO ${selectedBoard.toUpperCase()}` : 'DISCONNECTED'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>GRBL v1.1H</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-primary uppercase">Cutter/Pen:</span>
             <span className="text-foreground">LIFTED</span>
          </div>
        </div>
        <div className="flex gap-4">
          <span>BUFF: 124/128 lines</span>
          <span>TEMP: 32°C</span>
          <span className="text-foreground font-mono">14:52:12</span>
        </div>
      </footer>
    </div>
  );
}
