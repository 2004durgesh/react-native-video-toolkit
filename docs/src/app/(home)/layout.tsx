import { HomeLayout } from 'fumadocs-ui/layouts/home';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <HomeLayout
      githubUrl="https://github.com/2004durgesh/react-native-video-toolkit"
      className="dark:from-fd-background dark:to-fd-background from-fd-accent bg-gradient-to-b to-white"
      nav={{
        title: (
          <div className="hover:bg-fd-accent -ml-0.5 flex size-8 items-center justify-center rounded-md transition-colors duration-200">
            <img src="/icon.png" />
          </div>
        ),
      }}
      links={[
        {
          type: 'custom',
          children: (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-fd-accent dark:hover:bg-fd-accent -ml-1.5 justify-start sm:ml-0 sm:justify-center">
              <Link href="/docs">Docs</Link>
            </Button>
          ),
        },
        {
          type: 'custom',
          children: (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hover:bg-fd-accent dark:hover:bg-fd-accent -ml-1.5 justify-start sm:ml-0 sm:justify-center">
              <Link href="/docs/api-reference/components">Components</Link>
            </Button>
          ),
        },
      ]}>
      {children}
    </HomeLayout>
  );
}
