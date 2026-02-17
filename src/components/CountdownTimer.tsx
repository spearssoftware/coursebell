import { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { getSecondsUntil, formatCountdown } from '../lib/time-utils';
import { colors, fontSize } from '../theme';

interface CountdownTimerProps {
  targetTime: string;
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() => getSecondsUntil(targetTime));

  useEffect(() => {
    setSeconds(getSecondsUntil(targetTime));
    const interval = setInterval(() => {
      setSeconds(getSecondsUntil(targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <Text style={styles.countdown}>{formatCountdown(seconds)}</Text>;
}

const styles = StyleSheet.create({
  countdown: {
    fontSize: fontSize.giant,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: colors.primary,
    textAlign: 'center',
  },
});
