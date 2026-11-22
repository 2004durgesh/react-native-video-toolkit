import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { VideoProvider } from '../../providers/VideoProvider';
import { CaptionsPreview } from '../CaptionsPreview';

const textStyle = () => StyleSheet.flatten(screen.getByTestId('captions-preview-text').props.style);
const boxStyle = () => StyleSheet.flatten(screen.getByTestId('captions-preview').props.style);

describe('CaptionsPreview', () => {
  it("draws the sample in the theme's subtitle style", async () => {
    await render(
      <VideoProvider theme={{ captions: { color: '#FFEB3B', fontSize: 20, backgroundColor: 'transparent' } }}>
        <CaptionsPreview text="Hello there" />
      </VideoProvider>
    );
    expect(screen.getByTestId('captions-preview-text')).toHaveTextContent('Hello there');
    expect(textStyle()).toEqual(expect.objectContaining({ color: '#FFEB3B', fontSize: 20 }));
    expect(boxStyle().backgroundColor).toBe('transparent');
  });

  it("sizes 'auto' text for the picture height it's given", async () => {
    await render(
      <VideoProvider>
        <CaptionsPreview pictureHeight={400} />
      </VideoProvider>
    );
    expect(textStyle().fontSize).toBe(22);
  });
});
