import { useEffect, useState } from 'react';
import { MenuCategory, MenuResponse } from '../types/menu';

export const useMenu = () => {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_API_URL}/api/menu/`, {
          cache: 'no-store',
        });
        const data: MenuResponse = await response.json();
        setMenu(data.menu ?? []);
      } catch (error) {
        console.error('Error fetching menu:', error);
        setMenu([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  return { menu, isLoading };
};
