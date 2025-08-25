import {
  sleep,
  createFigure,
  createSample,
  type Figure,
  type Mixer,
  type Sample,
  type Tracker,
  createMixer,
  type Track,
  createPattern,
  createMeasure,
  type Pattern,
  type Measure,
} from "~/types2";

export const useAudioStore = defineStore("audioStore", () => {
  const audioContext = ref<AudioContext>();
  const figures = ref<Figure[]>([]);
  const samples = ref<Sample[]>([]);
  const tracker = ref<Tracker>();

  const activeMixer = ref<Mixer>();
  const activeTrack = ref<Track>();
  const activeFigure = ref<Figure>();

  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);
  const currentMeasureIdx = ref<number>(0);

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");

    tracker.value = {
      bpm: 120,
      tracks: [
        {
          figure: undefined,
          mixer: createMixer(audioContext.value),
          currentMeasureIdx: -1,
        },
      ],
      mixer: createMixer(audioContext.value),
    };

    activeMixer.value = tracker.value.tracks[0]!.mixer;
    activeTrack.value = tracker.value.tracks[0]!;

    tracker.value.mixer.pannerNode
      .connect(tracker.value.mixer.gainNode)
      // .connect(tracker.value.mixer.pitcherNode)
      .connect(audioContext.value.destination);
  });

  async function loadFigures() {
    if (!audioContext.value) return;

    for (const s of samples.value) {
      samples.value.pop();
    }

    for (const f of figures.value) {
      figures.value.pop();
    }

    const paths = import.meta.glob<string>("~/assets/*.wav", {
      eager: true,
      import: "default",
    });
    const wavs: string[] = Object.values(paths);

    for (let i = 0; i < wavs.length; i++) {
      const sample = await fetch(wavs[i]!)
        .then((response) => response.arrayBuffer())
        .then(
          (arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!
        );

      const fileName = wavs[i]!.split("/").pop();

      samples.value.push(
        createSample(sample, fileName!, audioContext.value, fileName)
      );
    }

    const kick1M = createMeasure("5-5-:5-5-");
    const hihat1M = createMeasure("-5-5:-5-5");
    const snare1M = createMeasure("--5-:--5-");
    const kick2M = createMeasure("5---:5--2:-25-:--5-");
    const hihat2M = createMeasure("5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-");
    const snare2M = createMeasure("----:5---:-2--:5---");
    const perc2M = createMeasure("---5:---5");
    const shi3M1 = createMeasure("2");
    const shi3M2 = createMeasure("");

    const patternsRecord: Record<string, Pattern[]> = {
      "1": [],
      "2": [],
      "3": [],
    };

    for (const s of samples.value) {
      if (s.fileName?.includes("kick1.wav")) {
        patternsRecord["1"]!.push(
          createPattern(s, [kick1M], audioContext.value)
        );
      }
      if (s.fileName?.includes("hihat1.wav")) {
        patternsRecord["1"]!.push(
          createPattern(s, [hihat1M], audioContext.value)
        );
      }
      if (s.fileName?.includes("snare1.wav")) {
        patternsRecord["1"]!.push(
          createPattern(s, [snare1M], audioContext.value)
        );
      }
      if (s.fileName?.includes("kick2.wav")) {
        patternsRecord["2"]!.push(
          createPattern(s, [kick2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("hihat2.wav")) {
        patternsRecord["2"]!.push(
          createPattern(s, [hihat2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("snare2.wav")) {
        patternsRecord["2"]!.push(
          createPattern(s, [snare2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("perc2.wav")) {
        patternsRecord["2"]!.push(
          createPattern(s, [perc2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("shi3.wav")) {
        patternsRecord["3"]!.push(
          createPattern(s, [shi3M1, shi3M2], audioContext.value)
        );
      }
    }

    figures.value.push(
      createFigure(
        "drums1",
        "KeyA",
        1,
        patternsRecord["1"]!,
        audioContext.value
      )
    );
    figures.value.push(
      createFigure(
        "drums2",
        "KeyS",
        1,
        patternsRecord["2"]!,
        audioContext.value
      )
    );
    figures.value.push(
      createFigure("shi1", "KeyD", 1, patternsRecord["3"]!, audioContext.value)
    );

    activeFigure.value = figures.value[0];
  }
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
    if (cMixer.pitcherNode) lastNode = lastNode.connect(cMixer.pitcherNode, 0);
    lastNode.connect(cMixer.gainNode, 0).connect(pMixer.pannerNode, 0);
  }

  async function mixerConnectTrack(t: Track) {
    if (!audioContext.value) return;
    if (!tracker.value) return;
    if (!t.figure) return;

    mixerConnectChildToParent(t.mixer, tracker.value.mixer);
    mixerConnectChildToParent(t.figure.mixer, t.mixer);
    for (const p of t.figure.patterns) {
      mixerConnectChildToParent(p.mixer, t.figure.mixer);
      mixerConnectChildToParent(p.sample.mixer, p.mixer);
    }
  }

  async function playTracker() {
    if (isPlaying.value) return;
    if (!tracker.value) return;

    tracker.value.tracks.forEach((t) => (t.currentMeasureIdx = -1));
    cursor.value = -1;
    currentMeasureIdx.value = -1;
    isPlaying.value = true;

    const advanceCursor = async () => {
      if (!tracker.value) return;

      cursor.value++;
      if (cursor.value === 64) cursor.value = 0;

      let noteLength = (1 / (64 / 4)) * (60 / tracker.value.bpm) * 1000; // milliseconds

      for (const t of tracker.value.tracks) {
        if (t.figure && t.figure.patterns[0]) {
          const trackMeasuresLength = t.figure.patterns[0].measures.length;

          if (cursor.value === 0) t.currentMeasureIdx++;
          if (t.currentMeasureIdx < 0) t.currentMeasureIdx = 0; // When changing active track figure
          if (t.currentMeasureIdx >= trackMeasuresLength)
            t.currentMeasureIdx = 0;

          for (const p of t.figure.patterns) {
            if (p.mute) {
              stopSample(p.sample);
            } else {
              const m = p.measures[t.currentMeasureIdx];

              if (m && m.v64Notes[cursor.value] !== "-") {
                const velocity = Number(m.v64Notes[cursor.value]);
                const melody = Number(m.m64Notes[cursor.value]) || 0;

                if (velocity) {
                  playSample(p.sample, velocity, melody);
                }
                if (m.v64Notes === "X") {
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
    activeTrack,
    activeFigure,
    isPlaying,
    cursor,
    currentMeasureIdx,
    playSample,
    stopSample,
    playTracker,
    stopTracker,
    mixerConnectChildToParent,
    mixerConnectTrack,
    loadFigures,
  };
});
