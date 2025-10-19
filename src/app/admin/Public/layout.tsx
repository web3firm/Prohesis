export default function PublicAdminLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for public admin routes (e.g., /admin/login) without sidebar
  return <>{children}</>;
}
