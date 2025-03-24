import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { colors } from '../../styles/colors';

interface LanguageSelectorProps {
  style?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ style }) => {
  const { t, currentLanguage, availableLanguages, changeLanguage } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageSelect = async (langCode: string) => {
    await changeLanguage(langCode);
    setModalVisible(false);
  };

  // Get current language display name
  const currentLanguageName = availableLanguages[currentLanguage];

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{t('language')}</Text>
          <Text style={styles.value}>{currentLanguageName}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language')}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.entries(availableLanguages)}
              keyExtractor={([code]) => code}
              renderItem={({ item: [code, name] }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    code === currentLanguage && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageSelect(code)}
                >
                  <Text
                    style={[
                      styles.languageName,
                      code === currentLanguage && styles.selectedLanguageName,
                    ]}
                  >
                    {name}
                  </Text>
                  {code === currentLanguage && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  value: {
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    paddingBottom: 30, // For safe area
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  selectedLanguageItem: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  languageName: {
    fontSize: 16,
    color: colors.text,
  },
  selectedLanguageName: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
});

export default LanguageSelector; 