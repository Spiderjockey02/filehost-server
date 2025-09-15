import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '../UI/Card';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import React, { useState } from 'react';
import InputField from '../Form/InputField';
import { Config } from '@/types';
import axios from 'axios';

async function saveConfig(updated: Config): Promise<void> {
	const res = await fetch('/api/admin/config', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updated),
	});
	if (!res.ok) throw new Error('Failed to save config');
}

export default function AdminConfigCard() {
	const queryClient = useQueryClient();
	const [mimeTypeValue, setMimeTypeValue] = useState('');

	const { data: config, isLoading: loadingConfig } = useQuery({
		queryKey: ['config'],
		queryFn: async () => {
			const res = await fetch('/api/admin/config');
			if (!res.ok) throw new Error('Failed to fetch config');
			return res.json() as Promise<Config>;
		},
	});

	const { data: mimeTypes, isLoading: loadingMimes } = useQuery({
		queryKey: ['mime-types', mimeTypeValue],
		queryFn: async () => {
			const res = await fetch(`/api/admin/mime-types/search?query=${mimeTypeValue}`);
			if (!res.ok) throw new Error('Failed to fetch mime types');

			const d = await res.json();
			return d.list as string[];
		},
	});

	const mutation = useMutation({
		mutationFn: saveConfig,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['config'] });
		},
	});

	if (loadingConfig) return <p>Loading config...</p>;

	if (!config) return <p>Error: Config not found</p>;

	const handleInputChange = (key: keyof Config, value: any) => {
		config[key] = value;
	};

	const handleNestedChange = <K extends keyof Config, F extends keyof Config[K]>(
		key: K,
		field: F,
		value: any,
	) => {
		(config[key] as any)[field] = value;
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		mutation.mutate(config);
		console.log('Saved config:', config);

		try {
			await axios.post('/api/admin/config', config);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Card className='mb-4'>
			<Card.Header>
        Config Manager
			</Card.Header>
			<Card.Body>
				<form onSubmit={handleSave}>
					<InputField name="MAX_AVATAR_SIZE" title="Max Avatar Size (MB)" type="number" value={config.MAX_AVATAR_SIZE / (1024 ** 2)} onChange={(e) => handleInputChange('MAX_AVATAR_SIZE', parseInt(e.target.value) * (1024 ** 2))} />
					<InputField name="MAX_CHARS_FILE_NAME" title="Max Characters in File Name" type="number" value={config.MAX_CHARS_FILE_NAME} onChange={(e) => handleInputChange('MAX_CHARS_FILE_NAME', parseInt(e.target.value))} />

					<div className="mb-3">
						<label className="form-label">Disallowed MIME Types</label>
						<Select
							isMulti
							isLoading={loadingMimes}
							options={mimeTypes?.map((v) => ({ value: v, label: v })) || []}
							defaultValue={config.DISALLOWED_MIME_TYPES.map((v) => ({
								value: v,
								label: v,
							}))}
							onInputChange={(inputValue) => setMimeTypeValue(inputValue)}
							onChange={(vals) => handleInputChange('DISALLOWED_MIME_TYPES', vals.map((v) => v.value))}
						/>
					</div>

					<div className="mb-3">
						<label className="form-label">Invalid Characters in File Name</label>
						<CreatableSelect
							isMulti
							placeholder="Type and press enter..."
							defaultValue={config.INVALID_CHARS_IN_FILE_NAME.map((v) => ({
								value: v,
								label: v,
							}))}
							onChange={(vals) => handleInputChange('INVALID_CHARS_IN_FILE_NAME', vals.map((v) => v.value))}
						/>
					</div>
					<InputField title="Keep Original Metadata" name="KEEP_ORIGINAL_METADATA" type="checkbox" checked={config.KEEP_ORIGINAL_METADATA} onChange={(e) => handleInputChange('KEEP_ORIGINAL_METADATA', e.target.checked)} />
					<InputField name="FOLDER_SIZE" title="Folder Size (bytes)" type="number" value={config.FOLDER_SIZE} onChange={(e) => handleInputChange('FOLDER_SIZE', parseInt(e.target.value))} />
					<hr />
					<h5>Thumbnail Settings</h5>
					<div className="row">
						<div className='col-6'>
							<InputField title="Width" name="WIDTH" type="number" value={config.THUMBNAIL.WIDTH} onChange={(e) => handleNestedChange('THUMBNAIL', 'WIDTH', parseInt(e.target.value))} />
						</div>
						<div className='col-6'>
							<InputField title="Height" name="HEIGHT" type="number" value={config.THUMBNAIL.HEIGHT} onChange={(e) => handleNestedChange('THUMBNAIL', 'HEIGHT', parseInt(e.target.value))} />
						</div>
					</div>
					<hr />
					<h5>Retention Policy (days)</h5>
					{Object.entries(config.RETENTION_POLICY_IN_DAYS).map(([key, val]) => (
						<InputField key={key} name={key} title={key.replace(/_/g, ' ')} type="number" value={val} onChange={(e) => handleNestedChange('RETENTION_POLICY_IN_DAYS', key as keyof Config['RETENTION_POLICY_IN_DAYS'], parseInt(e.target.value))} />
					))}
					<button type="submit" className="btn btn-success">
						Save Changes
					</button>
				</form>
			</Card.Body>
		</Card>
	);
}
