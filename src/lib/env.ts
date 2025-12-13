const missingEnv = (name: string) => {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`Environment variable ${name} is not defined`);
  }
  return "";
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_LOCAL_API_URL ??
  missingEnv("NEXT_PUBLIC_API_BASE_URL");

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ?? missingEnv("NEXT_PUBLIC_WS_BASE_URL");
