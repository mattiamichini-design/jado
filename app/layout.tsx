import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { inter, rootMetadata } from '@/lib/root-layout';

export const metadata = rootMetadata;

// Root layout shared by the landing page and the playbook.
export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
