import { authClient } from '@/auth/client';
import { SyntheticEvent, useState } from 'react';
import QRCode from 'react-qr-code';
import InputField from '../Form/InputField';

export default function User2FAModal() {
	const [password, setPassword] = useState('');
	const [code, setCode] = useState('');
	const [data, setData] = useState<{
		backupCodes: string[];
		totpURI: string;
	}>({
		backupCodes: [],
		totpURI: '',
	});

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();

		const { data: info, error } = await authClient.twoFactor.enable({
			password: password,
		});
		if (info !== null) setData(info);
		console.log(error);
	};

	const verifyCode = async (e: SyntheticEvent) => {
		e.preventDefault();
		const { data: info, error } = await authClient.twoFactor.verifyTotp({
			code: code,
		});
		console.log(info, error);
	};

	return (
		<div className="modal fade" id="User2FAModal" role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5" id="exampleModalLabel">Search for file</h1>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						{data.backupCodes.length == 0 ? (
							<>
								<InputField title={'Password'} name={'password'} onChange={(e) => setPassword(e.target.value)}/>
								<button className="btn btn-primary" onClick={handleSubmit}>Generate Backup Codes</button>
							</>
						) :
							<>
								<p>Backup Codes:</p>
								<ul>
									{data.backupCodes.map((txt, index) => (
										<li key={index}>{txt}</li>
									))}
								</ul>
								{data.totpURI ? <QRCode value={data.totpURI || ''} /> : null}
                verify your 2FA app with the QR code above.
								<InputField title={'Code'} name={'code'} onChange={(e) => setCode(e.target.value)}/>
								<button onClick={verifyCode}>Verify code</button>
							</>
						}
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
						<button type="submit" className="btn btn-primary">Search</button>
					</div>
				</div>
			</div>
		</div>
	);
}