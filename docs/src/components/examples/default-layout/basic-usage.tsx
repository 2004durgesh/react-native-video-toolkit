'use client';
import { VideoPlayer, DefaultLayout } from 'react-native-video-toolkit';

export const BasicUsage = () => {
  return (
    <VideoPlayer
      // @ts-ignore
      containerStyle={{
        width: '100%',
        height: '50vh', // for web, take full height of the viewport, since the example is been rendered on web
      }}
      videoStyle={{ height: '50%' }}
      source={{ uri: '/test.mp4' }}>
      <DefaultLayout title="My Awesome Video" subtitle="An example of the DefaultLayout" />
    </VideoPlayer>
  );
};
