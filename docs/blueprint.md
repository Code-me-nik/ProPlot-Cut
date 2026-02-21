# **App Name**: ProPlot CNC

## Core Features:

- G-Code Streaming: Stream G-code line by line to the Arduino/GRBL controller via USB OTG.
- Live Toolpath Preview: Render the G-code toolpath in real-time using OpenGL ES 3.0, showing completed and remaining paths.
- Power Failure Recovery: Automatically save machine state upon USB disconnection and prompt user to resume or restart job.
- Machine Mode Switching: Dynamically switch between Plotter and CNC modes, updating UI and control behavior.
- Emergency Stop: Implement an emergency stop button for immediate machine reset.
- Precision Test Module: Generate G-code for testing CNC precision and calculating deviation using a tool.
- Live Status Monitoring: Parse and display live machine status (position, feed rate, spindle speed, etc.) from GRBL messages.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) for a modern, industrial feel.
- Background color: Dark gray (#212121) to enhance visibility and reduce eye strain in low-light environments.
- Accent color: Neon green (#00FF00) for start/active indicators.
- Body and headline font: 'Inter', a sans-serif font providing a neutral, machined look, is ideal for both headings and body text, ensuring readability and consistency.
- Code font: 'Source Code Pro' for displaying G-code and other code snippets.
- Use simple, high-contrast icons for machine controls.
- Design the layout to be responsive, adapting to both phone and tablet screen sizes.
- Incorporate smooth transitions and subtle animations for status updates and control interactions.