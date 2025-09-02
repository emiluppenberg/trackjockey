import {
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
  const currentMeasureIdx = ref<number>(0);

  const fLen = computed<number>(() => {
    return figures.value.length;
  });

  const velPool = ref<GainNode[]>([]);

  const cursor = ref<number>(0);
  const processedStop1 = ref<number>(0);
  const processedStop2 = ref<number>(0);
  const processedStop3 = ref<number>(0);

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
          currentMeasureIdx: 0,
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

    loadFigures();
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

  function getGain(): GainNode {
    return velPool.value!.pop() || audioContext.value!.createGain();
  }

  function recycle(velNode: GainNode, srcNode: AudioBufferSourceNode) {
    try {
      velNode.disconnect();
      srcNode.disconnect();
    } catch (e) {
      console.log(e);
    }

    velPool.value!.push(velNode);
  }

  async function startTracker() {
    if (isPlaying.value) return;

    isPlaying.value = true;
    tracker.value!.tracks.forEach((t) => (t.currentMeasureIdx = 0));
    let noteLen = 60 / tracker.value!.bpm / 16;
    let nextNoteTime = audioContext.value!.currentTime;
    const scheduleAhead = 0.2; // s
    const lookAhead = 25; // ms

    const loop = async () => {
      if (!isPlaying.value) return;

      while (nextNoteTime < audioContext.value!.currentTime + scheduleAhead) {
        const cycleStart = nextNoteTime;

        const proccesingStart = performance.now();

        for (const t of tracker.value!.tracks) {
          if (!t.figure) continue;
          cycleTrackPatterns(t, noteLen, cycleStart);
        }

        // console.log(
        //   (performance.now() - proccesingStart).toFixed(2),
        //   processedStop1.value,
        //   processedStop2.value,
        //   processedStop3.value
        // );
        // processedStop1.value = 0;
        // processedStop2.value = 0;
        // processedStop3.value = 0;

        nextNoteTime += noteLen;
        cursor.value++;
        if (cursor.value === 64) cursor.value = 0;
      }

      setTimeout(loop, lookAhead);
    };

    loop();
  }

  function cycleTrackPatterns(t: Track, noteLen: number, cycleStart: number) {
    for (const p of t.figure!.patterns) {
      const _currentMeasure = p.currentMeasure;
      const m = p.measures[_currentMeasure];

      if (!m) continue;
      if (p.currentMeasure !== t.currentMeasureIdx) continue;

      scheduleMeasureNote(t, p, m, noteLen, cycleStart, _currentMeasure);
    }

    let elapsedMeasures = t.figure!.patterns.filter(
      (p) => p.currentMeasure > t.currentMeasureIdx
    );

    if (elapsedMeasures.length === t.figure!.patterns.length) {
      t.currentMeasureIdx++;
    }
    if (t.currentMeasureIdx === t.figure!.measureCount) {
      t.figure!.patterns.forEach((p) => (p.currentMeasure = 0));
      t.currentMeasureIdx = 0;
    }
  }

  function scheduleMeasureNote(
    t: Track,
    p: Pattern,
    m: Measure,
    noteLen: number,
    cycleStart: number,
    _idxCurrentMeasure: number
  ) {
    const _idx64 = m.idx64;
    const vNote = m.velocity64[_idx64]!;
    if (vNote.pos64 !== cursor.value) return;

    const startTime = cycleStart;
    const stopTime = getNextNoteStopTime(
      p,
      _idxCurrentMeasure,
      _idx64,
      cycleStart,
      noteLen
    );

    const velocity = (vNote.value * 2) / 10;
    const pitch = m.pitch64[m.idx64]!.value! * 100;

    const velNode = getGain();
    const srcNode = audioContext.value!.createBufferSource();
    srcNode.buffer = p.sample.audioBuffer;
    srcNode.detune.value = pitch;
    velNode.gain.value = velocity;
    srcNode.connect(velNode).connect(p.velocityNode);

    srcNode.start(startTime);
    srcNode.stop(stopTime);

    srcNode.onended = () => recycle(velNode, srcNode);

    m.idx64++;
    if (m.idx64 >= m.velocity64.length) {
      m.idx64 = 0;
      p.currentMeasure++;
    }
  }

  function getNextNoteStopTime(
    p: Pattern,
    _idxCurrentMeasure: number,
    _idx64: number,
    cycleStart: number,
    noteLen: number
  ): number {
    let next_vNote = p.measures[_idxCurrentMeasure]!.velocity64[_idx64 + 1];
    let next_mOffset;
    let next_nOffset;

    if (next_vNote) {
      processedStop1.value++; // For logging

      next_mOffset = noteLen * _idxCurrentMeasure * 64;
      next_nOffset = next_vNote.pos64 * noteLen;
      return cycleStart + next_mOffset + next_nOffset;
    } else {
      let next_m = p.measures[_idxCurrentMeasure + 1];

      if (next_m) {
        processedStop2.value++; // For logging

        next_vNote = p.measures[_idxCurrentMeasure + 1]!.velocity64[0]!;
        next_mOffset = noteLen * (_idxCurrentMeasure + 1) * 64;
        next_nOffset = next_vNote.pos64 * noteLen;
        return cycleStart + next_mOffset + next_nOffset;
      } else {
        processedStop3.value++; // For logging

        const first_Vnote = p.measures[0]!.velocity64[0]!;
        next_mOffset = noteLen * 0 * 64;
        next_nOffset = (64 + first_Vnote.pos64) * noteLen;
        return cycleStart + next_mOffset + next_nOffset;
      }
    }
  }

  async function stopTracker() {
    isPlaying.value = false;
    cursor.value = 0;
  }

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

    const kick1M = createMeasure("5-5-:5-5-", 0);
    const hihat1M = createMeasure("-5-5:-5-5", 0);
    const snare1M = createMeasure("--5-:--5-", 0);

    const kick2M1 = createMeasure("5---:5--2:-25-:--5-", 0);
    const hihat2M1 = createMeasure("5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-", 0);
    const snare2M1 = createMeasure("----:5---:-2--:5---", 0);
    const kick2M2 = createMeasure("5---:5--2:-25-:--5-", 1);
    const hihat2M2 = createMeasure("5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-", 1);
    const snare2M2 = createMeasure("0-", 1);
    const kick2M3 = createMeasure("0-", 2);
    const hihat2M3 = createMeasure("5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-", 2);
    const snare2M3 = createMeasure("5---:5--2:-25-:--5-", 2);
    const perc2M1 = createMeasure("---5:---5", 0);

    const shi3M1 = createMeasure("2---:02--", 0);

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
        patternsRecord[2]!.push(
          createPattern(s, [kick2M1, kick2M2, kick2M3], audioContext.value)
        );
      }
      if (s.fileName?.includes("hihat2.wav")) {
        patternsRecord[2]!.push(
          createPattern(s, [hihat2M1, hihat2M2, hihat2M3], audioContext.value)
        );
      }
      if (s.fileName?.includes("snare2.wav")) {
        patternsRecord[2]!.push(
          createPattern(s, [snare2M1, snare2M2, snare2M3], audioContext.value)
        );
      }
      if (s.fileName?.includes("perc2.wav")) {
        patternsRecord[2]!.push(
          createPattern(s, [perc2M1, perc2M1, perc2M1], audioContext.value)
        );
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
