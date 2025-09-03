import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          {siteConfig.title}
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/getting-started">
            Get Started
          </Link>
          <Link className="button button--secondary button--lg" to={siteConfig.customFields.githubUrl as string}>
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function VisualDemo() {
  return (
    <section className={styles.visualDemo}>
      <div className="container">
        <div className={styles.visualDemoContent}>
          {/* 
            This is a placeholder for the animated GIF or video.
            Replace 'video-placeholder.mp4' with the actual media file in the 'static/img' directory.
          */}
          <video className={styles.demoVideo} autoPlay loop muted playsInline src="/img/video-placeholder.mp4" />
        </div>
      </div>
    </section>
  );
}

function CodeExample() {
  const CodeBlock = `
import { VideoPlayer } from 'react-native-video-toolkit';

const MyPlayer = () => (
  <VideoPlayer source={{ uri: "..." }}>
    <VideoPlayer.Overlay>
      <VideoPlayer.Controls />
    </VideoPlayer.Overlay>
  </VideoPlayer>
);
  `;

  return (
    <section className={styles.codeExample}>
      <div className="container">
        <Heading as="h2" className="text--center">
          See It In Action
        </Heading>
        <div className={styles.codeContainer}>
          <pre>
            <code>{CodeBlock}</code>
          </pre>
          <div className={styles.codeResult}>
            {/* This is a placeholder for the rendered component */}
            <p>Rendered player would appear here.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="The Complete Video Player Toolkit for React Native.">
      <HomepageHero />
      <main>
        <VisualDemo />
        <HomepageFeatures />
        <CodeExample />
      </main>
    </Layout>
  );
}
