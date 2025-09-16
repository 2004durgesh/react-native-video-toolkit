import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* Hero Section */}
      <main className="max-w-fd-container mx-auto flex w-full flex-1 flex-col items-center">
        <div className="container relative flex flex-col items-center gap-6 py-12 text-center md:pt-20 lg:pt-24 xl:gap-8">
          {/* Background gradient effect */}
          <div className="pointer-events-none absolute inset-0 -bottom-16 z-[-10] bg-gradient-to-b from-primary/5 via-transparent to-transparent [mask-image:radial-gradient(ellipse_50%_100%_at_50%_0%,black,transparent)]" />

          {/* Badge */}
          <Badge
            variant="secondary"
            className="text-primary bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors">
            ✨ Inspired by Vidstack
          </Badge>

          {/* Main title */}
          <h1 className="text-primary/90 leading-tighter max-w-4xl text-balance text-4xl font-bold tracking-tight lg:leading-[1.1] xl:max-w-6xl xl:text-6xl xl:font-bold xl:tracking-tighter">
            React Native Video Toolkit
          </h1>

          {/* Subtitle */}
          <p className="text-foreground/70 max-w-2xl text-balance text-lg leading-relaxed sm:text-xl">
            A powerful, flexible, and customizable video player UI toolkit for React Native apps. Build beautiful video
            experiences with ease.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="min-w-32">
              <Link href="/docs/introduction">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-32">
              <Link href="https://github.com/2004durgesh/react-native-video-toolkit" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        {/* Video Demo Section */}
        <div className="w-full max-w-5xl mx-auto px-4 pb-12">
          <div className="relative">
            {/* Video container with better styling */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
              <video
                src="/example-tv.mp4"
                autoPlay
                muted
                loop
                className="w-full h-auto aspect-video object-cover"
                poster="/icon.png"
              />
              {/* Overlay gradient for better visual */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
              Built with modern React Native patterns and best practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">🎬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Customizable UI</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Fully customizable video player components that match your app's design system and brand identity.
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 2 */}
            <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">High Performance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Optimized for smooth playback, responsive interactions, and minimal memory footprint.
                </p>
              </CardContent>
            </Card>

            {/* Feature Card 3 */}
            <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/10 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Developer Friendly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Simple API with full TypeScript support, comprehensive docs, and extensive examples.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">React Native Video Toolkit</span>
              <span className="text-foreground/50">•</span>
              <span className="text-foreground/70 text-sm">Built with ❤️ for React Native</span>
            </div>
            <div className="flex gap-6 text-sm text-foreground/70">
              <Link href="/docs" className="hover:text-primary transition-colors">
                Documentation
              </Link>
              <Link
                href="https://github.com/2004durgesh/react-native-video-toolkit"
                target="_blank"
                className="hover:text-primary transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
