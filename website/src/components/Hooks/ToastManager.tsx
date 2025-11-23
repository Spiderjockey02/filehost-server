import type { ToastContextValue, ToastType } from '@/types/Components/Hooks';
import { createContext, useContext, useState, ReactNode } from 'react';

const ToastContext = createContext<ToastContextValue | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toast, setToast] = useState({
		type: 'success' as ToastType,
		message: '',
		visible: false,
	});

	const showToast = (type: ToastType, message: string) => setToast({ type, message, visible: true });
	const hideToast = () => setToast((t) => ({ ...t, visible: false }));

	return (
		<ToastContext.Provider value={{ toast, showToast, hideToast }}>
			{children}
		</ToastContext.Provider>
	);
}

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast must be used inside ToastProvider');
	return ctx;
};
