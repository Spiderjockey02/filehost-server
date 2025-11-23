import type { ControlledModalProps } from '@/types/Components/Modals';
import InputField from '../../Form/InputField';
import { authClient } from '@/auth/client';
import { useRouter } from 'next/router';
import { Modal } from 'react-bootstrap';
import { useState } from 'react';

export default function User2FAInputModal({ setShow, show }: ControlledModalProps) {
	const [code, setCode] = useState('');
	const [errMsg, setErrMsg] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		// First make sure the entered code is exactly 6 digits
		if (/^\d{6}$/.test(code) == false) return setErrMsg('Code must be exactly 6 digits.');

		try {
			const { error } = await authClient.twoFactor.verifyTotp({	code });
			if (error) return setErrMsg(`${error.message}`);
			if (error == null) router.push('/files');
		} catch (err) {
			setErrMsg(`${err}`);
		}
	};

	return (
		<Modal onHide={() => setShow(false)} show={show} centered>
			<Modal.Body>
				<InputField title="Enter 2FA Code" name="Enter 2FA Code" onChange={(e) => setCode(e.target.value)} autocomplete='off' errorMsg={errMsg} />
			</Modal.Body>
			<Modal.Footer>
				<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
				<button className="btn btn-primary" onClick={handleSubmit}>Login</button>
			</Modal.Footer>
		</Modal>
	);
}