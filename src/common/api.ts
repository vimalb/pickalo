
export interface FileDetail {
  name: string,
  path: string,
  url: string
}

export type JpegDataURL = string;
export interface JpegMetaRequest {
  path: JpegDataURL,
  windowHeight: number
}

export interface JpegSrcSet {
  src: JpegDataURL,
  width: number,
  height: number
}

export interface JpegMeta {
  path?: string,
  src: JpegDataURL,
  width?: number,
  height?: number,
  srcSet?: JpegSrcSet[]
}

export interface PlatformInfo {
  platform?: string,
  argv?: string[]
}

// Must always be functions which return a Promise
export interface MainApi {
  chooseDirectory: () => Promise<string>,
  recursiveListDirectory: (rootDir: string) => Promise<FileDetail[]>,
  copyToDirectory: (srcFile: string, dstDir: string) => Promise<void>,
  deleteFromDirectory: (targetDir: string, filePrefix: string) => Promise<void>,

  precacheJpegMeta: (requests: JpegMetaRequest[]) => Promise<void>,
  getJpegMeta: (request: JpegMetaRequest) => Promise<JpegMeta>,

  platformInfo: () => Promise<PlatformInfo>,

  installShellExtension: () => Promise<void>,
  uninstallShellExtension: () => Promise<void>,

  alert: (msg: string) => Promise<void>
}

// Must always be functions which return void
export interface RendererApi {
  setUnsortedJpegDirectory: (newValue: string | null) => void
  setUnsortedRawDirectory: (newValue: string | null) => void
  setSortedJpegDirectory: (newValue: string | null) => void
  setSortedRawDirectory: (newValue: string | null) => void
}
