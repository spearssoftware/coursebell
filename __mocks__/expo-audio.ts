const mockPlayer = {
  play: jest.fn(),
  replace: jest.fn(),
  release: jest.fn(),
};

export const useAudioPlayer = jest.fn(() => mockPlayer);
