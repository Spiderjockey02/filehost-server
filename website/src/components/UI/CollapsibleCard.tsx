import type { GridLayoutProps } from '@/types/Components/Layout';
import type { CollapsibleIdProps } from '@/types/Components/UI';

function CollapsibleCard({ children, className, style }: GridLayoutProps) {
	return (
		<div className={`accordion ${className ?? ''}`} style={style}>
			<div className="accordion-item">
				{children}
			</div>
		</div>
	);
}

function Header({ children, id }: CollapsibleIdProps) {
	return (
		<h2 className="accordion-header" style={{ height: '50px' }}>
			<button className="accordion-button " type="button" data-bs-toggle="collapse" data-bs-target={`#${id}`} aria-expanded="true" aria-controls={id} style={{ backgroundColor: 'rgba(33, 37, 41, 0.03)', color: 'black', height: '50px' }}>
				<h5 className='d-flex flex-row align-items-center justify-content-between' style={{ margin: 0 }}>
					{children}
				</h5>
			</button>
		</h2>
	);
}

function Body({ children, className, style, id }: CollapsibleIdProps) {
	return (
		<div id={id} className="accordion-collapse collapse show">
			<div className={`accordion-body ${className ?? ''}`} style={style}>
				{children}
			</div>
		</div>
	);
}

CollapsibleCard.Header = Header;
CollapsibleCard.Body = Body;
export default CollapsibleCard;