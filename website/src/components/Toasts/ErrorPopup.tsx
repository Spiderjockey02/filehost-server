import { PopupProps } from '@/types/Components/Toasts';
import Link from 'next/link';

export default function ErrorPopup({ text }: PopupProps) {
	return (
		<div className="toast-container p-3 top-0 start-50 translate-middle-x" id="toastPlacement" data-original-class="toast-container p-3" style={{ color: '#2b0b0e' }}>
			<div className="toast fade show" style={{ backgroundColor: '#ea868f', border: '1px solid #842029', minWidth: '50vw' }}>
				<div className="toast-body justify-content-between d-flex">
					<span>
						<strong>Error - {text}!</strong> If this error keeps occurring, please contact <Link className='fw-bold' style={{ color: '#713f44' }} href="/contact-us"><b>support</b></Link>.
					</span>
					<button className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
				</div>
			</div>
		</div>
	);
}