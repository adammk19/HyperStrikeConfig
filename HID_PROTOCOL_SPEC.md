# HyperStrike HID Communication Protocol Specification

## Overview

Binary protocol over USB HID using 64-byte reports. The controller exposes a
vendor-defined HID interface (Usage Page `0xFF00`, Usage `0x01`). All multi-byte
integers are **little-endian** to match the RP2040's native byte order.

## USB Identifiers (Placeholders)

| Field       | Value    |
|-------------|----------|
| Vendor ID   | `0xCAFE` |
| Product ID  | `0x4001` |
| Usage Page  | `0xFF00` |
| Usage       | `0x01`   |

---

## Report Structure

### Output Reports: Host -> Device (Report ID 0x01, 64 bytes)

```
Byte 0:     Command ID
Byte 1:     Sequence number (0 for single-packet commands)
Byte 2:     Total packets  (1 for single-packet commands)
Bytes 3-63: Payload (61 bytes available)
```

### Input Reports: Device -> Host (Report ID 0x01, 64 bytes) — Command Responses

```
Byte 0:     Response ID (mirrors the command ID that triggered it)
Byte 1:     Status (0x00 = OK, 0x01 = ERROR, 0x02 = BUSY)
Byte 2:     Sequence number
Byte 3:     Total packets
Bytes 4-63: Payload (60 bytes available)
```

### Input Reports: Device -> Host (Report ID 0x02, 64 bytes) — Real-time Data

```
Byte 0:     0x10 (realtime data marker)
Byte 1:     Button count (N)
Bytes 2+:   Current calibrated value per button (int16 LE each, 0-1000 scale)
```

---

## Commands

| Cmd ID | Name                | Payload          | Response             |
|--------|---------------------|------------------|----------------------|
| `0x01` | `GET_DEVICE_INFO`   | None             | Device info          |
| `0x02` | `GET_CONFIG`        | None             | Config (multi-pkt)   |
| `0x03` | `SET_CONFIG`        | Config (multi-pkt)| Write ACK           |
| `0x04` | `CALIBRATE_START`   | None             | ACK                  |
| `0x05` | `CALIBRATE_STOP`    | None             | ACK                  |
| `0x06` | `RESET_DEFAULTS`    | None             | ACK                  |
| `0x07` | `ENTER_BOOTLOADER`  | None             | None (device reboots)|
| `0x08` | `START_REALTIME`    | None             | ACK                  |
| `0x09` | `STOP_REALTIME`     | None             | ACK                  |

---

## Response Payloads

### DEVICE_INFO Response (0x01)

```
Byte 4:     Controller type (0x01 = Mini, 0x02 = Standard, 0x03 = Pro)
Byte 5:     Button count (12 or 14)
Byte 6:     Firmware version major
Byte 7:     Firmware version minor
Byte 8:     Firmware version patch
Bytes 9-63: Reserved (zeroed)
```

### CONFIG Response (0x02) — Multi-packet

Config binary layout (contiguous, sent across multiple packets):

```
Offset 0:          rapidTrigger          (uint8, 0 or 1)
Offset 1:          continuousRapidTrigger (uint8, 0 or 1)
Offset 2-5:        rapidTriggerSensitivity (int32 LE)
Offset 6+:         actuationPoints[N]     (int32 LE each)
Offset 6+4N:       minRawValues[N]        (int32 LE each)
Offset 6+8N:       maxRawValues[N]        (int32 LE each)
```

**Sizes:**
- Mini (N=12):     2 + 4 + 48 + 48 + 48 = **150 bytes** → 3 packets
- Standard/Pro (N=14): 2 + 4 + 56 + 56 + 56 = **174 bytes** → 3 packets

Each packet carries up to 60 bytes in bytes 4-63. The sequence/total fields
indicate reassembly order (seq 0 = first, etc.).

### SET_CONFIG (0x03) — Multi-packet from Host

Same binary layout as CONFIG response above, but sent as output reports.
Each output report carries up to 61 bytes in bytes 3-63. After all packets
are received, the device validates, applies the config, saves to EEPROM,
and responds with a WRITE_ACK (Response ID 0x03, Status 0x00).

### ACK Response (0x04, 0x05, 0x06, 0x08, 0x09)

```
Byte 1: Status (0x00 = OK)
```

---

## Real-time Analog Streaming

When enabled via `START_REALTIME` (0x08), the device sends Report ID 0x02
at ~60 Hz (or as fast as the ADC scan rate allows):

```
Byte 0:     0x10 (marker)
Byte 1:     Button count (N)
Bytes 2-2+2N: Calibrated value per button (int16 LE, 0-1000 scale)
```

For N=12: 2 + 24 = 26 bytes used (fits in 64).
For N=14: 2 + 28 = 30 bytes used (fits in 64).

Streaming stops on `STOP_REALTIME` (0x09) or device disconnect.

---

## Timeouts

| Condition                   | Timeout |
|-----------------------------|---------|
| Single command response     | 2000 ms |
| Multi-packet reassembly     | 5000 ms |
| Realtime stream watchdog    | 1000 ms |
| Boot drive detection poll   | 1000 ms (30s max) |
| Device reconnect poll       | 2000 ms (30s max) |

---

## Firmware Update Flow

1. App sends `ENTER_BOOTLOADER` (0x07)
2. Device reboots to RP2040 UF2 BOOT mode (mass storage: `RPI-RP2`)
3. App detects boot drive (OS-specific), downloads UF2 from GitHub Releases
4. App copies UF2 to boot drive root
5. RP2040 auto-flashes and reboots with new firmware
6. App polls for device reconnection, verifies new firmware version

**Legacy firmware (no HID):** User manually holds BOOT button + plugs in,
app detects drive and copies UF2.

---

## Notes

- `bool` fields in firmware are `sizeof(bool)` = 1 byte on RP2040 (ARM)
- `int` fields in firmware are `sizeof(int)` = 4 bytes on RP2040 (int32)
- The HID binary layout differs from the EEPROM layout intentionally:
  - HID: RT, CRT, sensitivity, all APs, all mins, all maxes (sequential arrays)
  - EEPROM: RT, sensitivity, CRT, all APs, interleaved min/max pairs
- The firmware translates between the two formats when reading/writing HID
