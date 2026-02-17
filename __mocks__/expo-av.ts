const mockSound = {
  playAsync: jest.fn(),
  unloadAsync: jest.fn(),
};

export const Audio = {
  Sound: {
    createAsync: jest.fn(() => Promise.resolve({ sound: mockSound })),
  },
};
