import { TextViewerProps } from '@/types/Components/Views';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

export default function TextViewer({ path }: TextViewerProps) {
	const [fileContent, setFileContent] = useState('');

	const loadContent = useCallback(async () => {
		const controller = new AbortController();

		try {
			const { data } = await axios.get(path, { signal: controller.signal });
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

	return (
		<textarea rows={35} readOnly value={fileContent} style={{ width: '100%' }} />
	);
}