'use client';
import React from 'react';
import { Menu } from 'react-native-video-toolkit';

export const MenuExample = () => {
  return (
    <Menu.Root>
      <Menu.Trigger />

      <Menu.Content>
        <Menu.SubContent viewId="root">
          <Menu.Item navigateTo="quality">Quality</Menu.Item>
          <Menu.Item navigateTo="speed">Playback Speed</Menu.Item>
          <Menu.Item navigateTo="audio">Audio</Menu.Item>
        </Menu.SubContent>

        <Menu.SubContent viewId="quality">
          <Menu.Label>Video Quality</Menu.Label>
          <Menu.CheckboxItem checked={true} onCheckedChange={console.log}>
            1080p
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            720p
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            480p
          </Menu.CheckboxItem>
        </Menu.SubContent>

        <Menu.SubContent viewId="speed">
          <Menu.Label>Playback Speed</Menu.Label>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            0.5x
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={true} onCheckedChange={console.log}>
            1x
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            1.5x
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            2x
          </Menu.CheckboxItem>
        </Menu.SubContent>

        <Menu.SubContent viewId="audio">
          <Menu.Label>Audio Track</Menu.Label>
          <Menu.CheckboxItem checked={true} onCheckedChange={console.log}>
            English
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            Spanish
          </Menu.CheckboxItem>
          <Menu.CheckboxItem checked={false} onCheckedChange={console.log}>
            French
          </Menu.CheckboxItem>
        </Menu.SubContent>
      </Menu.Content>
    </Menu.Root>
  );
};
