/**
 * ProPlot CNC - Single Axis Controller Firmware
 * Optimized for Arduino Uno + CNC Shield
 * Features: Auto-power down to prevent overheating
 */

const int STEP_PIN = 2; // X-axis step
const int DIR_PIN = 5;  // X-axis direction
const int EN_PIN = 8;   // Global enable (HIGH = OFF, LOW = ON)

void setup() {
  Serial.begin(115200);
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
  pinMode(EN_PIN, OUTPUT);
  
  // Start with motor power OFF to keep it cool
  digitalWrite(EN_PIN, HIGH); 
  
  Serial.println("PROPLOT_SYSTEM_ONLINE");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    if (command.startsWith("X")) {
      float distance = command.substring(1).toFloat();
      moveX(distance);
      Serial.println("OK");
    }
  }
}

void moveX(float distance) {
  // 1. Turn motor power ON
  digitalWrite(EN_PIN, LOW); 
  
  // 2. Set direction
  digitalWrite(DIR_PIN, distance >= 0 ? HIGH : LOW);
  
  // 3. Calculate steps (Assume 100 steps per mm)
  long steps = abs(distance) * 100;
  
  // 4. Step pulse loop
  for (long i = 0; i < steps; i++) {
    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(400); // Speed control
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(400);
  }
  
  // 5. Turn motor power OFF immediately to prevent heat/hiss
  digitalWrite(EN_PIN, HIGH); 
}
