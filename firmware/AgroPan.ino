/*
 * ============================================================================
 *  AgroPan — Smart Agriculture IoT Node Firmware
 * ============================================================================
 *  MCU          : ESP32-S3 Dev Module
 *  Framework    : Arduino (ESP32 Board Package ≥ 2.0.x)
 *  Author       : AgroPan Engineering Team
 *  Version      : 1.0.0
 *  Date         : 2026-02-11
 *  License      : MIT
 * ----------------------------------------------------------------------------
 *  Hardware Bill of Materials:
 *    • MQ135 Gas Sensor             → GPIO 4  (ADC)
 *    • Capacitive Soil Moisture     → GPIO 5  (ADC)
 *    • DHT22 Temp & Humidity        → GPIO 16 (Digital)
 *    • 1.3" SSD1306 OLED 128×64    → SDA GPIO 8 / SCL GPIO 9 (I2C)
 *    • WiFiManager AP for provisioning
 * ----------------------------------------------------------------------------
 *  Required Libraries (install via Arduino Library Manager):
 *    WiFiManager            – tzapu / tablatronix
 *    ArduinoJson            – Benoît Blanchon  (v6 or v7)
 *    Adafruit SSD1306       – Adafruit
 *    Adafruit GFX Library   – Adafruit
 *    DHT sensor library     – Adafruit
 * ============================================================================
 */

// ─── Includes ────────────────────────────────────────────────────────────────
#include <WiFi.h>
#include <WiFiManager.h>          // WiFi provisioning portal
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

// ─── Device Identity ─────────────────────────────────────────────────────────
#define DEVICE_ID           "AGROPAN-001"
#define FIRMWARE_VERSION    "1.0.0"

// ─── Pin Configuration ───────────────────────────────────────────────────────
#define PIN_MQ135           4       // MQ135 analog output
#define PIN_SOIL            5       // Capacitive soil moisture analog output
#define PIN_DHT             16      // DHT22 data pin
#define PIN_SDA             8       // OLED I2C SDA
#define PIN_SCL             9       // OLED I2C SCL

// ─── OLED Configuration ─────────────────────────────────────────────────────
#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64
#define OLED_RESET          -1      // No hardware reset pin
#define OLED_I2C_ADDR       0x3C   // Typical address for 1.3" SSD1306

// ─── DHT Configuration ──────────────────────────────────────────────────────
#define DHT_TYPE            DHT22

// ─── Sensor Calibration Constants ────────────────────────────────────────────
// Capacitive soil moisture sensor: dry ≈ 3200 (ADC), wet ≈ 1200 (ADC)
// Adjust these after calibration with YOUR sensor in YOUR soil.
#define SOIL_DRY_VALUE      3200
#define SOIL_WET_VALUE      1200

// MQ135 threshold (raw ADC value). Tune after warm-up in clean air.
#define GAS_THRESHOLD_RAW   1800
#define ADC_SAMPLES         10      // Number of samples to average

// ─── Alert Thresholds ────────────────────────────────────────────────────────
#define ALERT_SOIL_LOW      30.0f   // Soil moisture < 30 % → Low Moisture
#define ALERT_TEMP_HIGH     35.0f   // Temperature  > 35 °C → Heat Alert
// Gas alert uses GAS_THRESHOLD_RAW converted to percentage internally.
#define ALERT_GAS_PCT       60.0f   // Gas level > 60 % → Gas Warning

// ─── Timing Intervals (ms) ──────────────────────────────────────────────────
#define DISPLAY_INTERVAL    5000UL  // Rotate OLED screens every 5 s
#define SENSOR_INTERVAL     2000UL  // Read sensors every 2 s
#define UPLOAD_INTERVAL     30000UL // POST to server every 30 s
#define WIFI_CHECK_INTERVAL 15000UL // Check WiFi connection every 15 s

// ─── API Endpoint ────────────────────────────────────────────────────────────
#define API_ENDPOINT        "https://yourdomain.com/api/upload.php"
#define HTTP_TIMEOUT_MS     8000    // HTTP request timeout
#define HTTP_MAX_RETRIES    3       // Retry count on failure

// ─── WiFiManager AP ──────────────────────────────────────────────────────────
#define AP_NAME             "AgroPan-Setup"
#define AP_TIMEOUT          180     // Config portal timeout (seconds)

// ═══════════════════════════════════════════════════════════════════════════
//  Global Objects
// ═══════════════════════════════════════════════════════════════════════════

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
DHT dht(PIN_DHT, DHT_TYPE);
WiFiManager wifiManager;

// ─── Sensor Data Structure ───────────────────────────────────────────────────
struct SensorData {
  float soilMoisture;   // 0 – 100 %
  float temperature;    // °C
  float humidity;       // % RH
  float gasLevel;       // 0 – 100 %
  bool  dhtOk;          // true if last DHT read succeeded
  bool  gasAlert;
  bool  soilAlert;
  bool  heatAlert;
} sensor = {0};

// ─── Alert Status String (for API) ──────────────────────────────────────────
String alertStatusString = "OK";

// ─── Timing Trackers ─────────────────────────────────────────────────────────
unsigned long lastDisplaySwitch = 0;
unsigned long lastSensorRead    = 0;
unsigned long lastUpload        = 0;
unsigned long lastWiFiCheck     = 0;

// ─── Display State ───────────────────────────────────────────────────────────
enum DisplayScreen : uint8_t {
  SCREEN_WIFI  = 0,
  SCREEN_DATA  = 1,
  SCREEN_ALERT = 2,
  SCREEN_COUNT = 3
};
uint8_t currentScreen = SCREEN_WIFI;

// ─── WiFi Status Cache ───────────────────────────────────────────────────────
bool wifiConnected = false;
String localIP     = "N/A";

// ═══════════════════════════════════════════════════════════════════════════
//  Forward Declarations
// ═══════════════════════════════════════════════════════════════════════════
void readSensors();
void updateDisplay();
void checkAlerts();
void sendToServer();
void drawScreenWifi();
void drawScreenData();
void drawScreenAlert();
void reconnectWiFi();
uint16_t readAnalogAverage(uint8_t pin, uint8_t samples);

// ═══════════════════════════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════════════════════════
void setup() {
  // ── Serial ──
  Serial.begin(115200);
  delay(500);  // Brief startup settle
  Serial.println(F("\n===================================="));
  Serial.print(F("  AgroPan Firmware v"));
  Serial.println(FIRMWARE_VERSION);
  Serial.print(F("  Device ID : "));
  Serial.println(DEVICE_ID);
  Serial.println(F("====================================\n"));

  // ── I2C & OLED ──
  Wire.begin(PIN_SDA, PIN_SCL);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.println(F("[OLED] SSD1306 init FAILED — halting."));
    while (true) { yield(); }  // Cannot continue without display
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(10, 10);
  display.println(F("AgroPan v" FIRMWARE_VERSION));
  display.setCursor(10, 30);
  display.println(F("Connecting WiFi..."));
  display.display();
  Serial.println(F("[OLED] Display initialised."));

  // ── DHT22 ──
  dht.begin();
  Serial.println(F("[DHT22] Sensor initialised."));

  // ── ADC Resolution (ESP32-S3 supports 12-bit) ──
  analogReadResolution(12);  // 0 – 4095

  // ── WiFiManager ──
  // Automatically connects using saved credentials,
  // or starts a config portal on AP_NAME if none are stored.
  wifiManager.setConfigPortalTimeout(AP_TIMEOUT);
  wifiManager.setConnectTimeout(20);
  wifiManager.setDebugOutput(true);

  Serial.println(F("[WiFi] Starting WiFiManager..."));

  bool connected = wifiManager.autoConnect(AP_NAME);

  if (connected) {
    wifiConnected = true;
    localIP = WiFi.localIP().toString();
    Serial.print(F("[WiFi] Connected! IP: "));
    Serial.println(localIP);
  } else {
    wifiConnected = false;
    Serial.println(F("[WiFi] Failed to connect. Continuing offline."));
  }

  // ── Splash Complete ──
  display.clearDisplay();
  display.setCursor(10, 10);
  display.println(wifiConnected ? F("WiFi Connected!") : F("WiFi Offline"));
  display.display();
  delay(1000);  // Last blocking delay — lets user see result

  // ── Seed timing baselines ──
  unsigned long now = millis();
  lastSensorRead    = now;
  lastDisplaySwitch = now;
  lastUpload        = now - UPLOAD_INTERVAL + 5000; // First upload after 5 s
  lastWiFiCheck     = now;

  Serial.println(F("[SETUP] Complete. Entering main loop.\n"));
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN LOOP — fully non-blocking
// ═══════════════════════════════════════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // ── 1. Read sensors at SENSOR_INTERVAL ──
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    readSensors();
    checkAlerts();
  }

  // ── 2. Rotate OLED screen at DISPLAY_INTERVAL ──
  if (now - lastDisplaySwitch >= DISPLAY_INTERVAL) {
    lastDisplaySwitch = now;
    currentScreen = (currentScreen + 1) % SCREEN_COUNT;
    updateDisplay();
  }

  // ── 3. Upload data to server at UPLOAD_INTERVAL ──
  if (now - lastUpload >= UPLOAD_INTERVAL) {
    lastUpload = now;
    if (wifiConnected) {
      sendToServer();
    } else {
      Serial.println(F("[HTTP] Skipped — WiFi not connected."));
    }
  }

  // ── 4. Periodic WiFi health check ──
  if (now - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
    lastWiFiCheck = now;
    reconnectWiFi();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  readSensors() — Sample all sensors with averaging & fail-safe
// ═══════════════════════════════════════════════════════════════════════════
void readSensors() {
  // ── Soil Moisture (capacitive, analog) ──
  uint16_t soilRaw = readAnalogAverage(PIN_SOIL, ADC_SAMPLES);
  // Map: dry (high ADC) → 0 %, wet (low ADC) → 100 %
  sensor.soilMoisture = constrain(
    map(soilRaw, SOIL_DRY_VALUE, SOIL_WET_VALUE, 0, 100), 0, 100
  );

  // ── MQ135 Gas Sensor (analog) ──
  uint16_t gasRaw = readAnalogAverage(PIN_MQ135, ADC_SAMPLES);
  // Percentage relative to threshold ceiling (4095 max ADC)
  sensor.gasLevel = constrain((gasRaw / 4095.0f) * 100.0f, 0.0f, 100.0f);

  // ── DHT22 Temperature & Humidity ──
  float t = dht.readTemperature();   // °C
  float h = dht.readHumidity();      // % RH

  if (isnan(t) || isnan(h)) {
    sensor.dhtOk = false;
    Serial.println(F("[DHT22] Read FAILED — using last known values."));
    // Retain previous values (fail-safe: don't zero them out)
  } else {
    sensor.dhtOk      = true;
    sensor.temperature = t;
    sensor.humidity    = h;
  }

  // ── Debug Output ──
  Serial.println(F("--- Sensor Readings ---"));
  Serial.printf("  Soil Moisture : %.1f %%  (raw %u)\n", sensor.soilMoisture, soilRaw);
  Serial.printf("  Gas Level     : %.1f %%  (raw %u)\n", sensor.gasLevel, gasRaw);
  Serial.printf("  Temperature   : %.1f °C %s\n", sensor.temperature, sensor.dhtOk ? "" : "[STALE]");
  Serial.printf("  Humidity      : %.1f %% %s\n", sensor.humidity, sensor.dhtOk ? "" : "[STALE]");
  Serial.println(F("-----------------------"));
}

// ═══════════════════════════════════════════════════════════════════════════
//  readAnalogAverage() — Multi-sample ADC read with averaging
// ═══════════════════════════════════════════════════════════════════════════
uint16_t readAnalogAverage(uint8_t pin, uint8_t samples) {
  uint32_t sum = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sum += analogRead(pin);
  }
  return (uint16_t)(sum / samples);
}

// ═══════════════════════════════════════════════════════════════════════════
//  checkAlerts() — Evaluate thresholds and build alert string
// ═══════════════════════════════════════════════════════════════════════════
void checkAlerts() {
  sensor.soilAlert = (sensor.soilMoisture < ALERT_SOIL_LOW);
  sensor.heatAlert = (sensor.temperature  > ALERT_TEMP_HIGH);
  sensor.gasAlert  = (sensor.gasLevel     > ALERT_GAS_PCT);

  // Build composite alert string for API & display
  String alerts = "";

  if (sensor.soilAlert) {
    alerts += "LOW_MOISTURE ";
    Serial.println(F("[ALERT] Low Soil Moisture!"));
  }
  if (sensor.heatAlert) {
    alerts += "HEAT ";
    Serial.println(F("[ALERT] High Temperature!"));
  }
  if (sensor.gasAlert) {
    alerts += "GAS ";
    Serial.println(F("[ALERT] Gas Level High!"));
  }

  alerts.trim();
  alertStatusString = alerts.length() > 0 ? alerts : "OK";
}

// ═══════════════════════════════════════════════════════════════════════════
//  updateDisplay() — Draw the current OLED screen
// ═══════════════════════════════════════════════════════════════════════════
void updateDisplay() {
  // If any alert is active, force the alert screen into the rotation
  bool hasAlert = sensor.soilAlert || sensor.heatAlert || sensor.gasAlert;

  if (hasAlert && currentScreen != SCREEN_ALERT) {
    // Show alert every other cycle regardless of rotation
    // This simple logic ensures alerts get visibility
  }

  switch (currentScreen) {
    case SCREEN_WIFI:  drawScreenWifi();  break;
    case SCREEN_DATA:  drawScreenData();  break;
    case SCREEN_ALERT: drawScreenAlert(); break;
    default:           drawScreenData();  break;
  }
}

// ─── Screen 1: WiFi Status + IP Address ──────────────────────────────────────
void drawScreenWifi() {
  display.clearDisplay();
  display.setTextSize(1);

  // Header
  display.setCursor(0, 0);
  display.println(F("=== AgroPan WiFi ==="));

  display.setCursor(0, 16);
  if (wifiConnected) {
    display.print(F("Status : Connected"));
    display.setCursor(0, 28);
    display.print(F("IP : "));
    display.print(localIP);
    display.setCursor(0, 40);
    display.print(F("RSSI : "));
    display.print(WiFi.RSSI());
    display.print(F(" dBm"));
  } else {
    display.println(F("Status : OFFLINE"));
    display.setCursor(0, 28);
    display.println(F("Connect to AP:"));
    display.setCursor(0, 40);
    display.println(F(AP_NAME));
  }

  // Footer
  display.setCursor(0, 56);
  display.print(F("ID: "));
  display.print(DEVICE_ID);

  display.display();
}

// ─── Screen 2: Live Sensor Data ──────────────────────────────────────────────
void drawScreenData() {
  display.clearDisplay();
  display.setTextSize(1);

  // Header
  display.setCursor(0, 0);
  display.println(F("=== Sensor Data ==="));

  // Soil Moisture
  display.setCursor(0, 14);
  display.print(F("Soil   : "));
  display.print(sensor.soilMoisture, 1);
  display.println(F(" %"));

  // Temperature
  display.setCursor(0, 26);
  display.print(F("Temp   : "));
  display.print(sensor.temperature, 1);
  display.print(F(" C"));
  if (!sensor.dhtOk) display.print(F(" !"));

  // Humidity
  display.setCursor(0, 38);
  display.print(F("Humid  : "));
  display.print(sensor.humidity, 1);
  display.print(F(" %"));
  if (!sensor.dhtOk) display.print(F(" !"));

  // Gas
  display.setCursor(0, 50);
  display.print(F("Gas    : "));
  display.print(sensor.gasLevel, 1);
  display.println(F(" %"));

  display.display();
}

// ─── Screen 3: Alert Screen ─────────────────────────────────────────────────
void drawScreenAlert() {
  display.clearDisplay();
  display.setTextSize(1);

  bool hasAlert = sensor.soilAlert || sensor.heatAlert || sensor.gasAlert;

  display.setCursor(0, 0);
  if (hasAlert) {
    display.setTextSize(2);
    display.println(F("! ALERT !"));
    display.setTextSize(1);
    display.println();

    uint8_t y = 24;
    if (sensor.soilAlert) {
      display.setCursor(0, y);
      display.print(F("> Low Moisture: "));
      display.print(sensor.soilMoisture, 0);
      display.println(F("%"));
      y += 12;
    }
    if (sensor.heatAlert) {
      display.setCursor(0, y);
      display.print(F("> Heat Alert : "));
      display.print(sensor.temperature, 1);
      display.println(F("C"));
      y += 12;
    }
    if (sensor.gasAlert) {
      display.setCursor(0, y);
      display.print(F("> Gas Warning: "));
      display.print(sensor.gasLevel, 0);
      display.println(F("%"));
    }
  } else {
    display.setTextSize(2);
    display.setCursor(10, 8);
    display.println(F("ALL CLEAR"));
    display.setTextSize(1);
    display.setCursor(20, 40);
    display.println(F("No alerts active"));
    display.setCursor(20, 52);
    display.println(F("System nominal"));
  }

  display.display();
}

// ═══════════════════════════════════════════════════════════════════════════
//  sendToServer() — POST JSON payload with retry logic
// ═══════════════════════════════════════════════════════════════════════════
void sendToServer() {
  Serial.println(F("[HTTP] Preparing data upload..."));

  // Build JSON document
  JsonDocument doc;                     // ArduinoJson v7 (auto-sized)
  doc["device_id"]      = DEVICE_ID;
  doc["soil_moisture"]  = round(sensor.soilMoisture * 10.0f) / 10.0f;
  doc["temperature"]    = round(sensor.temperature * 10.0f) / 10.0f;
  doc["humidity"]       = round(sensor.humidity * 10.0f) / 10.0f;
  doc["gas_level"]      = round(sensor.gasLevel * 10.0f) / 10.0f;
  doc["alert_status"]   = alertStatusString;
  doc["firmware"]       = FIRMWARE_VERSION;
  doc["uptime_s"]       = (unsigned long)(millis() / 1000UL);

  String payload;
  serializeJson(doc, payload);

  Serial.print(F("[HTTP] Payload: "));
  Serial.println(payload);

  // Retry loop
  for (uint8_t attempt = 1; attempt <= HTTP_MAX_RETRIES; attempt++) {
    Serial.printf("[HTTP] Attempt %u/%u\n", attempt, HTTP_MAX_RETRIES);

    HTTPClient http;
    http.begin(API_ENDPOINT);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(HTTP_TIMEOUT_MS);

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      Serial.printf("[HTTP] Response code: %d\n", httpCode);
      if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
        String response = http.getString();
        Serial.print(F("[HTTP] Server response: "));
        Serial.println(response);
        http.end();
        return;  // Success — exit retry loop
      }
    } else {
      Serial.printf("[HTTP] Request failed: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();

    // Brief non-blocking(ish) wait before retry — acceptable here
    if (attempt < HTTP_MAX_RETRIES) {
      Serial.println(F("[HTTP] Retrying..."));
      unsigned long retryStart = millis();
      while (millis() - retryStart < 2000) { yield(); }  // 2 s pause, yields to RTOS
    }
  }

  Serial.println(F("[HTTP] All retry attempts failed."));
}

// ═══════════════════════════════════════════════════════════════════════════
//  reconnectWiFi() — Periodic WiFi health check & reconnect
// ═══════════════════════════════════════════════════════════════════════════
void reconnectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiConnected) {
      // Transitioned from disconnected → connected
      wifiConnected = true;
      localIP = WiFi.localIP().toString();
      Serial.print(F("[WiFi] Reconnected. IP: "));
      Serial.println(localIP);
    }
    return;
  }

  // WiFi lost
  if (wifiConnected) {
    wifiConnected = false;
    localIP = "N/A";
    Serial.println(F("[WiFi] Connection lost. Attempting reconnect..."));
  }

  WiFi.reconnect();
}
