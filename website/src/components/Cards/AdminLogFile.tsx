import { SyntheticEvent, useEffect, useState } from 'react';
import Card from '../UI/Card';

export default function AdminLogFileCard() {
	const [logFiles, setlogFiles] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [logContent, setLogContent] = useState<string[]>([]);
	const [activeLog, setActiveLog] = useState<string>('');

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/admin/logs');
				const { logs } = await res.json();
				setlogFiles(logs);
				setIsLoading(false);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	// Update the log file content, so admin can check content of logs
	async function updateLogFileContent(e: SyntheticEvent) {
		setIsLoading(true);
		const el = e.target as HTMLButtonElement;
		const fileName = el.innerHTML;

		try {
			const res = await fetch(`/api/admin/logs/${fileName}`, {
				method: 'get',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});
			const { file } = await res.json();
			setLogContent(file.reverse());
		} catch (err) {
			console.log(err);
			setLogContent(['']);
		}
		setIsLoading(false);
		setActiveLog(fileName);
	}

	// Update log file content type (INFO, DEBUG etc)
	async function updateViewContentType(e: SyntheticEvent) {
		setIsLoading(true);
		const el = e.target as HTMLSelectElement;

		try {
			// Fetch logs
			const res = await fetch(`/api/admin/logs/${activeLog}`, {
				method: 'get',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
			});

			// Get text from file and format it
			const { file } = await res.json() as { file: Array<string> };
			if (el.value == 'ALL') return setLogContent(file.reverse());
			setLogContent(file.reverse().filter(line => line.substring(13).startsWith(el.value)));
		} catch (err) {
			console.log(err);
		}

		setIsLoading(false);
	}

	return (
		logContent.length == 0 ?
			<Card>
				<Card.Header>Log files</Card.Header>
				<Card.Body style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<table className="table">
						<tbody>
							{isLoading ? (
								[0, 0, 0, 0, 0, 0, 0].map((_, index) => (
									<tr key={index}>
										<td className="placeholder-glow">
											<span className="placeholder col-12"></span>
										</td>
									</tr>
								))
							) : (
								logFiles.map(name => (
									<tr key={logFiles.indexOf(name)}>
										<td>
											<button className={`btn ${activeLog == name ? 'active' : ''}` } onClick={(e) => updateLogFileContent(e)}>{name}</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</Card.Body>
			</Card>
			:
			<Card>
				<Card.Header>
					Log content
					<div className="input-group" style={{ padding: 0, maxWidth: '50%' }}>
						<label className="input-group-text" htmlFor="inputGroupSelect01">Log type</label>
						<select className="form-select form-select-sm" onChange={(e) => updateViewContentType(e)}>
							<option selected value="ALL">All</option>
							<option value="DEBUG">Debug</option>
							<option value="INFO">Info</option>
							<option value="WARN">Warn</option>
							<option value="ERROR">Error</option>
							<option value="FATAL">Fatal</option>
						</select>
					</div>
				</Card.Header>
				<Card.Body style={{ overflowY: 'scroll', maxHeight: '65vh' }}>
					<button className='btn btn-link' onClick={() => setLogContent([])}>Back</button>
					{isLoading ? (
						[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, index) => (
							<div className="placeholder-glow" key={index}>
								<span className="placeholder col-12"></span>
							</div>
						))
					) : (
						logContent.map(line => (
							<div key={logContent.indexOf(line)}>{line}</div>
						))
					)}
				</Card.Body>
			</Card>
	);
}