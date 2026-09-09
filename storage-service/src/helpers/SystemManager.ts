import os from 'os';

export const getCpuUsage = async (interval = 100): Promise<number> => {
	const start = os.cpus();
	await new Promise((resolve) => setTimeout(resolve, interval));
	const end = os.cpus();

	let idle = 0;
	let total = 0;

	for (const [index, endCpu] of end.entries()) {
		const startCpu = start[index];
		if (!startCpu) continue;

		const idleDelta = endCpu.times.idle - startCpu.times.idle;
		const totalDelta =
      (endCpu.times.user - startCpu.times.user) +
      (endCpu.times.nice - startCpu.times.nice) +
      (endCpu.times.sys - startCpu.times.sys) +
      (endCpu.times.idle - startCpu.times.idle) +
      (endCpu.times.irq - startCpu.times.irq);

		idle += idleDelta;
		total += totalDelta;
	}

	return total === 0 ? 0 : (1 - idle / total) * 100;
};

export const getMemory = () => {
	return {
		using: process.memoryUsage().heapUsed,
		total: os.totalmem(),
	};
};

export const getCPU = async () => {
	return {
		usage: await getCpuUsage(),
		cores: os.cpus().length,
	};
};