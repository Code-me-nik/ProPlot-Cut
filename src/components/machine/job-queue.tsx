"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { FileText, FolderOpen, Download } from 'lucide-react'
import { cn } from "@/lib/utils"

interface JobFile {
  name: string;
  handle: FileSystemFileHandle;
}

interface JobQueueProps {
  folderName: string | null;
  files: JobFile[];
  onLoadFolder: () => void;
  onSelectFile?: (file: JobFile) => void;
}

export function JobQueue({ folderName, files, onLoadFolder, onSelectFile }: JobQueueProps) {
  return (
    <div className="bg-secondary/20 p-4 rounded-lg border border-white/5 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" /> Local Vault
        </h3>
        {folderName && (
          <span className="text-[9px] font-mono text-cyan-400 truncate max-w-[120px] opacity-60">
            /{folderName}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {files.length > 0 ? (
          files.map((file, i) => (
            <div 
              key={i} 
              onClick={() => onSelectFile?.(file)}
              className="bg-black/40 p-2.5 rounded border border-white/5 flex items-center justify-between hover:border-cyan-500/40 cursor-pointer transition-all active-press group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-cyan-500/50 group-hover:animate-pulse" />
                <span className="text-[10px] font-bold truncate tracking-tight uppercase">{file.name}</span>
              </div>
              <Download className="w-3 h-3 text-muted-foreground/40 group-hover:text-cyan-400 transition-colors" />
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg py-8">
            <span className="text-[9px] text-muted-foreground/40 font-bold italic uppercase tracking-widest text-center px-4">
              Link Directory for G-Code Access
            </span>
          </div>
        )}
      </div>

      <Button 
        variant="outline" 
        onClick={onLoadFolder} 
        className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-dashed bg-white/5 hover:bg-white/10 border-white/10 transition-all active-press"
      >
        <FolderOpen className="w-4 h-4 mr-2" /> 
        {folderName ? 'Sync Storage' : 'Link Storage'}
      </Button>
    </div>
  );
}
