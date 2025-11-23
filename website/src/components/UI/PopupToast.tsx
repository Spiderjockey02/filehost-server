import { Toast, ToastContainer } from 'react-bootstrap';
import { useToast } from '../Hooks/ToastManager';
import Link from 'next/link';

export default function PopupToast() {
	const { toast, hideToast } = useToast();
	if (!toast.visible) return null;

	if (toast.type == 'success') {
		return (
			<ToastContainer className="p-3 top-0 start-50 translate-middle-x" position='top-center' style={{ color: '#051b11' }}>
				<Toast bg="success" show={true} onClose={hideToast} style={{ backgroundColor: '#75b798', border: '1px solid #407e61', minWidth: '50vw' }}>
					<Toast.Body className='justify-content-between d-flex'>
						<strong>Success - {toast.message}!</strong>
						<button className="btn-close" onClick={hideToast}></button>
					</Toast.Body>
				</Toast>
			</ToastContainer>
		);
	} else {
		return (
			<ToastContainer className="p-3 top-0 start-50 translate-middle-x" position='top-center' style={{ color: '#2b0b0e' }}>
				<Toast bg="danger" show={true} onClose={hideToast} style={{ backgroundColor: '#ea868f', border: '1px solid #842029', minWidth: '50vw' }}>
					<Toast.Body className='justify-content-between d-flex'>
						<span>
							<strong>Error - {toast.message}</strong> If this error keeps occurring, please contact <Link className='fw-bold' style={{ color: '#713f44' }} href="/contact-us"><b>support</b></Link>.
						</span>
						<button className="btn-close" onClick={hideToast}></button>
					</Toast.Body>
				</Toast>
			</ToastContainer>
		);
	}
}