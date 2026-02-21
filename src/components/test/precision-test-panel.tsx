"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { generateCustomPrecisionTest } from "@/ai/flows/generate-custom-precision-test"
import { Settings2, Loader2, Sparkles, Send } from "lucide-react"

interface PrecisionTestPanelProps {
  onGenerated: (gcode: string) => void;
}

export function PrecisionTestPanel({ onGenerated }: PrecisionTestPanelProps) {
  const [description, setDescription] = useState('Generate a pattern of 3 concentric circles starting at 10mm radius with 5mm increments for accuracy testing.');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateCustomPrecisionTest({ description });
      onGenerated(result.gcode);
    } catch (error) {
      console.error("Failed to generate test G-code:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-secondary/50 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Settings2 className="w-3 h-3" /> AI Precision Module
        </h3>
        <Sparkles className="w-3 h-3 text-primary animate-pulse-glow" />
      </div>

      <div className="space-y-3">
        <p className="text-[10px] text-muted-foreground leading-tight">
          Describe a custom calibration pattern. Our AI engine will generate optimized G-code for your machine.
        </p>
        
        <Textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., A 50mm square with crosshairs inside..."
          className="bg-black/40 border-primary/20 text-xs min-h-[80px]"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDescription('10mm step calibration grid for X and Y axis accuracy.')}
            className="text-[9px] font-bold border-muted"
          >
            Grid Test
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDescription('Circle-Diamond-Square pattern 40mm wide.')}
            className="text-[9px] font-bold border-muted"
          >
            Geometry Test
          </Button>
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/90 glow-blue text-xs font-black uppercase tracking-wider" 
          disabled={loading}
          onClick={handleGenerate}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Generate & Load G-Code
        </Button>
      </div>
    </div>
  )
}
