export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
}));

export const useLocalSearchParams = jest.fn(() => ({}));
export const useSegments = jest.fn(() => []);
export const usePathname = jest.fn(() => '/');
export const useFocusEffect = jest.fn((cb: () => void) => cb());

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
  navigate: jest.fn(),
};

export const Link = 'Link';
export const Stack = {
  Screen: 'Screen',
};
export const Tabs = {
  Screen: 'Screen',
};
