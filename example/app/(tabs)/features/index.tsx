import React from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { DemoScreen, DemoCard, DemoSection } from '../../components/DemoComponents';

export default function FeaturesScreen() {
  return (
    <DemoScreen title="Features" description="Explore individual components and capabilities" showBackButton={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DemoSection title="🎛️ Controls & Components">
          <DemoCard
            title="Control Components"
            description="Play, pause, progress, volume, and fullscreen controls"
            icon="options-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/features/controls')}
          />
          <DemoCard
            title="Gesture Controls"
            description="Touch gestures, pinch to zoom, and double tap"
            icon="hand-right-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/features/gestures')}
          />
          <DemoCard
            title="Hooks & State"
            description="Custom hooks for video state management"
            icon="code-slash-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/features/hooks')}
          />
        </DemoSection>

        <DemoSection title="⚙️ Configuration">
          <DemoCard
            title="Player Configuration"
            description="Autoplay, control behavior, and event handling"
            icon="settings-outline"
            color="#AF52DE"
            onPress={() => router.push('/(tabs)/features/configuration')}
            disabled
          />
          <DemoCard
            title="Video Sources"
            description="Different video formats and source types"
            icon="videocam-outline"
            color="#FF3B30"
            onPress={() => router.push('/(tabs)/features/sources')}
            disabled
          />
          <DemoCard
            title="Performance"
            description="Optimization tips and best practices"
            icon="speedometer-outline"
            color="#5856D6"
            onPress={() => router.push('/(tabs)/features/performance')}
            disabled
          />
        </DemoSection>

        <DemoSection title="📚 Documentation">
          <DemoCard
            title="API Reference"
            description="Complete props and methods documentation"
            icon="library-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/features/api')}
          />
          <DemoCard
            title="Examples"
            description="Code examples and implementation patterns"
            icon="code-working-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/features/examples')}
            disabled
          />
          <DemoCard
            title="Troubleshooting"
            description="Common issues and solutions"
            icon="help-circle-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/features/troubleshooting')}
            disabled
          />
        </DemoSection>
      </ScrollView>
    </DemoScreen>
  );
}
