import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScheduleStore } from '../src/store/schedule-store';
import { useSettingsStore } from '../src/store/settings-store';
import { decodeSchedule } from '../src/lib/qr-codec';

export default function ImportScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  const importSchedule = useScheduleStore((s) => s.importSchedule);
  const setWarningMinutes = useSettingsStore((s) => s.setWarningMinutes);

  useEffect(() => {
    if (!data) {
      Alert.alert('Invalid Link', 'No schedule data found in this link.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
      return;
    }

    let decoded: string;
    try {
      decoded = atob(decodeURIComponent(data));
    } catch {
      Alert.alert('Invalid Link', 'Could not decode schedule data.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
      return;
    }

    const result = decodeSchedule(decoded);
    if (!result) {
      Alert.alert('Invalid Link', 'This link does not contain a valid CourseBell schedule.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
      return;
    }

    const dayCount = result.days.filter((d) => d.periods.length > 0).length;
    Alert.alert(
      'Import Schedule',
      `Found schedule with ${dayCount} day(s) configured.\n\nThis will replace your current schedule.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/') },
        {
          text: 'Import',
          onPress: async () => {
            await importSchedule(result.days);
            setWarningMinutes(result.warningMinutes);
            Alert.alert('Imported!', 'Schedule has been imported successfully.', [
              { text: 'OK', onPress: () => router.replace('/') },
            ]);
          },
        },
      ],
    );
  }, [data]);

  return null;
}
