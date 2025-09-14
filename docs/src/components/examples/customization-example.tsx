'use client';
import React from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { Slider } from 'react-native-awesome-slider';

export const CustomizationExample = () => {
  const progress = useSharedValue(30);
  const min = useSharedValue(0);
  const max = useSharedValue(100);

  return <Slider style={{ width: 300, height: 40 }} progress={progress} minimumValue={min} maximumValue={max} />;
};

export default CustomizationExample;
