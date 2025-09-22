'use client';
import React from 'react';
import { LoadingSpinner, useBuffering } from 'react-native-video-toolkit';
import { Button } from '@/components/ui/button';
import { View } from 'react-native';

export const LoadingSpinnerExample = () => {
  const { setBuffering } = useBuffering();

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
          position: 'absolute',
          top: 10,
        }}>
        <Button onClick={() => setBuffering(true)}>Start Buffering</Button>
        <Button onClick={() => setBuffering(false)}>Stop Buffering</Button>
      </View>
      <View style={{}}>
        <LoadingSpinner />
      </View>
    </>
  );
};
