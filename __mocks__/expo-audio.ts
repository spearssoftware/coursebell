const mockPlayer = {
  play: jest.fn(),
  replace: jest.fn(),
  release: jest.fn(),
};

export const useAudioPlayer = jest.fn(() => mockPlayer);

export const setAudioModeAsync = jest.fn(() => Promise.resolve());
