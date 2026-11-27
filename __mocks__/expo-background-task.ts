export enum BackgroundTaskStatus {
  Restricted = 1,
  Available = 2,
}

export enum BackgroundTaskResult {
  Success = 1,
  Failed = 2,
}

export const getStatusAsync = jest.fn(() => Promise.resolve(BackgroundTaskStatus.Available));
export const registerTaskAsync = jest.fn(() => Promise.resolve());
