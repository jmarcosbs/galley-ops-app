import { toast } from 'sonner';

type NotificationType = 'success' | 'error' | 'info';

export const useUtils = () => {
    const showNotification = (message: string, type: NotificationType) => {
        if (type === 'success') {
            toast.success(message);
            return;
        }
        if (type === 'error') {
            toast.error(message);
            return;
        }
        toast(message);
    };

    return {
        showNotification,
    };
};
