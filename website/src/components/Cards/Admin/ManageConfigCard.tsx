import { CollapsibleCard, InputField } from '@/components';
import CreatableSelect from 'react-select/creatable';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import type { Config } from '@/types';
import Select from 'react-select';
import axios from 'axios';

export default function AdminManageConfigCard() {
	const [mimeTypeValue, setMimeTypeValue] = useState('');

	const { data: config, isLoading: loadingConfig, error: configError } = useQuery({
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
			if (!res.ok) throw new Error('Failed to fetch mime-types');

			const d = await res.json();
			return d.list as string[];
		},
	});

	const handleInputChange = <K extends keyof Config>(key: K, value: Config[K]) => {
		if (config) config[key] = value;
	};

	const handleNestedChange = <K extends keyof Config, F extends keyof Config[K]>(key: K, field: F, value: Config[K][F]) => {
		if (config) config[key][field] = value;
	};

	const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			await axios.post('/api/admin/config', config);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<CollapsibleCard className="mb-4">
			<CollapsibleCard.Header id="adminConfig">
				Config Manager
			</CollapsibleCard.Header>
			<CollapsibleCard.Body id="adminConfig">
				{configError == null ?
					loadingConfig || config == undefined ?
						Array.from({ length: 35 }, (_, i) => i).map((_) => (
							<div className="placeholder-glow" key={_}>
								<span className="placeholder col-12"></span>
							</div>
						))
						: <form onSubmit={handleSave}>
							<InputField name="MAX_AVATAR_SIZE" title="Max Avatar Size (MB)" type="number" value={config.MAX_AVATAR_SIZE / (1024 ** 2)} onChange={(e) => handleInputChange('MAX_AVATAR_SIZE', parseInt(e.target.value) * (1024 ** 2))} />
							<InputField name="MAX_CHARS_FILE_NAME" title="Max Characters in File Name" type="number" value={config.MAX_CHARS_FILE_NAME} onChange={(e) => handleInputChange('MAX_CHARS_FILE_NAME', parseInt(e.target.value))} />
							<div className="mb-3">
								<label className="form-label">Disallowed MIME Types</label>
								<Select isMulti isLoading={loadingMimes} options={mimeTypes?.map((v) => ({ value: v, label: v })) || []}
									defaultValue={config.DISALLOWED_MIME_TYPES.map((v) => ({ value: v, label: v }))}
									onInputChange={(inputValue) => setMimeTypeValue(inputValue)}
									onChange={(vals) => handleInputChange('DISALLOWED_MIME_TYPES', vals.map((v) => v.value))}
								/>
							</div>
							<div className="mb-3">
								<label className="form-label">Invalid Characters in File Name</label>
								<CreatableSelect isMulti placeholder="Type and press enter..." defaultValue={config.INVALID_CHARS_IN_FILE_NAME.map((v) => ({ value: v, label: v	}))}
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
							<hr />
							<h5>Rate limit</h5>
							{Object.entries(config.RATE_LIMIT).map(([key, val]) => (
								<InputField key={key} name={key} title={key.replace(/_/g, ' ')} type="number" value={val} onChange={(e) => handleNestedChange('RATE_LIMIT', key as keyof Config['RATE_LIMIT'], parseInt(e.target.value))} />
							))}
							<button type="submit" className="btn btn-success">
								Save Changes
							</button>
						</form>
					:
					<div className="alert alert-danger" role="alert">
						{configError.message}
					</div>
				}
			</CollapsibleCard.Body>
		</CollapsibleCard>
	);
}
