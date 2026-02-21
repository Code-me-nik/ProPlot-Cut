
/**
 * ProPlot CNC - Basic X-Axis Controller
 * Hardware: Arduino Uno + CNC Shield V3.0
 */

// CNC Shield V3.0 Pin Definitions
#define EN        8       // Stepper enable (active low)
#define X_STEP    2       // X-axis step
#define X_DIR     5       // X-axis direction

// Change this based on your motor and driver settings
// Standard A4988/DRV8825 with 1/16 microstepping is usually ~80-100 steps per mm
const int STEPS_PER_UNIT = 80; 

void setup() {
  pinMode(EN, OUTPUT);
  pinMode(X_STEP, OUTPUT);
  pinMode(X_DIR, OUTPUT);
  
  // Enable the motors (LOW = ON)
  digitalWrite(EN, LOW); 
  
  // Start Serial communication
  Serial.begin(115200);
  Serial.println("ProPlot CNC X-Axis Ready");
}

/**
 * Move the stepper motor
 * @param dir true for clockwise/forward, false for counter-clockwise/backward
 * @param steps number of pulses to send
 */
void performSteps(boolean dir, int steps) {
  digitalWrite(X_DIR, dir);
  for (int i = 0; i < steps; i++) {
    digitalWrite(X_STEP, HIGH);
    delayMicroseconds(800); // Speed control (lower is faster)
    digitalWrite(X_STEP, LOW);
    delayMicroseconds(800);
  }
}

void loop() {
  if (Serial.available() > 0) {
    // Read command until newline
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    // Simple Parser for "X10" or "X-10"
    if (cmd.startsWith("X")) {
      float distance = cmd.substring(1).toFloat();
      
      if (distance > 0) {
        performSteps(true, (int)(distance * STEPS_PER_UNIT));
      } else if (distance < 0) {
        performSteps(false, (int)(abs(distance) * STEPS_PER_UNIT));
      }
      
      // Crucial: Reply 'ok' so the web app knows we finished
      Serial.println("ok");
    }
  }
}
