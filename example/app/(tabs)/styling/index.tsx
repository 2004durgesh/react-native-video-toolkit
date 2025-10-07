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
          {/* <DemoCard
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
          /> */}
        </DemoSection>
      </ScrollView>
    </DemoScreen>
  );
}
