import { ReactNode, Ref } from 'react';

interface Props {
  x: number
  y: number
  ref: Ref<HTMLDivElement>
  children: ReactNode
}

function ContextMenu({ x, y, ref, children }: Props) {
	return (
		<div className="ctxmenu" ref={ref} style={{ top: `${y}px`, left: `${x}px`, zIndex: 20, position: 'absolute' }}>
			{children}
		</div>
	);
}

interface ButtonProps {
  onClick?: () => void
  children: ReactNode
	BSToggle?: string
	BSTarget?: string
}

function Button({ onClick, children, BSToggle, BSTarget }: ButtonProps) {
	return (
		<button className="btn btn-ctx-menu" onClick={onClick} data-bs-toggle={BSToggle} data-bs-target={BSTarget}>
			{children}
		</button>
	);
}

ContextMenu.Button = Button;
export default ContextMenu;