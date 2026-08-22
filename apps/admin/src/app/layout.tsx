import "../styles/admin.css";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata = {
  title: { default: "RENAS CMS", template: "%s — RENAS CMS" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
