import { PaginationFooterProps } from '@/types/Components/Tables';
import { TableProps } from '@/types/Components/UI';

function Table({ children, id, className, style }: TableProps) {
	return (
		<table className={`table ${className ?? ''}`} id={id} style={style}>
			{children}
		</table>
	);
}

function HeaderRow({ children }: TableProps) {
	return (
		<thead>
			<tr>
				{children}
			</tr>
		</thead>
	);
}

function Header({ children, id, className, style, onClick }: TableProps) {
	return (
		<th id={id} className={className} style={style} onClick={onClick}>
			{children}
		</th>
	);
}

function Body({ children, id, className, style }: TableProps) {
	return (
		<tbody id={id} className={className} style={style}>
			{children}
		</tbody>
	);
}

function PaginationFooter({ isLoading, total = 0, page, setPage }: PaginationFooterProps) {
	return (
		<div className="d-flex flex-row align-items-center mt-3 justify-content-between">
			<div className="d-flex align-items-center mb-2">
				{isLoading ?
					<div className="placeholder-glow">
						<span className="placeholder" style={{ width: '170px' }}></span>
					</div>
					:
					<p className="mb-0 me-2">
            Showing {page * 20} to {Math.min((page + 1) * 20, total)} out of {total}
					</p>
				}
			</div>
			{total > 20 ?
				<nav aria-label="Page navigation">
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