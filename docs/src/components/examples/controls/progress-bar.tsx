'use client';
import React, { useEffect } from 'react';
import { ProgressBar, useProgress } from 'react-native-video-toolkit';

export const ProgressBarUsageExample = () => {
  const { setDuration, setCurrentTime } = useProgress();

  useEffect(() => {
    setDuration(300); // Set total duration to 5 minutes
    setCurrentTime(120); // Set current time to 2 minutes
  }, [setDuration, setCurrentTime]);
  return <ProgressBar />;
};
