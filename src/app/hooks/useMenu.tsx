import { useEffect, useState } from 'react';
import { MenuCategory, MenuResponse } from '../types/menu';

export const useMenu = () => {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/menu/`, {
          cache: 'no-store',
          signal: abortController.signal,
        });
        const data: MenuResponse = await response.json();
        if (!isActive) return;
        setMenu(data.menu ?? []);
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error('Error fetching menu:', error);
        if (isActive) {
          setMenu([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchMenu();
    return () => {
      isActive = false;
      abortController.abort();
    };
  }, []);

  return { menu, isLoading };
};
