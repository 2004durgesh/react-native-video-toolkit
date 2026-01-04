'use client';
import React from 'react';
import { BaseIconButton } from 'react-native-video-toolkit';
import { Heart } from 'lucide-react';

export const BaseIconButtonExample = () => {
  /**
   * Alert don't works on web so changed to window alert :P
   */
  return <BaseIconButton IconComponent={Heart} onTap={() => alert('Heart')} />;
};

export default BaseIconButtonExample;
