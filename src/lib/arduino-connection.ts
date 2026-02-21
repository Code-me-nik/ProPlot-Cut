'use client';

/**
 * Arduino Serial Connection Utility
 * 
 * This service uses the Web Serial API to communicate with an Arduino Uno.
 * Note: navigator.serial requires a secure context (HTTPS) and 
 * must be triggered by a user gesture (e.g., a button click).
 */

export async function connectToArduino() {
  // 1. Check browser support
  if (typeof window === 'undefined' || !('serial' in navigator)) {
    console.error('Web Serial API is not supported in this browser.');
    return null;
  }

  try {
    // 2. Request the user to select the Arduino port
    // @ts-ignore - Serial types may not be in standard TS lib
    const port = await navigator.serial.requestPort();
    
    // 3. Open connection (115200 is standard for GRBL firmware)
    await port.open({ baudRate: 115200 });

    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    const decoder = new TextDecoder();
    const reader = port.readable.getReader();

    console.log('Successfully connected to Arduino Uno');

    // 4. Start a background loop to listen for responses (like "ok")
    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const message = decoder.decode(value);
          console.log('[FROM ARDUINO]:', message);
          // You can dispatch this to a UI console here
        }
      } catch (error) {
        console.error('Serial read error:', error);
      } finally {
        reader.releaseLock();
      }
    })();

    // 5. Return control functions
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
