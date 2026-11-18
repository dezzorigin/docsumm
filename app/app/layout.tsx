import { Sidebar } from '@/components/layout/Sidebar'
import { TopNav } from '@/components/layout/TopNav'
import { MobileNav } from '@/components/layout/MobileNav'
import { AuthGuard } from '@/components/layout/AuthGuard'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  )
}
