import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { source } from '@/lib/source';
import { VideoProvider } from 'react-native-video-toolkit';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      themeSwitch={{ mode: 'light-dark' }}
      sidebar={{ className: '[&>div]:pt-3' }}
      nav={{
        title: (
          <div className="text-foreground/80 -ml-px flex items-center gap-1.5 opacity-90 transition-opacity duration-200 hover:opacity-100">
            <div className="flex items-center justify-center">
              <img src="/icon.png" className="h-6 w-6" />
            </div>
            <p className="text-base">RNVT</p>
          </div>
        ),
      }}
      githubUrl="https://github.com/2004durgesh/react-native-video-toolkit"
      tree={source.pageTree}>
      {/* Wrap VideoProvider for the context of codeblocks used in docs */}
      <VideoProvider>{children}</VideoProvider>
    </DocsLayout>
  );
}
