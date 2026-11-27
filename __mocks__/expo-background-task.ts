export enum BackgroundTaskResult {
  Success = 1,
}

export const registerTaskAsync = jest.fn(() => Promise.resolve());
