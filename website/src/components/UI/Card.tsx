import { GridLayoutProps } from '@/types/Components/Layout';

/**
  * A wrapper component that renders a card.
  * @param {GridLayoutProps} props - The component props.
*/
function Card({ children, style, className }: GridLayoutProps) {
	return (
		<div className={`card mb-2 ${className ?? ''}`} style={style}>
			{children}
		</div>
	);
}

/**
  * A wrapper component that renders a card header.
  * @param {GridLayoutProps} props - The component props.
*/
function Header({ children, style }: GridLayoutProps) {
	return (
		<h5 className="card-header d-flex flex-row align-items-center justify-content-between" style={{ height: '50px', ...style }}>
			{children}
		</h5>
	);
}

/**
  * A wrapper component that renders a card title.
  * @param {GridLayoutProps} props - The component props.
*/
function Title({ children, style }: GridLayoutProps) {
	return (
		<h5 className="card-title fw-bold d-flex flex-row align-items-center justify-content-between" style={style}>
			{children}
		</h5>
	);
}

/**
  * A wrapper component that renders a card body.
  * @param {GridLayoutProps} props - The component props.
*/
function Body({ children, style, className }: GridLayoutProps) {
	return (
		<div className={`card-body ${className ?? ''}`} style={style}>
			{children}
		</div>
	);
}

Card.Header = Header;
Card.Title = Title;
Card.Body = Body;
export default Card;