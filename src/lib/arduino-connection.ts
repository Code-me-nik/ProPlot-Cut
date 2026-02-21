'use client';

/**
 * Arduino Serial Connection Utility
 * 
 * This service uses the Web Serial API to communicate with an Arduino.
 */

export interface ArduinoConnection {
  send: (gcode: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export async function connectToArduino(onMessage: (msg: string) => void): Promise<ArduinoConnection | null> {
  if (typeof window === 'undefined' || !('serial' in navigator)) {
    console.error('Web Serial API is not supported in this browser.');
    return null;
  }

  try {
    // 1. Request port (User gesture required for first time)
    // @ts-ignore
    const port = await navigator.serial.requestPort();
    
    // 2. Open connection
    await port.open({ baudRate: 115200 });

    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    const decoder = new TextDecoder();
    const reader = port.readable.getReader();

    // 3. Read loop
    (async () => {
      try {
        let partialMessage = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          partialMessage += chunk;
          
          // Split by newline to handle complete responses
          const lines = partialMessage.split('\n');
          partialMessage = lines.pop() || '';
          
          for (const line of lines) {
            onMessage(line.trim());
          }
        }
      } catch (error) {
        console.error('Serial read error:', error);
      } finally {
        reader.releaseLock();
      }
    })();

    return {
      send: async (gcode: string) => {
        await writer.write(encoder.encode(gcode + '\n'));
      },
      disconnect: async () => {
        await reader.cancel();
        writer.releaseLock();
        await port.close();
      }
    };
  } catch (error) {
    console.error('Serial connection failed:', error);
    return null;
  }
}

/**
 * Attempts to automatically connect to a previously authorized port.
 */
export async function getExistingPort(onMessage: (msg: string) => void): Promise<ArduinoConnection | null> {
  if (typeof window === 'undefined' || !('serial' in navigator)) return null;

  // @ts-ignore
  const ports = await navigator.serial.getPorts();
  if (ports.length > 0) {
    const port = ports[0];
    try {
      await port.open({ baudRate: 115200 });
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      const decoder = new TextDecoder();
      const reader = port.readable.getReader();

      (async () => {
        try {
          let partialMessage = '';
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            partialMessage += chunk;
            const lines = partialMessage.split('\n');
            partialMessage = lines.pop() || '';
            for (const line of lines) onMessage(line.trim());
          }
        } catch (e) { console.error(e); } finally { reader.releaseLock(); }
      })();

      return {
        send: async (gcode: string) => { await writer.write(encoder.encode(gcode + '\n')); },
        disconnect: async () => { await reader.cancel(); writer.releaseLock(); await port.close(); }
      };
    } catch (e) {
      return null;
    }
  }
  return null;
}
