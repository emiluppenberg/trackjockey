import {
  sleep,
  createFigure,
  type Figure,
  type Mixer,
  type Sample,
  type Tracker,
  createMixer,
} from "~/types2";

export const useAudioStore = defineStore("audioStore", () => {
  const audioContext = ref<AudioContext>();
  const figures = ref<Figure[]>([]);
  const samples = ref<Sample[]>([]);
  const tracker = ref<Tracker>();
  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");

    figures.value.push(
      createFigure("Empty", "#D6B300", "KeyQ", 1, 120, [], audioContext.value)
    );

    tracker.value = {
      bpm: 120,
      tracks: [
        {
          figure: undefined,
          channelNode: audioContext.value.createChannelMerger(),
          mixer: createMixer(audioContext.value),
        },
      ],
      channelNode: audioContext.value.createChannelMerger(),
      mixer: createMixer(audioContext.value),
    };
  });

  async function playSample(s: Sample, velocity: number, melody: number) {
    if (!audioContext.value) return;

    const gain = (velocity * 2) / 10;
    const gainNode = audioContext.value.createGain();
    gainNode.gain.value = gain;

    s.source = audioContext.value.createBufferSource();
    s.source.buffer = s.audioBuffer;

    const detune = melody * 100;
    s.source.detune.value = detune;

    s.source.connect(s.channelNode);
    s.source.start();
  }

  async function stopSample(s: Sample) {
    if (!s.source) return;

    s.source.stop();
    s.source = undefined;
  }

  async function connectTracker() {
    if (!audioContext.value) return;
    if (!tracker.value) return;
    console.log(tracker.value);
    tracker.value.mixer.channelNode
      .connect(tracker.value.mixer.pannerNode)
      // .connect(tracker.value.mixer.pitcherNode)
      .connect(audioContext.value.destination);

    for (const t of tracker.value.tracks) {
      t.mixer.channelNode
        .connect(t.mixer.pannerNode)
        .connect(t.mixer.pitcherNode)
        .connect(tracker.value.mixer.channelNode);

      if (t.figure) {
        t.figure.mixer.channelNode
          .connect(t.figure.mixer.pannerNode)
          // .connect(t.figure.mixer.pitcherNode)
          .connect(t.mixer.channelNode);

        for (const p of t.figure.patterns) {
          p.mixer.channelNode
            .connect(p.mixer.pannerNode)
            // .connect(p.mixer.pitcherNode)
            .connect(t.figure.mixer.channelNode);

          p.sample.channelNode // Sample has extra channelNode to connect in playSample
            .connect(p.sample.mixer.pannerNode)
            // .connect(p.sample.mixer.pitcherNode)
            .connect(p.sample.mixer.channelNode)
            .connect(p.mixer.channelNode);
        }
      }
    }
  }

  async function playTracker() {
    if (isPlaying.value) return;
    if (!tracker.value) return;

    isPlaying.value = true;
    let noteLength;
    let j = -1;
    let i = 0;

    await connectTracker();

    while (isPlaying.value) {
      const maxMeasures = tracker.value.tracks.map((t) => {
        if (t.figure) return t.figure.measureCount;
        return 0;
      });

      const m = Math.max(...maxMeasures);

      j++;
      if (j === 64) j = 0;
      cursor.value = j;

      if (j === 0) i++;
      if (i > m) i = 1;

      for (let k = 0; k < tracker.value.tracks.length; k++) {
        const t = tracker.value.tracks[k];

        if (t && t.figure) {
          noteLength = (1 / (64 / 4)) * (60 / tracker.value.bpm) * 1000; // milliseconds

          for (const p of t.figure.patterns) {
            if (p.mute) {
              stopSample(p.sample);
            } else {
              const m = p.measures.find((_m) => _m.index === i);

              if (m && m.fNotes[j] !== "-") {
                const velocity = Number(m.fNotes[j]);
                const melody = Number(m.mNotes[j]) || 0;

                if (velocity) {
                  playSample(p.sample, velocity, melody);
                }
                if (m.fNotes === "X") {
                  stopSample(p.sample);
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
