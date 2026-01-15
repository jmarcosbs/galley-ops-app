const env = process.env as Record<string, string | undefined>;

const getEnv = (key: string, fallback: string) => {
  const value = env[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
};

export const brandConfig = {
  name: getEnv('NEXT_PUBLIC_BRAND_NAME', 'Seu Restaurante'),
  shortName: getEnv('NEXT_PUBLIC_BRAND_SHORT_NAME', 'Seu Restaurante'),
  descriptor: getEnv('NEXT_PUBLIC_BRAND_DESCRIPTOR', 'Pedidos internos'),
  badgeLabel: getEnv('NEXT_PUBLIC_BRAND_BADGE_LABEL', 'Pedidos internos'),
  categoryLabel: getEnv('NEXT_PUBLIC_BRAND_CATEGORY_LABEL', 'Restaurante'),
  tagline: getEnv(
    'NEXT_PUBLIC_BRAND_TAGLINE',
    'Operação digital completa para qualquer restaurante.',
  ),
};

export const pwaConfig = {
  name: getEnv('NEXT_PUBLIC_PWA_NAME', `${brandConfig.name} · Pedidos`),
  shortName: getEnv('NEXT_PUBLIC_PWA_SHORT_NAME', brandConfig.shortName),
  description: getEnv(
    'NEXT_PUBLIC_PWA_DESCRIPTION',
    'Acompanhe mesas, pedidos e dashboards pelo app interno.',
  ),
};
