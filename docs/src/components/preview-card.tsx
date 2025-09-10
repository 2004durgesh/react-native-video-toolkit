'use client';

// import { RnrIcon } from '@docs/components/icons/rnr-icon';
// import { PlatformSelect, usePlatform } from '@docs/components/platform-select';
import { useParams } from 'next/navigation';
// import { QRCodeSVG } from 'qrcode.react';
import * as React from 'react';

type PreviewCardProps = {
  preview: React.ReactNode;
};

export function PreviewCard({ preview }: PreviewCardProps) {
  const params = useParams<{ slug: string[] }>();

  const component = params.slug.at(-1);

  return (
    <>
      <div className="group/copy bg-card not-prose relative flex min-h-[450px] flex-col rounded-md border p-4">
        <div className="flex flex-1 flex-col items-center justify-center">{preview}</div>
      </div>
      <a
        href={`https://reactnativereusables.com/showcase/links/${component}`}
        target="_blank"
        className="not-prose bg-primary text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 mt-4 inline-flex w-full shrink-0 items-center gap-2.5 rounded-lg p-2.5 text-sm font-medium shadow-sm outline-none transition-all focus-visible:ring-[3px] sm:hidden dark:p-2 [&_svg]:shrink-0">
        <div className="flex flex-col gap-1">
          <p className="leading-none">Tap to preview in the app</p>
          <p className="text-[1.3rem] font-semibold leading-none">React Native Reusables</p>
        </div>
      </a>
    </>
  );
}

export function BlockPreviewCard({ preview }: PreviewCardProps) {
  return (
    <div className="group/copy bg-card not-prose relative flex min-h-[450px] flex-col rounded-md border">
      <div className="flex flex-1 flex-col items-center justify-center py-6 sm:px-4 sm:py-8">{preview}</div>
    </div>
  );
}
