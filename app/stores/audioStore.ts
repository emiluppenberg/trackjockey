import {
  Pattern,
  type Mixer,
  Figure,
  Sample,
  Tracker,
  type Track,
  type Note,
} from "~/types2";

export const useAudioStore = defineStore("audioStore", () => {
  const ctx = ref<AudioContext>();
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

  const log = ref<string>("");
  const processedStop1 = ref<number>(0);
  const processedStop2 = ref<number>(0);
  const processedStop3 = ref<number>(0);

  onMounted(async () => {
    ctx.value = new AudioContext();
    await ctx.value.audioWorklet.addModule("/pitch-processor.js");

    eqAnalyser.value = ctx.value.createAnalyser();
    compAnalyser.value = ctx.value.createAnalyser();

    tracker.value = new Tracker(120, ctx.value);

    activeMixer.value = tracker.value.tracks[0]!.mixer;
    activeTrack.value = tracker.value.tracks[0]!;

    tracker.value.master.pannerNode
      .connect(tracker.value.master.gainNode)
      // .connect(tracker.value.mixer.pitcherNode)
      .connect(ctx.value.destination);

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

  function recycle(
    velNode: GainNode,
    srcNode: AudioBufferSourceNode,
    p_srcNodes: Set<AudioBufferSourceNode>
  ) {
    velNode.disconnect();
    srcNode.disconnect();
    if (p_srcNodes.has(srcNode)) p_srcNodes.delete(srcNode);
  }

  async function startTracker() {
    if (isPlaying.value) return;

    tracker.value!.tracks.forEach((t) => {
      t.currentMeasure = 0;
      t.figure?.patterns.forEach((p) => {
        p.currentMeasure = 0;
        p.currentPos = 0;
      });
    });

    isPlaying.value = true;
    let nextNoteTime = ctx.value!.currentTime;
    const scheduleAhead = 0.2; // s

    const loop = async () => {
      if (!isPlaying.value) return;

      let noteLen = 60 / tracker.value!.bpm / 16;

      while (nextNoteTime < ctx.value!.currentTime + scheduleAhead) {
        const cycleStart = nextNoteTime;

        for (const t of tracker.value!.tracks) {
          if (!t.figure) continue;
          if (t.mute) continue;
          cycleTrackPatterns(t, noteLen, cycleStart);
        }

        nextNoteTime += noteLen;
        cursor.value++;

        if (cursor.value === 64) {
          cursor.value = 0;

          for (const t of tracker.value!.tracks) {
            if (!t.figure) continue;
            if (t.mute) continue;

            t.currentMeasure++;
            if (t.nextMeasures.length > 0) {
              t.currentMeasure = t.nextMeasures[0]!;
              t.nextMeasures.splice(0, 1);
            }
            if (t.currentMeasure === t.figure.measureCount)
              t.currentMeasure = 0;

            for (const p of t.figure.patterns) {
              p.currentMeasure = t.currentMeasure;
              p.currentPos = 0;
            }
          }
        }
      }

      // log.value = log.value.concat(`${logString}\n`);

      requestAnimationFrame(loop);
    };

    loop();
  }

  function cycleTrackPatterns(t: Track, noteLen: number, cycleStart: number) {
    for (const p of t.figure!.patterns) {
      let nextMeasure;
      if (t.nextMeasures.length > 0) nextMeasure = t.nextMeasures[0];

      const _currentMeasure = p.currentMeasure;
      const _currentPos = p.currentPos;

      const measure = p.measures[_currentMeasure]!;
      if (!measure.notes) return;

      const note = measure.notes![_currentPos]!;
      if (note.pos64 !== cursor.value) continue;

      scheduleNote(
        p,
        note,
        noteLen,
        cycleStart,
        _currentMeasure,
        _currentPos,
        nextMeasure
      );
    }
  }

  function scheduleNote(
    p: Pattern,
    note: Note,
    noteLen: number,
    cycleStart: number,
    _currentMeasure: number,
    _currentPos: number,
    nextMeasure: number | undefined
  ) {
    const startTime = cycleStart;
    const stopTime = getNoteStop(
      p,
      _currentMeasure,
      _currentPos,
      cycleStart,
      noteLen,
      nextMeasure
    );

    const velocity = (note.velocity * 2) / 10;
    const pitch = note.pitch * 100;

    const velNode = ctx.value!.createGain();
    const srcNode = ctx.value!.createBufferSource();
    srcNode.buffer = p.sample.audioBuffer;
    srcNode.detune.value = pitch;
    velNode.gain.value = velocity;
    srcNode.connect(velNode).connect(p.velocityNode);

    srcNode.start(startTime);
    srcNode.stop(stopTime);

    p.srcNodes.add(srcNode);
    srcNode.onended = () => recycle(velNode, srcNode, p.srcNodes);

    if (_currentPos < p.measures[_currentMeasure]!.notes!.length - 1)
      p.currentPos++;
  }

  function getNoteStop(
    p: Pattern,
    _currentMeasure: number,
    _currentPos: number,
    cycleStart: number,
    noteLen: number,
    nextMeasure: number | undefined
  ): number {
    let next_mOffset = 0;
    let next_nOffset = 0;
    let note: Note;

    // Check current measure
    for (
      let i = _currentPos + 1;
      i < p.measures[_currentMeasure]!.notes!.length;
      i++
    ) {
      if (p.measures[_currentMeasure]!.notes![i]) {
        note = p.measures[_currentMeasure]!.notes![i]!;
        next_mOffset = noteLen * _currentMeasure * 64;
        next_nOffset = note.pos64 * noteLen;
        return cycleStart + next_mOffset + next_nOffset;
      }
    }

    // Check next measure and following
    if (nextMeasure) {
      if (p.measures[nextMeasure]!.notes) {
        note = p.measures[nextMeasure]!.notes![0]!;
        next_mOffset = noteLen * nextMeasure * 64;
        next_nOffset = note.pos64 * noteLen;
        return cycleStart + next_mOffset + next_nOffset;
      } else {
        for (let i = nextMeasure + 1; i < p.measures.length; i++) {
          if (p.measures[i]!.notes) {
            note = p.measures[i]!.notes![0]!;
            next_mOffset = noteLen * i * 64;
            next_nOffset = note.pos64 * noteLen;
            return cycleStart + next_mOffset + next_nOffset;
          }
        }
      }
    }

    // Else check current following measures
    if (!nextMeasure) {
      for (let i = _currentMeasure + 1; i < p.measures.length; i++) {
        if (p.measures[i]!.notes) {
          note = p.measures[i]!.notes![0]!;
          next_mOffset = noteLen * i * 64;
          next_nOffset = note.pos64 * noteLen;
          return cycleStart + next_mOffset + next_nOffset;
        }
      }
    }

    // Else check previous measures
    for (let i = 0; i <= _currentMeasure; i++) {
      if (p.measures[i]!.notes) {
        note = p.measures[i]!.notes![0]!;
        next_mOffset = noteLen * (i + 1) * 64;
        next_nOffset = note.pos64 * noteLen;
      }
    }

    return cycleStart + next_mOffset + next_nOffset;
  }

  async function stopTracker() {
    isPlaying.value = false;
    cursor.value = 0;
  }

  async function loadFigures() {
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
        .then((arrayBuffer) => ctx.value!.decodeAudioData(arrayBuffer)!);

      const fileName = wavs[i]!.split("/").pop()!;

      samples.value.push(new Sample(sample, fileName, fileName));
    }

    const kick1M = "5-5-:5-5-";
    const hihat1M = "-5-5:-5-5";
    const snare1M = "--5-:--5-";

    const kick2M1 = "5---:5--2:-25-:--5-";
    const hihat2M1 = "5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-";
    const snare2M1 = "----:5---:-2--:5---";
    const kick2M2 = "5---:5--2:-25-:--5-";
    const hihat2M2 = "5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-";
    const snare2M2 = "0-";
    const kick2M3 = "0-";
    const hihat2M3 = "5-5-5-5-:5---5-23:1-5-5-5-:1-5-5-5-";
    const snare2M3 = "5---:5--2:-25-:--5-";
    const perc2M1 = "---5:---5";

    const shi3M1 = "2---:--02";
    const shi3M3 = "--2-:---2";

    const kick1P = new Pattern(
      samples.value.find((s) => s.name === "kick1.wav")!,
      ctx.value!.createGain()
    );
    kick1P.addMeasure(kick1M);
    const hihat1P = new Pattern(
      samples.value.find((s) => s.name === "hihat1.wav")!,
      ctx.value!.createGain()
    );
    hihat1P.addMeasure(hihat1M);
    const snare1P = new Pattern(
      samples.value.find((s) => s.name === "snare1.wav")!,
      ctx.value!.createGain()
    );
    snare1P.addMeasure(snare1M);

    const kick2P = new Pattern(
      samples.value.find((s) => s.name === "kick2.wav")!,
      ctx.value!.createGain()
    );
    kick2P.addMeasure(kick2M1);
    kick2P.addMeasure(kick2M2);
    kick2P.addMeasure(kick2M3);
    const snare2P = new Pattern(
      samples.value.find((s) => s.name === "snare2.wav")!,
      ctx.value!.createGain()
    );
    snare2P.addMeasure(snare2M1);
    snare2P.addMeasure(snare2M2);
    snare2P.addMeasure(snare2M3);
    const hihat2P = new Pattern(
      samples.value.find((s) => s.name === "hihat2.wav")!,
      ctx.value!.createGain()
    );
    hihat2P.addMeasure(hihat2M1);
    hihat2P.addMeasure(hihat2M2);
    hihat2P.addMeasure(hihat2M3);

    const shi3P = new Pattern(
      samples.value.find((s) => s.name === "shi3.wav")!,
      ctx.value!.createGain()
    );
    shi3P.addMeasure(shi3M1);
    shi3P.addMeasure();
    shi3P.addMeasure(shi3M3);
    shi3P.addMeasure();

    const drums1 = new Figure(0, "drums1", "KeyA", [kick1P, hihat1P, snare1P]);
    const drums2 = new Figure(1, "drums2", "KeyS", [kick2P, snare2P, hihat2P]);
    const shi3 = new Figure(2, "shi3", "KeyD", [shi3P]);

    figures.value.push(drums1, drums2, shi3);

    activeFigure.value = figures.value[0];
  }

  function mixerConnectEqAnalyser() {
    eqAnalyser.value = ctx.value!.createAnalyser();
    eqAnalyser.value.fftSize = eq_fftSize;
    activeMixer.value!.gainNode.connect(eqAnalyser.value);
  }

  function mixerConnectCompAnalyser() {
    compAnalyser.value = ctx.value!.createAnalyser();
    compAnalyser.value.fftSize = comp_fftSize;
    activeMixer.value!.gainNode.connect(compAnalyser.value);
  }

  function reloadActiveFigureTracks() {
    const fTracks = tracker.value!.tracks.filter(
      (t) => t.figure?.id === activeFigure.value!.id
    );

    console.log(fTracks.length);

    if (fTracks.length > 0) {
      for (const t of fTracks) {
        t.figure = activeFigure.value!.clone(ctx.value!);
        t.connect(tracker.value!);
      }
    }
  }

  function consoleLog() {
    tracker.value!.tracks.forEach((t) =>
      console.log(t.figure?.patterns.map((p) => p.srcNodes))
    );

    console.log(ctx.value?.currentTime, ctx.value?.state);
  }

  return {
    ctx,
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
    log,
    startTracker,
    stopTracker,
    mixerConnectEqAnalyser,
    mixerConnectCompAnalyser,
    loadFigures,
    reloadActiveFigureTracks,
    consoleLog,
  };
});
