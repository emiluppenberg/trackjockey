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

  const activeMixer = ref<Mixer>();
  const activeTrackIdx = ref<number>(0);

  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);
  const currentMeasure = ref<number>(0);

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
          mixer: createMixer(audioContext.value),
        },
      ],
      mixer: createMixer(audioContext.value),
    };

    activeMixer.value = tracker.value.tracks[0]!.mixer;
  });

  async function playSample(s: Sample, velocity: number, melody: number) {
    if (!audioContext.value) return;

    const vGain = (velocity * 2) / 10;
    s.velocityNode.gain.value = vGain;

    s.source = audioContext.value.createBufferSource();
    s.source.buffer = s.audioBuffer;

    const detune = melody * 100;
    s.source.detune.value = detune;

    s.source.connect(s.velocityNode);
    s.source.start();
  }

  async function stopSample(s: Sample) {
    if (!s.source) return;

    s.source.stop();
    s.source = undefined;
  }

  async function mixerConnectChildToParent(cMixer: Mixer, pMixer: Mixer) {
    let lastNode: AudioNode = cMixer.pannerNode; // Default audio flow : pannerNode -> pitcherNode? -> ... -> gainNode -> parent
    lastNode.disconnect(0);
    if (cMixer.pitcherNode) lastNode = lastNode.connect(cMixer.pitcherNode);
    lastNode.connect(cMixer.gainNode).connect(pMixer.pannerNode);
  }

  async function mixerConnectTracker() {
    if (!audioContext.value) return;
    if (!tracker.value) return;

    tracker.value.mixer.pannerNode
      .connect(tracker.value.mixer.gainNode)
      // .connect(tracker.value.mixer.pitcherNode)
      .connect(audioContext.value.destination);

    for (const t of tracker.value.tracks) {
      mixerConnectChildToParent(t.mixer, tracker.value.mixer);

      if (t.figure) {
        mixerConnectChildToParent(t.figure.mixer, t.mixer);

        for (const p of t.figure.patterns) {
          mixerConnectChildToParent(p.mixer, t.figure.mixer);
          mixerConnectChildToParent(p.sample.mixer, p.mixer);
        }
      }
    }
  }

  async function advanceCursor() {}

  async function playTracker() {
    if (isPlaying.value) return;

    cursor.value = -1;
    currentMeasure.value = 0;
    isPlaying.value = true;

    await mixerConnectTracker();

    const advanceCursor = async () => {
      if (!tracker.value) return;

      const maxMeasures = Math.max(
        ...tracker.value.tracks.map((t) => {
          if (t.figure) return t.figure.measureCount;
          return 0;
        })
      );

      cursor.value++;
      if (cursor.value === 64) cursor.value = 0;
      if (cursor.value === 0) currentMeasure.value++;
      if (currentMeasure.value > maxMeasures) currentMeasure.value = 1;

      let noteLength = (1 / (64 / 4)) * (60 / tracker.value.bpm) * 1000; // milliseconds

      for (const t of tracker.value.tracks) {
        if (t.figure) {
          for (const p of t.figure.patterns) {
            if (p.mute) {
              stopSample(p.sample);
            } else {
              const m = p.measures.find(
                (_m) => _m.index === currentMeasure.value
              );

              if (m && m.fNotes[cursor.value] !== "-") {
                const velocity = Number(m.fNotes[cursor.value]);
                const melody = Number(m.mNotes[cursor.value]) || 0;

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
    };
    while (isPlaying.value) {
      await advanceCursor();
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
    activeMixer,
    activeTrackIdx,
    isPlaying,
    cursor,
    playSample,
    stopSample,
    playTracker,
    stopTracker,
    mixerConnectChildToParent,
  };
});
