/// <reference types="vite/client" />

// WebHID API type declarations
interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[]
}

interface HIDInputReportEvent extends Event {
  device: HIDDevice
  reportId: number
  data: DataView
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice
}

interface HIDDevice extends EventTarget {
  opened: boolean
  vendorId: number
  productId: number
  productName: string
  collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  forget(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  oninputreport: ((this: HIDDevice, ev: HIDInputReportEvent) => void) | null
  addEventListener(
    type: 'inputreport',
    listener: (ev: HIDInputReportEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: 'inputreport',
    listener: (ev: HIDInputReportEvent) => void,
    options?: boolean | EventListenerOptions
  ): void
}

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  type: number
  children: HIDCollectionInfo[]
  inputReports: HIDReportInfo[]
  outputReports: HIDReportInfo[]
  featureReports: HIDReportInfo[]
}

interface HIDReportInfo {
  reportId: number
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>
  addEventListener(
    type: 'connect',
    listener: (ev: HIDConnectionEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: 'disconnect',
    listener: (ev: HIDConnectionEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: 'connect',
    listener: (ev: HIDConnectionEvent) => void,
    options?: boolean | EventListenerOptions
  ): void
  removeEventListener(
    type: 'disconnect',
    listener: (ev: HIDConnectionEvent) => void,
    options?: boolean | EventListenerOptions
  ): void
}

interface Navigator {
  hid: HID
}
