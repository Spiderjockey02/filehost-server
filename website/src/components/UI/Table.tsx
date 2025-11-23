import { PaginationFooterProps } from '@/types/Components/Tables';
import { TableProps } from '@/types/Components/UI';

/**
  * A component that renders a styled table element.
  * @param {TableProps} props - The component props.
*/
function Table({ children, id, className, style }: TableProps) {
	return (
		<table className={`table ${className ?? ''}`} id={id} style={style}>
			{children}
		</table>
	);
}

/**
  * A component that renders the header row of a table.
  * @param {TableProps} props - The component props.
*/
function HeaderRow({ children }: TableProps) {
	return (
		<thead>
			<tr>
				{children}
			</tr>
		</thead>
	);
}

/**
 * A component that renders a single header cell (<th>) in a table.
  * @param {TableProps} props - The component props.
*/
function Header({ children, id, className, style, onClick }: TableProps) {
	return (
		<th id={id} className={className} style={style} onClick={onClick}>
			{children}
		</th>
	);
}

/**
  * A component that renders the body (<tbody>) of a table.
  * @param {TableProps} props - The component props.
*/
function Body({ children, id, className, style }: TableProps) {
	return (
		<tbody id={id} className={className} style={style}>
			{children}
		</tbody>
	);
}

/**
  * A component that renders a pagination footer for tables, showing the current page range and navigation controls for switching between pages.
  * @param {PaginationFooterProps} props - The component props.
*/
function PaginationFooter({ isLoading, total = 0, page, setPage }: PaginationFooterProps) {
	return (
		<div className="d-flex flex-row align-items-center justify-content-between">
			<div className="d-flex align-items-center">
				{isLoading ?
					<div className="placeholder-glow">
						<span className="placeholder" style={{ width: '170px' }}></span>
					</div>
					:
					<p className="mb-0">
            Showing {page * 20} to {Math.min((page + 1) * 20, total)} out of {total}
					</p>
				}
			</div>
			{total > 20 ?
				<nav aria-label="Page navigation" style={{ height: '36px' }}>
					<ul className="pagination">
						<li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
							<button className="page-link" onClick={() => setPage(Math.max(1 - 1, 0))} aria-label="Previous">
								<span aria-hidden="true">&laquo;</span>
							</button>
						</li>
						<li className="page-item">
							<button className="page-link" onClick={() => setPage(0)}>{1}</button>
						</li>
						<li className="page-item disabled">
							<span className="page-link">{page + 1}</span>
						</li>
						<li className="page-item">
							<button className="page-link" onClick={() => setPage(Math.floor(total / 20))}>{Math.floor(total / 20) + 1}</button>
						</li>
						<li className={`page-item ${page == Math.floor(total / 20) ? 'disabled' : ''}`}>
							<button className="page-link" onClick={() => setPage(Math.min(page + 1, 20))} aria-label="Next">
								<span aria-hidden="true">&raquo;</span>
							</button>
						</li>
					</ul>
				</nav>
				: null
			}
		</div>
	);
}

Table.Header = Header;
Table.HeaderRow = HeaderRow;
Table.Body = Body;
Table.PaginationFooter = PaginationFooter;
export default Table;