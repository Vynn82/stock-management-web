import React from "react";
import Image from "next/image";

interface AuthShellProps {
  children: React.ReactNode;
  monkeyClosed: boolean;
}

export function AuthShell({ children, monkeyClosed }: AuthShellProps) {
  return (
    <main className="auth-page">
      <span className="orb" />
      <span className="orb two" />
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-name">Stock Management</div>
        </div>

        <div className="monkey-wrap">
          <Image
            className="monkey"
            src={monkeyClosed ? "/images/monkey_pwd.gif" : "/images/monkey.gif"}
            alt="Security assistant"
            width={132}
            height={132}
            priority
            unoptimized
          />
          {monkeyClosed && (
            <Image
              className="hands"
              src="/images/hands.png"
              alt="Hands covering eyes"
              width={132}
              height={132}
              priority
            />
          )}
        </div>

        {children}
      </section>
    </main>
  );
}
