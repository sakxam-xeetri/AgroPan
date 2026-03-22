# AgroPan — API Walkthrough

> Complete documentation for every CRUD endpoint in the AgroPan platform API.

---

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Request / Response Format](#request--response-format)
- [Database Schema Summary](#database-schema-summary)
- [API Directory Structure](#api-directory-structure)
- [1. Users API](#1-users-api)
- [2. Crops API](#2-crops-api)
- [3. Devices API](#3-devices-api)
- [4. Data API (Sensor Readings)](#4-data-api-sensor-readings)
- [5. Questions API](#5-questions-api)
- [6. Answers API](#6-answers-api)
- [7. Warnings API (Emergency Alerts)](#7-warnings-api-emergency-alerts)
- [8. Emails API (Subscriber Notifications)](#8-emails-api-subscriber-notifications)
- [Email Notification Triggers](#email-notification-triggers)
- [9. Authentication API](#9-authentication-api)
- [Error Handling](#error-handling)
- [Status Codes](#status-codes)

---

## Overview

The AgroPan API is a PHP + MySQL (MariaDB) RESTful API running on XAMPP. It follows a **CRUD folder structure** — each table has a dedicated PHP file in `create/`, `read/`, `update/`, and `delete/` folders. All endpoints accept and return **JSON**.

**Database:** `agropan` (MariaDB 10.4.32)  
**PHP Version:** 8.0.30  
**Server:** XAMPP (Apache)

---

## Base URL

```
http://localhost/reliance/Renhackathon-spark/API
```

All endpoint paths below are relative to this base URL.

---

## Request / Response Format

### Requests

- **Method:** `POST` for all endpoints (create, read, update, delete)
- **Content-Type:** `application/json`
- **Body:** JSON object with the required fields

### Responses

All endpoints return a JSON object with this structure:

```json
{
  "success": true,
  "message": "Description of what happened",
  "data": {}
}
```

On error:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Database Schema Summary

| Table       | Primary Key   | Purpose                               |
| ----------- | ------------- | ------------------------------------- |
| `users`     | `user_id`     | Farmer & merchant accounts            |
| `crops`     | `crop_id`     | Crop marketplace listings with prices |
| `devices`   | `device_id`   | Registered IoT field devices          |
| `data`      | `data_id`     | Sensor readings uploaded by devices   |
| `questions` | `question_id` | Community forum questions             |
| `answers`   | `answer_id`   | Replies to forum questions            |
| `emails`    | `email_id`    | Subscribed emails for notifications   |
| `warnings`  | `warning_id`  | Admin-broadcast emergency alerts      |

---

## API Directory Structure

```
API/
├── database.php         ← Shared PDO connection + helpers
├── auth.php             ← Login, logout, session management
├── create/
│   ├── users.php
│   ├── crops.php
│   ├── devices.php
│   ├── data.php         ← Triggers email notifications
│   ├── emails.php
│   ├── questions.php
│   ├── answers.php
│   └── warnings.php     ← Triggers email notifications
├── read/
│   ├── users.php
│   ├── crops.php
│   ├── devices.php
│   ├── data.php
│   ├── emails.php
│   ├── questions.php
│   ├── answers.php
│   └── warnings.php
├── update/
│   ├── users.php
│   ├── crops.php
│   ├── devices.php
│   ├── data.php
│   ├── emails.php
│   ├── questions.php
│   ├── answers.php
│   └── warnings.php
├── delete/
│   ├── users.php
│   ├── crops.php
│   ├── devices.php
│   ├── data.php
│   ├── emails.php
│   ├── questions.php
│   ├── answers.php
│   └── warnings.php
├── auth.php             ← Authentication (login/logout/status)
└── API-walkthrough.md   ← This file
```

---

## 1. Users API

> Manages farmer and merchant accounts.

### `users` Table Schema

| Column       | Type                     | Description                              |
| ------------ | ------------------------ | ---------------------------------------- |
| `user_id`    | `int(11)` AUTO_INCREMENT | Primary key                              |
| `username`   | `text`                   | Unique login username                    |
| `email`      | `text`                   | User's email address                     |
| `phone`      | `text`                   | User's phone number                      |
| `name`       | `text`                   | Full display name                        |
| `location`   | `text`                   | User's district/location                 |
| `type`       | `text`                   | Account type: `"farmer"` or `"merchant"` |
| `last_login` | `text`                   | Timestamp of last login                  |
| `password`   | `text`                   | Hashed password                          |

---

### CREATE — `POST /create/users.php`

Register a new user account. Password is **bcrypt-hashed server-side**. `last_login` is auto-set to the current Unix timestamp. Duplicate username/email is rejected.

**Request Body:**

```json
{
  "username": "ramesh_farmer",
  "email": "ramesh@example.com",
  "phone": "9801234567",
  "name": "Ramesh Thapa",
  "location": "Chitwan",
  "type": "farmer",
  "password": "securePassword123"
}
```

| Field      | Required | Type   | Description                                  |
| ---------- | -------- | ------ | -------------------------------------------- |
| `username` | **Yes**  | string | Unique username for login                    |
| `email`    | **Yes**  | string | Valid email address (checked for duplicates) |
| `phone`    | **Yes**  | string | Phone number                                 |
| `name`     | **Yes**  | string | Full name of the user                        |
| `location` | **Yes**  | string | District or city                             |
| `type`     | **Yes**  | string | `"farmer"` or `"merchant"` (validated)       |
| `password` | **Yes**  | string | Plain-text password (hashed with bcrypt)     |

**Success Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 1
  }
}
```

---

### READ — `POST /read/users.php`

Retrieve user(s). Send an empty body to get all users, or pass `user_id` for a single user. **Password is excluded** from all responses.

**Request Body (single user):**

```json
{
  "user_id": 1
}
```

**Request Body (all users):**

```json
{}
```

| Field     | Required | Type | Description                 |
| --------- | -------- | ---- | --------------------------- |
| `user_id` | No       | int  | Fetch a specific user by ID |

**Success Response:**

```json
{
  "success": true,
  "message": "User fetched successfully",
  "data": {
    "user_id": 1,
    "username": "ramesh_farmer",
    "email": "ramesh@example.com",
    "phone": "9801234567",
    "name": "Ramesh Thapa",
    "location": "Chitwan",
    "type": "farmer",
    "last_login": "1739260800"
  }
}
```

> **Note:** The `password` field is NEVER returned in read responses. All timestamps are Unix timestamps.

---

### UPDATE — `POST /update/users.php`

Update an existing user's details. `user_id` is required. `last_login` is auto-updated to the current Unix timestamp on every call. If `password` is provided, it is re-hashed with bcrypt.

**Request Body:**

```json
{
  "user_id": 1,
  "name": "Ramesh Kumar Thapa",
  "location": "Kathmandu"
}
```

| Field      | Required | Type   | Description                            |
| ---------- | -------- | ------ | -------------------------------------- |
| `user_id`  | **Yes**  | int    | ID of the user to update               |
| `username` | No       | string | New username                           |
| `email`    | No       | string | New email                              |
| `phone`    | No       | string | New phone number                       |
| `name`     | No       | string | New display name                       |
| `location` | No       | string | New location                           |
| `type`     | No       | string | `"farmer"` or `"merchant"` (validated) |
| `password` | No       | string | New password (re-hashed with bcrypt)   |

> `last_login` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "User updated successfully"
}
```

---

### DELETE — `POST /delete/users.php`

Delete a user account permanently.

**Request Body:**

```json
{
  "user_id": 1
}
```

| Field     | Required | Type | Description              |
| --------- | -------- | ---- | ------------------------ |
| `user_id` | **Yes**  | int  | ID of the user to delete |

**Success Response:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

---

## 2. Crops API

> Manages crop listings in the marketplace with pricing data.

### `crops` Table Schema

| Column         | Type                     | Description                                              |
| -------------- | ------------------------ | -------------------------------------------------------- |
| `crop_id`      | `int(11)` AUTO_INCREMENT | Primary key                                              |
| `name`         | `text`                   | Crop name (e.g., "Rice", "Wheat")                        |
| `image`        | `text`                   | Path or URL to crop image                                |
| `type`         | `text`                   | Crop category (e.g., "cereal", "vegetable", "cash_crop") |
| `price`        | `text`                   | Current market price (NPR per unit)                      |
| `last_updated` | `text`                   | Timestamp of last price update                           |

---

### CREATE — `POST /create/crops.php`

Add a new crop to the marketplace. `last_updated` is auto-set to the current Unix timestamp.

**Request Body:**

```json
{
  "name": "Rice",
  "image": "gallery/crop-rice-paddy.jpg",
  "type": "cereal",
  "price": "45"
}
```

| Field   | Required | Type   | Description                                   |
| ------- | -------- | ------ | --------------------------------------------- |
| `name`  | **Yes**  | string | Name of the crop                              |
| `image` | **Yes**  | string | Image path or URL                             |
| `type`  | **Yes**  | string | Category (cereal, vegetable, cash_crop, etc.) |
| `price` | **Yes**  | string | Market price per kg in NPR                    |

> `last_updated` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Crop added successfully",
  "data": {
    "crop_id": 1
  }
}
```

---

### READ — `POST /read/crops.php`

Retrieve crop(s) from the marketplace. Send an empty body to get all crops.

**Request Body (all crops):**

```json
{}
```

**Request Body (single crop):**

```json
{
  "crop_id": 1
}
```

**Request Body (by type):**

```json
{
  "type": "cereal"
}
```

| Field     | Required | Type   | Description                 |
| --------- | -------- | ------ | --------------------------- |
| `crop_id` | No       | int    | Fetch a specific crop by ID |
| `type`    | No       | string | Filter by crop category     |

**Success Response:**

```json
{
  "success": true,
  "message": "Crop fetched successfully",
  "data": {
    "crop_id": 1,
    "name": "Rice",
    "image": "gallery/crop-rice-paddy.jpg",
    "type": "cereal",
    "price": "45",
    "last_updated": "1739260800"
  }
}
```

---

### UPDATE — `POST /update/crops.php`

Update a crop's details (typically price updates). `last_updated` is auto-set to the current Unix timestamp on every call.

**Request Body:**

```json
{
  "crop_id": 1,
  "price": "48"
}
```

| Field     | Required | Type   | Description              |
| --------- | -------- | ------ | ------------------------ |
| `crop_id` | **Yes**  | int    | ID of the crop to update |
| `name`    | No       | string | New crop name            |
| `image`   | No       | string | New image path           |
| `type`    | No       | string | New category             |
| `price`   | No       | string | Updated market price     |

> `last_updated` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Crop updated successfully"
}
```

---

### DELETE — `POST /delete/crops.php`

Remove a crop listing from the marketplace.

**Request Body:**

```json
{
  "crop_id": 1
}
```

| Field     | Required | Type | Description              |
| --------- | -------- | ---- | ------------------------ |
| `crop_id` | **Yes**  | int  | ID of the crop to delete |

**Success Response:**

```json
{
  "success": true,
  "message": "Crop deleted successfully"
}
```

---

---

## 3. Devices API

> Manages registered IoT field devices (ESP32-S3 sensor nodes).

### `devices` Table Schema

| Column      | Type                     | Description                             |
| ----------- | ------------------------ | --------------------------------------- |
| `device_id` | `int(11)` AUTO_INCREMENT | Primary key                             |
| `name`      | `text`                   | Device name (e.g., "AGROPAN-001")       |
| `location`  | `text`                   | Physical deployment location            |
| `last_ping` | `text`                   | Timestamp of last data transmission     |
| `owned_by`  | `text`                   | User ID or username of the device owner |

---

### CREATE — `POST /create/devices.php`

Register a new IoT device. `last_ping` is auto-set to the current Unix timestamp.

**Request Body:**

```json
{
  "name": "AGROPAN-001",
  "location": "Chitwan, Field Block A",
  "owned_by": "1"
}
```

| Field      | Required | Type   | Description                  |
| ---------- | -------- | ------ | ---------------------------- |
| `name`     | **Yes**  | string | Unique device identifier     |
| `location` | **Yes**  | string | Where the device is deployed |
| `owned_by` | **Yes**  | string | User ID of the device owner  |

> `last_ping` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "device_id": 1
  }
}
```

---

### READ — `POST /read/devices.php`

Retrieve device(s).

**Request Body (all devices):**

```json
{}
```

**Request Body (by owner):**

```json
{
  "owned_by": "1"
}
```

**Request Body (single device):**

```json
{
  "device_id": 1
}
```

| Field       | Required | Type   | Description                       |
| ----------- | -------- | ------ | --------------------------------- |
| `device_id` | No       | int    | Fetch a specific device           |
| `owned_by`  | No       | string | Filter devices by owner's user ID |

**Success Response:**

```json
{
  "success": true,
  "message": "Devices fetched successfully",
  "data": [
    {
      "device_id": 1,
      "name": "AGROPAN-001",
      "location": "Chitwan, Field Block A",
      "last_ping": "1739264730",
      "owned_by": "1"
    }
  ]
}
```

---

### UPDATE — `POST /update/devices.php`

Update device details (typically called when device pings or is relocated). `last_ping` is auto-updated to the current Unix timestamp on every call.

**Request Body:**

```json
{
  "device_id": 1,
  "location": "Chitwan, Field Block B"
}
```

| Field       | Required | Type   | Description                          |
| ----------- | -------- | ------ | ------------------------------------ |
| `device_id` | **Yes**  | int    | ID of the device to update           |
| `name`      | No       | string | New device name                      |
| `location`  | No       | string | New deployment location              |
| `owned_by`  | No       | string | Transfer ownership to different user |

> `last_ping` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Device updated successfully"
}
```

---

### DELETE — `POST /delete/devices.php`

Unregister a device from the platform.

**Request Body:**

```json
{
  "device_id": 1
}
```

| Field       | Required | Type | Description                |
| ----------- | -------- | ---- | -------------------------- |
| `device_id` | **Yes**  | int  | ID of the device to remove |

**Success Response:**

```json
{
  "success": true,
  "message": "Device deleted successfully"
}
```

---

---

## 4. Data API (Sensor Readings)

> Stores sensor readings uploaded by IoT devices. This is the core data pipeline — devices POST readings every 30 seconds.

### `data` Table Schema

| Column        | Type                     | Description                          |
| ------------- | ------------------------ | ------------------------------------ |
| `data_id`     | `int(11)` AUTO_INCREMENT | Primary key                          |
| `timestamp`   | `text`                   | When the reading was taken           |
| `temperature` | `text`                   | Temperature in °C                    |
| `moisture`    | `text`                   | Soil moisture percentage (0–100%)    |
| `humidity`    | `text`                   | Air humidity percentage              |
| `gases`       | `text`                   | Gas level percentage (MQ135 reading) |
| `nitrogen`    | `text`                   | Nitrogen level reading               |
| `device`      | `text`                   | Device ID or name that sent the data |

---

### CREATE — `POST /create/data.php`

Upload a new sensor reading. Called by the ESP32-S3 firmware every 30 seconds. `timestamp` is auto-set to the current Unix timestamp. Triggers email notification to all active subscribers.

**Request Body:**

```json
{
  "temperature": "28.5",
  "moisture": "62.3",
  "humidity": "78.1",
  "gases": "12.5",
  "nitrogen": "45.0",
  "device": "AGROPAN-001"
}
```

| Field         | Required | Type   | Description                        |
| ------------- | -------- | ------ | ---------------------------------- |
| `temperature` | **Yes**  | string | Temperature in °C                  |
| `moisture`    | **Yes**  | string | Soil moisture (0–100%)             |
| `humidity`    | **Yes**  | string | Air humidity (0–100%)              |
| `gases`       | **Yes**  | string | Gas concentration (%)              |
| `nitrogen`    | **Yes**  | string | Nitrogen level                     |
| `device`      | **Yes**  | string | Device name or ID sending the data |

> `timestamp` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Sensor data recorded",
  "data": {
    "data_id": 1
  }
}
```

---

### READ — `POST /read/data.php`

Retrieve sensor readings. Can filter by device or fetch by ID. Results ordered by timestamp descending.

**Request Body (latest from a device):**

```json
{
  "device": "AGROPAN-001"
}
```

**Request Body (all readings):**

```json
{}
```

**Request Body (by data ID):**

```json
{
  "data_id": 42
}
```

| Field     | Required | Type   | Description                       |
| --------- | -------- | ------ | --------------------------------- |
| `data_id` | No       | int    | Fetch a specific reading by ID    |
| `device`  | No       | string | Filter readings by device name/ID |

**Success Response:**

```json
{
  "success": true,
  "message": "Sensor data fetched successfully",
  "data": [
    {
      "data_id": 1,
      "timestamp": "1739264730",
      "temperature": "28.5",
      "moisture": "62.3",
      "humidity": "78.1",
      "gases": "12.5",
      "nitrogen": "45.0",
      "device": "AGROPAN-001"
    }
  ]
}
```

---

### UPDATE — `POST /update/data.php`

Update an existing sensor reading (used for corrections or recalibration adjustments).

**Request Body:**

```json
{
  "data_id": 1,
  "moisture": "64.0",
  "temperature": "28.8"
}
```

| Field         | Required | Type   | Description                  |
| ------------- | -------- | ------ | ---------------------------- |
| `data_id`     | **Yes**  | int    | ID of the reading to update  |
| `timestamp`   | No       | string | Corrected timestamp          |
| `temperature` | No       | string | Corrected temperature        |
| `moisture`    | No       | string | Corrected moisture           |
| `humidity`    | No       | string | Corrected humidity           |
| `gases`       | No       | string | Corrected gas level          |
| `nitrogen`    | No       | string | Corrected nitrogen level     |
| `device`      | No       | string | Reassign to different device |

**Success Response:**

```json
{
  "success": true,
  "message": "Sensor data updated successfully"
}
```

---

### DELETE — `POST /delete/data.php`

Delete a sensor reading record.

**Request Body:**

```json
{
  "data_id": 1
}
```

| Field     | Required | Type | Description                 |
| --------- | -------- | ---- | --------------------------- |
| `data_id` | **Yes**  | int  | ID of the reading to delete |

**Success Response:**

```json
{
  "success": true,
  "message": "Sensor data deleted successfully"
}
```

---

---

## 5. Questions API

> Manages community forum questions posted by farmers and merchants.

### `questions` Table Schema

| Column        | Type                     | Description                                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `question_id` | `int(11)` AUTO_INCREMENT | Primary key                                                                                                 |
| `question`    | `text`                   | The question text/body                                                                                      |
| `type`        | `text`                   | Topic category (e.g., "crop_disease", "market_trends", "weather", "equipment", "success_story", "seasonal") |
| `asked_by`    | `text`                   | User ID or username of the author                                                                           |
| `upvotes`     | `text`                   | Comma-separated list of user IDs who upvoted                                                                |
| `downvotes`   | `text`                   | Comma-separated list of user IDs who downvoted                                                              |
| `answers`     | `text`                   | Comma-separated list of answer IDs linked to this question                                                  |

---

### CREATE — `POST /create/questions.php`

Post a new question to the community forum. `upvotes`, `downvotes`, and `answers` are auto-initialized to `"0"`, `"0"`, and `""` respectively.

**Request Body:**

```json
{
  "question": "What is the best organic fertilizer for rice paddies in Chitwan?",
  "type": "crop_disease",
  "asked_by": "1"
}
```

| Field      | Required | Type   | Description                  |
| ---------- | -------- | ------ | ---------------------------- |
| `question` | **Yes**  | string | Full question text           |
| `type`     | **Yes**  | string | Topic category (see below)   |
| `asked_by` | **Yes**  | string | User ID of the person asking |

> `upvotes` defaults to `"0"`, `downvotes` defaults to `"0"`, `answers` defaults to `""` — do not send them manually.

**Topic Categories:**

| Value           | Description                              |
| --------------- | ---------------------------------------- |
| `crop_disease`  | Crop diseases and pest management        |
| `market_trends` | Price trends, buying/selling advice      |
| `weather`       | Weather advisories and seasonal planning |
| `equipment`     | Tools, machinery, IoT device tips        |
| `success_story` | Farmer/merchant success stories          |
| `seasonal`      | Seasonal planting and harvest guides     |

**Success Response:**

```json
{
  "success": true,
  "message": "Question posted successfully",
  "data": {
    "question_id": 1
  }
}
```

---

### READ — `POST /read/questions.php`

Retrieve forum questions.

**Request Body (all questions):**

```json
{}
```

**Request Body (by topic):**

```json
{
  "type": "crop_disease"
}
```

**Request Body (single question):**

```json
{
  "question_id": 1
}
```

| Field         | Required | Type   | Description               |
| ------------- | -------- | ------ | ------------------------- |
| `question_id` | No       | int    | Fetch a specific question |
| `type`        | No       | string | Filter by topic category  |

**Success Response:**

```json
{
  "success": true,
  "message": "Question fetched successfully",
  "data": {
    "question_id": 1,
    "question": "What is the best organic fertilizer for rice paddies in Chitwan?",
    "type": "crop_disease",
    "asked_by": "1",
    "upvotes": "2,5,8",
    "downvotes": "",
    "answers": "1,3"
  }
}
```

---

### UPDATE — `POST /update/questions.php`

Update a question (edit text, add votes, link new answers).

**Request Body (edit question text):**

```json
{
  "question_id": 1,
  "question": "What is the best organic fertilizer for rice paddies in the Terai region?"
}
```

**Request Body (add upvote):**

```json
{
  "question_id": 1,
  "upvotes": "2,5,8,12"
}
```

**Request Body (link a new answer):**

```json
{
  "question_id": 1,
  "answers": "1,3,7"
}
```

| Field         | Required | Type   | Description                        |
| ------------- | -------- | ------ | ---------------------------------- |
| `question_id` | **Yes**  | int    | ID of the question to update       |
| `question`    | No       | string | Edited question text               |
| `type`        | No       | string | Changed topic category             |
| `asked_by`    | No       | string | Updated author user ID             |
| `upvotes`     | No       | string | Updated upvote user ID list        |
| `downvotes`   | No       | string | Updated downvote user ID list      |
| `answers`     | No       | string | Updated comma-separated answer IDs |

**Success Response:**

```json
{
  "success": true,
  "message": "Question updated successfully"
}
```

---

### DELETE — `POST /delete/questions.php`

Delete a forum question **and all its linked answers**. The question's `answers` field (comma-separated IDs) is parsed, and every referenced answer is deleted automatically in the same request.

**Request Body:**

```json
{
  "question_id": 1
}
```

| Field         | Required | Type | Description                  |
| ------------- | -------- | ---- | ---------------------------- |
| `question_id` | **Yes**  | int  | ID of the question to delete |

> **Cascade:** All answers linked via the question's `answers` field are deleted automatically. No separate call needed.

**Success Response:**

```json
{
  "success": true,
  "message": "Question and linked answers deleted successfully"
}
```

---

---

## 6. Answers API

> Manages replies to community forum questions.

### `answers` Table Schema

| Column        | Type                     | Description                                    |
| ------------- | ------------------------ | ---------------------------------------------- |
| `answer_id`   | `int(11)` AUTO_INCREMENT | Primary key                                    |
| `answer`      | `text`                   | The answer text/body                           |
| `answered_by` | `text`                   | User ID or username of the responder           |
| `upvotes`     | `text`                   | Comma-separated list of user IDs who upvoted   |
| `downvotes`   | `text`                   | Comma-separated list of user IDs who downvoted |

---

### CREATE — `POST /create/answers.php`

Post a new answer to a forum question. Requires `question_id` to link the answer to a question. The new `answer_id` is **automatically appended** to the parent question's `answers` field. `upvotes` and `downvotes` are auto-initialized to `"0"`.

**Request Body:**

```json
{
  "question_id": 1,
  "answer": "Vermicompost works great for rice paddies. Apply 2-3 tons per hectare before transplanting.",
  "answered_by": "3"
}
```

| Field         | Required | Type   | Description                     |
| ------------- | -------- | ------ | ------------------------------- |
| `question_id` | **Yes**  | int    | ID of the parent question       |
| `answer`      | **Yes**  | string | Full answer text                |
| `answered_by` | **Yes**  | string | User ID of the person answering |

> `upvotes` defaults to `"0"`, `downvotes` defaults to `"0"`. The new `answer_id` is auto-appended to the parent question's `answers` field — no separate update call needed.

**Success Response:**

```json
{
  "success": true,
  "message": "Answer posted successfully",
  "data": {
    "answer_id": 1
  }
}
```

---

### READ — `POST /read/answers.php`

Retrieve answer(s). Can fetch by `answer_id`, by `question_id` (looks up the question's `answers` field and fetches all linked answers), or all.

**Request Body (single answer):**

```json
{
  "answer_id": 1
}
```

**Request Body (all answers for a question):**

```json
{
  "question_id": 1
}
```

**Request Body (all answers):**

```json
{}
```

| Field         | Required | Type | Description                                           |
| ------------- | -------- | ---- | ----------------------------------------------------- |
| `answer_id`   | No       | int  | Fetch a specific answer                               |
| `question_id` | No       | int  | Fetch all answers linked to a question (via WHERE IN) |

**Success Response:**

```json
{
  "success": true,
  "message": "Answers fetched successfully",
  "data": [
    {
      "answer_id": 1,
      "answer": "Vermicompost works great for rice paddies. Apply 2-3 tons per hectare before transplanting.",
      "answered_by": "3",
      "upvotes": "1,5",
      "downvotes": ""
    }
  ]
}
```

---

### UPDATE — `POST /update/answers.php`

Edit an answer or update its votes.

**Request Body:**

```json
{
  "answer_id": 1,
  "answer": "Vermicompost works great for rice paddies. Apply 2-3 tons per hectare before transplanting. Mix with cow dung for best results.",
  "upvotes": "1,5,9"
}
```

| Field         | Required | Type   | Description                   |
| ------------- | -------- | ------ | ----------------------------- |
| `answer_id`   | **Yes**  | int    | ID of the answer to update    |
| `answer`      | No       | string | Edited answer text            |
| `answered_by` | No       | string | Updated responder user ID     |
| `upvotes`     | No       | string | Updated upvote user ID list   |
| `downvotes`   | No       | string | Updated downvote user ID list |

**Success Response:**

```json
{
  "success": true,
  "message": "Answer updated successfully"
}
```

---

### DELETE — `POST /delete/answers.php`

Delete an answer. The `answer_id` is **automatically removed** from the parent question's `answers` field — no separate update call needed.

**Request Body:**

```json
{
  "answer_id": 1
}
```

| Field       | Required | Type | Description                |
| ----------- | -------- | ---- | -------------------------- |
| `answer_id` | **Yes**  | int  | ID of the answer to delete |

> **Auto-cleanup:** The deleted `answer_id` is automatically removed from any parent question's comma-separated `answers` field.

**Success Response:**

```json
{
  "success": true,
  "message": "Answer deleted successfully"
}
```

---

---

## 7. Warnings API (Emergency Alerts)

> Manages admin-broadcast emergency alerts for diseases, pest invasions, landslides, severe weather, etc.

### `warnings` Table Schema

| Column       | Type                     | Description                                |
| ------------ | ------------------------ | ------------------------------------------ |
| `warning_id` | `int(11)` AUTO_INCREMENT | Primary key                                |
| `title`      | `text`                   | Alert title                                |
| `details`    | `text`                   | Alert description/details                  |
| `timestamp`  | `text`                   | When the alert was issued (Unix timestamp) |
| `valid_till` | `text`                   | When the alert expires (Unix timestamp)    |

---

### CREATE — `POST /create/warnings.php`

Broadcast a new emergency alert (admin only). `timestamp` is auto-set to the current Unix timestamp. Triggers email notification to all active subscribers.

**Request Body:**

```json
{
  "title": "Late Blight Alert — Potato Crops",
  "details": "Phytophthora infestans detected in Solukhumbu district. Farmers with potato crops should apply copper-based fungicide immediately. Inspect fields daily.",
  "valid_till": "1739865600"
}
```

| Field        | Required | Type   | Description                                     |
| ------------ | -------- | ------ | ----------------------------------------------- |
| `title`      | **Yes**  | string | Short alert title                               |
| `details`    | **Yes**  | string | Full alert description with recommended actions |
| `valid_till` | **Yes**  | string | Unix timestamp — when the alert expires         |

> `timestamp` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Emergency alert broadcast successfully",
  "data": {
    "warning_id": 1
  }
}
```

---

### READ — `POST /read/warnings.php`

Retrieve emergency alerts. Can fetch by `warning_id`, active-only alerts, or all.

**Request Body (all alerts):**

```json
{}
```

**Request Body (active alerts only):**

```json
{
  "active": true
}
```

**Request Body (single alert):**

```json
{
  "warning_id": 1
}
```

| Field        | Required | Type | Description                             |
| ------------ | -------- | ---- | --------------------------------------- |
| `warning_id` | No       | int  | Fetch a specific alert by ID            |
| `active`     | No       | bool | `true` to fetch only non-expired alerts |

**Success Response:**

```json
{
  "success": true,
  "message": "Warnings fetched successfully",
  "data": [
    {
      "warning_id": 1,
      "title": "Late Blight Alert — Potato Crops",
      "details": "Phytophthora infestans detected in Solukhumbu district...",
      "timestamp": "1739260800",
      "valid_till": "1739865600"
    }
  ]
}
```

> **Tip:** Use `{"active": true}` to show only alerts where `valid_till > current_unix_timestamp`.

---

### UPDATE — `POST /update/warnings.php`

Update an existing alert (extend validity, edit details, etc.).

**Request Body:**

```json
{
  "warning_id": 1,
  "details": "UPDATED: Spread confirmed in Ramechhap and Dolakha districts as well. All potato farmers in eastern hills should take immediate action.",
  "valid_till": 1740470400
}
```

| Field        | Required | Type   | Description                  |
| ------------ | -------- | ------ | ---------------------------- |
| `warning_id` | **Yes**  | int    | ID of the alert to update    |
| `title`      | No       | string | Updated title                |
| `details`    | No       | string | Updated details/instructions |
| `timestamp`  | No       | string | Corrected issue timestamp    |
| `valid_till` | No       | string | Extended or shortened expiry |

**Success Response:**

```json
{
  "success": true,
  "message": "Warning updated successfully"
}
```

---

### DELETE — `POST /delete/warnings.php`

Remove an emergency alert.

**Request Body:**

```json
{
  "warning_id": 1
}
```

| Field        | Required | Type | Description               |
| ------------ | -------- | ---- | ------------------------- |
| `warning_id` | **Yes**  | int  | ID of the alert to delete |

**Success Response:**

```json
{
  "success": true,
  "message": "Warning deleted successfully"
}
```

---

---

## 8. Emails API (Subscriber Notifications)

> Manages email subscriptions for receiving sensor data and emergency alert notifications.

### `emails` Table Schema

| Column          | Type                     | Description                             |
| --------------- | ------------------------ | --------------------------------------- |
| `email_id`      | `int(11)` AUTO_INCREMENT | Primary key                             |
| `email`         | `text`                   | Subscriber's email address              |
| `name`          | `text`                   | Subscriber's display name               |
| `subscribed_at` | `text`                   | Timestamp when the subscriber signed up |
| `is_active`     | `tinyint(1)` DEFAULT `1` | `1` = active, `0` = unsubscribed        |

---

### CREATE — `POST /create/emails.php`

Register a new email subscriber. `subscribed_at` is auto-set to the current Unix timestamp. Email format is validated, and duplicates are rejected.

**Request Body:**

```json
{
  "email": "farmer.ram@example.com",
  "name": "Ram Thapa"
}
```

| Field   | Required | Type   | Description                          |
| ------- | -------- | ------ | ------------------------------------ |
| `email` | **Yes**  | string | Subscriber email address (validated) |
| `name`  | **Yes**  | string | Subscriber display name              |

> `subscribed_at` is auto-set to the current Unix timestamp — do not send it manually.

**Success Response:**

```json
{
  "success": true,
  "message": "Email subscriber registered successfully",
  "data": {
    "email_id": 1
  }
}
```

---

### READ — `POST /read/emails.php`

Fetch one subscriber by ID, all active subscribers (default), or all subscribers including inactive.

**Request Body (single):**

```json
{
  "email_id": 1
}
```

**Request Body (all active — default):**

```json
{}
```

**Request Body (all including inactive):**

```json
{
  "all": true
}
```

| Field      | Required | Type | Description                                         |
| ---------- | -------- | ---- | --------------------------------------------------- |
| `email_id` | No       | int  | Specific subscriber ID                              |
| `all`      | No       | bool | `true` to include inactive/unsubscribed subscribers |

> Without any filter, only active subscribers (`is_active = 1`) are returned.

**Success Response (all):**

```json
{
  "success": true,
  "message": "Subscribers fetched successfully",
  "data": [
    {
      "email_id": 1,
      "email": "farmer.ram@example.com",
      "name": "Ram Thapa",
      "subscribed_at": "1739260800",
      "is_active": 1
    }
  ]
}
```

---

### UPDATE — `POST /update/emails.php`

Update a subscriber's details or toggle their active status (unsubscribe/resubscribe).

**Request Body:**

```json
{
  "email_id": 1,
  "is_active": 0
}
```

| Field       | Required | Type   | Description                            |
| ----------- | -------- | ------ | -------------------------------------- |
| `email_id`  | **Yes**  | int    | ID of the subscriber to update         |
| `email`     | No       | string | Updated email address                  |
| `name`      | No       | string | Updated display name                   |
| `is_active` | No       | int    | `1` to resubscribe, `0` to unsubscribe |

**Success Response:**

```json
{
  "success": true,
  "message": "Subscriber updated successfully"
}
```

---

### DELETE — `POST /delete/emails.php`

Permanently remove a subscriber from the database. For a soft-delete (unsubscribe without losing the record), use `POST /update/emails.php` with `{"is_active": 0}` instead.

**Request Body:**

```json
{
  "email_id": 1
}
```

| Field      | Required | Type | Description                    |
| ---------- | -------- | ---- | ------------------------------ |
| `email_id` | **Yes**  | int  | ID of the subscriber to delete |

**Success Response:**

```json
{
  "success": true,
  "message": "Subscriber deleted successfully"
}
```

---

---

## Email Notification Triggers

Two endpoints automatically send email notifications to **all active subscribers** (`is_active = 1` in the `emails` table):

| Trigger Endpoint       | When                                    | Email Subject Prefix        |
| ---------------------- | --------------------------------------- | --------------------------- |
| `/create/data.php`     | New sensor reading uploaded by a device | `AgroPan — New Sensor Data` |
| `/create/warnings.php` | New emergency alert issued by admin     | `AgroPan Emergency Alert`   |

The `notifyAllSubscribers()` helper function in `database.php` handles the fan-out:

1. Queries all active subscribers from the `emails` table
2. Personalises each email with the subscriber's name
3. Sends via PHP's `mail()` function
4. Silently logs failures — email errors never break the main API response

> **Note:** For production, replace `mail()` with a proper SMTP library (e.g., PHPMailer) or a transactional email API (SendGrid, Mailgun, etc.).

---

---

## 9. Authentication API

> Handles user login, logout, and session status checks. Uses PHP native sessions with secure cookie settings. Supports dual-mode: **endpoint mode** (call directly) and **include mode** (other pages include it for session helpers).

### Endpoint — `POST /auth.php`

All auth actions use the same endpoint. The `action` field determines what happens.

---

### Login — `POST /auth.php`

Authenticate a user with username and password. Starts a PHP session with secure cookie settings. Updates `last_login` to the current Unix timestamp.

**Request Body:**

```json
{
  "action": "login",
  "username": "ramesh_farmer",
  "password": "securePassword123"
}
```

| Field      | Required | Type   | Description           |
| ---------- | -------- | ------ | --------------------- |
| `action`   | **Yes**  | string | Must be `"login"`     |
| `username` | **Yes**  | string | The user's login name |
| `password` | **Yes**  | string | Plain-text password   |

**Success Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": 1,
    "username": "ramesh_farmer",
    "name": "Ramesh Thapa",
    "email": "ramesh@example.com",
    "phone": "9801234567",
    "type": "farmer",
    "location": "Chitwan"
  }
}
```

**Error Response (401):**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

> **Security:** Session ID is regenerated on login to prevent session fixation attacks. Password is verified with `password_verify()` (bcrypt).

---

### Logout — `POST /auth.php`

Destroys the current session and clears the session cookie.

**Request Body:**

```json
{
  "action": "logout"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Status — `POST /auth.php`

Check if a user is currently logged in and retrieve their session data.

**Request Body:**

```json
{
  "action": "status"
}
```

**Success Response (logged in):**

```json
{
  "success": true,
  "message": "User is logged in",
  "data": {
    "user_id": 1,
    "username": "ramesh_farmer",
    "name": "Ramesh Thapa",
    "email": "ramesh@example.com",
    "phone": "9801234567",
    "type": "farmer",
    "location": "Chitwan"
  }
}
```

**Response (not logged in):**

```json
{
  "success": false,
  "message": "Not logged in"
}
```

---

### Include Mode — Using auth.php in Other Pages

Include `auth.php` in any PHP page to access session helpers without triggering the endpoint logic:

```php
<?php
// From a page at the project root:
require_once __DIR__ . '/API/auth.php';

// From inside the API/ folder:
require_once __DIR__ . '/auth.php';

// Session is already started. Use the helpers:
if (isLoggedIn()) {
    $user = getLoggedInUser();
    echo "Hello, " . $user['name'];
}

// Block unauthenticated access (returns 401 JSON and exits):
requireLogin();
```

**Available Helper Functions:**

| Function               | Returns | Description                                                            |
| ---------------------- | ------- | ---------------------------------------------------------------------- | -------------------------------------------------- |
| `startSecureSession()` | `void`  | Starts session with secure cookie params (safe to call multiple times) |
| `isLoggedIn()`         | `bool`  | Returns `true` if user is authenticated                                |
| `getLoggedInUser()`    | `array  | null`                                                                  | Returns user data array or `null` if not logged in |
| `requireLogin()`       | `void`  | Sends 401 response and exits if not logged in                          |

**Session Data Available (when logged in):**

| Key                      | Type   | Description                |
| ------------------------ | ------ | -------------------------- |
| `$_SESSION['user_id']`   | int    | User's primary key         |
| `$_SESSION['username']`  | string | Login username             |
| `$_SESSION['name']`      | string | Full display name          |
| `$_SESSION['email']`     | string | Email address              |
| `$_SESSION['phone']`     | string | Phone number               |
| `$_SESSION['type']`      | string | `"farmer"` or `"merchant"` |
| `$_SESSION['location']`  | string | District/location          |
| `$_SESSION['logged_in']` | bool   | Always `true`              |

**Session Configuration:**

| Setting  | Value              | Description                         |
| -------- | ------------------ | ----------------------------------- |
| Name     | `AGROPAN_SESSION`  | Custom session cookie name          |
| Lifetime | `86400` (24 hours) | Session expires after 24 hours      |
| HttpOnly | `true`             | JS cannot access the session cookie |
| SameSite | `Lax`              | CSRF protection                     |
| Secure   | `false`            | Set `true` in production with HTTPS |

---

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "message": "Description of the error"
}
```

### Common Error Messages

| Error                            | Returned When                                                   |
| -------------------------------- | --------------------------------------------------------------- |
| `"Missing required fields"`      | A required field is absent from the request body                |
| `"Invalid JSON input"`           | Request body is not valid JSON                                  |
| `"Record not found"`             | The specified ID does not exist in the database                 |
| `"Database connection failed"`   | MySQL/MariaDB is not running or credentials are wrong           |
| `"Duplicate entry"`              | Attempting to insert a record that violates a unique constraint |
| `"Invalid username or password"` | Login failed — wrong credentials                                |
| `"Authentication required"`      | Endpoint requires login but no active session exists            |
| `"Method not allowed"`           | Non-POST request sent to a POST-only endpoint                   |

---

## Status Codes

| HTTP Code | Meaning               | Used When                                 |
| --------- | --------------------- | ----------------------------------------- |
| `200`     | OK                    | Successful read, update, delete, or login |
| `201`     | Created               | Successful record creation                |
| `400`     | Bad Request           | Missing fields, invalid JSON              |
| `401`     | Unauthorized          | Login failed or session expired           |
| `404`     | Not Found             | Requested record ID doesn't exist         |
| `405`     | Method Not Allowed    | Non-POST request to a POST-only endpoint  |
| `500`     | Internal Server Error | Database failure or unexpected PHP error  |

---

## Quick Reference — All Endpoints

| Endpoint                | Method | Description              |
| ----------------------- | ------ | ------------------------ |
| `/create/users.php`     | POST   | Register a new user      |
| `/read/users.php`       | POST   | Fetch user(s)            |
| `/update/users.php`     | POST   | Update user details      |
| `/delete/users.php`     | POST   | Delete a user            |
| `/create/crops.php`     | POST   | Add a crop listing       |
| `/read/crops.php`       | POST   | Fetch crop(s)            |
| `/update/crops.php`     | POST   | Update crop data/price   |
| `/delete/crops.php`     | POST   | Remove a crop            |
| `/create/devices.php`   | POST   | Register an IoT device   |
| `/read/devices.php`     | POST   | Fetch device(s)          |
| `/update/devices.php`   | POST   | Update device info       |
| `/delete/devices.php`   | POST   | Unregister a device      |
| `/create/data.php`      | POST   | Upload sensor reading    |
| `/read/data.php`        | POST   | Fetch sensor data        |
| `/update/data.php`      | POST   | Correct a reading        |
| `/delete/data.php`      | POST   | Delete a reading         |
| `/create/questions.php` | POST   | Post a forum question    |
| `/read/questions.php`   | POST   | Fetch question(s)        |
| `/update/questions.php` | POST   | Edit/vote on a question  |
| `/delete/questions.php` | POST   | Delete a question        |
| `/create/answers.php`   | POST   | Post an answer           |
| `/read/answers.php`     | POST   | Fetch answer(s)          |
| `/update/answers.php`   | POST   | Edit/vote on an answer   |
| `/delete/answers.php`   | POST   | Delete an answer         |
| `/create/warnings.php`  | POST   | Broadcast an alert       |
| `/read/warnings.php`    | POST   | Fetch alert(s)           |
| `/update/warnings.php`  | POST   | Update an alert          |
| `/delete/warnings.php`  | POST   | Remove an alert          |
| `/create/emails.php`    | POST   | Subscribe an email       |
| `/read/emails.php`      | POST   | Fetch subscriber(s)      |
| `/update/emails.php`    | POST   | Update/unsubscribe       |
| `/delete/emails.php`    | POST   | Delete a subscriber      |
| `/auth.php` (login)     | POST   | Login & start session    |
| `/auth.php` (logout)    | POST   | Logout & destroy session |
| `/auth.php` (status)    | POST   | Check session status     |

---

_Document version: 5.0 · Last updated: February 2026_
