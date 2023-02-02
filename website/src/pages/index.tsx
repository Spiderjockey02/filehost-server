import '@/styles/Home.module.css';
import NavBar from '../components/navBar';
import Footer from '../components/footer';
import Link from 'next/link';
import config from '../config';
import { useSession } from 'next-auth/react';
import Script from 'next/script';

export default function Home() {
	const { data: session, status } = useSession();

	return (
		<>
			<Script src="https://cdn.jsdelivr.net/npm/@srexi/purecounterjs/dist/purecounter_vanilla.js" strategy="worker" />
			<NavBar />
			<section id="hero" className="d-flex align-items-center">
				<div className="container">
					<h1>Welcome to <span>{config.company.name}</span></h1>
					<h2>{config.company.slogan}</h2>
					<div className="d-flex">
						<Link href="/signup" className="btn-get-started" style={{ textDecoration: 'none' }}>Get Started</Link>
            &nbsp;
						<Link href="#pricing" className="btn-get-started" style={{ textDecoration: 'none' }}>Pricing</Link>
					</div>
				</div>
			</section>
			<main id="main">
				<section id="featured-services" className="featured-services">
					<div className="container" data-aos="fade-up">
						<div className="row">
							<div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0">
								<div className="icon-box" data-aos="fade-up" data-aos-delay="100">
									<div className="icon"><i className="bi bi-chat-left-dots"></i></div>
									<h4 className="title">Collaborate</h4>
									<p className="description">Manage tasks, track file updates, and stay in sync with your teams and clients.</p>
								</div>
							</div>
							<div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0">
								<div className="icon-box" data-aos="fade-up" data-aos-delay="200">
									<div className="icon"><i className="bi bi-file-earmark-text"></i></div>
									<h4 className="title">Back up and protect</h4>
									<p className="description">If you lose your device, you won’t lose your files and photos when they’re saved in {config.company.name}.</p>
								</div>
							</div>
							<div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0">
								<div className="icon-box" data-aos="fade-up" data-aos-delay="300">
									<div className="icon"><i className="fa-solid fa-gauge"></i></div>
									<h4 className="title">Superior loading speeds</h4>
									<p className="description">Access, send and recieve important files with speed.</p>
								</div>
							</div>
							<div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0">
								<div className="icon-box" data-aos="fade-up" data-aos-delay="400">
									<div className="icon"><i className="bi bi-globe-europe-africa"></i></div>
									<h4 className="title">Anywhere access</h4>
									<p className="description">Enjoy the freedom to access, edit, and share your files on all your devices, wherever you are.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="counts" className="counts">
					<div className="container" data-aos="fade-up">
						<div className="row">
							<div className="col-lg-3 col-md-6">
								<div className="count-box">
									<i className="fa-solid fa-users"></i>
									<span data-purecounter-start="0" data-purecounter-end="10" data-purecounter-duration="1" className="purecounter">0</span>
									<p>Happy users</p>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-5 mt-md-0">
								<div className="count-box">
									<i className="fa-solid fa-file"></i>
									<span data-purecounter-start="0" data-purecounter-end="10" data-purecounter-duration="1" className="purecounter">0</span>
									<p>Total files</p>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-5 mt-lg-0">
								<div className="count-box">
									<i className="fa-solid fa-hard-drive"></i>
									<span data-purecounter-start="0" data-purecounter-end="10" data-purecounter-duration="1" data-purecounter-currency="true" className="purecounter-data">0</span>
									<p>Total storage used</p>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-5 mt-lg-0">
								<div className="count-box">
									<i className="bi bi-people"></i>
									<span data-purecounter-start="0" data-purecounter-end="15" data-purecounter-duration="1" className="purecounter">0</span>
									<p>Hard Workers</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="pricing" className="pricing">
					<div className="container" data-aos="fade-up">
						<div className="section-title">
							<h3>Check our <span>Pricing</span></h3>
							<p>Compare {config.company.name} cloud storage pricing and plans</p>
						</div>
						<div className="row">
							<div className="col-lg-3 col-md-6" data-aos="fade-up" data-aos-delay="100">
								<div className="box">
									<h3>Free</h3>
									<h4><sup>$</sup>0<span> / month</span></h4>
									<ul>
										<li><b>Storage only</b></li>
										<li>5 GB</li>
										<li></li>
										<li><b>Services included</b></li>
										<li>Photo album viewer</li>
										<li className="na">Text editor</li>
									</ul>
									<div className="btn-wrap">
										<Link href="/signup" className="btn-buy">Sign up</Link>
									</div>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-4 mt-lg-0" data-aos="fade-up" data-aos-delay="200">
								<div className="box">
									<h3>Developer</h3>
									<h4><sup>$</sup>5<span> / month</span></h4>
									<ul>
										<li><b>Storage size</b></li>
										<li>15 GB</li>
										<li><b>Services included</b></li>
										<li>File editor</li>
										<li></li>
										<li></li>
										<li></li>
									</ul>
									<div className="btn-wrap">
										<Link href="/signup" className="btn-buy">Buy Now</Link>
									</div>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-4 mt-md-0" data-aos="fade-up" data-aos-delay="300">
								<div className="box featured">
									<h3>Business</h3>
									<h4><sup>$</sup>10<span> / month</span></h4>
									<ul>
										<li><b>Storage size</b></li>
										<li>1 TB</li>
										<li>Nulla at volutpat dola</li>
										<li>Pharetra massa</li>
										<li className="na">Massa ultricies mi</li>
										<li></li>
									</ul>
									<div className="btn-wrap">
										<Link href="#" className="btn-buy">Buy Now</Link>
									</div>
								</div>
							</div>
							<div className="col-lg-3 col-md-6 mt-4 mt-lg-0" data-aos="fade-up" data-aos-delay="400">
								<div className="box">
									<span className="advanced">Advanced</span>
									<h3>Ultimate</h3>
									<h4><sup>$</sup>20<span> / month</span></h4>
									<ul>
										<li>Aida dere</li>
										<li>Nec feugiat nisl</li>
										<li>Nulla at volutpat dola</li>
										<li>Pharetra massa</li>
										<li>Massa ultricies mi</li>
										<li></li>
									</ul>
									<div className="btn-wrap">
										<Link href="#" className="btn-buy">Buy Now</Link>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section id="faq" className="faq section-bg">
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
			<Footer />
		</>
	);
}
