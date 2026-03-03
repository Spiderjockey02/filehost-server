import React, { createContext, useContext, useMemo, useState } from 'react';
import type { sortKeyTypes, SortOrder } from '@/types/Components/Tables';
import type { FileContextType } from '@/types/Components/Hooks';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import API from '@/services/api';

const FileContext = createContext<FileContextType | undefined>(undefined);
export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const router = useRouter();
	const path = (router.query.files as string[] | undefined) ?? [];

	// Handle sorting of folder children
	const [sortBy, setSortBy] = useState<sortKeyTypes>('Name');
	const [sortDir, setSortDir] = useState<SortOrder>('ascn');
	const toggleSortDir = () => setSortDir(prev => (prev === 'ascn' ? 'dscn' : 'ascn'));

	// Fetch files
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['folder', path],
		queryFn: async ({ signal }) => {
			return API.FILE.fetch(signal, path.join('/'));
		},
		enabled: router.isReady && router.pathname.startsWith('/files'),
	});

	// Compute sorted children ONLY when needed
	const sortedFile = useMemo(() => {
		if (!data) return null;
		if (!sortBy || !data.children) return data;
		const isAscending = sortDir === 'ascn';

		const sortedChildren = [...data.children].sort((a, b) => {
			switch (sortBy) {
				case 'Name':
					return isAscending ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
				case 'Size':
					if (a.type === 'DIRECTORY' && b.type === 'DIRECTORY') {
						return isAscending ? a._count.children - b._count.children
							: b._count.children - a._count.children;
					}

					if (a.type === 'FILE' && b.type === 'FILE') return isAscending ? a.size - b.size : b.size - a.size;
					return a.type === 'DIRECTORY' ? -1 : 1;
				case 'Date_Mod': {
					const dateA = new Date(a.createdAt).getTime();
					const dateB = new Date(b.createdAt).getTime();
					return isAscending ? dateA - dateB : dateB - dateA;
				}
				default:
					return 0;
			}
		});

		// Return same file but with sorted children
		return { ...data, children: sortedChildren };
	}, [data, sortBy, sortDir]);


	return (
		<FileContext.Provider
			value={{
				file: sortedFile,
				isLoading,
				error,
				refreshFolder: refetch,
				sortBy,
				sortDir,
				setSortBy,
				toggleSortDir,
			}}
		>
			{children}
		</FileContext.Provider>
	);
};

export default function useManageFolder() {
	const context = useContext(FileContext);
	if (!context) throw new Error('useFolder must be used within FileProvider');
	return context;
}