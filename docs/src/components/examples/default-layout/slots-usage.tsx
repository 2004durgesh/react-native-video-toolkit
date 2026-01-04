'use client';
import { VideoPlayer, DefaultLayout, BaseIconButton, useVideo } from 'react-native-video-toolkit';
import { Heart } from 'lucide-react';

export const SlotsUsage = () => {
  const { state } = useVideo();
  const { theme } = state;
  const LikeButton = () => (
    <BaseIconButton IconComponent={Heart} onTap={() => alert('Liked!')} size={theme.iconSizes.md} color="white" />
  );
  return (
    <VideoPlayer
      // @ts-ignore
      containerStyle={{
        width: '100%',
        height: '50vh', // for web, take full height of the viewport, since the example is been rendered on web
      }}
      videoStyle={{ height: '50%' }}
      source={{ uri: '/test.mp4' }}>
      <DefaultLayout
        title="My Awesome Video"
        slots={{
          beforeFullscreenButton: <LikeButton />,
        }}
      />
    </VideoPlayer>
  );
};
