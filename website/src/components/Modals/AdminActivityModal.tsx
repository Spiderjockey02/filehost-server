import { formatBytes } from '@/utils/functions';
import { UserActivity } from '@prisma/client';
import Link from 'next/link';

interface Props {
  activity: UserActivity
}

export default function AdminActivityModal({ activity }: Props) {
	return (
		<div className="modal fade" id={`${new Date(activity.createdAt).getTime()}`} role="dialog" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered modal-lg" role="document">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Activity Details</h5>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						<div className="mb-3">
							<span className="badge bg-primary me-2">{activity.method}</span>
							<span className="text-muted">{activity.endpoint}</span>
						</div>
						<div className="row g-3 h-100">
							<div className="col-md-6 h-100">
								<div className="card">
									<div className="card-body">
										<h5 className="card-title fw-bold">Request Info</h5>
										<p className="mb-1"><strong>Status: </strong>{activity.statusCode}</p>
										<p className="mb-1"><strong>Duration: </strong>{activity.durationMs} ms</p>
										<p className="mb-1"><strong>Incoming: </strong>{formatBytes(activity.incomingBytes)}</p>
										<p className="mb-0"><strong>Outgoing: </strong>{formatBytes(activity.outgoingBytes)}</p>
									</div>
								</div>
							</div>
							<div className="col-md-6 h-100">
								<div className="card">
									<div className="card-body">
										<h5 className="card-title fw-bold">User Info</h5>
										<p className="mb-1"><strong>User ID: </strong><Link href={`/admin/users/${activity.userId}`}>{activity.userId}</Link></p>
										<p className="mb-1"><strong>IP Address: </strong> {activity.ipAddress}</p>
										<p className="mb-0"><strong>Timestamp: </strong> {new Date(activity.createdAt).toLocaleString()}</p>
									</div>
								</div>
							</div>
							<div className="col-12">
								<div className="card">
									<div className="card-body">
										<h5 className="card-title fw-bold">User Agent</h5>
										<p className="mb-0"><code className="small">{activity.userAgent}</code></p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}