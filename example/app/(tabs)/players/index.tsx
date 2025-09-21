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
          <DemoCard
            title="Compound Components"
            description="Flexible composition with individual components"
            icon="layers-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/players/compound')}
          />
        </DemoSection>

        <DemoSection title="📚 Setup & Documentation">
          <DemoCard
            title="Installation Guide"
            description="Step-by-step installation and setup"
            icon="download-outline"
            color="#5856D6"
            onPress={() => router.push('/(tabs)/players/installation')}
          />
          <DemoCard
            title="Video Sources"
            description="Different video formats and sources"
            icon="videocam-outline"
            color="#FF3B30"
            onPress={() => router.push('/(tabs)/players/sources')}
            disabled
          />
          <DemoCard
            title="Performance Tips"
            description="Optimization and best practices"
            icon="speedometer-outline"
            color="#AF52DE"
            onPress={() => router.push('/(tabs)/players/performance')}
            disabled
          />
        </DemoSection>
      </ScrollView>
    </DemoScreen>
  );
}
