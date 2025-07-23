import { authClient } from '@/auth/client';
import { useState } from 'react';
import InputField from '../Form/InputField';
import { useRouter } from 'next/router';

interface Props {
  modalRef: React.RefObject<HTMLDivElement | null>
}

export default function User2FAInputModal({ modalRef }: Props) {
	const [code, setCode] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault();
		const { error } = await authClient.twoFactor.verifyTotp({
			code,
		});

		if (error == null) {
			router.push('/files');
		}
	};

	return (
		<div className="modal fade show" id="User2FAInputModal" role="dialog" aria-hidden="true" ref={modalRef}>
			<div className="modal-dialog modal-dialog-centered modal-lg" role="document" style={{ maxWidth: '500px' }}>
				<div className="modal-content">
					<div className="modal-body">
						<InputField title="Enter 2FA Code" name="Enter 2FA Code" onChange={(e) => setCode(e.target.value)} />
						<button className="btn btn-primary" style={{ float:'right' }} onClick={handleSubmit}>Login</button>
					</div>
				</div>
			</div>
		</div>
	);
}