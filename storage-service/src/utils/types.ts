export type loggerTypes = 'log' | 'warn' | 'error' | 'debug' | 'ready'

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

export const PATHS = {
	AVATAR: `${process.cwd()}/src/uploads/avatars`,
	THUMBNAIL: `${process.cwd()}/src/uploads/thumbnails`,
	CONTENT: `${process.cwd()}/src/uploads/content`,
	TRASH: `${process.cwd()}/src/uploads/trash`,
};
