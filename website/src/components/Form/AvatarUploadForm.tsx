import type { AvatarUploadFormProps } from '@/types/Components/Form';
import { useToast } from '../Hooks/ToastManager';
import Image from 'next/image';
import axios from 'axios';

export function AvatarUploadForm({ user }: AvatarUploadFormProps) {
	const { showToast } = useToast();

	// Upload new avatar
	const onAvatarUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		// Make sure only a single image file is uploaded
		const fileInput = e.target;
		if (!fileInput.files || fileInput.files.length != 1) return showToast('error', 'Please upload a single image file.');
		const file = fileInput.files[0];
		if (file.type.split('/')[0] !== 'image') return showToast('error', 'Please upload a single image file.');

		try {
			const formData = new FormData();
			formData.append('media', file);

			const { data } = await axios.post('/api/session/avatar/change', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			if (data.success) showToast('success', data.success);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while uploading avatar.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	// Delete avatar
	const deleteAvatar = async () => {
		try {
			const { data } = await axios.delete('/api/session/avatar/reset');
			if (data.success) showToast('success', data.success);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const message = err.response?.data?.error || err.message || 'An unexpected error occurred while deleting avatar.';
				showToast('error', message);
			} else {
				showToast('error', 'Unexpected error occurred');
			}
		}
	};

	return (
		<div className="d-flex flex-column align-items-center">
			<Image src={user?.image ?? `/avatar/${user?.id}`} width={100} height={100} className="rounded-circle" alt="User avatar" />
			<div className="d-flex justify-content-center gap-2 mt-2">
				<label className="btn btn-sm btn-primary">
          Upload Avatar
					<input type="file" hidden name="avatarFile" className="upload-input" onChange={onAvatarUploadChange} accept="image/*" />
				</label>
				<button className="btn btn-sm btn-danger" onClick={deleteAvatar}>
          Remove
				</button>
			</div>
		</div>
	);
}