'use client';
import { BaseButton } from 'react-native-video-toolkit';
import React from 'react';
import { Text } from 'react-native';

export function BaseButtonExample() {
  return (
    <div>
      <BaseButton
        onTap={() => {
          console.log('Button tapped!');
          alert('Button tapped!');
        }}>
        <Text style={{ color: 'white', padding: 10 }}>Tap Me</Text>
      </BaseButton>
    </div>
  );
}
