import type { ContextMenuProps, ButtonProps } from '@/types/Components/UI';

function ContextMenu({ x, y, ref, children }: ContextMenuProps) {
	return (
		<div className="ctxmenu" ref={ref} style={{ top: `${y}px`, left: `${x}px`, zIndex: 20, position: 'absolute' }}>
			{children}
		</div>
	);
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