import config from '../config';

export default function Footer() {
	return (
		<footer id="footer">
			<div className="footer-top">
				<div className="container">
					<div className="row">
						<div className="col-lg-3 col-md-6 footer-contact">
							<h3>{config.company.name}<span>.</span></h3>
							<p>
								{config.company.slogan}
								<br />
								<br />
								<strong>Phone:</strong> {config.company.phone}<br />
								<strong>Email:</strong> {config.company.email}<br />
							</p>
						</div>
						<div className="col-lg-3 col-md-6 footer-links">
							<h4>Useful Links</h4>
							<ul>
								<li><i className="bx bx-chevron-right"></i> <a href="/">Home</a></li>
								<li><i className="bx bx-chevron-right"></i> <a href="/terms-and-conditions">Terms of service</a></li>
								<li><i className="bx bx-chevron-right"></i> <a href="/privacy-policy">Privacy policy</a></li>
								<li><i className="bx bx-chevron-right"></i> <a href="/contact-us">Contact us</a></li>
							</ul>
						</div>
						<div className="col-lg-3 col-md-6 footer-links">
							<h4>Our Services</h4>
							<ul>
								<li><i className="bx bx-chevron-right"></i> <a href="/">Cloud storage</a></li>
								<li><i className="bx bx-chevron-right"></i> <a href="https://discord.gg/8g6zUQu">Discord bot</a></li>
							</ul>
						</div>
						<div className="col-lg-3 col-md-6 footer-links">
							<h4>Our Social Networks</h4>
							<p>Go give us a follow for the latest updates and events.</p>
							<div className="social-links mt-3">
								<a href="/social/twitter" className="twitter"><i className="bx bxl-twitter"></i></a>
								<a href="/social/facebook" className="facebook"><i className="bx bxl-facebook"></i></a>
								<a href="/social/instagram" className="instagram"><i className="bx bxl-instagram"></i></a>
								<a href="/social/linkedin" className="linkedin"><i className="bx bxl-linkedin"></i></a>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="container py-4">
				<div className="copyright">
      &copy; Copyright <strong><span>{config.company.name}</span></strong>. All Rights Reserved
				</div>
			</div>
		</footer>

	);
}
