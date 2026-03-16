// HID Protocol Constants

// Placeholder USB identifiers - must match firmware
export const USB_VID = 0xcafe
export const USB_PID = 0x4001
export const USAGE_PAGE = 0xff00
export const USAGE = 0x01

// Report configuration
// REPORT_SIZE is 63 (not 64) because TinyUSB prepends a 1-byte report ID,
// making the total USB transfer 64 bytes — exactly the RP2040 Full-Speed
// max packet size and the default CFG_TUD_HID_EP_BUFSIZE.
export const REPORT_SIZE = 63
export const REPORT_ID_COMMAND = 0x01
export const REPORT_ID_REALTIME = 0x02

// Output command header
export const CMD_HEADER_SIZE = 3 // command + seq + total
export const CMD_PAYLOAD_MAX = REPORT_SIZE - CMD_HEADER_SIZE // 60

// Input response header
export const RESP_HEADER_SIZE = 4 // responseId + status + seq + total
export const RESP_PAYLOAD_MAX = REPORT_SIZE - RESP_HEADER_SIZE // 59

// Command IDs (Host -> Device)
export const CMD_GET_DEVICE_INFO = 0x01
export const CMD_GET_CONFIG = 0x02
export const CMD_SET_CONFIG = 0x03
export const CMD_CALIBRATE_START = 0x04
export const CMD_CALIBRATE_STOP = 0x05
export const CMD_RESET_DEFAULTS = 0x06
export const CMD_ENTER_BOOTLOADER = 0x07
export const CMD_START_REALTIME = 0x08
export const CMD_STOP_REALTIME = 0x09

// Response status codes
export const STATUS_OK = 0x00
export const STATUS_ERROR = 0x01
export const STATUS_BUSY = 0x02

// Real-time data marker
export const REALTIME_MARKER = 0x10

// Timeouts
export const COMMAND_TIMEOUT_MS = 2000
export const MULTI_PACKET_TIMEOUT_MS = 5000
export const REALTIME_WATCHDOG_MS = 1000
export const RECONNECT_INTERVAL_MS = 2000
export const RECONNECT_MAX_ATTEMPTS = 15 // 30 seconds total

export interface ParsedResponse {
  responseId: number
  status: number
  sequence: number
  totalPackets: number
  payload: Uint8Array
}
