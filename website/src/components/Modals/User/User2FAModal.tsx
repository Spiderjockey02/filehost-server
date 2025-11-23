import type { BaseModalProps } from '@/types/Components/Modals';
import { useToast } from '@/components/Hooks/ToastManager';
import { SyntheticEvent, useState } from 'react';
import InputField from '../../Form/InputField';
import { authClient } from '@/auth/client';
import { Modal } from 'react-bootstrap';
import QRCode from 'react-qr-code';

export default function User2FAModal({ show, onClose }: BaseModalProps) {
	const [password, setPassword] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const [code, setCode] = useState('');
	const { showToast } = useToast();
	const [data, setData] = useState({
		backupCodes: [] as string[],
		totpURI: '',
	});

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		if (password.length == 0) return setErrMsg('This field is missing.');
		try {
			const { data: info, error } = await authClient.twoFactor.enable({
				password: password,
			});

			if (error) return setErrMsg(`${error.message}`);
			if (info !== null) setData(info);
		} catch (err) {
			setErrMsg(`${err}`);
		}
	};

	const verifyCode = async (e: SyntheticEvent) => {
		e.preventDefault();

		if (code.length == 0) return setErrMsg('This field is missing.');
		if (/^\d{6}$/.test(code) == false) return setErrMsg('Code must be exactly 6 digits.');

		try {
			const { data: info, error } = await authClient.twoFactor.verifyTotp({
				code: code,
			});

			if (error) return setErrMsg(`${error.message}`);
			if (info) showToast('success', 'Successfully setup 2fa');
			onClose();
		} catch (err) {
			setErrMsg(`${err}`);
		}
	};

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Header closeButton>
				<Modal.Title>
          Enable 2 Factor Authentication
				</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{data.backupCodes.length == 0 ?
					<InputField title="Current Password" name="Current Password" type="password" autocomplete='current-password' onChange={(e) => setPassword(e.target.value)} errorMsg={errMsg} />
				 :
					<>
						<div className="text-center">
							<h5 className="fw-semibold">Backup Codes</h5>
							<div className="rounded">
								<div className="d-flex flex-wrap justify-content-center gap-3">
									{data.backupCodes.map((txt, index) => (
										<div key={index} className="px-3 py-1 border rounded bg-white fw-semibold" style={{ minWidth: '120px', textAlign: 'center' }}>
											<code>{txt}</code>
										</div>
									))}
								</div>
							</div>
						</div>
						{data.totpURI && (
							<div className="text-center my-4">
								<QRCode value={data.totpURI} size={160} />
								<p className="mt-2 text-muted small">
        					Scan this QR code with your 2FA app to enable authentication.
								</p>
							</div>
						)}
						<div className="mt-2">
							<InputField title="Verification Code" name="code" placeholder="Enter code from your app" autocomplete='off' onChange={(e) => setCode(e.target.value)} errorMsg={errMsg} />
						</div>
					</>
				}
			</Modal.Body>
			<Modal.Footer>
				{data.backupCodes.length == 0 ?
					<button className="btn btn-primary" onClick={handleSubmit}>Generate Backup Codes</button>
					: <button className="btn btn-primary" onClick={verifyCode}>Verify code</button>
				}
			</Modal.Footer>
		</Modal>
	);
}