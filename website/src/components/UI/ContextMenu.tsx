import type { ContextMenuProps, ButtonProps } from '@/types/Components/UI';

/**
  * A component that renders a custom context menu positioned at specific screen coordinates.
  * @param {ContextMenuProps} props - The component props.
*/
function ContextMenu({ x, y, ref, children }: ContextMenuProps) {
	return (
		<div className="ctxmenu" ref={ref} style={{ top: `${y}px`, left: `${x}px`, zIndex: 20, position: 'absolute' }}>
			{children}
		</div>
	);
}

/**
  * A reusable button component designed for use within a context menu.
  * @param {ButtonProps} props - The component props.
*/
function Button({ onClick, children }: ButtonProps) {
	return (
		<button className="btn btn-ctx-menu" onClick={onClick}>
			{children}
		</button>
	);
}

ContextMenu.Button = Button;
export default ContextMenu;