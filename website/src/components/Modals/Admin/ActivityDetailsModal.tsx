import type { AdminActivityDetailsModalProps } from '@/types/Components/Modals';
import { formatBytes } from '@/utils/functions';
import { Col, Row, Card } from '@/components';
import { Modal } from 'react-bootstrap';
import Link from 'next/link';

export default function AdminActivityDetailsModal({ activity, show, onClose }: AdminActivityDetailsModalProps) {
	return (
		<Modal show={show} onHide={onClose} centered>
  		<Modal.Header closeButton>
  			<Modal.Title>Modal title</Modal.Title>
  		</Modal.Header>
  		<Modal.Body>
				<div className="mb-3">
					<span className="badge bg-primary me-2">{activity.method}</span>
					<span className="text-muted">{activity.endpoint}</span>
				</div>
				<Row className='g-3 h-100'>
					<Col md={6}>
						<Card className='h-100'>
							<Card.Body>
								<Card.Title>Request Info</Card.Title>
								<p className="mb-1"><strong>Status: </strong>{activity.statusCode}</p>
								<p className="mb-1"><strong>Duration: </strong>{activity.durationMs} ms</p>
								<p className="mb-1"><strong>Incoming: </strong>{formatBytes(activity.incomingBytes)}</p>
								<p className="mb-0"><strong>Outgoing: </strong>{formatBytes(activity.outgoingBytes)}</p>
							</Card.Body>
						</Card>
					</Col>
					<Col md={6}>
						<Card className='h-100'>
							<Card.Body>
								<Card.Title>User Info</Card.Title>
								<p className="mb-1"><strong>User ID: </strong><Link href={`/admin/users/${activity.userId}`}>{activity.userId}</Link></p>
								<p className="mb-1"><strong>IP Address: </strong> {activity.ipAddress}</p>
								<p className="mb-0"><strong>Timestamp: </strong> {new Date(activity.createdAt).toLocaleString()}</p>
							</Card.Body>
						</Card>
					</Col>
					<Col>
						<Card>
							<Card.Body>
								<Card.Title>User Agent</Card.Title>
								<code className="small">{activity.userAgent}</code>
							</Card.Body>
						</Card>
					</Col>
				</Row>
			</Modal.Body>
		</Modal>
	);
}