import { GridLayoutProps } from '@/types/Components/Layout';

function Card({ children, style, className }: GridLayoutProps) {
	return (
		<div className={`card mb-4 ${className ?? ''}`} style={style}>
			{children}
		</div>
	);
}

export function Header({ children, style }: GridLayoutProps) {
	return (
		<h5 className="card-header d-flex flex-row align-items-center justify-content-between" style={{ height: '50px', ...style }}>
			{children}
		</h5>
	);
}

export function Body({ children, style, className }: GridLayoutProps) {
	return (
		<div className={`card-body ${className ?? ''}`} style={style}>
			{children}
		</div>
	);
}

Card.Header = Header;
Card.Body = Body;
export default Card;