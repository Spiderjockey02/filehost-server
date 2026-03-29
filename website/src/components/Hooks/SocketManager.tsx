import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { SocketContextType } from '@/types/Components/Hooks';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
	latency: 0,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [latency, setLatency] = useState(0);
	const smoothedRef = useRef(0);

	useEffect(() => {
		const socket = io('/');
		socketRef.current = socket;
		let interval: NodeJS.Timeout;

		socket.on('connect', () => {
			console.log('Connected to socket');
			setIsConnected(true);

			// Start latency tracking when connected
			interval = setInterval(() => {
				const start = performance.now();
				socket.emit('latency');

				socket.once('latency', () => {
					const current = performance.now() - start;

					// smoothing (EMA)
					const alpha = 0.2;
					smoothedRef.current = smoothedRef.current	? smoothedRef.current * (1 - alpha) + current * alpha : current;

					setLatency(Math.round(smoothedRef.current));
					console.log(`Latency: ${Math.round(smoothedRef.current)}ms`);
				});
			}, 2000);
		});

		socket.on('disconnect', () => {
			setIsConnected(false);
			clearInterval(interval);
		});

		return () => {
			socket.disconnect();
			clearInterval(interval);
		};
	}, []);

	return (
		<SocketContext.Provider value={{ socket: socketRef.current, isConnected, latency }}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocket = () => useContext(SocketContext);