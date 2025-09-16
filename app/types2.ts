export type Note = {
  velocity: number;
  pitch: number;
  pos64: number;
};

export class Sample {
  constructor(
    public audioBuffer: AudioBuffer,
    public fileName: string,
    public name: string
  ) {}

  clone(ctx: AudioContext): Sample {
    return new Sample(
      cloneAudioBuffer(this.audioBuffer, ctx),
      this.fileName,
      this.name
    );
  }
}

export class Figure {
  public measureCount: number;

  constructor(
    public id: number = 0,
    public name: string = "undefined",
    public keyBind: string = "",
    public patterns: Pattern[] = []
  ) {
    this.measureCount =
      Math.max(...patterns.map((p) => p.measures.length)) || 0;
  }

  clone(ctx: AudioContext): Figure {
    return new Figure(
      this.id,
      this.name,
      this.keyBind,
      this.patterns.map((p) => p.clone(ctx))
    );
  }
}

export class Pattern {
  constructor(
    public sample: Sample,
    public velocityNode: GainNode,
    public mute: boolean = false,
    public measures: Measure[] = [],
    public currentMeasure: number = 0,
    public currentPos: number = 0,
    public srcNodes: Set<AudioBufferSourceNode> = new Set()
  ) {}

  clone(ctx: AudioContext): Pattern {
    return new Pattern(
      this.sample.clone(ctx),
      ctx.createGain(),
      this.mute,
      this.measures,
      0,
      0,
      new Set()
    );
  }

  addMeasure(notation?: string) {
    this.measures.push(new Measure(notation));
  }

  insertMeasure(idx: number, notation?: string) {
    this.measures.splice(idx, 1, new Measure(notation));
  }

  disconnect() {
    this.srcNodes.forEach((s) => s.disconnect());
    this.velocityNode.disconnect();
  }
}

export class Measure {
  cursorPos?: number[]; // Contains the indices of notes[i] with a value - same length as patterns[x].notePos[i][j]
  notes?: Note[];
  notation?: string;

  constructor(notation?: string) {
    if (notation) {
      let cursorPos: number[] = [];

      for (let i = 0; i < notation.length; i++) {
        const c = notation.charAt(i);

        if (!isNaN(Number(c))) {
          cursorPos.push(i);
        }
      }

      this.notes = initializeNotes64(notation);
      this.notation = notation;
      this.cursorPos = cursorPos;
    } else {
      this.cursorPos = undefined;
      this.notes = undefined;
      this.notation = undefined;
    }
  }
}

export class Tracker {
  tracks: Track[];
  master: Mixer;

  constructor(
    public bpm: number,
    public ctx: AudioContext
  ) {
    this.tracks = [new Track(ctx, this)];
    this.master = new Mixer(ctx);
  }

  setLength(len: number) {
    if (this.tracks.length > len) {
      for (let i = this.tracks.length; i > len; i--) {
        const t = this.tracks[i - 1]!;
        t.disconnect();
        this.tracks.pop();
      }
    }

    if (this.tracks.length < len) {
      for (let i = this.tracks.length; i < len; i++) {
        this.tracks.push(new Track(this.ctx, this));
      }
    }
  }
}

export class Track {
  figure?: Figure;
  nextFigure?: Figure;
  mixer: Mixer;

  constructor(
    public ctx: AudioContext,
    public tracker: Tracker,
    public mute: boolean = false,
    public currentMeasure: number = 0,
    public nextMeasures: number[] = []
  ) {
    this.mixer = new Mixer(ctx);
  }

  connect(tracker: Tracker) {
    if (!this.figure) return;

    this.mixer.connect();
    this.mixer.gainNode.disconnect();
    this.mixer.gainNode.connect(this.tracker.master.pannerNode);

    for (const p of this.figure.patterns) {
      p.velocityNode.disconnect();
      p.velocityNode.gain.value = 1;
      p.velocityNode.connect(this.mixer.pannerNode);
    }
  }

  disconnect() {
    this.mixer.disconnect();

    if (this.figure) {
      this.figure.patterns.forEach((p) => {
        p.velocityNode.disconnect();
        p.srcNodes.forEach((s) => {
          s.stop();
          s.disconnect();
        });
        p.srcNodes.clear();
      });
    }
  }

  setCurrentMeasure(idxM: number, cursor64: number) {
    if (this.figure) {
      this.figure.patterns.forEach((p) => {
        // Find next note in new measure adjusting for cursor position
        if (p.measures[idxM]!.notes) {
          p.currentPos = p.measures[idxM]!.notes!.findIndex(
            (n) => n.pos64 > cursor64
          );

          if (p.currentPos < 0) p.currentPos = 0;
        } else p.currentPos = 0;

        p.currentMeasure = idxM;
      });
    }

    this.currentMeasure = idxM;
  }

  changeFigure(f: Figure) {
    if (this.figure) {
      this.figure.patterns.forEach((p) => p.disconnect());
    }

    this.currentMeasure = 0;
    this.figure = f.clone(this.ctx);
    this.connect(this.tracker);
  }

  pushNextFigure() {
    if (this.figure) {
      this.figure.patterns.forEach((p) => p.disconnect());
    }

    this.currentMeasure = this.nextFigure!.measureCount - 1;
    this.figure = this.nextFigure;
    this.nextFigure = undefined;
    this.connect(this.tracker);
  }
}

export class Mixer {
  pitcherNode: AudioWorkletNode;
  pitch: number;
  pannerNode: StereoPannerNode;
  gainNode: GainNode;
  filterNodes: BiquadFilterNode[];
  compressorNode: DynamicsCompressorNode;
  constructor(ctx: AudioContext) {
    this.pitcherNode = new AudioWorkletNode(ctx, "pitch-processor");
    this.pitch = 0;
    this.pannerNode = ctx.createStereoPanner();
    this.gainNode = ctx.createGain();

    this.filterNodes = [
      ctx.createBiquadFilter(),
      ctx.createBiquadFilter(),
      ctx.createBiquadFilter(),
      ctx.createBiquadFilter(),
    ];
    this.filterNodes.forEach((f) => (f.frequency.value = 24000));

    this.compressorNode = ctx.createDynamicsCompressor();
    this.compressorNode.attack.value = 0.05;
    this.compressorNode.knee.value = 0;
    this.compressorNode.ratio.value = 1;
    this.compressorNode.threshold.value = 0;
  }

  connect() {
    let lastNode: AudioNode = this.pannerNode; // Default audio flow : pannerNode -> pitcherNode? -> ... -> gainNode -> parent
    lastNode = lastNode.connect(this.pitcherNode);

    if (this.filterNodes.length > 0) {
      lastNode.disconnect();
      lastNode = lastNode.connect(this.filterNodes[0]!);

      for (const f of this.filterNodes) {
        const idx = this.filterNodes.indexOf(f);

        if (this.filterNodes[idx + 1]) {
          lastNode.disconnect();
          lastNode = lastNode.connect(this.filterNodes[idx + 1]!);
        }
      }
    }

    lastNode.disconnect();
    lastNode = lastNode.connect(this.compressorNode).connect(this.gainNode);
  }

  disconnect() {
    this.pannerNode.disconnect(); // Default audio flow : pannerNode -> pitcherNode? -> ... -> gainNode -> parent
    this.pitcherNode.disconnect();

    if (this.filterNodes.length > 0) {
      this.filterNodes.forEach((f) => f.disconnect());
    }

    this.compressorNode.disconnect();
    this.gainNode.disconnect();
  }
}

export function cloneAudioBuffer(
  audioBuffer: AudioBuffer,
  audioContext: AudioContext
): AudioBuffer {
  const clone = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    clone.copyToChannel(audioBuffer.getChannelData(i), i);
  }

  return clone;
}

export function initializeNotes64(notes: string): Note[] {
  const _notes = notes.replaceAll(":", "");
  const len = _notes.length;
  const step = 64 / len;
  let idx = 0;
  let notes64: Note[] = [];
  for (let i = 0; i < _notes.length; i++) {
    const c = _notes.charAt(i);

    if (!isNaN(Number(c)))
      notes64.push({ velocity: Number(c), pitch: 0, pos64: idx });

    if (c === "*") notes64.push({ velocity: -1, pitch: 0, pos64: idx });

    idx += step;
  }

  return notes64;
}

export function handleScrollAudioParam(e: WheelEvent, model: AudioParam) {
  const element = e.target as HTMLInputElement;
  const step = Number(element.step);

  if (e.deltaY < 0) model.value = Math.round((model.value + step) * 10) / 10;
  if (e.deltaY > 0) model.value = Math.round((model.value - step) * 10) / 10;

  if (model.value % 1 !== 0) element.value = model.value.toFixed(2);
  else element.value = model.value.toString();
}

export function handleScrollValue(e: WheelEvent) {
  const element = e.target as HTMLInputElement;
  let value = 0;

  if (e.deltaY < 0) value = Number(element.value) + Number(element.step);
  if (e.deltaY > 0) value = Number(element.value) - Number(element.step);

  element.value = value.toString();
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

export function selectAllText(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}

export function hzToMel(f: number): number {
  return 2595 * Math.log10(1 + f / 700);
}

export function melToX(f: number, w: number): number {
  const fMax = 24000;
  const mel = hzToMel(f);
  const melMax = hzToMel(fMax);
  return (mel / melMax) * w;
}

export function melToHz(m: number): number {
  return 700 * (Math.pow(10, m / 2595) - 1);
}

export function xToHz(x: number, w: number): number {
  const fMax = 24000;
  const melMax = hzToMel(fMax);
  const mel = (x / w) * melMax;
  return melToHz(mel);
}

// export function getPitchIndex(idxC: number, m: string): Note {
//   let idxP = 0;

//   for (let i = 0; i < idxC; i++) {
//     if (m[i] !== ":") idxP++;
//   }

//   const _notes = m.replaceAll(":", "");

//   const len = _notes.length;
//   const step = 64 / len;
//   return m.pitch64[idxP * step]!;
// }

// export function getMelodyIndex(idxC: number, notes: string): number {
//   let idxM = 0;
//   let _notes = "";

//   for (let i = 0; i < idxC; i++) {
//     const c = notes.charAt(i);
//     if (c !== ":") idxM++;
//   }

//   for (let i = 0; i < notes.length; i++) {
//     const c = notes.charAt(i);
//     if (c !== ":") _notes += c;
//   }

//   const fLen = 64 / _notes.length;
//   return fLen * idxM;
// }

// export function getCursorForVNotes(
//   m: Measure,
//   idxC: number,
//   idxM: number
// ): boolean {
//   const audioStore = useAudioStore();
//   if (!audioStore.activeTrack) return false;

//   let colonIndices: number[] = [];
//   let currentNoteIdx: number = idxC;

//   for (let i = 0; i < m.notes.length; i++) {
//     if (m.notes[i] === ":") colonIndices.push(i);
//   }

//   if (colonIndices.includes(idxC)) return false;

//   for (const colonIdx of colonIndices) {
//     if (idxC > colonIdx) currentNoteIdx -= 1;
//   }

//   const vNotesClean = m.notes.replaceAll(":", "");
//   const fLen = 64 / vNotesClean.length;
//   const nextNoteIdx = currentNoteIdx + 1;

//   if (audioStore.activeTrack.currentMeasureIdx !== idxM) return false;

//   if (audioStore.cursor === currentNoteIdx * fLen) return true;

//   if (
//     audioStore.cursor < nextNoteIdx * fLen &&
//     audioStore.cursor > currentNoteIdx * fLen
//   )
//     return true;

//   return false;
// }