import { render } from '@testing-library/react-native';
import { setAudioModeAsync } from 'expo-audio';

jest.mock('../../src/lib/bell-engine', () => ({
  scheduleBellNotifications: jest.fn(),
  requestNotificationPermissions: jest.fn(() => Promise.resolve(true)),
}));

import RootLayout from '../_layout';

describe('RootLayout', () => {
  it('puts the audio session in a category that ignores the silent switch', () => {
    render(<RootLayout />);

    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });
});
