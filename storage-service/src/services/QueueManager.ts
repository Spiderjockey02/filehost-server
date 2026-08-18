import type { QueuedTask, QueueKeys, Task } from '@/types';

export default class QueueManager {
	private queues: Map<string, QueuedTask<any>[]> = new Map();
	private processing: Map<string, boolean> = new Map();

	async addToQueue<T>(key: QueueKeys, task: Task<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const queuedTask: QueuedTask<T> = { task, resolve, reject };

			if (!this.queues.has(key)) this.queues.set(key, []);

      this.queues.get(key)!.push(queuedTask);
      this.processNext(key);
		});
	}

	private async processNext(key: QueueKeys): Promise<void> {
		if (this.processing.get(key) || !this.queues.get(key)?.length) return;
		this.processing.set(key, true);

		const { task, resolve, reject } = this.queues.get(key)!.shift()!;

		try {
			const result = await task();
			resolve(result);
		} catch (err) {
			reject(err);
		} finally {
			this.processing.set(key, false);
			if (this.queues.get(key)!.length === 0) {
				this.queues.delete(key);
				this.processing.delete(key);
			} else {
				setImmediate(() => this.processNext(key));
			}
		}
	}
}
