"""Prints a song's waveform and length for the TRACKS list in site/index.html:  python3 tools/peaks.py site/audio/Song.mp3

The waveform is the song's loudness in 160 slices, each packed as one character (0 quiet to z loud), so a song's whole
shape is one short string. Needs ffmpeg and numpy."""
import json, subprocess, sys
import numpy as np
f = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
rms = np.array([np.sqrt(np.mean(c * c)) for c in np.array_split(a, 160)])
v = np.clip((rms / rms.max()) ** 0.8, 0.04, 1)
print(f"dur: {len(a) / 8000:.1f}, peaks: " + json.dumps("".join(chr(48 + int(round(x * 74))) for x in v)))
