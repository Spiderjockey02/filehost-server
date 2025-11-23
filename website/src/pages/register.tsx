import type { GetServerSidePropsContext } from 'next/types';
import RegisterForm from '@/components/Form/RegisterForm';
import { Card, Col, Row } from '@/components';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

export default function RegisterPage() {
	return (
		<>
			<Head>
				<title>{process.env.NEXT_PUBLIC_COMPANY_NAME} - Register</title>
			</Head>
			<section className='d-flex flex-row align-items-center' style={{ 'backgroundColor': '#eee', padding: '0', minHeight: '100vh' }}>
				<div className="container">
					<Row className='d-flex justify-content-center align-items-center'>
						<Col lg={12} xl={11}>
							<Card>
								<Card.Body>
									<Row>
										<Col lg={6} className=' order-2 order-lg-1'>
											<p className="text-center h1 fw-bold mb-5 mx-1 mx-md-4 mt-4">Sign up</p>
											<RegisterForm />
											<p>Already have an account? <Link href="/login">Click here</Link></p>
										</Col>
										<Col lg={6} className=' d-flex align-items-center order-1 order-lg-2'>
											<Image src="/register.webp" className="img-fluid" alt="Sample image" width={530} height={280}/>
										</Col>
									</Row>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</div>
			</section>
		</>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/get-session`, {
		headers: {
			cookie: context.req.headers.cookie || '',
		},
	});

	const data = await res.json();
	if (data !== null) {
		return {
			redirect: {
				destination: '/files',
				permanent: false,
			},
		};
	} else {
		// Get the path from the URL
		const path = [context.params?.files].flat();
		return { props: { path: path.join('/') } };
	}
}