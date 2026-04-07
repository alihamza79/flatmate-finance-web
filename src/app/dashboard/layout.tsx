import { TabLayout } from '@/components/ui/TabLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <TabLayout>{children}</TabLayout>;
}
