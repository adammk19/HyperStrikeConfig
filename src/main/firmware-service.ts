import { app, net } from 'electron'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

const GITHUB_OWNER = 'adammk19'
const GITHUB_REPO = 'HyperStrikeConfig'
const FIRMWARE_TAG_PREFIX = 'fw-v'

export interface FirmwareReleaseInfo {
  version: string
  downloadUrl: string
  releaseNotes: string
  publishedAt: string
}

const CONTROLLER_FIRMWARE_MAP: Record<number, string> = {
  0x01: 'mini',
  0x02: 'standard',
  0x03: 'pro',
  0x04: 'founders'
}

export async function fetchLatestRelease(controllerType?: number): Promise<FirmwareReleaseInfo> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`
  const response = await net.fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'HyperStrikeConfig'
    }
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const releases = await response.json()

  // Find the latest release with a fw- tag prefix
  const release = releases.find(
    (r: { tag_name: string; draft: boolean; prerelease: boolean }) =>
      r.tag_name.startsWith(FIRMWARE_TAG_PREFIX) && !r.draft && !r.prerelease
  )

  if (!release) {
    throw new Error('No firmware release found')
  }

  // Try to find controller-specific firmware first
  const controllerKey = controllerType ? CONTROLLER_FIRMWARE_MAP[controllerType] : null
  let uf2Asset
  if (controllerKey) {
    uf2Asset = release.assets?.find(
      (a: { name: string }) =>
        a.name.toLowerCase().includes(controllerKey) && a.name.endsWith('.uf2')
    )
  }

  // Fallback to any .uf2 file (backward compat with single-firmware releases)
  if (!uf2Asset) {
    uf2Asset = release.assets?.find((a: { name: string }) => a.name.endsWith('.uf2'))
  }

  if (!uf2Asset) {
    throw new Error('No matching UF2 firmware file found in the latest release')
  }

  return {
    version: release.tag_name?.replace(/^fw-v/, '') ?? '0.0.0',
    downloadUrl: uf2Asset.browser_download_url,
    releaseNotes: release.body ?? '',
    publishedAt: release.published_at ?? ''
  }
}

export async function downloadUF2(
  url: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Validate URL points to GitHub
  const parsed = new URL(url)
  if (
    !parsed.hostname.endsWith('github.com') &&
    !parsed.hostname.endsWith('githubusercontent.com')
  ) {
    throw new Error('UF2 download URL must be from GitHub')
  }

  const response = await net.fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  const destPath = join(app.getPath('temp'), 'hyperstrike-firmware.uf2')

  const fileStream = createWriteStream(destPath)
  const body = response.body
  if (!body) {
    throw new Error('Empty response body')
  }

  let downloaded = 0
  const reader = body.getReader()
  const readable = new Readable({
    async read(): Promise<void> {
      const { done, value } = await reader.read()
      if (done) {
        this.push(null)
        return
      }
      downloaded += value.byteLength
      if (contentLength > 0 && onProgress) {
        onProgress(Math.round((downloaded / contentLength) * 100))
      }
      this.push(Buffer.from(value))
    }
  })

  await pipeline(readable, fileStream)
  return destPath
}
