import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BELL_SOUND_IDS } from '../../types';

const ROOT = join(__dirname, '..', '..', '..');

describe('sound assets', () => {
  it('has a bundled wav for every sound id', () => {
    for (const id of BELL_SOUND_IDS) {
      expect({ id, exists: existsSync(join(ROOT, 'assets', 'sounds', `${id}.wav`)) }).toEqual({ id, exists: true });
    }
  });

  it('registers exactly the sound ids in the expo-notifications plugin config', () => {
    const appJson = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')) as {
      expo: { plugins: Array<string | [string, { sounds?: string[] }]> };
    };
    const plugin = appJson.expo.plugins.find(
      (p): p is [string, { sounds?: string[] }] => Array.isArray(p) && p[0] === 'expo-notifications',
    );
    const registered = [...(plugin?.[1].sounds ?? [])].sort();
    const expected = BELL_SOUND_IDS.map((id) => `./assets/sounds/${id}.wav`).sort();
    expect(registered).toEqual(expected);
  });
});
