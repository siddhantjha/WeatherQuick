import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { useRecommendation } from '../../hooks/useRecommendation';
import { useSharing } from '../../hooks/useSharing';
import { RecommendationType } from '../../services/RecommendationService';

interface RecommendationCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: RecommendationType;
  suitability?: number;
  isEssential?: boolean;
  locationId: string;
  weatherCondition: string;
  temperature: number;
  style?: ViewStyle;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  id,
  title,
  description,
  icon,
  type,
  suitability,
  isEssential = false,
  locationId,
  weatherCondition,
  temperature,
  style,
}) => {
  const { recordRecommendationShown, saveUserFeedback } = useRecommendation();
  const { shareRecommendation, isSharing } = useSharing();
  const [recordedId, setRecordedId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const cardRef = useRef(null);

  // Record when a recommendation is shown
  useEffect(() => {
    const recordView = async () => {
      if (recordedId !== id) {
        await recordRecommendationShown(id, type, locationId, weatherCondition, temperature);
        setRecordedId(id);
      }
    };
    
    recordView();
  }, [id, type, locationId, weatherCondition, temperature]);

  // Determine background color based on suitability or essential status
  const getBackgroundColor = () => {
    if (type === RecommendationType.HEALTH) {
      return colors.errorLight; // Health advisories always have attention color
    }
    
    if (type === RecommendationType.CLOTHING && isEssential) {
      return colors.warningLight; // Essential clothing has warning color
    }
    
    if (suitability !== undefined) {
      if (suitability >= 8) return colors.successLight;
      if (suitability >= 5) return colors.warningLight;
      return colors.errorLight;
    }
    
    return colors.card; // Default background
  };

  // Determine icon color based on suitability or essential status
  const getIconColor = () => {
    if (type === RecommendationType.HEALTH) {
      return colors.error;
    }
    
    if (type === RecommendationType.CLOTHING && isEssential) {
      return colors.warning;
    }
    
    if (suitability !== undefined) {
      if (suitability >= 8) return colors.success;
      if (suitability >= 5) return colors.warning;
      return colors.error;
    }
    
    return colors.primary;
  };

  // Submit user feedback
  const handleFeedback = async (helpful: boolean) => {
    if (!feedbackSubmitted) {
      await saveUserFeedback(id, helpful);
      setFeedbackSubmitted(true);
    }
  };

  // Handle sharing of this recommendation
  const handleShare = async () => {
    try {
      await shareRecommendation(
        type,
        title,
        description,
        locationId,
        weatherCondition,
        temperature
      );
    } catch (error) {
      console.error('Error sharing recommendation:', error);
      Alert.alert('Sharing Failed', 'Unable to share this recommendation. Please try again later.');
    }
  };

  return (
    <View 
      ref={cardRef}
      style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}
      accessibilityRole="article"
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color={getIconColor()} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing}
          accessibilityLabel="Share this recommendation"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      {suitability !== undefined && (
        <View style={styles.suitabilityContainer}>
          <Text style={styles.suitabilityLabel}>Suitability:</Text>
          <View style={styles.suitabilityBar}>
            <View 
              style={[
                styles.suitabilityFill, 
                { width: `${suitability * 10}%` },
                suitability >= 8 ? styles.suitabilityHigh : 
                suitability >= 5 ? styles.suitabilityMedium : 
                styles.suitabilityLow
              ]} 
            />
          </View>
          <Text style={styles.suitabilityValue}>{suitability}/10</Text>
        </View>
      )}
      
      {isEssential && (
        <View style={styles.essentialBadge}>
          <Ionicons name="alert-circle" size={14} color={colors.warning} />
          <Text style={styles.essentialText}>Essential</Text>
        </View>
      )}
      
      {type === RecommendationType.HEALTH && (
        <View style={styles.advisoryBadge}>
          <Ionicons name="medical" size={14} color={colors.error} />
          <Text style={styles.advisoryText}>Health Advisory</Text>
        </View>
      )}
      
      {!feedbackSubmitted ? (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackQuestion}>Was this recommendation helpful?</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity 
              style={styles.feedbackButton} 
              onPress={() => handleFeedback(true)}
              accessibilityLabel="Yes, this recommendation was helpful"
              accessibilityRole="button"
            >
              <Ionicons name="thumbs-up" size={18} color={colors.success} />
              <Text style={styles.feedbackButtonText}>Yes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.feedbackButton}
              onPress={() => handleFeedback(false)}
              accessibilityLabel="No, this recommendation was not helpful"
              accessibilityRole="button"
            >
              <Ionicons name="thumbs-down" size={18} color={colors.error} />
              <Text style={styles.feedbackButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.feedbackThankYou}>
          Thanks for your feedback!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  suitabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  suitabilityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  suitabilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  suitabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  suitabilityHigh: {
    backgroundColor: colors.success,
  },
  suitabilityMedium: {
    backgroundColor: colors.warning,
  },
  suitabilityLow: {
    backgroundColor: colors.error,
  },
  suitabilityValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    width: 40,
    textAlign: 'right',
  },
  essentialBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  essentialText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  advisoryBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  advisoryText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  feedbackContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
  },
  feedbackQuestion: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  feedbackButtons: {
    flexDirection: 'row',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 4,
  },
  feedbackButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text,
  },
  feedbackThankYou: {
    marginTop: 12,
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default RecommendationCard; 