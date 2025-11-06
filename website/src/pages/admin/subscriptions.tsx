import { authClient } from '@/auth/client';
import { Row, Col, InfoPill, Card, Table } from '@/components';
import AdminCustomerTrend from '@/components/Graphs/AdminCustomerTrends';
import AdminAddNewPlanModal from '@/components/Modals/AdminAddNewPlan';
import AdminEditPlanModal from '@/components/Modals/AdminEditPlan';
import AdminLayout from '@/layouts/admin';
import { formatBytes, headers, queryOptions } from '@/utils/functions';
import { faAdd, faDollar, faDownload, faHardDrive, faPen, faUserTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Plan } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { User } from 'better-auth';
import { GetServerSidePropsContext } from 'next';

interface Props {
	stats: {
		payingUsers: number
		newCustomers: number
		mostPopular: number
	}
}

export default function AdminSystemPage({ stats }: Props) {
	const { data: session } = authClient.useSession();
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['plans'],
		queryFn: async ({ signal }) => {
			const res = await fetch('/api/plans', { signal });
			if (!res.ok) throw new Error(`Failed to fetch recent activity: ${res.statusText}`);

			const d = await res.json();
			return d as { plans: Plan[] };
		},
		...queryOptions,
	});

	if (session == null) return null;
	return (
		<AdminLayout activeTab='subscriptions' user={session.user as User} tabName='Admin Subscriptions'>
      &nbsp;
			<div className="d-sm-flex align-items-center justify-content-between mb-4">
				<h1 className="h3 mb-0 text-gray-800">Subscriptions Dashboard</h1>
				<button className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm">
					<FontAwesomeIcon icon={faDownload} /> Generate Report
				</button>
			</div>
			<Row>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Total earnings" text={`${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL}???`} icon={faDollar} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Active Subscribers" text={stats.payingUsers} icon={faUserTag} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="New Subscribers (30 days)" text={stats.newCustomers} icon={faHardDrive} />
				</Col>
				<Col xl={3} md={6} className="mb-4">
					<InfoPill title="Most Popular Plan" text={stats.mostPopular} icon={faHardDrive} />
				</Col>
			</Row>
			<AdminCustomerTrend />
			<Card>
				<Card.Header>
					Plans
					<button className='btn btn-success' data-bs-toggle="modal" data-bs-target="#AdminAddNewPlanModal">
						<FontAwesomeIcon icon={faAdd} />
						Add Plan
					</button>
				</Card.Header>
				<Card.Body className='table-responsive'>
					<Table>
						<Table.HeaderRow>
							<Table.Header>Name</Table.Header>
							<Table.Header>Max storage</Table.Header>
							<Table.Header>Max file</Table.Header>
							<Table.Header>File rentention</Table.Header>
							<Table.Header>Price</Table.Header>
							<Table.Header className='text-center'>Edit</Table.Header>
						</Table.HeaderRow>
						<Table.Body>
							{error == null ?
								isLoading || data == null ?
									(
										Array.from({ length: 5 }, (_, i) => i).map((_, index) => (
											<tr key={index}>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
												<td className="placeholder-glow">
													<span className="placeholder col-12"></span>
												</td>
											</tr>
										))
									) : (
										data.plans.map((plan) => (
											<tr key={plan.id}>
												<td>{plan.name}</td>
												<td>{formatBytes(plan.maxStorageSize)}</td>
												<td>{formatBytes(plan.maxFileSize)}</td>
												<td>{plan.deletedFileRetentionDays} days</td>
												<td>{`${process.env.NEXT_PUBLIC_CURRENCY_SYMBOL}${plan.price}`}</td>
												<td className='text-center'>
													<button className='btn' data-bs-toggle="modal" data-bs-target={`#${plan.id}`} style={{ padding: '0' }}>
														<FontAwesomeIcon size='lg' icon={faPen} />
													</button>
												</td>
											</tr>
										))
									) :
								<tr>
									<td colSpan={5} className="text-center text-danger fw-bold">
										{error?.message ?? 'Failed to load recently uploaded files'}
									</td>
								</tr>
							}
						</Table.Body>
					</Table>
				</Card.Body>
			</Card>
			{data?.plans.map((plan) => (<AdminEditPlanModal refresh={refetch} plan={plan} key={plan.id} />))}
			<AdminAddNewPlanModal refresh={refetch} />
		</AdminLayout>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data == null) {
		return {
			redirect: {
				destination: '/login',
				permanent: false,
			},
		};
	} else if (data.user.role !== 'admin') {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		try {
			const { data: stats } = await axios.get(`${process.env.BETTER_AUTH_URL}/api/admin/plan/stats`, headers(context.req));
			return { props: { stats } };
		} catch (err) {
			console.log(err);
			return { props: { storages: [], avgFileCount: 0, avgStorageUsage: 0, MediumCounts: {}, error: 'API server currently unavailable' } };
		}
	}
}