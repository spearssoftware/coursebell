import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '../src/store/settings-store';
import { colors, spacing, borderRadius, fontSize } from '../src/theme';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: 'notifications';
}

const STEPS: OnboardingStep[] = [
  {
    icon: 'school-outline',
    title: 'Welcome to CourseBell',
    description:
      'CourseBell helps you never miss a bell. Set up your school schedule and get notified before each period starts and ends.',
  },
  {
    icon: 'calendar-outline',
    title: 'Build Your Schedule',
    description:
      'Create your weekly schedule with custom periods, start and end times, and bell preferences for each day.',
  },
  {
    icon: 'notifications-outline',
    title: 'Stay on Time',
    description:
      "Get bell notifications so you always know when it's time to wrap up or move to your next class.",
    action: 'notifications',
  },
  {
    icon: 'qr-code-outline',
    title: "You're All Set!",
    description:
      'Head to the Schedule tab to build your first day. You can also share schedules with QR codes.',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [notificationsRequested, setNotificationsRequested] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    flatListRef.current?.scrollToIndex({ index: step, animated: true });
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1);
    } else {
      await completeOnboarding();
      router.replace('/(tabs)');
    }
  };

  const handleRequestNotifications = async () => {
    await Notifications.requestPermissionsAsync();
    setNotificationsRequested(true);
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const showNotificationButton =
    step.action === 'notifications' && !notificationsRequested;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={({ item }) => (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={64} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        {showNotificationButton && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleRequestNotifications}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={20} color={colors.white} />
            <Text style={styles.notificationButtonText}>
              Enable Notifications
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => goToStep(currentStep - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, isLast && styles.doneButton]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
            {!isLast && (
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepContainer: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  notificationButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  doneButton: {
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
