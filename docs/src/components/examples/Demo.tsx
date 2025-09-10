'use client';
import { StyleSheet, Text } from 'react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Video from 'react-native-video';

export const Demo = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Demo</Text>
      <Video
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={{ width: 300, height: 200 }}
        controls
      />
    </GestureHandlerRootView>
  );
};

export default Demo;

const styles = StyleSheet.create({});
