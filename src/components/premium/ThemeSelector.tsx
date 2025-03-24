import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import { colors } from '../../styles/colors';

interface ThemeSelectorProps {
  onPremiumRequired?: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onPremiumRequired }) => {
  const { currentTheme, themes, changeTheme } = useTheme();
  const { isPremium } = useSubscription();
  const [modalVisible, setModalVisible] = useState(false);

  const handleThemeChange = (themeKey: string) => {
    if (!isPremium && themeKey !== 'default') {
      if (onPremiumRequired) {
        onPremiumRequired();
      } else {
        Alert.alert(
          'Premium Feature',
          'Custom themes are only available to premium users. Upgrade to Premium to access this feature.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              // Navigate to subscription screen
            }},
          ]
        );
      }
      return;
    }

    changeTheme(themeKey);
    setModalVisible(false);
  };

  const renderThemeOption = (themeKey: string, themeName: string, isPremiumTheme: boolean) => {
    const isSelected = currentTheme === themeKey;
    
    return (
      <TouchableOpacity
        key={themeKey}
        style={[
          styles.themeOption,
          isSelected && styles.themeOptionSelected,
        ]}
        onPress={() => handleThemeChange(themeKey)}
        disabled={isSelected}
      >
        <View style={styles.themeOptionHeader}>
          <Text style={[
            styles.themeOptionTitle,
            isSelected && styles.themeOptionTitleSelected,
          ]}>
            {themeName}
          </Text>
          
          {isPremiumTheme && !isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={colors.white} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
          
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          )}
        </View>
        
        <View style={styles.themePreview}>
          <View 
            style={[
              styles.themePreviewElement, 
              { backgroundColor: themes[themeKey].colors.background }
            ]}
          >
            <View 
              style={[
                styles.themePreviewHeader,
                { backgroundColor: themes[themeKey].colors.primary }
              ]}
            />
            <View 
              style={[
                styles.themePreviewCard, 
                { backgroundColor: themes[themeKey].colors.card }
              ]}
            />
            <View style={styles.themePreviewButtons}>
              <View 
                style={[
                  styles.themePreviewButton, 
                  { backgroundColor: themes[themeKey].colors.primary }
                ]}
              />
              <View 
                style={[
                  styles.themePreviewButton, 
                  { backgroundColor: themes[themeKey].colors.secondary }
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorTitle}>App Theme</Text>
            <Text style={styles.selectorValue}>
              {Object.keys(themes).find(key => key === currentTheme)
                ? themes[currentTheme].name
                : 'Default'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Theme</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.themeList}>
              {/* Default theme (always available) */}
              {renderThemeOption('default', 'Default', false)}
              
              {/* Premium themes */}
              {renderThemeOption('dark', 'Dark Mode', true)}
              {renderThemeOption('night', 'Night Blue', true)}
              {renderThemeOption('sunset', 'Sunset Orange', true)}
              {renderThemeOption('forest', 'Forest Green', true)}
              {renderThemeOption('purple', 'Royal Purple', true)}
              
              {!isPremium && (
                <View style={styles.premiumPromo}>
                  <Ionicons name="star" size={24} color={colors.primary} />
                  <Text style={styles.premiumPromoTitle}>
                    Get Premium for Custom Themes
                  </Text>
                  <Text style={styles.premiumPromoText}>
                    Upgrade to Premium to unlock all custom themes and personalize your weather experience.
                  </Text>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={onPremiumRequired}
                  >
                    <Text style={styles.upgradeButtonText}>
                      Upgrade to Premium
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorTextContainer: {
    marginLeft: 12,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  themeList: {
    paddingHorizontal: 20,
  },
  themeOption: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: colors.primary,
  },
  themeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  themeOptionTitleSelected: {
    color: colors.primary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 4,
  },
  themePreview: {
    alignItems: 'center',
  },
  themePreviewElement: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  themePreviewHeader: {
    height: 20,
    width: '100%',
  },
  themePreviewCard: {
    margin: 10,
    height: 40,
    borderRadius: 6,
  },
  themePreviewButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  themePreviewButton: {
    width: 50,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  premiumPromo: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  premiumPromoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  premiumPromoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ThemeSelector; 