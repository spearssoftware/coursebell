/** Parse "HH:MM" into { hours, minutes } */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h, minutes: m };
}

/** Convert hours + minutes to total minutes since midnight */
export function toMinutes(time: string): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

/** Check if timeA < timeB (both "HH:MM") */
export function isTimeBefore(a: string, b: string): boolean {
  return toMinutes(a) < toMinutes(b);
}

/** Check if timeA >= timeB (both "HH:MM") */
export function isTimeAfterOrEqual(a: string, b: string): boolean {
  return toMinutes(a) >= toMinutes(b);
}

/** Format "HH:MM" to "8:00 AM" style */
export function formatTimeDisplay(time: string): string {
  const { hours, minutes } = parseTime(time);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** Get current time as "HH:MM" */
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Get seconds remaining from now until target "HH:MM" */
export function getSecondsUntil(targetTime: string): number {
  const now = new Date();
  const { hours, minutes } = parseTime(targetTime);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
}

/** Format seconds as "1h 23m" or "12:34" */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Validate "HH:MM" format */
export function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}
