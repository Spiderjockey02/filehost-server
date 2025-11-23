import ObjectOrientedPieChart from './ObjectOrientedPieChart';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import type { StringNumberObj } from '@/types';
import { Card } from '@/components';

export default function LanguageDistributionPieChart() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['languageDistribution'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/admin/users/language-codes', { signal });
			if (!res.ok) throw new Error(`Failed to fetch language distribution: ${res.statusText}`);

			const d = await res.json();
			return d.langaugeCodes as StringNumberObj;
		},
		...queryOptions,
	});

	return (
		<Card>
			<Card.Header>
        Language Distribution
			</Card.Header>
			<Card.Body className='d-flex justify-content-center'>
				{isLoading ? (
					<div className="placeholder-glow" style={{ height: '400px', width: '100%' }}>
						<span	className="placeholder col-10 my-1"	style={{ height: '400px', borderRadius: '0.25rem', width: '100%' }}></span>
					</div>
				) : error ? (
					<div className="alert alert-danger" role="alert">
						{error.message}
					</div>
				) : (
					<ObjectOrientedPieChart data={data ?? {}} />
				)}
			</Card.Body>
		</Card>
	);
}