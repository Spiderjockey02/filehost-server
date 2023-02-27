export type fileType = 'file' | 'directory'

export type fileItem = {
  path: string
  name: string
  isSymbolicLink: boolean
  size: number
  extension: string
  type: fileType
  modified: number
  children: fileItem[]
  url: string
}
