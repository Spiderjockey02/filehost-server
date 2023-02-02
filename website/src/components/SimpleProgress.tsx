const SimpleProgressBar = ({
	progress = 0,
	remaining = 0,
}: {
  progress?: number;
  remaining?: number;
}) => {
	return (
		<>
			{!!remaining && (
				<div className="mb-1.5 text-sm text-gray-700">
          Remaining time: {remaining}
				</div>
			)}
			<div className="progress" style={{ width:'200px' }}>
				<div className="progress-bar bg-danger" role="progressbar" style={{ width:`${progress}%` }} aria-valuenow={5} aria-valuemin={0} aria-valuemax={10}></div>
			</div>
		</>
	);
};

export default SimpleProgressBar;
