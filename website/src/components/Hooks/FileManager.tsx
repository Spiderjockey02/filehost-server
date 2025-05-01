import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { fileItem } from '@/types';

interface FileContextType {
  file: fileItem | null;
  setFile: (file: fileItem | null) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
	const [file, setFile] = useState<fileItem | null>(null);

	return (
		<FileContext.Provider value={{ file, setFile }}>
			{children}
		</FileContext.Provider>
	);
};

export const useFolder = (): fileItem | null => {
	const context = useContext(FileContext);
	if (!context) {
		throw new Error('useFile must be used within a FileProvider');
	}
	return context.file;
};

export const useSetFolder = (): ((file: fileItem | null) => void) => {
	const context = useContext(FileContext);
	if (!context) {
		throw new Error('useSetFile must be used within a FileProvider');
	}
	return context.setFile;
};
