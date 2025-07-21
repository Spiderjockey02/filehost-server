import { PopupProps } from '@/types/Components/Toasts';

export default function SuccessPopup({ text }: PopupProps) {
	return (
		<div className="toast-container p-3 top-0 start-50 translate-middle-x" id="toastPlacement" data-original-class="toast-container p-3" style={{ color: '#051b11' }}>
			<div className="toast fade show" style={{ backgroundColor: '#75b798', border: '1px solid #407e61', minWidth: '50vw' }}>
				<div className="toast-body justify-content-between d-flex">
					<strong>Success - {text}!</strong>
					<button className="btn-close"></button>
				</div>
			</div>
		</div>
	);
}