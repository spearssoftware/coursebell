import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScheduleStore } from '../schedule-store';
import type { Period } from '../../types';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

const PERIOD_BASE = {
  startTime: '08:00',
  endTime: '08:50',
  bellAtStart: true,
  bellAtEnd: true,
  bellBeforeEnd: false,
} satisfies Partial<Omit<Period, 'id' | 'label' | 'sortOrder'>>;

function emptyWeek() {
  return Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, periods: [] as Period[] }));
}

function getDay(dayOfWeek: number) {
  return useScheduleStore.getState().days.find((d) => d.dayOfWeek === dayOfWeek)!;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.clear();
  useScheduleStore.setState({ days: emptyWeek(), isLoaded: true, history: [] });
});

// ---------------------------------------------------------------------------
// addPeriod
// ---------------------------------------------------------------------------
describe('addPeriod', () => {
  it('adds a period to the correct day', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });

    expect(getDay(1).periods).toHaveLength(1);
    expect(getDay(1).periods[0].label).toBe('P1');
  });

  it('does not affect other days', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });

    expect(getDay(2).periods).toHaveLength(0);
  });

  it('assigns sequential sortOrders', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    await useScheduleStore.getState().addPeriod(1, { label: 'P2', ...PERIOD_BASE });

    expect(getDay(1).periods[0].sortOrder).toBe(0);
    expect(getDay(1).periods[1].sortOrder).toBe(1);
  });

  it('assigns an id', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });

    expect(getDay(1).periods[0].id).toBeTruthy();
  });

  it('creates a history snapshot before adding', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });

    const { history } = useScheduleStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].label).toBe('Before adding period');
  });

  it('persists days to AsyncStorage', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@classhop/days', expect.any(String));
  });
});

// ---------------------------------------------------------------------------
// updatePeriod
// ---------------------------------------------------------------------------
describe('updatePeriod', () => {
  beforeEach(async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    useScheduleStore.setState({ history: [] }); // reset snapshot from addPeriod
  });

  it('updates the specified field', async () => {
    const period = getDay(1).periods[0];
    await useScheduleStore.getState().updatePeriod(1, period.id, { label: 'Renamed' });

    expect(getDay(1).periods[0].label).toBe('Renamed');
  });

  it('does not change the period id or sortOrder', async () => {
    const period = getDay(1).periods[0];
    await useScheduleStore.getState().updatePeriod(1, period.id, { label: 'Renamed' });

    expect(getDay(1).periods[0].id).toBe(period.id);
    expect(getDay(1).periods[0].sortOrder).toBe(0);
  });

  it('does NOT create a history snapshot', async () => {
    const period = getDay(1).periods[0];
    await useScheduleStore.getState().updatePeriod(1, period.id, { label: 'Renamed' });

    expect(useScheduleStore.getState().history).toHaveLength(0);
  });

  it('does not affect other periods', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P2', ...PERIOD_BASE });
    const p1 = getDay(1).periods[0];
    const p2 = getDay(1).periods[1];

    await useScheduleStore.getState().updatePeriod(1, p1.id, { label: 'Changed' });

    expect(getDay(1).periods[1].id).toBe(p2.id);
    expect(getDay(1).periods[1].label).toBe('P2');
  });
});

// ---------------------------------------------------------------------------
// deletePeriod
// ---------------------------------------------------------------------------
describe('deletePeriod', () => {
  beforeEach(async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    await useScheduleStore.getState().addPeriod(1, { label: 'P2', ...PERIOD_BASE });
    await useScheduleStore.getState().addPeriod(1, { label: 'P3', ...PERIOD_BASE });
    useScheduleStore.setState({ history: [] });
  });

  it('removes the correct period', async () => {
    const target = getDay(1).periods[1]; // P2
    await useScheduleStore.getState().deletePeriod(1, target.id);

    const remaining = getDay(1).periods.map((p) => p.label);
    expect(remaining).toEqual(['P1', 'P3']);
  });

  it('reindexes sortOrders after deletion', async () => {
    const target = getDay(1).periods[0]; // delete P1
    await useScheduleStore.getState().deletePeriod(1, target.id);

    expect(getDay(1).periods[0].sortOrder).toBe(0);
    expect(getDay(1).periods[1].sortOrder).toBe(1);
  });

  it('creates a history snapshot before deleting', async () => {
    const target = getDay(1).periods[0];
    await useScheduleStore.getState().deletePeriod(1, target.id);

    const { history } = useScheduleStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].label).toContain('Before deleting');
    expect(history[0].label).toContain('P1');
  });

  it('does not affect other days', async () => {
    await useScheduleStore.getState().addPeriod(2, { label: 'Tue', ...PERIOD_BASE });
    const target = getDay(1).periods[0];
    await useScheduleStore.getState().deletePeriod(1, target.id);

    expect(getDay(2).periods).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// copyDay
// ---------------------------------------------------------------------------
describe('copyDay', () => {
  beforeEach(async () => {
    await useScheduleStore.getState().addPeriod(1, {
      label: 'P1', startTime: '08:00', endTime: '08:50',
      bellAtStart: true, bellAtEnd: true, bellBeforeEnd: false,
    });
    await useScheduleStore.getState().addPeriod(1, {
      label: 'P2', startTime: '09:00', endTime: '09:50',
      bellAtStart: false, bellAtEnd: true, bellBeforeEnd: true,
    });
    useScheduleStore.setState({ history: [] });
  });

  it('copies all periods to the target day', async () => {
    await useScheduleStore.getState().copyDay(1, 2);

    expect(getDay(2).periods).toHaveLength(2);
    expect(getDay(2).periods[0].label).toBe('P1');
    expect(getDay(2).periods[1].label).toBe('P2');
  });

  it('preserves period data in the copy', async () => {
    await useScheduleStore.getState().copyDay(1, 2);

    expect(getDay(2).periods[0].startTime).toBe('08:00');
    expect(getDay(2).periods[1].bellBeforeEnd).toBe(true);
  });

  it('gives copies new unique IDs', async () => {
    const sourceIds = getDay(1).periods.map((p) => p.id);
    await useScheduleStore.getState().copyDay(1, 2);

    const copyIds = getDay(2).periods.map((p) => p.id);
    expect(copyIds[0]).not.toBe(sourceIds[0]);
    expect(copyIds[1]).not.toBe(sourceIds[1]);
  });

  it('does not modify the source day', async () => {
    await useScheduleStore.getState().copyDay(1, 2);

    expect(getDay(1).periods).toHaveLength(2);
  });

  it('overwrites existing periods on target day', async () => {
    await useScheduleStore.getState().addPeriod(2, { label: 'Old', ...PERIOD_BASE });
    await useScheduleStore.getState().copyDay(1, 2);

    const labels = getDay(2).periods.map((p) => p.label);
    expect(labels).not.toContain('Old');
    expect(labels).toContain('P1');
  });

  it('creates a history snapshot before copying', async () => {
    await useScheduleStore.getState().copyDay(1, 2);

    const { history } = useScheduleStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].label).toContain('Before copying');
  });
});

// ---------------------------------------------------------------------------
// restoreSnapshot
// ---------------------------------------------------------------------------
describe('restoreSnapshot', () => {
  it('restores days to the snapshot state', async () => {
    // Snapshot is taken before the first add (empty week)
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    const emptySnapshotId = useScheduleStore.getState().history[0].id;

    // Add another period to dirty the state
    await useScheduleStore.getState().addPeriod(1, { label: 'P2', ...PERIOD_BASE });

    await useScheduleStore.getState().restoreSnapshot(emptySnapshotId);

    expect(getDay(1).periods).toHaveLength(0);
  });

  it('saves current state to history before restoring', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    const snapshotId = useScheduleStore.getState().history[0].id;
    const historyCountBefore = useScheduleStore.getState().history.length;

    await useScheduleStore.getState().restoreSnapshot(snapshotId);

    expect(useScheduleStore.getState().history.length).toBeGreaterThan(historyCountBefore);
  });

  it('does nothing for an unknown snapshot id', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'P1', ...PERIOD_BASE });
    const periodsBefore = getDay(1).periods;

    await useScheduleStore.getState().restoreSnapshot('nonexistent-id');

    expect(getDay(1).periods).toEqual(periodsBefore);
  });
});

// ---------------------------------------------------------------------------
// importSchedule
// ---------------------------------------------------------------------------
describe('importSchedule', () => {
  it('replaces current schedule with imported days', async () => {
    await useScheduleStore.getState().addPeriod(1, { label: 'Old', ...PERIOD_BASE });

    const importedDays = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      periods: i === 3
        ? [{ id: 'imported-1', label: 'Imported', sortOrder: 0, ...PERIOD_BASE }]
        : [] as Period[],
    }));
    await useScheduleStore.getState().importSchedule(importedDays);

    expect(getDay(1).periods).toHaveLength(0);
    expect(getDay(3).periods[0].label).toBe('Imported');
  });

  it('creates a history snapshot before importing', async () => {
    useScheduleStore.setState({ history: [] });
    await useScheduleStore.getState().importSchedule(emptyWeek());

    const { history } = useScheduleStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].label).toBe('Before importing schedule');
  });
});
