"""Generate CourseBell's bell/alert sounds into assets/sounds/.

All sounds are original additive/modal synthesis — no licensed audio. Some are
"inspired by" familiar phone sounds (Morse-code SMS beeps, whistle, chiptune)
but none reproduce copyrighted or trademarked audio.

Run from the repo root:  python3 scripts/generate-sounds.py
"""
import wave, struct, math, random

SR = 44100
random.seed(11)


def new(dur):
    return [0.0] * int(dur * SR)


def partial(buf, start, freq, amp, decay, dur=None, phase=0.0):
    """Exponentially decaying sine partial mixed in at start (seconds)."""
    n0 = int(start * SR)
    n = min(int(((dur if dur else decay * 7)) * SR), len(buf) - n0)
    w = 2 * math.pi * freq / SR
    for i in range(n):
        buf[n0 + i] += amp * math.exp(-i / (decay * SR)) * math.sin(w * i + phase)


def noise_burst(buf, start, amp, decay, dur, brightness=0.7):
    """Short filtered-noise strike transient."""
    n0 = int(start * SR)
    n = min(int(dur * SR), len(buf) - n0)
    prev = 0.0
    for i in range(n):
        white = random.uniform(-1, 1)
        hp = white - prev * (1 - brightness)
        prev = white
        buf[n0 + i] += amp * math.exp(-i / (decay * SR)) * hp


def tone(buf, start, dur, f0, amp, harmonics=((1, 1.0),), attack=0.006, release=0.03,
         glide_to=None, vib_hz=0.0, vib_depth=0.0):
    """Sustained tone with raised-cosine edges, optional glide and vibrato."""
    n0 = int(start * SR)
    n = min(int(dur * SR), len(buf) - n0)
    na, nr = int(attack * SR), int(release * SR)
    ph = 0.0
    for i in range(n):
        t = i / SR
        f = f0 if glide_to is None else f0 * (glide_to / f0) ** (t / dur)
        if vib_hz:
            f *= 1 + vib_depth * math.sin(2 * math.pi * vib_hz * t)
        ph += 2 * math.pi * f / SR
        s = sum(a * math.sin(k * ph) for k, a in harmonics)
        e = 1.0
        if i < na:
            e = 0.5 - 0.5 * math.cos(math.pi * i / na)
        if i > n - nr:
            e *= 0.5 - 0.5 * math.cos(math.pi * (n - i) / nr)
        buf[n0 + i] += amp * e * s


def bell_strike(buf, t, f0, amp, ratios, decays, detune=0.004, max_dur=None):
    """One metallic strike: transient + inharmonic partials."""
    noise_burst(buf, t, amp * 0.5, 0.007, 0.025)
    for r, d in zip(ratios, decays):
        f = f0 * r * (1 + random.uniform(-detune, detune))
        partial(buf, t, f, amp / (1 + 0.9 * (r - 1)), d,
                dur=(min(d * 6, max_dur) if max_dur else None),
                phase=random.uniform(0, 2 * math.pi))


def write_wav(name, buf, peak_dbfs=-1.0, fade_out=0.05):
    nfo = int(fade_out * SR)
    for i in range(nfo):
        buf[-1 - i] *= i / nfo
    peak = max(abs(s) for s in buf) or 1.0
    g = 10 ** (peak_dbfs / 20) / peak
    samples = [max(-32768, min(32767, round(s * g * 32767))) for s in buf]
    w = wave.open(f'assets/sounds/{name}.wav', 'wb')
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(struct.pack('<%dh' % len(samples), *samples))
    w.close()
    print(name, f'{len(samples)/SR:.2f}s')


WARM = ((1, 1.0), (2, 0.22), (3, 0.05))
BEEPY = ((1, 1.0), (3, 0.18))
ROUNDED_SQUARE = ((1, 1.0), (3, 0.25), (5, 0.08))

# ============ ALARM / BELL SOUNDS ============

# School bell: electric bell — rapid clapper rattle over a gong hum
DUR = 3.6
buf = new(DUR)
t = 0.0
while t < 2.8:
    bell_strike(buf, t, 1250, 0.55, [1.0, 1.79, 2.52, 3.36, 4.07],
                [0.05, 0.045, 0.04, 0.03, 0.025])
    t += (1 / 17.0) * (1 + random.uniform(-0.02, 0.02))
partial(buf, 0, 620, 0.25, 1.4, DUR)
partial(buf, 0, 828, 0.18, 1.1, DUR)
write_wav('school-bell', buf, fade_out=0.5)

# Dinner bell: swung hand bell — slower, ringy clangs
DUR = 3.9
buf = new(DUR)
t = 0.0
while t < 2.3:
    amp = random.uniform(0.75, 1.0)
    bell_strike(buf, t, 660, amp, [1.0, 1.51, 2.06, 2.72, 3.55, 4.40],
                [0.55, 0.42, 0.36, 0.28, 0.22, 0.17], max_dur=DUR - t)
    t += (1 / 5.2) * (1 + random.uniform(-0.08, 0.08))
write_wav('dinner-bell', buf, fade_out=0.6)

# Chime: soft two-note ding-dong (G5 -> E5), tubular voicing
DUR = 3.6
buf = new(DUR)
for start, f0 in [(0.0, 784.0), (0.45, 659.3)]:
    noise_burst(buf, start, 0.12, 0.005, 0.015, brightness=0.4)
    for r, d, a in [(1.00, 2.2, 1.00), (2.00, 1.4, 0.30), (2.99, 0.9, 0.15), (4.02, 0.5, 0.06)]:
        partial(buf, start, f0 * r, a, d, DUR - start)
        partial(buf, start, f0 * r * 1.0015, a * 0.4, d, DUR - start)
write_wav('chime', buf, fade_out=0.5)

# Sonar alarm: repeating pings with echo
buf = new(4.0)
for base in (0.0, 1.9):
    for k in range(4):
        st = base + k * 0.42
        partial(buf, st, 830, 1.0, 0.20)
        partial(buf, st, 1245, 0.30, 0.09)
        partial(buf, st + 0.16, 830, 0.30, 0.25)
write_wav('sonar-alarm', buf, fade_out=0.4)

# Classic alarm: escalating digital beep groups
buf = new(3.4)
t = 0.0
for amp in [0.45, 0.62, 0.8, 1.0]:
    for k in range(4):
        tone(buf, t, 0.065, 1240, amp, BEEPY, attack=0.003, release=0.01)
        t += 0.13
    t += 0.32
write_wav('classic-alarm', buf)

# Melodic alarm: gentle plucked motif
buf = new(3.2)
for f, st in [(523, 0.0), (659, 0.35), (784, 0.7), (1047, 1.05), (784, 1.5), (659, 1.85), (523, 2.2)]:
    for k, (a, d) in enumerate([(1.0, 0.5), (0.4, 0.3), (0.18, 0.2), (0.08, 0.14)], start=1):
        partial(buf, st, f * k, a, d)
write_wav('melodic-alarm', buf, fade_out=0.4)

# ============ WARNING SOUNDS ============

# Double beep
buf = new(0.55)
tone(buf, 0.00, 0.10, 950, 1.0, WARM)
tone(buf, 0.17, 0.10, 950, 1.0, WARM)
write_wav('double-beep', buf)

# Up and down: short rise-and-fall sweep
buf = new(0.75)
tone(buf, 0.0, 0.30, 640, 1.0, WARM, glide_to=980, release=0.005)
tone(buf, 0.30, 0.32, 980, 1.0, WARM, attack=0.005, glide_to=620)
write_wav('up-and-down', buf)

# Retro SMS: Morse code for "SMS" (... -- ...)
buf = new(1.9)
DIT, F = 0.065, 1320
t = 0.0
for sym in '...|--|...':
    if sym == '|':
        t += DIT * 2
        continue
    d = DIT if sym == '.' else DIT * 3
    tone(buf, t, d, F, 1.0, BEEPY, attack=0.004, release=0.01)
    t += d + DIT
write_wav('retro-sms', buf)

# Soft triple: ascending marimba arpeggio (G5 B5 D6)
buf = new(1.4)
for i, f in enumerate([784, 988, 1175]):
    st = i * 0.14
    partial(buf, st, f, 1.0, 0.30)
    partial(buf, st, f * 3.9, 0.22, 0.10)
    partial(buf, st, f * 9.2, 0.06, 0.05)
write_wav('soft-triple', buf)

# Whistle: two-phrase human whistle with vibrato
buf = new(1.15)
tone(buf, 0.00, 0.32, 1400, 1.0, ((1, 1.0),), attack=0.03, release=0.04,
     glide_to=1900, vib_hz=5.5, vib_depth=0.012)
tone(buf, 0.46, 0.48, 1900, 1.0, ((1, 1.0),), attack=0.03, release=0.08,
     glide_to=1320, vib_hz=5.5, vib_depth=0.015)
noise_burst(buf, 0.0, 0.03, 0.4, 1.0, brightness=0.9)
write_wav('whistle', buf)

# 8-bit: chiptune arpeggio — rounded-square timbre, lowered pitch and level
buf = new(0.6)
t = 0.0
for f, d in [(784, 0.05), (988, 0.05), (1175, 0.05), (1568, 0.22)]:
    tone(buf, t, d, f, 0.9, ROUNDED_SQUARE, attack=0.003, release=0.012,
         vib_hz=(6.0 if d > 0.1 else 0), vib_depth=0.01)
    t += d
write_wav('eight-bit', buf, peak_dbfs=-5.0)
