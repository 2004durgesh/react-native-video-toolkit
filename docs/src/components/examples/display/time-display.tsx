'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TimeDisplay, useProgress } from 'react-native-video-toolkit';

interface TimeDisplayDemoProps {
  title: string;
  type?: 'current' | 'duration' | 'both';
}

const TimeDisplayDemo = ({ title, type }: TimeDisplayDemoProps) => {
  return (
    <Card className="flex-1 min-w-[200px]">
      <CardHeader className="pb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <TimeDisplay type={type} />
      </CardContent>
    </Card>
  );
};

export const TimeDisplayExample = () => {
  const { setDuration, setCurrentTime } = useProgress();

  useEffect(() => {
    setDuration(300); // Set total duration to 5 minutes
    setCurrentTime(120); // Set current time to 2 minutes
  }, [setDuration, setCurrentTime]);

  return (
    <View style={styles.container}>
      <TimeDisplayDemo title="Default (Both)" />
      <TimeDisplayDemo title="Current Time Only" type="current" />
      <TimeDisplayDemo title="Duration Only" type="duration" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    maxWidth: 800,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
});
