import { sleep, type Figure, type Sample, type Tracker } from "~/types2";

export const useAudioStore = defineStore("audioStore", () => {
  const audioContext = ref<AudioContext>();
  const figures = ref<Figure[]>([
    {
      name: "",
      color: "#D6B300",
      measureCount: 1,
      tempo: 120,
      patterns: [],
    },
  ]);
  const samples = ref<Sample[]>([]);
  const tracker = ref<Tracker>({ bpm: 120, tracks: [] });
  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");
  });

  async function playSample(
    s: Sample,
    velocity: number,
    melody: number,
    channel: ChannelMergerNode
  ) {
    if (audioContext.value) {
      const gain = (velocity * 2) / 10;
      const detune = melody * 100;

      const gainNode = audioContext.value.createGain();
      gainNode.gain.value = gain;
      s.source = audioContext.value.createBufferSource();
      s.source.buffer = s.audioBuffer;
      s.source.detune.value = detune;
      s.source.connect(channel);
      s.source.start();
    }
  }
  async function stopSample(s: Sample) {
    if (audioContext.value) {
      if (s.source) {
        s.source.stop();
        s.source = undefined;
      }
    }
  }

  async function playTracker() {
    if (isPlaying.value) return;
    isPlaying.value = true;
    let noteLength;
    let j = -1;
    let i = 0;
    while (isPlaying.value) {
      const maxMeasures = tracker.value.tracks.map((t) => {
        // TODO: Math.max(tracker.tracks...)
        if (t.figure) {
          return t.figure.measureCount;
        }
        return 0;
      });
      const m = Math.max(...maxMeasures);
      j++;
      if (j === 64) {
        j = 0;
      }
      cursor.value = j;
      if (j === 0) {
        i++;
      }
      if (i > m) {
        i = 1;
      }
      for (let k = 0; k < tracker.value.tracks.length; k++) {
        const t = tracker.value.tracks[k];
        if (t) {
          if (t.figure) {
            const f = t.figure;
            noteLength = (1 / (64 / 4)) * (60 / tracker.value.bpm) * 1000; // milliseconds
            for (const p of f.patterns) {
              if (p.mute) {
                stopSample(p.sample);
              } else {
                const m = p.measures.find((_m) => _m.index === i);
                if (m && m.fNotes[j] !== "-") {
                  const velocity = Number(m.fNotes[j]);
                  const melody = Number(m.mNotes[j]) || 0;

                  if (velocity) {
                    playSample(p.sample, velocity, melody, t.channel);
                  }
                  if (m.fNotes === "X") {
                    stopSample(p.sample);
                  }
                }
              }
            }
          }
        }
      }
      if (!noteLength) await sleep(30);
      if (noteLength) await sleep(noteLength);
      if (!isPlaying.value) return;
    }
  }
  async function stopTracker() {
    isPlaying.value = false;
    cursor.value = 0;
  }

  return {
    audioContext,
    figures,
    samples,
    tracker,
    isPlaying,
    cursor,
    playSample,
    stopSample,
    playTracker,
    stopTracker,
  };
});
