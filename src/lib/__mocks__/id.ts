let counter = 0;

export function generateId(): string {
  counter++;
  return `test-id-${counter}`;
}

export function resetIdCounter(): void {
  counter = 0;
}
