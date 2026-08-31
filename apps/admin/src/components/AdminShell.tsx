"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

type NavItem = { href: string; label: string; role?: "SUPER_ADMIN" };

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "", items: [{ href: "/dashboard", label: "Dashboard" }] },
  {
    section: "Content",
    items: [
      { href: "/pages", label: "Pages" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
      { href: "/media", label: "Media" },
    ],
  },
  {
    section: "Site",
    items: [
      { href: "/navigation", label: "Navigation" },
      { href: "/settings", label: "Settings" },
      { href: "/redirects", label: "Redirects" },
    ],
  },
  {
    section: "Inbox",
    items: [
      { href: "/supply-requests", label: "Supply Requests" },
      { href: "/contact-submissions", label: "Contact Submissions" },
    ],
  },
  {
    section: "Admin",
    items: [
      { href: "/users", label: "Users", role: "SUPER_ADMIN" as const },
      { href: "/audit-logs", label: "Audit Log", role: "SUPER_ADMIN" as const },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/renas-mark.png" alt="" className="admin-sidebar__mark" />
          RENAS<span className="dot">.</span> CMS
        </div>

        <nav>
          {NAV.map((group) => (
            <div key={group.section || "root"}>
              {group.section && <p className="admin-nav-section">{group.section}</p>}
              {group.items
                .filter((item) => !item.role || user?.role === item.role)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-nav-link${pathname?.startsWith(item.href) ? " is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__user">
          <div>{user?.name}</div>
          <div style={{ color: "var(--muted-2)", fontSize: 12 }}>{user?.role}</div>
          <button className="admin-sidebar__logout" onClick={logout}>
            LOG OUT
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
