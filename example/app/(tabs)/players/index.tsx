import React from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { DemoScreen, DemoCard, DemoSection } from '../../components/DemoComponents';

export default function PlayersScreen() {
  return (
    <DemoScreen title="Video Players" description="Different player implementations and layouts" showBackButton={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DemoSection title="🎬 Player Layouts">
          <DemoCard
            title="Default Layout"
            description="Pre-built layout with all controls included"
            icon="play-circle-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/players/default')}
          />
          <DemoCard
            title="Custom Layout"
            description="Build your own player with custom controls"
            icon="construct-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/players/custom')}
          />
        </DemoSection>
      </ScrollView>
    </DemoScreen>
  );
}
