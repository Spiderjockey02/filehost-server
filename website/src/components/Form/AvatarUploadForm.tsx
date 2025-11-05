import { SettingErrorTypes } from '@/types';
import type { User } from 'better-auth';
import Image from 'next/image';

interface Props {
  user: User | null
  setSuccess: (msg: string) => void
  setErrors: (errs: SettingErrorTypes[]) => void
}

export function AvatarUploadForm({ user, setSuccess, setErrors }: Props) {
	// Upload new avatar
	const onAvatarUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		// Make sure only a single image file is uploaded
		const fileInput = e.target;
		if (!fileInput.files || fileInput.files.length != 1) return setErrors([{ type: 'av', text: 'Please upload a single image file.' }]);
		const file = fileInput.files[0];
		if (file.type.split('/')[0] !== 'image') return setErrors([{ type: 'av', text: 'Please upload a single image file.' }]);

		try {
			const formData = new FormData();
			formData.append('media', file);

			const res = await fetch('/api/session/avatar/change', {
				method: 'POST',
				body: formData,
			});
			const data = await res.json();
			if (data.success) setSuccess(data.success);
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'av', text: 'Failed to upload avatar' }]);
		}
	};

	// Delete avatar
	const deleteAvatar = async () => {
		try {
			const res = await fetch('/api/session/avatar/reset', { method: 'DELETE' });
			const data = await res.json();
			if (data.success) setSuccess(data.success);
		} catch (err) {
			console.log(err);
			setErrors([{ type: 'av', text: 'Failed to delete avatar' }]);
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