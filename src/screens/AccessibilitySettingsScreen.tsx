import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Slider,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../components/AccessibilityManager';
import { useTranslation } from '../hooks/useTranslation';
import { colors } from '../styles/colors';

const AccessibilitySettingsScreen: React.FC = () => {
  const { settings, updateSettings, isScreenReaderEnabled } = useAccessibility();
  const { t } = useTranslation();
  
  // Local font scale state for slider
  const [localFontScale, setLocalFontScale] = useState(settings.customFontScale);
  
  // Handle toggle switches
  const handleToggle = async (setting: keyof typeof settings, value: boolean) => {
    await updateSettings({ [setting]: value });
  };
  
  // Handle font scale changes
  const handleFontScaleComplete = async (value: number) => {
    await updateSettings({ customFontScale: value });
  };
  
  // Handle timeout slider changes
  const handleTimeoutComplete = async (value: number) => {
    await updateSettings({ touchAccommodationTimeout: value * 1000 }); // Convert to ms
  };
  
  // Function to format the font scale value for display
  const formatFontScale = (scale: number): string => {
    return scale.toFixed(1) + 'x';
  };
  
  // Function to format the timeout value for display
  const formatTimeout = (ms: number): string => {
    return (ms / 1000).toFixed(1) + 's';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        accessibilityLabel="Accessibility settings screen"
      >
        <Text style={styles.sectionTitle}>Text Size</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Enable Font Scaling</Text>
              <Text style={styles.settingDescription}>
                Apply custom font sizes to make text easier to read
              </Text>
            </View>
            <Switch
              value={settings.fontScaleEnabled}
              onValueChange={(value) => handleToggle('fontScaleEnabled', value)}
              accessibilityLabel="Enable font scaling toggle"
              accessibilityHint="Double tap to toggle font scaling"
              ios_backgroundColor={colors.border}
              trackColor={{ 
                false: Platform.OS === 'ios' ? colors.border : colors.border, 
                true: colors.primary 
              }}
              thumbColor={Platform.OS === 'ios' ? 
                undefined : 
                settings.fontScaleEnabled ? colors.white : colors.white
              }
            />
          </View>
          
          {settings.fontScaleEnabled && (
            <View style={styles.sliderContainer}>
              <Text style={styles.scaleValueText}>
                {formatFontScale(localFontScale)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.8}
                maximumValue={1.6}
                step={0.1}
                value={localFontScale}
                onValueChange={setLocalFontScale}
                onSlidingComplete={handleFontScaleComplete}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                accessibilityLabel={`Font scale: ${formatFontScale(localFontScale)}`}
                accessibilityHint="Slide left to decrease font size, slide right to increase"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>A</Text>
                <Text style={[styles.sliderLabel, { fontSize: 20 }]}>A</Text>
              </View>
            </View>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Visual</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>High Contrast Mode</Text>
              <Text style={styles.settingDescription}>
                Increase contrast for better readability
              </Text>
            </View>
            <Switch
              value={settings.highContrastEnabled}
              onValueChange={(value) => handleToggle('highContrastEnabled', value)}
              accessibilityLabel="High contrast mode toggle"
              accessibilityHint="Double tap to toggle high contrast mode"
              ios_backgroundColor={colors.border}
              trackColor={{ 
                false: Platform.OS === 'ios' ? colors.border : colors.border, 
                true: colors.primary 
              }}
              thumbColor={Platform.OS === 'ios' ? 
                undefined : 
                settings.highContrastEnabled ? colors.white : colors.white
              }
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Reduce Motion</Text>
              <Text style={styles.settingDescription}>
                Minimize animations and transitions
              </Text>
            </View>
            <Switch
              value={settings.reduceMotion}
              onValueChange={(value) => handleToggle('reduceMotion', value)}
              accessibilityLabel="Reduce motion toggle"
              accessibilityHint="Double tap to toggle reduced motion"
              ios_backgroundColor={colors.border}
              trackColor={{ 
                false: Platform.OS === 'ios' ? colors.border : colors.border, 
                true: colors.primary 
              }}
              thumbColor={Platform.OS === 'ios' ? 
                undefined : 
                settings.reduceMotion ? colors.white : colors.white
              }
            />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Screen Reader</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Screen Reader Status</Text>
              <Text style={styles.settingDescription}>
                {isScreenReaderEnabled ? 'Screen reader is enabled' : 'Screen reader is disabled'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isScreenReaderEnabled ? colors.success : colors.border }
            ]}>
              <Text style={styles.statusText}>
                {isScreenReaderEnabled ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Enhanced Voice Feedback</Text>
              <Text style={styles.settingDescription}>
                Provide additional voice announcements for important events
              </Text>
            </View>
            <Switch
              value={settings.enhancedScreenReaderFeedback}
              onValueChange={(value) => handleToggle('enhancedScreenReaderFeedback', value)}
              accessibilityLabel="Enhanced voice feedback toggle"
              accessibilityHint="Double tap to toggle enhanced voice feedback"
              ios_backgroundColor={colors.border}
              trackColor={{ 
                false: Platform.OS === 'ios' ? colors.border : colors.border, 
                true: colors.primary 
              }}
              thumbColor={Platform.OS === 'ios' ? 
                undefined : 
                settings.enhancedScreenReaderFeedback ? colors.white : colors.white
              }
            />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Touch Accommodations</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Touch Accommodations</Text>
              <Text style={styles.settingDescription}>
                Adjust touch sensitivity for easier interaction
              </Text>
            </View>
            <Switch
              value={settings.touchAccommodationsEnabled}
              onValueChange={(value) => handleToggle('touchAccommodationsEnabled', value)}
              accessibilityLabel="Touch accommodations toggle"
              accessibilityHint="Double tap to toggle touch accommodations"
              ios_backgroundColor={colors.border}
              trackColor={{ 
                false: Platform.OS === 'ios' ? colors.border : colors.border, 
                true: colors.primary 
              }}
              thumbColor={Platform.OS === 'ios' ? 
                undefined : 
                settings.touchAccommodationsEnabled ? colors.white : colors.white
              }
            />
          </View>
          
          {settings.touchAccommodationsEnabled && (
            <View style={styles.sliderContainer}>
              <Text style={styles.scaleValueText}>
                {formatTimeout(settings.touchAccommodationTimeout)}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={2.0}
                step={0.1}
                value={settings.touchAccommodationTimeout / 1000}
                onSlidingComplete={handleTimeoutComplete}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                accessibilityLabel={`Touch timeout: ${formatTimeout(settings.touchAccommodationTimeout)}`}
                accessibilityHint="Slide left for shorter touch hold time, slide right for longer"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Faster</Text>
                <Text style={styles.sliderLabel}>Slower</Text>
              </View>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => updateSettings(DEFAULT_SETTINGS)}
          accessibilityLabel="Reset to default settings"
          accessibilityHint="Double tap to reset all accessibility settings to default values"
        >
          <Text style={styles.resetButtonText}>Reset to Default Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sliderContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleValueText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: colors.errorBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  resetButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AccessibilitySettingsScreen; 