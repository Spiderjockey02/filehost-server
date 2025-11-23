import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { TextViewerProps } from '@/types/Components/Views';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export default function TextViewer({ path }: TextViewerProps) {
	const [fileContent, setFileContent] = useState('');

	const loadContent = useCallback(async () => {
		const controller = new AbortController();

		try {
			const { data } = await axios.get(path, {
				signal: controller.signal,
				responseType: 'text',
			});
			setFileContent(data);
		} catch (err) {
			console.log(err);
			setFileContent('Failed to load content');
		}

		return () => controller.abort();
	}, [path]);

	useEffect(() => {
		loadContent();
	}, [loadContent]);

	const getLanguageFromPath = (fileName: string) => {
		if (fileName.endsWith('.json')) return 'json';
		if (fileName.endsWith('.js')) return 'javascript';
		if (fileName.endsWith('.ts')) return 'typescript';
		if (fileName.endsWith('.css')) return 'css';
		if (fileName.endsWith('.html')) return 'html';
		if (fileName.endsWith('.md')) return 'markdown';
		return 'text';
	};

	return (
		<SyntaxHighlighter
			language={getLanguageFromPath(path)}
			wrapLines={true}
			showLineNumbers={true}
		>
			{fileContent}
		</SyntaxHighlighter>
	);
}