import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { InfoPillProps } from '@/types/Components/UI';
import Card from './Card';

/**
  * A small, styled information card (or "pill") that displays a title, value, and icon.
  * @param {InfoPillProps} props - The component props.
*/
export default function InfoPill({ title, text, icon, colour, isLoading }: InfoPillProps) {
	const randomColor = colour ?? `#${Math.floor(Math.random() * 16777215).toString(16)}`;
	return (
		<Card className='shadow h-100' style={{ borderLeft: `.25rem solid ${randomColor}` }}>
			<Card.Body>
				<div className="row no-gutters align-items-center">
					<div className="col mr-2">
						<b className="text-xs fw-bold text-uppercase mb-1" style={{ color: randomColor }}>{title}</b>
						{isLoading ? (
							<>
								<br />
								<h4 className="placeholder col-2 h5 mb-0 fw-bold text-gray-800"></h4>
							</>
						) :
							<h4 className="h5 mb-0 fw-bold text-gray-800">{text}</h4>
						}
					</div>
					<div className="col-auto">
						<FontAwesomeIcon icon={icon} className="fa-2x" />
					</div>
				</div>
			</Card.Body>
		</Card>
	);
}
