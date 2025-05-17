import { faFacebook, faInstagram, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Col, Row } from '@/components/UI/Grid';
import config from '@/config';
import Link from 'next/link';

export default function Footer() {
	return (
		<footer id="footer">
			<div className="footer-top container">
				<Row>
					<Col lg={3} md={6} className="footer-contact">
						<h3>{config.company.name}<span>.</span></h3>
						<p>
							{config.company.slogan}
							<br />
							<br />
							<strong>Phone: </strong><Link href={`tel:${config.company.phone}`} className="btn-link">{config.company.phone}</Link><br />
							<strong>Email: </strong><Link href={`mailto:${config.company.email}`} className="btn-link">{config.company.email}</Link><br />
						</p>
					</Col>
					<Col lg={3} md={6} className="footer-links">
						<h4>Useful Links</h4>
						<ul>
							<li><Link href="/" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Home</Link></li>
							<li><Link href="/terms-of-service" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Terms of service</Link></li>
							<li><Link href="/privacy-policy" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Privacy policy</Link></li>
							<li><Link href="/contact-us" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Contact us</Link></li>
						</ul>
					</Col>
					<Col lg={3} md={6} className="footer-links">
						<h4>Our Services</h4>
						<ul>
							<li><Link href="/" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Cloud storage</Link></li>
							<li><Link href="https://discord.gg/8g6zUQu" className="btn-link"><FontAwesomeIcon icon={faChevronRight} /> Discord bot</Link></li>
						</ul>
					</Col>
					<Col lg={3} md={6} className="footer-links">
						<h4>Our Social Networks</h4>
						<p>Go give us a follow for the latest updates and events.</p>
						<div className="social-links mt-3">
							<Link href={config.company.twitterURL} className="twitter"><FontAwesomeIcon icon={faXTwitter} /></Link>
							<Link href={config.company.facebookURL} className="facebook"><FontAwesomeIcon icon={faFacebook} /></Link>
							<Link href={config.company.instagramURL} className="instagram"><FontAwesomeIcon icon={faInstagram} /></Link>
							<Link href={config.company.linkedinURL} className="linkedin"><FontAwesomeIcon icon={faLinkedin} /></Link>
						</div>
					</Col>
				</Row>
			</div>
			<div className="container py-4">
				<div className="copyright">
      		&copy; Copyright <strong><span>{config.company.name}</span></strong>. All Rights Reserved
				</div>
			</div>
		</footer>
	);
}
