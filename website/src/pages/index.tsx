import { faCommentDots, faEarthEurope, faFile, faGauge, faHardDrive, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatBytes, queryOptions } from '@/utils/functions';
import { useQuery } from '@tanstack/react-query';
import { Col, Row } from '@/components/UI/Grid';
import { authClient } from '@/auth/client';
import MainLayout from '@/layouts/main';
import CountUp from 'react-countup';
import API from '@/services/api';
import config from '../config';
import Link from 'next/link';

export default function Home() {
	const { data: session } = authClient.useSession();

	const { data, isLoading } = useQuery({
		queryKey: ['homePageStatistics'],
		queryFn: async ({ signal }) => {
			return API.fetchStatistics(signal);
		},
		...queryOptions,
	});

	const { data: plans, isLoading: isLoadingPlans } = useQuery({
		queryKey: ['homePagePlans'],
		queryFn: async ({ signal }) => {
			return API.fetchPlans(signal);
		},
		...queryOptions,
	});

	return (
		<MainLayout user={session?.user ?? null} tabName='Home page'>
			<section id="hero" className="d-flex align-items-center large-padding">
				<div className="container">
					<h1>Welcome to <span>{config.company.name}</span></h1>
					<h2>{config.company.slogan}</h2>
					<div className="d-flex">
						<Link href="/register" className="btn btn-get-started">Get Started</Link>
            &nbsp;
						<Link href="#pricing" className="btn btn-get-started">Pricing</Link>
					</div>
				</div>
			</section>
			<main id="main">
				<section id="featured-services" className="featured-services large-padding">
					<div className="container" data-aos="fade-up">
						<Row>
							<Col md={6} lg={3} className='d-flex align-items-stretch mb-5 mb-lg-0'>
								<div className="icon-box" data-aos="fade-up" data-aos-delay="100">
									<div className="icon"><FontAwesomeIcon icon={faCommentDots} /></div>
									<h4 className="title">Collaborate</h4>
									<p className="description">Manage tasks, track file updates, and stay in sync with your teams and clients.</p>
								</div>
							</Col>
							<Col md={6} lg={3} className='d-flex align-items-stretch mb-5 mb-lg-0'>
								<div className="icon-box" data-aos="fade-up" data-aos-delay="200">
									<div className="icon"><FontAwesomeIcon icon={faFile} /></div>
									<h4 className="title">Back up and protect</h4>
									<p className="description">If you lose your device, you won&apos;t lose your files and photos when they&apos;re saved in {config.company.name}.</p>
								</div>
							</Col>
							<Col md={6} lg={3} className='d-flex align-items-stretch mb-5 mb-lg-0'>
								<div className="icon-box" data-aos="fade-up" data-aos-delay="300">
									<div className="icon"><FontAwesomeIcon icon={faGauge} className='bi'/> </div>
									<h4 className="title">Superior loading speeds</h4>
									<p className="description">Access, send and recieve important files with speed.</p>
								</div>
							</Col>
							<Col md={6} lg={3} className='d-flex align-items-stretch mb-5 mb-lg-0'>
								<div className="icon-box" data-aos="fade-up" data-aos-delay="400">
									<div className="icon"><FontAwesomeIcon icon={faEarthEurope} /></div>
									<h4 className="title">Anywhere access</h4>
									<p className="description">Enjoy the freedom to access, edit, and share your files on all your devices, wherever you are.</p>
								</div>
							</Col>
						</Row>
					</div>
				</section>

				<section id="counts" className="counts large-padding">
					<div className="container" data-aos="fade-up">
						<Row>
							<Col lg={4} md={6} className='mb-5'>
								<div className="count-box">
									<FontAwesomeIcon icon={faUsers} />
									<CountUp end={isLoading || data == undefined ? 0 : data.totalUsers.total} className='purecounter' duration={5} />
									<p>Happy users</p>
								</div>
							</Col>
							<Col lg={4} md={6} className='mb-5'>
								<div className="count-box">
									<FontAwesomeIcon icon={faFile} />
									<CountUp end={isLoading || data == undefined ? 0 : data.totalFileCount} className='purecounter' duration={5} />
									<p>Total files</p>
								</div>
							</Col>
							<Col lg={4} md={6} className='mb-5'>
								<div className="count-box">
									<FontAwesomeIcon icon={faHardDrive} />
									<CountUp end={isLoading || data == undefined ? 0 : data.totalUsage} className='purecounter' formattingFn={(n) => formatBytes(n)} duration={5} />
									<p>Total storage used</p>
								</div>
							</Col>
						</Row>
					</div>
				</section>

				<section id="pricing" className="pricing large-padding">
					<div className="container" data-aos="fade-up">
						<div className="section-title">
							<h3>Check our <span>Pricing</span></h3>
							<p>Compare {config.company.name} cloud storage pricing and plans</p>
						</div>
						<Row>
							{isLoadingPlans || plans == undefined ? (
								<p>Loading plans...</p>
							) : (
								plans.plans.map((plan, index) => (
									<Col lg={Math.min(Math.floor(12 / plans.plans.length), 6)} md={6} className='mb-5' key={index}>
										<div className="box">
											<h3>{plan.name}</h3>
											<h4><sup>$</sup>{Number(plan.price)}<span> / month</span></h4>
											<ul>
												<li><b>Storage size</b></li>
												<li>{formatBytes(plan.maxStorageSize)}</li>
											</ul>
											<div className="btn-wrap">
												{plan.isDefault ?
													<Link href="/register" className="btn btn-primary">Sign up</Link>
													 : <Link href={`/plan/${plan.id}`} className="btn btn-primary">Buy Now</Link>
												}
											</div>
										</div>
									</Col>
								))
							)}
						</Row>
					</div>
				</section>

				<section id="faq" className="faq section-bg large-padding">
					<div className="container" data-aos="fade-up">
						<div className="section-title">
							<h3>Frequently Asked <span>Questions</span></h3>
							<p>Get quick and simple help on any of {config.company.name}s services, either use the following options or click <Link href="/FAQ">here.</Link></p>
						</div>
						<div className="row justify-content-center">
							<div className="col-xl-10">
								<div className="accordion" id="accordionExample">
									<div className="accordion-item">
										<h2 className="accordion-header" id="headingOne">
											<button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
      									Can I stop my subscription anytime?
											</button>
										</h2>
										<div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
											<div className="accordion-body">
												Yes, but you will not be able to upload anymore files until you are in your limit of your new tier.
											</div>
										</div>
									</div>
									<div className="accordion-item">
										<h2 className="accordion-header" id="headingTwo">
											<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
        								What payment methods are supported?
											</button>
										</h2>
										<div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
											<div className="accordion-body">
												We accept debit/credit cards and even <a href="https://www.paypal.com/">paypal</a>.
											</div>
										</div>
									</div>
									<div className="accordion-item">
										<h2 className="accordion-header" id="headingThree">
											<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
								        Where can I find billing information?
											</button>
										</h2>
										<div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
											<div className="accordion-body">
												Just simply login and go to your dashboard Billing information and there you will see your payment history for your account.
											</div>
										</div>
									</div>

									<div className="accordion-item">
										<h2 className="accordion-header" id="headingFour">
											<button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
												Does {config.company.name} offer a Service Level Agreement (SLA)?
											</button>
										</h2>
										<div id="collapseFour" className="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#accordionExample">
											<div className="accordion-body">
												Yes, have a look <Link href="/SLA">here</Link>.
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
		</MainLayout>
	);
}