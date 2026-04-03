import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showBottomNav?: boolean;
  showBackButton?: boolean;
};

export function AppShell({
  title,
  subtitle,
  children,
  showBottomNav = true,
  showBackButton = false,
}: AppShellProps) {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__row">
            <div className="app-header__left">
              {showBackButton ? (
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                >
                  ←
                </button>
              ) : null}

              <div>
                <p className="app-header__eyebrow">LAYA Resident</p>
                <h1 className="app-header__title">
                  {title ?? "Elite Black Card"}
                </h1>
                {subtitle ? (
                  <p className="app-header__subtitle">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-content">{children}</main>

      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
