import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useScheduleStore } from '../../src/store/schedule-store';
import { useSettingsStore } from '../../src/store/settings-store';
import { encodeSchedule, decodeSchedule } from '../../src/lib/qr-codec';
import { EmptyState } from '../../src/components/EmptyState';
import { colors, spacing, borderRadius, fontSize } from '../../src/theme';

type Tab = 'share' | 'import';

export default function ShareScreen() {
  const { days, importSchedule } = useScheduleStore();
  const { warningMinutes, setWarningMinutes } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<Tab>('share');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const hasPeriods = days.some((d) => d.periods.length > 0);
  const qrData = encodeSchedule(days, warningMinutes);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const result = decodeSchedule(data);
    if (!result) {
      Alert.alert('Invalid QR Code', 'This QR code does not contain a valid ClassHop schedule.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const dayCount = result.days.filter((d) => d.periods.length > 0).length;
    Alert.alert(
      'Import Schedule',
      `Found schedule with ${dayCount} day(s) configured.\n\nThis will replace your current schedule.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setScanned(false) },
        {
          text: 'Import',
          onPress: async () => {
            await importSchedule(result.days);
            setWarningMinutes(result.warningMinutes);
            Alert.alert('Imported!', 'Schedule has been imported successfully.');
            setScanned(false);
          },
        },
      ],
    );
  };

  const handleShareLink = async () => {
    const encoded = btoa(qrData);
    const url = `classhop://import?data=${encoded}`;
    try {
      await Share.share({ message: url });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'share' && styles.activeTab]}
          onPress={() => setActiveTab('share')}
        >
          <Text style={[styles.tabText, activeTab === 'share' && styles.activeTabText]}>
            Share
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'import' && styles.activeTab]}
          onPress={() => {
            setActiveTab('import');
            setScanned(false);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'share' ? (
        <ScrollView contentContainerStyle={styles.shareContent}>
          {hasPeriods ? (
            <>
              <View style={styles.qrCard}>
                <QRCode value={qrData} size={220} backgroundColor={colors.white} />
              </View>
              <Text style={styles.shareHint}>
                Have another teacher scan this QR code to share your schedule
              </Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
                <Text style={styles.shareButtonText}>Share Link</Text>
              </TouchableOpacity>
            </>
          ) : (
            <EmptyState
              icon="qr-code-outline"
              title="Nothing to share"
              subtitle="Add periods to your schedule first"
            />
          )}
        </ScrollView>
      ) : (
        <View style={styles.importContent}>
          {!permission?.granted ? (
            <View style={styles.permissionContainer}>
              <EmptyState
                icon="camera-outline"
                title="Camera access needed"
                subtitle="Allow camera access to scan QR codes"
              />
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
              </View>
              <Text style={styles.scanHint}>Point your camera at a ClassHop QR code</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    margin: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm - 2,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  shareContent: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  qrCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  shareHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  shareButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  shareButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  importContent: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
  },
  permissionButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: borderRadius.md,
  },
  scanHint: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
