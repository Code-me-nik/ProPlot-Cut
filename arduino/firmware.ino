
/**
 * ProPlot CNC - Basic X-Axis Firmware
 * Optimized for Arduino Uno + CNC Shield
 */

// CNC Shield Pin Definitions
const int EN_PIN = 8;    // Enable pin (Active LOW)
const int X_STEP = 2;    // X-axis Step pin
const int X_DIR = 5;     // X-axis Direction pin

// Motor Configuration
const int STEPS_PER_MM = 80; // Standard for GT2 belt with 20T pulley
int feedRate = 1000;         // Default feed rate (speed)

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(EN_PIN, OUTPUT);
  pinMode(X_STEP, OUTPUT);
  pinMode(X_DIR, OUTPUT);
  
  // IMPORTANT: Disable drivers initially to stop humming/heat
  // HIGH = Disabled, LOW = Enabled
  digitalWrite(EN_PIN, HIGH); 
  
  Serial.println("PROPLOT CNC READY - IDLE POWER SAVING ACTIVE");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    if (command.startsWith("X")) {
      float target = command.substring(1).toFloat();
      moveX(target);
    } 
    else if (command.equals("G21 G90")) {
      Serial.println("ok");
    }
  }
}

/**
 * Moves the X-axis stepper motor
 */
void moveX(float distance) {
  // 1. Enable the stepper driver (Stops the SSSSSS sound/humming by powering up)
  digitalWrite(EN_PIN, LOW);
  delay(1); // Small delay to let electronics stabilize
  
  // 2. Set direction
  digitalWrite(X_DIR, distance > 0 ? HIGH : LOW);
  
  // 3. Calculate steps
  long steps = abs(distance) * STEPS_PER_MM;
  
  // 4. Execute movement
  // Calculate pulse delay from feedRate (approximate)
  long pulseDelay = 1000000L / (feedRate / 60.0 * STEPS_PER_MM);
  
  for (long i = 0; i < steps; i++) {
    digitalWrite(X_STEP, HIGH);
    delayMicroseconds(10);
    digitalWrite(X_STEP, LOW);
    delayMicroseconds(pulseDelay / 2);
  }
  
  // 5. IMPORTANT: Disable driver after move is complete
  // This cuts current to the motor, stopping the heat and noise
  digitalWrite(EN_PIN, HIGH);
  
  Serial.println("ok");
}
