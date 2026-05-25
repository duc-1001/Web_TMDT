import AdminLayout from '@/components/layout/admin/admin-layout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  )
}




