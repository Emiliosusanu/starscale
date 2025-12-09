import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map((t) => {
				const { id, title, description, action, dismiss, ...props } = t || {}; // Destructure 'dismiss' here
				return (
					<Toast key={id} {...props}>
						<div className="grid gap-1">
							{title && <ToastTitle>{title}</ToastTitle>}
							{description && (
								<ToastDescription>{description}</ToastDescription>
							)}
						</div>
						{action}
						{/* Pass 'dismiss' directly to onClick */}
						<ToastClose onClick={dismiss} />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}