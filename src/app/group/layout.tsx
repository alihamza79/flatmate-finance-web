import { TabLayout } from '@/components/ui/TabLayout';

export default function GroupLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <TabLayout>{children}</TabLayout>;
}
