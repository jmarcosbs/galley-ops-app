import { Alert, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

export const useUtils = () => {
    const showNotification = (message: string, type: 'success' | 'error') => {
        if (type === 'success') {
            toast.success(message);
        } else {
            toast.error(message);
        }
    }

    return {
        showNotification,
    }
}