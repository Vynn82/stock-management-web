import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="auth-page">
      <span className="orb" />
      <span className="orb two" />
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="brand" style={{ justifyContent: "center" }}>
          <div className="brand-mark">404</div>
          <div className="brand-name">Page Not Found</div>
        </div>
        <h1 className="title">Oops!</h1>
        <p className="subtitle">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href={ROUTES.LOGIN} className="submit">
          Return to Login
        </Link>
      </div>
    </main>
  );
}
