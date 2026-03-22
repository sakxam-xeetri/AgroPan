# 🌾 AgroPan — Smart Agriculture Platform for Nepal

> **"AgroPan is not just a website — it's an agriculture ecosystem: monitor, trade, discuss, and stay safe — powered by real IoT hardware."**

AgroPan is a Nepal-focused smart agriculture platform combining a **production-ready ESP32-S3 IoT sensor node** with a **digital marketplace**, **community forum**, and **emergency alert system**. It connects farmers, merchants, and administrators — enabling field monitoring, direct trade, knowledge sharing, and disaster preparedness.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [System Architecture](#system-architecture)
- [Hardware Guide — AgroPan IoT Node](#-hardware-guide--agropan-iot-node)
  - [Bill of Materials](#1-bill-of-materials-bom)
  - [Arduino IDE Setup](#2-arduino-ide-setup--board-installation)
  - [Library Installation](#3-library-installation)
  - [Wiring Diagram](#4-complete-wiring-connections)
  - [Detailed Pin-by-Pin Wiring](#5-detailed-pin-by-pin-wiring-instructions)
  - [Assembly Tips](#6-physical-assembly-tips)
  - [Firmware Upload](#7-firmware-upload)
  - [First Boot & WiFi Setup](#8-first-boot--wifi-provisioning)
  - [Calibration](#9-sensor-calibration)
  - [Troubleshooting](#10-troubleshooting)
- [Web Platform](#web-platform)
- [Folder Structure](#folder-structure)
- [Key Features](#key-features)
- [Team](#team)
- [License](#license)

---

## The Problem

Nepal's 3.4 million farming households face fragmented access to market information, limited direct connections to buyers, no centralized forum for agricultural knowledge, and no affordable way to monitor field conditions or receive early warnings about disasters and disease outbreaks.

## The Solution

AgroPan is a **four-pillar smart agriculture platform**:

1. **IoT Field Device** — An ESP32-S3 based sensor node that monitors soil moisture, temperature, humidity, and air quality, sending data to a web API in real time.
2. **Marketplace** — Farmers analyze crop prices, list produce, and connect directly with merchants. Both roles have dedicated accounts.
3. **Community Forum** — A discussion space where registered farmers and merchants share knowledge on diseases, market trends, equipment, and seasonal strategies.
4. **Emergency Alerts** — Administrators broadcast urgent alerts for disease outbreaks, pest invasions, landslides, and severe weather via the platform, SMS, and email.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AgroPan Platform                             │
├──────────────┬──────────────┬──────────────┬────────────────────────┤
│  IoT Device  │  Marketplace │  Community   │  Emergency Alerts      │
│  (ESP32-S3)  │              │  Forum       │  (Admin-driven)        │
│              │              │              │                        │
│ • Soil       │ • Price      │ • Crop       │ • Disease outbreaks    │
│   moisture   │   analysis   │   diseases   │ • Pest invasions       │
│ • Temp &     │ • Produce    │ • Market     │ • Landslides & floods  │
│   humidity   │   listings   │   trends     │ • Severe weather       │
│ • Air quality│ • Farmer ↔   │ • Equipment  │                        │
│ • OLED       │   Merchant   │   tips       │ • Platform alerts      │
│   display    │   contact    │ • Success    │ • SMS notifications    │
│ • WiFi data  │              │   stories    │ • Email broadcasts     │
│   upload     │              │              │                        │
└──────┬───────┴──────────────┴──────────────┴────────────────────────┘
       │
       ▼
┌───────────────────┐
│   Cloud Server    │
│  /api/upload.php  │
│  (JSON POST)      │
└───────────────────┘
```

---

# 🔧 Hardware Guide — AgroPan IoT Node

This is the complete, step-by-step guide to build the AgroPan IoT sensor node from scratch — from purchasing components to uploading firmware.

---

## 1. Bill of Materials (BOM)

| #   | Component                                | Specification                           | Qty | Approx. Cost (NPR) | Notes                                           |
| --- | ---------------------------------------- | --------------------------------------- | --- | ------------------ | ----------------------------------------------- |
| 1   | **ESP32-S3 Dev Module**                  | ESP32-S3-DevKitC-1 or N16R8 variant     | 1   | ₹800–1200          | Must be S3 variant (not ESP32 or S2)            |
| 2   | **MQ135 Gas Sensor Module**              | Breakout board with AO (analog out) pin | 1   | ₹200–350           | Has on-board comparator + analog output         |
| 3   | **Capacitive Soil Moisture Sensor v1.2** | Corrosion-resistant, analog output      | 1   | ₹150–250           | Do NOT use resistive type (corrodes fast)       |
| 4   | **DHT22 Sensor** (AM2302)                | Temperature + Humidity, digital output  | 1   | ₹300–500           | DHT22 is more accurate than DHT11               |
| 5   | **1.3" OLED Display**                    | SSD1306 driver, I2C, 128×64 pixels      | 1   | ₹250–400           | Must be I2C (4-pin: VCC, GND, SDA, SCL)         |
| 6   | **Breadboard**                           | Full-size 830 tie-point                 | 1   | ₹100               | For prototyping                                 |
| 7   | **Jumper Wires**                         | Male-to-Male and Male-to-Female         | 20+ | ₹80                | Assorted colors recommended                     |
| 8   | **USB-C Cable**                          | Data + Power capable                    | 1   | ₹100               | Some cheap cables are charge-only — avoid those |
| 9   | **10kΩ Resistor**                        | 1/4W through-hole                       | 1   | ₹5                 | Pull-up for DHT22 data line                     |
| 10  | **5V Power Supply** (optional)           | USB adapter or LiPo + regulator         | 1   | ₹150               | For field deployment (USB power bank works too) |

**Total Estimated Cost: ₹2,000 – ₹3,200** (~$15–25 USD)

---

## 2. Arduino IDE Setup — Board Installation

### Step 2.1 — Install Arduino IDE

1. Download **Arduino IDE 2.x** from: https://www.arduino.cc/en/software
2. Install and open the IDE.

### Step 2.2 — Add ESP32 Board Support

1. Open Arduino IDE → **File** → **Preferences**
2. In the **"Additional boards manager URLs"** field, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   > If you already have other URLs there, separate them with a comma.
3. Click **OK**.

### Step 2.3 — Install ESP32 Board Package

1. Go to **Tools** → **Board** → **Boards Manager**
2. Search for **"esp32"**
3. Find **"esp32 by Espressif Systems"** — install **version 2.0.x or later**
4. Wait for download to complete (≈200 MB).

### Step 2.4 — Select the Correct Board

1. Go to **Tools** → **Board** → **esp32** → **ESP32S3 Dev Module**
2. Configure these settings under **Tools** menu:

| Setting              | Value                                              |
| -------------------- | -------------------------------------------------- |
| **Board**            | ESP32S3 Dev Module                                 |
| **USB CDC On Boot**  | Enabled                                            |
| **CPU Frequency**    | 240MHz (WiFi)                                      |
| **Flash Mode**       | QIO 80MHz                                          |
| **Flash Size**       | 16MB (or match your board)                         |
| **Partition Scheme** | Default 4MB with spiffs (or Huge APP if needed)    |
| **PSRAM**            | OPI PSRAM (if your board has PSRAM, else Disabled) |
| **Upload Mode**      | UART0 / Hardware CDC                               |
| **Upload Speed**     | 921600                                             |

### Step 2.5 — Install USB Drivers (if needed)

Most ESP32-S3 dev boards use a built-in USB-JTAG/Serial interface. If your board isn't detected:

- **Windows**: The driver should auto-install. If not, install [Zadig](https://zadig.akeo.ie/) or the [CP210x driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) depending on your board's USB-UART chip.
- **macOS/Linux**: Usually works out of the box. If not, install CH340 or CP2102 drivers.

**Verify**: After plugging in the board, check **Tools** → **Port** — you should see a COM port (e.g., `COM3` on Windows, `/dev/ttyACM0` on Linux).

---

## 3. Library Installation

Open **Arduino IDE** → **Sketch** → **Include Library** → **Manage Libraries...**

Install each of the following (search by name):

| #   | Library Name                | Author              | Version      | Search Term                                   |
| --- | --------------------------- | ------------------- | ------------ | --------------------------------------------- |
| 1   | **WiFiManager**             | tzapu / tablatronix | ≥ 2.0.x      | `WiFiManager`                                 |
| 2   | **ArduinoJson**             | Benoît Blanchon     | ≥ 6.x or 7.x | `ArduinoJson`                                 |
| 3   | **Adafruit SSD1306**        | Adafruit            | ≥ 2.5.x      | `Adafruit SSD1306`                            |
| 4   | **Adafruit GFX Library**    | Adafruit            | ≥ 1.11.x     | `Adafruit GFX` (auto-installed with SSD1306)  |
| 5   | **DHT sensor library**      | Adafruit            | ≥ 1.4.x      | `DHT sensor`                                  |
| 6   | **Adafruit Unified Sensor** | Adafruit            | ≥ 1.1.x      | `Adafruit Unified Sensor` (dependency of DHT) |

> **Tip**: When you install "Adafruit SSD1306", the IDE will prompt to install dependencies (GFX, BusIO). Click **"Install All"**.

### Verify Libraries

After installation, go to **Sketch** → **Include Library** — you should see all six libraries listed under "Contributed Libraries".

---

## 4. Complete Wiring Connections

### Pin Map — ESP32-S3 Dev Module

```
                    ┌──────────────────────┐
                    │     ESP32-S3 Dev      │
                    │       Module          │
                    │                       │
     MQ135 AO ────►│ GPIO 4  (ADC1_CH3)    │
   Soil Moist ────►│ GPIO 5  (ADC1_CH4)    │
                    │                       │
    DHT22 Data ───►│ GPIO 16               │
                    │                       │
    OLED SDA ─────►│ GPIO 8  (I2C SDA)     │
    OLED SCL ─────►│ GPIO 9  (I2C SCL)     │
                    │                       │
         VCC ─────►│ 3V3                    │
         GND ─────►│ GND                    │
                    │                       │
    MQ135 VCC ────►│ 5V (VIN/USB)          │
                    └──────────────────────┘
```

### Master Wiring Table

| Wire # | From (Component Pin)     | To (ESP32-S3 Pin)              | Wire Color (Suggested) | Notes                                      |
| ------ | ------------------------ | ------------------------------ | ---------------------- | ------------------------------------------ |
| 1      | MQ135 → **VCC**          | **5V** (VIN pin)               | 🔴 Red                 | MQ135 needs 5V for heater                  |
| 2      | MQ135 → **GND**          | **GND**                        | ⚫ Black               | Common ground                              |
| 3      | MQ135 → **AO**           | **GPIO 4**                     | 🟡 Yellow              | Analog output (0–3.3V via onboard divider) |
| 4      | Soil Sensor → **VCC**    | **3V3**                        | 🔴 Red                 | 3.3V powered (do NOT use 5V)               |
| 5      | Soil Sensor → **GND**    | **GND**                        | ⚫ Black               | Common ground                              |
| 6      | Soil Sensor → **AOUT**   | **GPIO 5**                     | 🟠 Orange              | Analog output                              |
| 7      | DHT22 → **VCC** (Pin 1)  | **3V3**                        | 🔴 Red                 | 3.3V power                                 |
| 8      | DHT22 → **DATA** (Pin 2) | **GPIO 16**                    | 🟢 Green               | Digital data line                          |
| 9      | DHT22 → **GND** (Pin 4)  | **GND**                        | ⚫ Black               | Pin 3 is not connected                     |
| 10     | **10kΩ Resistor**        | DHT22 **VCC** ↔ DHT22 **DATA** | —                      | Pull-up resistor between Pin 1 and Pin 2   |
| 11     | OLED → **VCC**           | **3V3**                        | 🔴 Red                 | 3.3V power                                 |
| 12     | OLED → **GND**           | **GND**                        | ⚫ Black               | Common ground                              |
| 13     | OLED → **SDA**           | **GPIO 8**                     | 🔵 Blue                | I2C Data                                   |
| 14     | OLED → **SCL**           | **GPIO 9**                     | ⚪ White               | I2C Clock                                  |

---

## 5. Detailed Pin-by-Pin Wiring Instructions

### 5A. MQ135 Gas Sensor

```
   MQ135 Module              ESP32-S3
  ┌────────────┐          ┌────────────┐
  │ VCC   (5V) │─── 🔴 ──│ 5V / VIN   │
  │ GND        │─── ⚫ ──│ GND        │
  │ AO (Analog)│─── 🟡 ──│ GPIO 4     │
  │ DO (Digital)│   (not used)         │
  └────────────┘          └────────────┘
```

**Important Notes:**

- The MQ135 **requires 5V** for its internal heating element. Connect VCC to the ESP32-S3's **5V/VIN** pin (USB power rail), NOT the 3.3V pin.
- We only use the **AO (Analog Output)** pin. The DO (Digital Output) pin is not needed.
- The MQ135 has a **24–48 hour burn-in** period for first use. Readings stabilize after warm-up.
- After initial burn-in, the sensor needs **2–3 minutes** of warm-up each power cycle.

### 5B. Capacitive Soil Moisture Sensor

```
   Soil Sensor               ESP32-S3
  ┌────────────┐          ┌────────────┐
  │ VCC (3.3V) │─── 🔴 ──│ 3V3        │
  │ GND        │─── ⚫ ──│ GND        │
  │ AOUT       │─── 🟠 ──│ GPIO 5     │
  └────────────┘          └────────────┘
```

**Important Notes:**

- Use **3.3V** (not 5V) to power this sensor when using ESP32-S3 ADC.
- **Do NOT** immerse the electronics/header part in water — only the probe section goes into soil.
- The corrosion-resistant capacitive type (v1.2+) is essential for field deployment.
- Mark the sensor's "water line" — the maximum immersion depth printed on the PCB.

### 5C. DHT22 Temperature & Humidity Sensor

```
   DHT22 Pinout (front view, grid facing you):

     Pin 1    Pin 2    Pin 3    Pin 4
     (VCC)   (DATA)   (N/C)    (GND)
       │        │                 │
       │   ┌────┤                 │
       │   │ 10kΩ                 │
       │   │ Resistor             │
       │   └────┤                 │
       │        │                 │
    🔴 3V3   🟢 GPIO 16       ⚫ GND
                         (on ESP32-S3)

```

```
   DHT22                     ESP32-S3
  ┌────────────┐          ┌────────────┐
  │ Pin 1 VCC  │─── 🔴 ──│ 3V3        │
  │ Pin 2 DATA │─── 🟢 ──│ GPIO 16    │
  │ Pin 3 N/C  │   (leave unconnected) │
  │ Pin 4 GND  │─── ⚫ ──│ GND        │
  └────────────┘          └────────────┘

  + 10kΩ resistor between Pin 1 (VCC) and Pin 2 (DATA)
```

**Important Notes:**

- The **10kΩ pull-up resistor** between VCC and DATA is **required**. Without it, you'll get intermittent read failures (NaN values).
- Some DHT22 breakout boards have the resistor **built-in**. Check your board — if it has 3 pins (VCC, DATA, GND) with a small SMD resistor on the PCB, you may not need the external one.
- **Pin 3 is not connected** (leave it floating or don't connect at all).
- Minimum read interval is **2 seconds** (the firmware respects this).

### 5D. 1.3" OLED Display (SSD1306 I2C)

```
   OLED Display              ESP32-S3
  ┌────────────┐          ┌────────────┐
  │ VCC        │─── 🔴 ──│ 3V3        │
  │ GND        │─── ⚫ ──│ GND        │
  │ SDA        │─── 🔵 ──│ GPIO 8     │
  │ SCL        │─── ⚪ ──│ GPIO 9     │
  └────────────┘          └────────────┘
```

**Important Notes:**

- This MUST be the **I2C version** (4 pins: VCC, GND, SDA, SCL). The SPI version (7 pins) will NOT work with this firmware.
- Default I2C address is **0x3C**. If your display uses 0x3D, change `OLED_I2C_ADDR` in the firmware.
- Keep I2C wires **short** (< 20 cm) for reliable communication.
- If the display shows nothing after upload, try swapping SDA and SCL wires.

---

## 6. Physical Assembly Tips

### Breadboard Layout (Suggested)

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        BREADBOARD                            │
  │                                                              │
  │  ┌───────────┐   ┌──────────┐   ┌─────┐   ┌────────────┐  │
  │  │  ESP32-S3  │   │  MQ135   │   │DHT22│   │ OLED 1.3"  │  │
  │  │  Dev Board │   │  Module  │   │     │   │  Display   │  │
  │  │           │   │          │   │     │   │            │  │
  │  │  (center) │   │  (left)  │   │(mid)│   │  (right)   │  │
  │  └───────────┘   └──────────┘   └─────┘   └────────────┘  │
  │                                                              │
  │  Soil Sensor wire runs off-board to probe in soil pot        │
  │                                                              │
  │  + Rail: 3.3V    - Rail: GND    5V from ESP32 VIN pin       │
  └─────────────────────────────────────────────────────────────┘
```

### Assembly Order (Recommended)

1. **Place ESP32-S3** in the center of the breadboard, straddling the center gap.
2. **Connect power rails** — run 3V3 and GND from the ESP32 to the breadboard's + and - rails.
3. **Wire the OLED first** — it's I2C and easy to verify. Upload a simple I2C scanner sketch to confirm the address (0x3C).
4. **Wire the DHT22 next** — don't forget the pull-up resistor! Verify with a basic DHT test sketch.
5. **Wire the Soil Moisture Sensor** — connect and read raw ADC values to calibrate.
6. **Wire the MQ135 last** — it gets warm! Give it space on the breadboard. Let it warm up before trusting readings.
7. **Upload the AgroPan firmware** — all sensors should now work together.

### Power Considerations

| Component    | Voltage                        | Current Draw            |
| ------------ | ------------------------------ | ----------------------- |
| ESP32-S3     | 5V (USB) / 3.3V (internal LDO) | ~240 mA (WiFi active)   |
| MQ135        | 5V                             | ~150 mA (heater active) |
| DHT22        | 3.3V                           | ~1.5 mA                 |
| Soil Sensor  | 3.3V                           | ~5 mA                   |
| OLED SSD1306 | 3.3V                           | ~20 mA                  |
| **Total**    | —                              | **~420 mA**             |

> **A standard USB port provides 500 mA** — this is enough for prototyping. For field deployment, use a **USB power bank** (10,000 mAh = ~23 hours runtime) or a **5V/2A adapter**.

---

## 7. Firmware Upload

### Step 7.1 — Open the Firmware

1. In Arduino IDE: **File** → **Open** → navigate to `firmware/AgroPan.ino`
2. The file opens in the editor.

### Step 7.2 — Configure Your Settings

Before uploading, review these constants at the top of the file:

```cpp
// Change this to your actual API server:
#define API_ENDPOINT   "https://yourdomain.com/api/upload.php"

// Unique device ID — change per device if deploying multiple:
#define DEVICE_ID      "AGROPAN-001"

// Calibrate these after testing with YOUR soil sensor:
#define SOIL_DRY_VALUE  3200   // ADC reading in dry air
#define SOIL_WET_VALUE  1200   // ADC reading submerged in water
```

### Step 7.3 — Compile (Verify)

1. Click the **✓ (Verify)** button (or Ctrl+R).
2. Wait for compilation. First compile takes 1–2 minutes.
3. If you see **"Compilation complete"** — you're good.

**Common compilation errors:**

| Error                              | Fix                                       |
| ---------------------------------- | ----------------------------------------- |
| `WiFiManager.h: No such file`      | Install WiFiManager library (Step 3)      |
| `Adafruit_SSD1306.h: No such file` | Install Adafruit SSD1306 library (Step 3) |
| `DHT.h: No such file`              | Install DHT sensor library (Step 3)       |
| `Board not found`                  | Install ESP32 board package (Step 2.3)    |

### Step 7.4 — Upload

1. Connect ESP32-S3 to your PC via USB-C cable.
2. Select the correct port: **Tools** → **Port** → (select the COM port that appeared).
3. **Put the board in upload mode** (if needed):
   - Hold the **BOOT** button on the ESP32-S3.
   - While holding BOOT, press and release the **RESET** button.
   - Release the BOOT button.
   - You should see the port appear/reappear.
4. Click the **→ (Upload)** button (or Ctrl+U).
5. Wait for upload (progress bar shows percentage).
6. You should see: **"Hard resetting via RTS pin... Done uploading."**

### Step 7.5 — Open Serial Monitor

1. **Tools** → **Serial Monitor** (or Ctrl+Shift+M).
2. Set baud rate to **115200** (bottom-right dropdown).
3. Press the **RESET** button on the ESP32-S3.
4. You should see:

```
====================================
  AgroPan Firmware v1.0.0
  Device ID : AGROPAN-001
====================================

[OLED] Display initialised.
[DHT22] Sensor initialised.
[WiFi] Starting WiFiManager...
```

---

## 8. First Boot & WiFi Provisioning

On first boot (or when no WiFi credentials are saved):

### Step 8.1 — Connect to the Setup AP

1. The ESP32 creates a WiFi access point named **`AgroPan-Setup`**.
2. On your phone or laptop, go to **WiFi settings**.
3. Connect to the **"AgroPan-Setup"** network (no password).
4. A **captive portal** page will open automatically.
   - If it doesn't auto-open, go to **http://192.168.4.1** in your browser.

### Step 8.2 — Enter WiFi Credentials

1. On the portal page, tap **"Configure WiFi"**.
2. Select your WiFi network from the scanned list.
3. Enter your WiFi password.
4. Tap **"Save"**.

### Step 8.3 — Verify Connection

1. The ESP32 will restart and connect to your WiFi.
2. The OLED will show:
   ```
   === AgroPan WiFi ===
   Status : Connected
   IP : 192.168.1.xxx
   RSSI : -45 dBm
   ID: AGROPAN-001
   ```
3. The Serial Monitor will print:
   ```
   [WiFi] Connected! IP: 192.168.1.xxx
   [SETUP] Complete. Entering main loop.
   ```

**Credentials are saved in flash** — on subsequent power cycles, the ESP32 auto-connects without needing the portal again.

### To Reset WiFi Credentials

If you need to change the WiFi network, add this line in `setup()` before the `wifiManager.autoConnect()` call:

```cpp
wifiManager.resetSettings();  // Uncomment to clear saved WiFi
```

Upload, let it clear settings, then remove/comment the line and re-upload.

---

## 9. Sensor Calibration

### 9A. Soil Moisture Sensor Calibration

The raw ADC values vary between sensor units. You MUST calibrate yours:

1. **Open Serial Monitor** (115200 baud).
2. **Dry reading**: Hold the sensor in open air. Note the raw ADC value printed:

   ```
   Soil Moisture : 0.0 %  (raw 3280)
   ```

   → Set `SOIL_DRY_VALUE` to this number (e.g., `3280`).

3. **Wet reading**: Submerge the probe in a glass of water (up to the water line mark). Note:

   ```
   Soil Moisture : 100.0 %  (raw 1150)
   ```

   → Set `SOIL_WET_VALUE` to this number (e.g., `1150`).

4. Re-upload the firmware with updated values.

### 9B. MQ135 Gas Sensor Calibration

1. **First-time burn-in**: Power the MQ135 continuously for **24–48 hours** on first use.
2. **Clean air baseline**: After burn-in, note the raw ADC in clean air:
   ```
   Gas Level : 12.5 %  (raw 512)
   ```
3. **Alert threshold**: The default `ALERT_GAS_PCT` is 60%. Adjust based on your environment.
4. For precise PPM calculations, refer to the MQ135 datasheet's Rs/R0 curves.

### 9C. DHT22

No calibration needed — factory calibrated. If readings seem off:

- Verify the **10kΩ pull-up** is connected.
- Ensure adequate **ventilation** (don't enclose in a sealed box).
- Accuracy: ±0.5°C temperature, ±2% humidity.

---

## 10. Troubleshooting

| Problem                              | Possible Cause            | Solution                                                            |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------- |
| **OLED is blank**                    | Wrong I2C address         | Run an I2C scanner sketch; change `OLED_I2C_ADDR` to 0x3D if needed |
| **OLED is blank**                    | SDA/SCL swapped           | Swap the blue and white wires                                       |
| **DHT22 reads NaN**                  | Missing pull-up resistor  | Add 10kΩ between VCC and DATA                                       |
| **DHT22 reads NaN**                  | Wrong pin                 | Verify GPIO 16 connection                                           |
| **Soil reads 0% always**             | Wrong calibration values  | Re-calibrate dry/wet values (see 9A)                                |
| **Soil reads 100% always**           | Sensor powered at 5V      | Use 3.3V for the soil sensor                                        |
| **MQ135 reads very high**            | Sensor not warmed up      | Wait 2–3 minutes after power-on                                     |
| **MQ135 reads very high**            | First use without burn-in | Run for 24–48 hours continuously                                    |
| **WiFi portal doesn't appear**       | Credentials already saved | Add `wifiManager.resetSettings();` to clear them                    |
| **Upload fails**                     | Wrong board selected      | Ensure "ESP32S3 Dev Module" is selected                             |
| **Upload fails**                     | Board not in boot mode    | Hold BOOT → press RESET → release BOOT, then upload                 |
| **COM port not showing**             | Driver issue              | Install CP210x or CH340 driver for your board                       |
| **HTTP POST fails**                  | No internet               | Check WiFi connection; verify API URL                               |
| **Compile error: library not found** | Library not installed     | Install all 6 libraries from Step 3                                 |
| **Random reboots**                   | Power insufficient        | Use a 5V/2A power supply; MQ135 draws ~150 mA                       |

### I2C Scanner Sketch (for debugging OLED)

If your OLED isn't working, upload this quick sketch to find its address:

```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);  // SDA=8, SCL=9
  Serial.println("I2C Scanner");
  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("Device found at 0x%02X\n", addr);
    }
  }
  Serial.println("Scan complete.");
}

void loop() {}
```

---

# Web Platform

## Design Philosophy

| Principle                | Application                                                    |
| ------------------------ | -------------------------------------------------------------- |
| **Minimal & calm**       | Muted earth tones, generous whitespace, no visual noise        |
| **Data over decoration** | Every element communicates information, nothing is ornamental  |
| **Documentary-style**    | Real Nepali agriculture photography, not stock images          |
| **Trustworthy**          | Professional typography, policy-grade presentation             |
| **Nepal-first**          | Crop names, district-specific data, Nepali agriculture context |

---

## Tech Stack

| Layer                | Technology                                       |
| -------------------- | ------------------------------------------------ |
| **Markup**           | Semantic HTML5                                   |
| **Styling**          | CSS3 (Custom Properties, Flexbox, Grid)          |
| **Logic**            | Vanilla JavaScript (ES5+ compatible)             |
| **Animations**       | Intersection Observer API                        |
| **Fonts**            | Poppins, Inter, Noto Sans                        |
| **Web Dependencies** | **Zero** — no frameworks, no build tools, no npm |
| **IoT Firmware**     | Arduino C++ (ESP32-S3), WiFiManager, ArduinoJson |

---

## Folder Structure

```
agropan/
├── index.html                ← Landing page (single-page, static)
├── css/
│   ├── variables.css         ← Design tokens (colors, spacing, type)
│   └── index.css             ← Unified stylesheet (reset → responsive)
├── js/
│   ├── animations.js         ← Scroll reveal (Intersection Observer)
│   └── main.js               ← Nav, smooth scroll, counter animation
├── firmware/
│   └── AgroPan.ino           ← ESP32-S3 IoT node firmware (Arduino)
├── gallery/                  ← Real Nepali agriculture photographs
├── docs/
│   └── architecture.md       ← Detailed architecture documentation
└── README.md                 ← This file
```

---

## How to Run the Landing Page

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-team/agropan.git
   cd agropan
   ```

2. **Open in browser** — no build step required

   ```bash
   # Option A: Just double-click index.html

   # Option B: Use any local server
   python -m http.server 8000
   # Then open http://localhost:8000
   ```

3. **That's it.** No `npm install`, no `.env`, no Docker. AgroPan opens instantly.

---

## Key Features

### IoT Sensor Node

- Real-time soil, air, temperature monitoring
- 1.3" OLED field display with 3-screen rotation
- Smart threshold alerts (Low Moisture, Heat, Gas)
- WiFi auto-provisioning (zero-config setup)
- JSON API data upload every 30 seconds

### Marketplace

- **Farmer accounts** — list produce, view market prices, connect with buyers
- **Merchant accounts** — browse listings, compare prices across districts, contact farmers directly
- Real-time crop price analysis for informed trading decisions

### Community Forum

- 6 topic categories: Crop Diseases, Market Trends, Weather Advisories, Equipment Tips, Success Stories, Seasonal Guides
- Open to all registered farmers and merchants
- Knowledge sharing across Nepal's diverse agricultural regions

### Emergency Alerts

- Admin-broadcast alerts for disease outbreaks, pest invasions, landslides, and severe weather
- Multi-channel delivery: platform notifications, SMS, and email
- Color-coded severity levels (Warning, Danger, Info)

### UI/UX

- Mobile-first responsive design
- Scroll-reveal animations with stagger effects
- Glass-morphism navigation bar
- No page reloads — entire experience in a single page
- Accessible: ARIA labels, focus states, reduced-motion support

---

## Hackathon Pitch Summary

**AgroPan** is a smart agriculture platform for Nepal.

**Problem:** 3.4M Nepali farming households make high-stakes planting decisions without data. One bad season can mean food insecurity.

**Solution:** A zero-dependency web simulator that projects yield, risk, and profit _before planting_ — paired with an affordable ESP32-S3 IoT sensor node for real-time field monitoring. Both use Nepal-specific data.

**Differentiation:**

- Not a monitoring dashboard — it's a **pre-decision** simulator + **real hardware**
- Not a global tool — it's **calibrated to Nepal** (districts, monsoon patterns, local crop economics)
- Not a complex app — the web tool runs in **any browser with zero setup**
- Not a demo — it's **production-grade**, accessible, and extensible
- **IoT node costs under $25** — affordable for Nepali farmer cooperatives

**Impact:** Empowers smallholder farmers to make data-backed decisions, reduces seasonal risk, and generates policy-grade agricultural insights at district level.

**Future:** Real API integration, offline PWA support, WASM agronomic models, Nepali language interface, LoRa mesh networking for remote fields, solar-powered nodes, and a policymaker dashboard.

---

## Team

Built with purpose at **Ren Hackathon Spark** — for Nepal, by people who care about Nepal's food future.

---

## License

MIT — Open source & policy-grade.

_© 2026 AgroPan_
