import type { FileContextType } from '@/types/Components/Hooks';
import type { FileWithDeepChildren } from '@/types/database';
import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';

const FileContext = createContext<FileContextType | undefined>(undefined);
export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const router = useRouter();
	const path = (router.query.files as string[] | undefined) ?? [];

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['folder', path],
		queryFn: async ({ signal }) => {
			const res = await fetch(`/api/files/${path.join('/')}`, { signal });
			if (!res.ok) throw new Error(`Failed to fetch user's files: ${res.statusText}`);

			const { file } = await res.json();
			return file as FileWithDeepChildren;
		},
		enabled: router.isReady && router.pathname.startsWith('/files'),
	});

	return (
		<FileContext.Provider value={{ file: data ?? null, isLoading, error, refetch }}>
			{children}
		</FileContext.Provider>
	);
};

export const useFolder = () => {
	const context = useContext(FileContext);
	if (!context) throw new Error('useFolder must be used within a FileProvider');
	return context.file;
};

export const useFolderLoading = () => {
	const context = useContext(FileContext);
	if (!context) throw new Error('useFolderLoading must be used within a FileProvider');
	return { isLoading: context.isLoading, error: context.error };
};

export const useFolderRefetch = () => {
	const context = useContext(FileContext);
	if (!context) throw new Error('useFolderRefetch must be used within a FileProvider');
	return context.refetch;
};