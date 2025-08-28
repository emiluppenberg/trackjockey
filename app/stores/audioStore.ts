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
  createMeasure,
  type Measure,
  cloneFigure,
} from "~/types2";

export const useAudioStore = defineStore("audioStore", () => {
  const audioContext = ref<AudioContext>();
  const figures = ref<Figure[]>([]);
  const samples = ref<Sample[]>([]);
  const tracker = ref<Tracker>();

  const activeMixer = ref<Mixer>();
  const activeTrack = ref<Track>();
  const activeFigure = ref<Figure>();

  const eqAnalyser = ref<AnalyserNode>();
  const compAnalyser = ref<AnalyserNode>();
  const eq_fftSize = 256;
  const comp_fftSize = 8192;

  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);
  const currentMeasureIdx = ref<number>(0);

  const fLen = computed<number>(() => {
    return figures.value.length;
  });

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");

    eqAnalyser.value = audioContext.value.createAnalyser();
    compAnalyser.value = audioContext.value.createAnalyser();

    tracker.value = {
      bpm: 120,
      tracks: [
        {
          figure: undefined,
          mixer: createMixer(audioContext.value),
          currentMeasureIdx: -1,
          nextMeasureIdxs: [],
        },
      ],
      master: createMixer(audioContext.value),
    };

    activeMixer.value = tracker.value.tracks[0]!.mixer;
    activeTrack.value = tracker.value.tracks[0]!;

    tracker.value.master.pannerNode
      .connect(tracker.value.master.gainNode)
      // .connect(tracker.value.mixer.pitcherNode)
      .connect(audioContext.value.destination);
  });

  watch(activeTrack, (newTrack) => {
    if (newTrack) {
      activeMixer.value = newTrack.mixer;
      mixerConnectCompAnalyser();
      mixerConnectEqAnalyser();
    }
  });

  watch(
    () => activeTrack.value?.figure,
    (newFigure) => {
      if (newFigure) {
        activeMixer.value = activeTrack.value!.mixer;
        mixerConnectCompAnalyser();
        mixerConnectEqAnalyser();
      }
    }
  );

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

    type Pattern = {
      sample: Sample;
      measures: Measure[];
    };

    const patternsRecord: Record<number, Pattern[]> = {
      1: [],
      2: [],
      3: [],
    };

    for (const s of samples.value) {
      if (s.fileName?.includes("kick1.wav")) {
        patternsRecord[1]!.push({ sample: s, measures: [kick1M] });
      }
      if (s.fileName?.includes("hihat1.wav")) {
        patternsRecord[1]!.push({ sample: s, measures: [hihat1M] });
      }
      if (s.fileName?.includes("snare1.wav")) {
        patternsRecord[1]!.push({ sample: s, measures: [snare1M] });
      }
      if (s.fileName?.includes("kick2.wav")) {
        patternsRecord[2]!.push({ sample: s, measures: [kick2M] });
      }
      if (s.fileName?.includes("hihat2.wav")) {
        patternsRecord[2]!.push({ sample: s, measures: [hihat2M] });
      }
      if (s.fileName?.includes("snare2.wav")) {
        patternsRecord[2]!.push({ sample: s, measures: [snare2M] });
      }
      if (s.fileName?.includes("perc2.wav")) {
        patternsRecord[2]!.push({ sample: s, measures: [perc2M] });
      }
      if (s.fileName?.includes("shi3.wav")) {
        patternsRecord[3]!.push({ sample: s, measures: [shi3M1, shi3M2] });
      }
    }

    for (let i = 1; i < 4; i++) {
      let measures: Measure[][] = [];
      let samples: Sample[] = [];
      let fName = "";
      let fKeyBind = "";

      if (i === 1) {
        fName = "drums1";
        fKeyBind = "KeyA";
      }
      if (i === 2) {
        fName = "drums2";
        fKeyBind = "KeyS";
      }
      if (i === 3) {
        fName = "shi3";
        fKeyBind = "KeyD";
      }

      for (const pr of patternsRecord[i]!) {
        samples.push(pr.sample);
        measures.push(pr.measures);
      }

      figures.value.push(
        createFigure(
          fLen.value,
          fName,
          fKeyBind,
          measures,
          samples,
          audioContext.value
        )
      );
    }

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

  async function mixerConnect(mixer: Mixer) {
    let lastNode: AudioNode = mixer.pannerNode; // Default audio flow : pannerNode -> pitcherNode? -> ... -> gainNode -> parent
    lastNode = lastNode.connect(mixer.pitcherNode);

    if (mixer.filterNodes.length > 0) {
      lastNode.disconnect();
      lastNode = lastNode.connect(mixer.filterNodes[0]!);

      for (const f of mixer.filterNodes) {
        const idx = mixer.filterNodes.indexOf(f);

        if (mixer.filterNodes[idx + 1]) {
          lastNode.disconnect();
          lastNode = lastNode.connect(mixer.filterNodes[idx + 1]!);
        }
      }
    }

    lastNode.disconnect();
    lastNode = lastNode.connect(mixer.compressorNode).connect(mixer.gainNode);
  }

  async function mixerConnectTrack(t: Track) {
    if (!audioContext.value) return;
    if (!tracker.value) return;
    if (!t.figure) return;

    mixerConnect(t.mixer);
    t.mixer.gainNode.disconnect();
    t.mixer.gainNode.connect(tracker.value.master.pannerNode);

    for (const s of t.figure.samples) {
      s.velocityNode.disconnect();
      s.velocityNode.connect(t.mixer.pannerNode);
    }
  }

  function mixerConnectEqAnalyser() {
    if (!activeMixer.value) return;
    if (!audioContext.value) return;

    eqAnalyser.value = audioContext.value.createAnalyser();
    eqAnalyser.value.fftSize = eq_fftSize;
    activeMixer.value.gainNode.connect(eqAnalyser.value);
  }

  function mixerConnectCompAnalyser() {
    if (!activeMixer.value) return;
    if (!audioContext.value) return;

    compAnalyser.value = audioContext.value.createAnalyser();
    compAnalyser.value.fftSize = comp_fftSize;
    activeMixer.value.gainNode.connect(compAnalyser.value);
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
        if (t.figure && t.figure.measures[0]) {
          const trackMeasuresLength = t.figure.measures[0].length;

          if (cursor.value === 0) {
            if (t.nextMeasureIdxs.length > 0) {
              t.currentMeasureIdx = t.nextMeasureIdxs[0]!;
              t.nextMeasureIdxs.splice(0, 1);
            } else {
              t.currentMeasureIdx++;
            }
          }

          if (t.currentMeasureIdx < 0) t.currentMeasureIdx = 0; // When changing active track figure
          if (t.currentMeasureIdx >= trackMeasuresLength)
            t.currentMeasureIdx = 0;

          for (let i = 0; i < t.figure.samples.length; i++) {
            if (t.figure.samples[i]!.mute) {
              stopSample(t.figure.samples[i]!);
            } else {
              const m = t.figure.measures[i]![t.currentMeasureIdx];

              if (m && m.v64Notes[cursor.value] !== "-") {
                const velocity = Number(m.v64Notes[cursor.value]);
                const melody = Number(m.m64Notes[cursor.value]) || 0;

                if (velocity) {
                  playSample(t.figure.samples[i]!, velocity, melody);
                }
                if (m.v64Notes === "X") {
                  stopSample(t.figure.samples[i]!);
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

  function reloadActiveFigureTracks() {
    if (!tracker.value) return;
    if (!audioContext.value) return;
    if (!activeFigure.value) return;

    const fTracks = tracker.value.tracks.filter(
      (t) => t.figure?.id === activeFigure.value!.id
    );

    console.log(fTracks.length);

    if (fTracks.length > 0) {
      for (const t of fTracks) {
        t.figure = cloneFigure(activeFigure.value, audioContext.value);
        mixerConnectTrack(t);
      }
    }
  }

  return {
    audioContext,
    figures,
    samples,
    tracker,
    activeMixer,
    activeTrack,
    activeFigure,
    eqAnalyser,
    compAnalyser,
    eq_fftSize,
    comp_fftSize,
    isPlaying,
    cursor,
    currentMeasureIdx,
    fLen,
    playSample,
    stopSample,
    playTracker,
    stopTracker,
    mixerConnect,
    mixerConnectTrack,
    mixerConnectEqAnalyser,
    mixerConnectCompAnalyser,
    loadFigures,
    reloadActiveFigureTracks,
  };
});
