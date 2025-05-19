import type { FileContextType, FileProviderProps } from '@/types/Components/Hooks';
import { FileWithChildren } from '@/types/database';
import React, { createContext, useContext, useState } from 'react';

const FileContext = createContext<FileContextType | undefined>(undefined);

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
	const [file, setFile] = useState<FileWithChildren | null>(null);

	return (
		<FileContext.Provider value={{ file, setFile }}>
			{children}
		</FileContext.Provider>
	);
};

export const useFolder = (): FileWithChildren | null => {
	const context = useContext(FileContext);
	if (!context) {
		throw new Error('useFile must be used within a FileProvider');
	}
	return context.file;
};

export const useSetFolder = (): ((file: FileWithChildren | null) => void) => {
	const context = useContext(FileContext);
	if (!context) {
		throw new Error('useSetFile must be used within a FileProvider');
	}
	return context.setFile;
};
