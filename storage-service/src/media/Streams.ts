import { Readable, Writable } from 'node:stream';
import { spawn } from 'node:child_process';

export async function handleFFMPEGEncoding(args: string[], buffer: Buffer | Readable, output: Writable) {
	const ffmpeg = spawn('ffmpeg', args);

	// Input
	const stream = Readable.from(buffer);
	stream.on('error', (err) => console.error('Readable stream error:', err));
	ffmpeg.stdin.on('error', (err) => console.warn('FFmpeg stdin error:', err.message));

	stream.on('end', () => ffmpeg.stdin.end());
	stream.pipe(ffmpeg.stdin);

	// Output
	ffmpeg.stdout.pipe(output);

	ffmpeg.stderr.setEncoding('utf8');
	ffmpeg.stderr.on('data', (data) => {
		console.error('[FFmpeg STDERR]', data);
	});

	await new Promise((resolve, reject) => {
		ffmpeg.on('close', (code) => {
			if (code === 0) {
				resolve(null);
			} else {
				reject(new Error(`FFmpeg exited with code ${code}`));
			}
		});
		ffmpeg.on('error', reject);
	});
}