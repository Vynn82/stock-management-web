// Production backend by default. Only an explicit BACKEND_URL points it elsewhere.
const rawUrl = process.env.BACKEND_URL || "https://stock.theavin.xyz/";
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
