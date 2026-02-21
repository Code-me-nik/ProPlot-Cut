/**
 * ProPlot CNC - Single Axis Controller
 * Hardware: Arduino Uno + CNC Shield V3.0
 * Axis: X-Axis only
 */

// CNC Shield Pin Definitions
#define EN        8       // Stepper motors enable, active low
#define X_DIR     5       // X-axis direction control
#define X_STP     2       // X-axis step control

// Configuration
const int stepsPerUnit = 100; // Multiplier to make small web units visible (adjust as needed)
const int stepDelay = 500;    // Microseconds between pulses (smaller = faster)

void setup() {
  // Set pin modes
  pinMode(X_DIR, OUTPUT); 
  pinMode(X_STP, OUTPUT);
  pinMode(EN, OUTPUT);
  
  // Enable the stepper drivers (Low = Enabled)
  digitalWrite(EN, LOW);
  
  // Initialize Serial at the baud rate defined in the web app
  Serial.begin(115200);
  Serial.println("PROPLOT_X_AXIS_ONLINE");
}

void loop() {
  // Check if data is available from the web app
  if (Serial.available() > 0) {
    // Read the incoming command (e.g., "X10" or "X-10")
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command.length() > 0) {
      // Logic for X-axis commands
      if (command.startsWith("X")) {
        // Extract the numeric value after 'X'
        float val = command.substring(1).toFloat();
        long stepsToMove = (long)(val * stepsPerUnit);
        
        moveStepper(stepsToMove);
        
        // Return "ok" to the web app console to confirm execution
        Serial.println("ok");
      } else {
        // Echo unknown commands for debugging
        Serial.print("UNKNOWN_CMD: ");
        Serial.println(command);
      }
    }
  }
}

/**
 * Moves the X-axis stepper motor
 * @param steps Number of steps (positive for forward, negative for backward)
 */
void moveStepper(long steps) {
  // Set direction
  if (steps > 0) {
    digitalWrite(X_DIR, HIGH);
  } else {
    digitalWrite(X_DIR, LOW);
  }
  
  long absSteps = abs(steps);
  
  // Pulse the step pin
  for (long i = 0; i < absSteps; i++) {
    digitalWrite(X_STP, HIGH);
    delayMicroseconds(stepDelay);
    digitalWrite(X_STP, LOW);
    delayMicroseconds(stepDelay);
  }
}
