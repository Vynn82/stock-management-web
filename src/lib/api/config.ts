const rawUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/";
const isBrowser = typeof window !== "undefined";

export const config = {
  // In the browser, use the same-origin Next.js proxy route (/api/backend/)
  // to eliminate browser CORS preflight (OPTIONS 404) blocks.
  // On the server, connect directly to the backend.
  BASE_URL: isBrowser
    ? "/api/backend/"
    : rawUrl.endsWith("/")
      ? rawUrl
      : `${rawUrl}/`,
};

export default config;
