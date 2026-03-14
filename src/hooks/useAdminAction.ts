import { useToastStore, type ToastType } from '../stores/toastStore';

/**
 * Returns an action handler that fires a toast and optionally runs a callback.
 * Usage: const action = useAdminAction();
 *        <button onClick={action('Draft saved', 'success')}>Save Draft</button>
 */
export function useAdminAction() {
    const addToast = useToastStore((s) => s.addToast);

    return (message: string, type: ToastType = 'info', callback?: () => void) => {
        return () => {
            addToast(message, type);
            callback?.();
        };
    };
}
