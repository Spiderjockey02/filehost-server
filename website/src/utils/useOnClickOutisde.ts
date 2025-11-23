import { RefObject, useEffect } from 'react';

type Event = MouseEvent | TouchEvent

export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(ref: RefObject<T>, handler: (event: Event) => void) => {
	useEffect(() => {
		const listener = (event: Event) => {
			const el = ref?.current;
			const target = event.target as Node | null;

			// Ignore clicks inside the referenced element
			if (!el || (target && el.contains(target))) return;

			// Ignore clicks inside any Bootstrap modal or backdrop
			if (target instanceof HTMLElement && (target.closest('.modal') || target.closest('.modal-backdrop'))) return;
			handler(event);
		};

		document.addEventListener('mousedown', listener);
		document.addEventListener('touchstart', listener);

		return () => {
			document.removeEventListener('mousedown', listener);
			document.removeEventListener('touchstart', listener);
		};
	}, [ref, handler]);
};
