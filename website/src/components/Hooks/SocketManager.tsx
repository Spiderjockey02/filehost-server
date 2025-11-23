import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { SocketContextType } from '@/types/Components/Hooks';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const socket = io('/');
		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('Connected to socket');
			setIsConnected(true);
		});

		socket.on('disconnect', () => setIsConnected(false));

		return () => {
			socket.disconnect();
		};
	}, []);

	return (
		<SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
};

export const useSocket = () => useContext(SocketContext);