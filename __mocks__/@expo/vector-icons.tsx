import { Text } from 'react-native';

function MockIcon({ name, testID, ...props }: { name: string; testID?: string; [key: string]: unknown }) {
  return <Text testID={testID}>{name}</Text>;
}

export const Ionicons = Object.assign(MockIcon, {
  glyphMap: {} as Record<string, number>,
});
