'use client';
import React, { useState } from 'react';
import { Menu } from 'react-native-video-toolkit';

const QUALITIES = ['1080p', '720p', '480p'];
const SPEEDS = ['0.5x', '1x', '1.5x', '2x'];
const AUDIO = ['English', 'Spanish', 'French'];

export const MenuExample = () => {
  const [quality, setQuality] = useState('1080p');
  const [speed, setSpeed] = useState('1x');
  const [audio, setAudio] = useState('English');

  return (
    <Menu.Root>
      <Menu.Trigger />

      <Menu.Content>
        <Menu.SubContent viewId="root">
          <Menu.Item navigateTo="quality">Quality</Menu.Item>
          <Menu.Item navigateTo="speed">Playback Speed</Menu.Item>
          <Menu.Item navigateTo="audio">Audio</Menu.Item>
          <Menu.Separator />
          <Menu.CheckboxItem onCheckedChange={console.log}>Loop</Menu.CheckboxItem>
        </Menu.SubContent>

        <Menu.SubContent viewId="quality">
          <Menu.Label>Video Quality</Menu.Label>
          {QUALITIES.map((option) => (
            <Menu.RadioItem key={option} selected={option === quality} onSelect={() => setQuality(option)}>
              {option}
            </Menu.RadioItem>
          ))}
        </Menu.SubContent>

        <Menu.SubContent viewId="speed">
          {SPEEDS.map((option) => (
            <Menu.RadioItem key={option} selected={option === speed} onSelect={() => setSpeed(option)}>
              {option}
            </Menu.RadioItem>
          ))}
        </Menu.SubContent>

        <Menu.SubContent viewId="audio">
          <Menu.Label>Audio Track</Menu.Label>
          {AUDIO.map((option) => (
            <Menu.RadioItem key={option} selected={option === audio} onSelect={() => setAudio(option)}>
              {option}
            </Menu.RadioItem>
          ))}
        </Menu.SubContent>
      </Menu.Content>
    </Menu.Root>
  );
};
