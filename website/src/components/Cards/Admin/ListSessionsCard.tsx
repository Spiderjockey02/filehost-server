import type { AdminListSessionsCardProps } from '@/types/Components/Card';
import SessionTable from '@/components/Tables/SessionTable';
import { Card } from '@/components';

export default function AdminListSessionsCard({ userId, isAdmin }: AdminListSessionsCardProps) {
	return (
		<Card className='mb-4'>
			<Card.Header>
        Active Sessions
			</Card.Header>
			<Card.Body className='table-responsive' style={{ overflowY: 'scroll', maxHeight: '75vh' }}>
				<SessionTable userId={userId} isAdmin={isAdmin} />
			</Card.Body>
		</Card>
	);
}