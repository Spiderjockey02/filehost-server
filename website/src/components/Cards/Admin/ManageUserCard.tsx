import { getStatusColor, formatBytes, queryOptions } from '@/utils/functions';
import { faDiscord, faGoogle } from '@fortawesome/free-brands-svg-icons';
import type { AdminManageUserCardProps } from '@/types/Components/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AdminBanUserModal } from '@/components/Modals';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row } from '@/components';
import API from '@/services/api';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminManageUserCard({ isLoading, user, bannedStatus, isCurrentUser }: AdminManageUserCardProps) {
	const [activeModal, setActiveModal] = useState<string | null>(null);

	const { data } = useQuery({
		queryKey: ['userAccounts', user?.id],
		queryFn: async ({ signal }) => API.ADMIN.fetchUserAccounts(signal, user!.id),
		...queryOptions,
	});

	return (
		<Card className='mb-4'>
			<Card.Body>
				<div className="d-flex align-items-center mb-3">
					<Image
						src={user?.image ?? `/avatar/${user?.id}`}
						alt="User Avatar"
						className="rounded-circle me-3"
						width={60}
						height={60}
						style={{ objectFit: 'cover', border: '1px solid #ddd' }}
					/>
					{isLoading || user == null ? (
						<div className="flex-grow-1">
							<h5 className="card-title mb-1 placeholder col-7"></h5>
							<p className="card-subtitle text-muted placeholder col-7"></p>
						</div>
					) : (
						<div className="flex-grow-1">
							<h5 className="card-title mb-1">{user.name}</h5>
							<p className="card-subtitle text-muted">{user.email}</p>
						</div>
					)}
					<span className={`badge text-uppercase ${
						user?.role === 'admin' ? 'bg-danger' : 'bg-secondary'
					}`}>
						{user?.role}
					</span>
				</div>

				<ul className="list-unstyled mt-3 mb-2 small">
					<li><strong>Language: </strong>{isLoading || user == null ? <span className='placeholder col-1'></span> : user.languageCode}</li>
					<li><strong>Plan: </strong>{isLoading || user == null ? <span className='placeholder col-1'></span> : user.plan.name}</li>
					<li>
						<strong>Email Verified: </strong>
						{isLoading || user == null ? <span className='placeholder col-1'></span> :
							<span className={user?.emailVerified ? 'text-success' : 'text-danger'}>
								{user?.emailVerified ? 'Yes' : 'No'}
							</span>
						}
					</li>
					<li>
						<strong>Account Status: </strong>
						{isLoading || user == null ? <span className='placeholder col-1'></span> :
							bannedStatus !== null ? (
								<span className="text-danger">Banned ({new Intl.DateTimeFormat('en-GB', {
									dateStyle: 'full',
								}).format(new Date(bannedStatus.expiresAt))})</span>
							) : (
								<span className="text-success">Active</span>
							)
						}
					</li>
					<li>
						<strong>2FA Status: </strong>
						{isLoading || user == null ? <span className='placeholder col-1'></span> :
							data?.accounts.find(a => a.providerId == 'credential') == null ?
								<span className="text-warning">Not required</span> :
								user.twoFactorEnabled ?
									<span className="text-success">Enabled</span> :
									<span className="text-danger">Disabled</span>
						}
					</li>
				</ul>
				<div className="mb-2">
					<label className="form-label mb-1 small"><strong>Storage Used:</strong></label>
					{isLoading || user == null ?
						<>
							<span className='placeholder col-12'></span>
							<div className="text-muted small mt-1">
								<span className='placeholder col-3'></span>
							</div>
						</>
						:	<>
							<div className="progress" style={{ height: '8px' }}>
								<div
									className={`progress-bar ${getStatusColor(user?.totalStorageSize, user?.plan.maxStorageSize)}`}
									role="progressbar"
									style={{ width: `${(user?.totalStorageSize / (user?.plan.maxStorageSize ?? 1)) * 100}%` }}
									aria-valuenow={user?.totalStorageSize}
									aria-valuemin={0}
									aria-valuemax={user?.plan.maxStorageSize}
								></div>
							</div>
							<div className="text-muted small mt-1">
								{formatBytes(user?.totalStorageSize)} / {formatBytes(user?.plan.maxStorageSize)}
							</div>
						</>
					}
				</div>

				<div className="text-muted small">
					{isLoading || user == null ? <p className="mb-0">Created: <span className='placeholder col-4'></span></p> :
						<p className="mb-0">Created: {new Intl.DateTimeFormat('en-GB', {
							dateStyle: 'full',
							timeStyle: 'long',
						}).format(new Date(user.createdAt))}</p>
					}

					{isLoading || user == null ? <p className="mb-0">Updated: <span className='placeholder col-4'></span></p> :
						<p>Updated: {new Intl.DateTimeFormat('en-GB', {
							dateStyle: 'full',
							timeStyle: 'long',
						}).format(new Date(user.updatedAt))}</p>
					}
				</div>
				<Row>
					<Col lg={6}>
						<strong>Accounts linked: </strong>
						<br />
						{data?.accounts.map(a => (
							<>
								{formatProvider(a.providerId)}
								&nbsp;
							</>
						))}
					</Col>
					<Col lg={6}>
						<strong>Actions: </strong>
						{isLoading || user == null ?
							<span className='placeholder col-1'></span> : (
								<>
									<br />
									<button className={`btn btn-${isCurrentUser ? '' : 'outline-'}danger`} disabled={isCurrentUser} onClick={() => setActiveModal('banUser')}>Ban</button>
									{activeModal == 'banUser' && <AdminBanUserModal userId={user.id} show={true} onClose={() => setActiveModal(null)} />}
								</>
							)}

					</Col>
				</Row>
			</Card.Body>
		</Card>
	);
}

function formatProvider(provider: string) {
	switch(provider) {
		case 'discord':
			return <Link href="https://discord.com" className='btn btn-outline-secondary'><FontAwesomeIcon icon={faDiscord} /></Link>;
		case 'google':
			return <Link href="https://google.com" className='btn btn-outline-secondary'><FontAwesomeIcon icon={faGoogle} /></Link>;
		case 'credential':
			return <span className='btn btn-outline-secondary'>Email</span>;
		default:
			return provider;
	}
}