import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

/** "← Back" shown at the top of every sub-page; goes to the page it was opened from. */
export default function BackButton({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="page-back-btn" aria-label={label}>
      <ArrowLeftOutlined /> {label}
    </Link>
  );
}
