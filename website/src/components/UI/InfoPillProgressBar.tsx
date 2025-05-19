import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { InfoPillProgressProps } from '@/types/Components/UI';
import Card from './Card';

export default function InfoPillProgress({ title, text, icon, colour, max, current = 0 }: InfoPillProgressProps) {
	const randomColor = colour ?? `#${Math.floor(Math.random() * 16777215).toString(16)}`;

	return (
		<Card className='shadow h-75' style={{ borderLeft: `.25rem solid ${randomColor}` }}>
			<Card.Body>
				<div className="row no-gutters align-items-center">
  				<div className="col mr-2">
						<b className="text-xs fw-bold text-uppercase mb-1" style={{ color: randomColor }}>{title}</b>
  					<div className="row align-items-center">
  						<div className="col-auto">
  							<h5 className="mb-0 mr-3 fw-bold text-gray-800">{text}</h5>
  						</div>
  						<div className="col">
  							<div className="progress progress-sm">
  								<div className="progress-bar bg-info" role="progressbar" style={{ width: `${(current / max) * 100}%` }} aria-valuenow={current} aria-valuemin={0}	aria-valuemax={max}>
  									{Math.round((current / max) * 100)}%
  								</div>
  							</div>
  						</div>
  					</div>
  				</div>
  				<div className="col-auto">
  					<FontAwesomeIcon icon={icon} className="fa-2x" />
  				</div>
  			</div>
			</Card.Body>
		</Card>
	);
}
