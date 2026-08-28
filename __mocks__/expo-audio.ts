const mockPlayer = {
  play: jest.fn(),
  release: jest.fn(),
};

export type AudioPlayer = typeof mockPlayer;

export const createAudioPlayer = jest.fn(() => mockPlayer);
