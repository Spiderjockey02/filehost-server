import ObjectOrientedPieChart from './ObjectOrientedPieChart';
import { queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components';
import API from '@/services/api';

export default function LanguageDistributionPieChart() {
	const { data, isLoading, error } = useQuery({
		queryKey: ['languageDistribution'],
		queryFn: async ({ signal }) => {
			return API.ADMIN.fetchLanguageDistribution(signal);
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