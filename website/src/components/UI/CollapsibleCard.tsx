import type { GridLayoutProps } from '@/types/Components/Layout';
import type { CollapsibleIdProps } from '@/types/Components/UI';

function CollapsibleCard({ children }: GridLayoutProps) {
	return (
		<div className="accordion">
			<div className="accordion-item">
				{children}
			</div>
		</div>
	);
}

function Header({ children, id }: CollapsibleIdProps) {
	return (
		<h2 className="accordion-header">
			<button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#${id}`} aria-expanded="true" aria-controls={id} style={{ backgroundColor: 'rgba(33, 37, 41, 0.03)', color: 'black' }}>
        	{children}
			</button>
		</h2>
	);
}

function Body({ children, id }: CollapsibleIdProps) {
	return (
		<div id={id} className="accordion-collapse collapse show">
			<div className="accordion-body">
				{children}
			</div>
		</div>
	);
}

CollapsibleCard.Header = Header;
CollapsibleCard.Body = Body;
export default CollapsibleCard;