import React from 'react';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { DemoScreen, DemoCard, DemoSection } from '../../components/DemoComponents';

export default function StylingScreen() {
  return (
    <DemoScreen
      title="Styling & Themes"
      description="Customize the look and feel of your video player"
      showBackButton={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DemoSection title="🎨 Theming System">
          <DemoCard
            title="Theme Gallery"
            description="Pre-built themes and color schemes"
            icon="color-palette-outline"
            color="#AF52DE"
            onPress={() => router.push('/(tabs)/styling/themes')}
          />
          <DemoCard
            title="Custom Theming"
            description="Create your own themes and styles"
            icon="brush-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/styling/customization')}
          />
          <DemoCard
            title="Responsive Design"
            description="Adaptive layouts for different screen sizes"
            icon="resize-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/styling/responsive')}
          />
        </DemoSection>

        <DemoSection title="🎭 Style Components">
          <DemoCard
            title="Control Styling"
            description="Customize buttons, sliders, and progress bars"
            icon="options-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/styling/controls')}
            disabled
          />
          <DemoCard
            title="Layout Variations"
            description="Different control layouts and positioning"
            icon="grid-outline"
            color="#FF3B30"
            onPress={() => router.push('/(tabs)/styling/layouts')}
            disabled
          />
          <DemoCard
            title="Animation Styles"
            description="Custom animations and transitions"
            icon="flash-outline"
            color="#5856D6"
            onPress={() => router.push('/(tabs)/styling/animations')}
            disabled
          />
        </DemoSection>

        <DemoSection title="🛠️ Development Tools">
          <DemoCard
            title="Theme Builder"
            description="Interactive theme creation tool"
            icon="construct-outline"
            color="#34C759"
            onPress={() => router.push('/(tabs)/styling/builder')}
            disabled
          />
          <DemoCard
            title="Style Inspector"
            description="Debug and inspect component styles"
            icon="search-outline"
            color="#FF9500"
            onPress={() => router.push('/(tabs)/styling/inspector')}
            disabled
          />
          <DemoCard
            title="Export Themes"
            description="Export and share custom themes"
            icon="share-outline"
            color="#007AFF"
            onPress={() => router.push('/(tabs)/styling/export')}
            disabled
          />
        </DemoSection>
      </ScrollView>
    </DemoScreen>
  );
}
