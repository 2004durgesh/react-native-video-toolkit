'use client';
import { Text, Button } from 'react-native';
import React, { useState } from 'react';
import { BottomSheet } from 'react-native-video-toolkit';

export const BottomSheetExample = () => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(!visible)} title="Open Bottom Sheet" />
      <BottomSheet visible={visible} onClose={() => setVisible(false)}>
        <Text onPress={() => setVisible(false)} style={{ color: 'white' }}>
          Close Bottom Sheet
        </Text>
      </BottomSheet>
    </>
  );
};

export default BottomSheetExample;
