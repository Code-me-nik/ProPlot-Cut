/**
 * ProPlot CNC - Basic X-Axis Stepper Control Firmware
 * For Arduino Uno + CNC Shield
 * 
 * Hardware Connections (CNC Shield Defaults):
 * - X-Axis Step Pin: 2
 * - X-Axis Dir Pin: 5
 * - Enable Pin: 8 (Must be LOW to move)
 * 
 * Baud Rate: 115200
 */

// Pin Definitions
const int xStepPin = 2;
const int xDirPin = 5;
const int enablePin = 8;

// Configurable Parameters
const int stepsPerRevolution = 200; // Standard 1.8 degree stepper
const int microsteps = 1;           // Set based on your shield jumpers
const int pulseDelay = 800;         // Speed control (lower is faster)
float stepsPerUnit = 40.0;          // Steps required to move 1mm (calibrate this)

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  
  // Set Pin Modes
  pinMode(xStepPin, OUTPUT);
  pinMode(xDirPin, OUTPUT);
  pinMode(enablePin, OUTPUT);
  
  // Enable the motors (active low)
  digitalWrite(enablePin, LOW);
  
  Serial.println("PROPLOT CNC READY - X-AXIS ACTIVE");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    if (command.startsWith("X")) {
      // Parse the number after 'X'
      float distance = command.substring(1).toFloat();
      moveX(distance);
      Serial.print("Executed move: ");
      Serial.println(distance);
      Serial.println("ok");
    } 
    else if (command == "STOP") {
      digitalWrite(enablePin, HIGH); // Disable motors
      Serial.println("ALARM: HARD STOP EXECUTED");
    }
    else if (command == "G21" || command == "G90") {
      // Standard G-code acknowledgments
      Serial.println("ok");
    }
  }
}

/**
 * Move the X-Axis stepper
 * @param distance units to move (positive or negative)
 */
void moveX(float distance) {
  // Set Direction
  if (distance > 0) {
    digitalWrite(xDirPin, HIGH);
  } else {
    digitalWrite(xDirPin, LOW);
    distance = -distance; // Work with absolute distance
  }
  
  // Calculate total steps
  long totalSteps = (long)(distance * stepsPerUnit);
  
  // Pulse the step pin
  for (long i = 0; i < totalSteps; i++) {
    digitalWrite(xStepPin, HIGH);
    delayMicroseconds(pulseDelay);
    digitalWrite(xStepPin, LOW);
    delayMicroseconds(pulseDelay);
  }
}
