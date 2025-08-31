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
  type Pattern,
  createPattern,
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
  const comp_fftSize = 1024;

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

      samples.value.push(createSample(sample, fileName!, fileName));
    }

    const kick1M = createMeasure("5-5-:5-5-");
    const hihat1M = createMeasure("-5-5:-5-5");
    const snare1M = createMeasure("--5-:--5-");
    const kick2M = createMeasure("5---:5--2:-25-:--5-");
    const hihat2M = createMeasure("5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-");
    const snare2M = createMeasure("----:5---:-2--:5---");
    const perc2M = createMeasure("---5:---5");
    const shi3M1 = createMeasure("2---:02--");

    const patternsRecord: Record<number, Pattern[]> = {
      1: [],
      2: [],
      3: [],
    };

    for (const s of samples.value) {
      if (s.fileName?.includes("kick1.wav")) {
        patternsRecord[1]!.push(createPattern(s, [kick1M], audioContext.value));
      }
      if (s.fileName?.includes("hihat1.wav")) {
        patternsRecord[1]!.push(
          createPattern(s, [hihat1M], audioContext.value)
        );
      }
      if (s.fileName?.includes("snare1.wav")) {
        patternsRecord[1]!.push(
          createPattern(s, [snare1M], audioContext.value)
        );
      }
      if (s.fileName?.includes("kick2.wav")) {
        patternsRecord[2]!.push(createPattern(s, [kick2M], audioContext.value));
      }
      if (s.fileName?.includes("hihat2.wav")) {
        patternsRecord[2]!.push(
          createPattern(s, [hihat2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("snare2.wav")) {
        patternsRecord[2]!.push(
          createPattern(s, [snare2M], audioContext.value)
        );
      }
      if (s.fileName?.includes("perc2.wav")) {
        patternsRecord[2]!.push(createPattern(s, [perc2M], audioContext.value));
      }
      if (s.fileName?.includes("shi3.wav")) {
        patternsRecord[3]!.push(createPattern(s, [shi3M1], audioContext.value));
      }
    }

    for (let i = 1; i < 4; i++) {
      let fPatterns: Pattern[] = [];
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
        fPatterns.push(pr);
      }

      figures.value.push(createFigure(fLen.value, fName, fKeyBind, fPatterns));
    }

    activeFigure.value = figures.value[0];
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

    for (const p of t.figure.patterns) {
      p.velocityNode.disconnect();
      p.velocityNode.gain.value = 1;
      p.velocityNode.connect(t.mixer.pannerNode);
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

  async function stopPattern(p: Pattern) {
    p.measures.forEach((m) => m.sourceNodes.forEach((sn) => sn.stop()));
  }

  function getNextNoteStopTime(
    p: Pattern,
    idxM: number,
    idxN: number,
    cycleStartTime: number,
    noteLength: number
  ): number {
    let next_vNote = p.measures[idxM]!.velocity64[idxN + 1];
    let next_mOffset;
    let next_nOffset;

    if (next_vNote) {
      next_mOffset = noteLength * idxM * 64;
      next_nOffset = next_vNote.index * noteLength;
      return cycleStartTime + next_mOffset + next_nOffset;
    } else {
      let next_m = p.measures[idxM + 1];

      if (next_m) {
        next_vNote = p.measures[idxM + 1]!.velocity64[0]!;
        next_mOffset = noteLength * (idxM + 1) * 64;
        next_nOffset = next_vNote.index * noteLength;
        return cycleStartTime + next_mOffset + next_nOffset;
      } else {
        const first_Vnote = p.measures[0]!.velocity64[0]!;
        next_mOffset = noteLength * 0 * 64;
        next_nOffset = (64 + first_Vnote.index) * noteLength;
        return cycleStartTime + next_mOffset + next_nOffset;
      }
    }
  }

  function scheduleMeasure(
    m: Measure,
    idxM: number,
    p: Pattern,
    noteLength: number,
    cycleStartTime: number
  ) {
    if (!audioContext.value) return 0;
    const mOffset = noteLength * idxM * 64;

    for (let idxN = 0; idxN < m.velocity64.length; idxN++) {
      const vNote = m.velocity64[idxN]!;
      const nOffset = vNote.index * noteLength;
      const startTime = cycleStartTime + mOffset + nOffset;
      const stopTime = getNextNoteStopTime(
        p,
        idxM,
        idxN,
        cycleStartTime,
        noteLength
      );

      const velocity = (vNote.value * 2) / 10;
      const pitch = m.pitch64[idxN]!.value! * 100;

      const velocityNode = audioContext.value.createGain();
      const sourceNode = audioContext.value.createBufferSource();
      sourceNode.buffer = p.sample.audioBuffer;
      sourceNode.detune.value = pitch;
      velocityNode.gain.value = velocity;
      sourceNode.connect(velocityNode).connect(p.velocityNode);

      m.sourceNodes[idxN] = sourceNode;
      m.sourceNodes[idxN]!.start(startTime);
      m.sourceNodes[idxN]!.stop(stopTime);

      m.sourceNodes[idxN]!.onended = () => {
        velocityNode.disconnect();
        sourceNode.disconnect();
      };
    }
  }

  async function schedulePattern(
    p: Pattern,
    noteLength: number,
    cycleStartTime: number
  ): Promise<number> {
    if (!audioContext.value) return 0;

    for (let i = 0; i < p.measures.length; i++) {
      const mOffset = noteLength * i * 64;
      const m = p.measures[i]!;

      for (let j = 0; j < m.velocity64.length; j++) {
        const vNote = m.velocity64[j]!;
        const nOffset = vNote.index * noteLength;
        const startTime = cycleStartTime + mOffset + nOffset;
        const stopTime = getNextNoteStopTime(
          p,
          i,
          j,
          cycleStartTime,
          noteLength
        );

        const velocity = (vNote.value * 2) / 10;
        const pitch = m.pitch64[j]!.value! * 100;

        const velocityNode = audioContext.value.createGain();
        const sourceNode = audioContext.value.createBufferSource();
        sourceNode.buffer = p.sample.audioBuffer;
        sourceNode.detune.value = pitch;
        velocityNode.gain.value = velocity;
        sourceNode.connect(velocityNode).connect(p.velocityNode);

        m.sourceNodes[j] = sourceNode;
        m.sourceNodes[j]!.start(startTime);
        m.sourceNodes[j]!.stop(stopTime);

        m.sourceNodes[j]!.onended = () => {
          velocityNode.disconnect();
          sourceNode.disconnect();
        };
      }
    }

    return noteLength * p.measures.length * 64; // Total pattern time
  }

  async function advanceTracker(cycleStartTime: number): Promise<number> {
    if (!tracker.value) return 0;
    if (!isPlaying.value) return 0;
    if (!audioContext.value) return 0;

    let noteLength = 60 / tracker.value.bpm / 16;

    const patternTimes: number[] = [];

    for (const t of tracker.value.tracks) {
      if (t.figure && t.figure.patterns[0]) {
        for (const p of t.figure.patterns) {
          if (p.mute) await stopPattern(p);
          else {
            if (t.nextMeasureIdxs.length > 0) {
              for (let i = 0; i < t.nextMeasureIdxs.length; i++) {} // TODO
            }
          }
        }
      }
    }

    return Math.max(...patternTimes);
  }
  async function startTracker() {
    if (isPlaying.value) return;
    if (!tracker.value) return;
    if (!audioContext.value) return;

    // tracker.value.tracks.forEach((t) => (t.currentMeasureIdx = -1));
    // cursor.value = -1;
    // currentMeasureIdx.value = -1;
    isPlaying.value = true;
    const lookahead = 0.5;
    const scheduleAhead = 2.0;

    let nextCycleStart = audioContext.value.currentTime + lookahead;
    let id = 0;

    const cycle = async () => {
      if (nextCycleStart < audioContext.value!.currentTime + scheduleAhead)
        nextCycleStart += await advanceTracker(nextCycleStart);
    };

    const loop = async () => {
      if (!isPlaying.value) return;

      await cycle();

      setTimeout(loop, lookahead * 1000);
    };

    loop();
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
    startTracker,
    stopTracker,
    mixerConnect,
    mixerConnectTrack,
    mixerConnectEqAnalyser,
    mixerConnectCompAnalyser,
    loadFigures,
    reloadActiveFigureTracks,
  };
});
