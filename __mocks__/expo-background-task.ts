export enum BackgroundTaskResult {
  Success = 1,
  Failed = 2,
}

export const registerTaskAsync = jest.fn(() => Promise.resolve());
