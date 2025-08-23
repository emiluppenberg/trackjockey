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
  initialize64Melody,
  convertTo64Rhythm,
  type Measure,
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

  const isPlaying = ref<boolean>(false);
  const cursor = ref<number>(0);
  const currentMeasure = ref<number>(0);

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");

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
    activeTrack.value = tracker.value.tracks[0]!;
  });
  
async function loadFigures() {
  if (!audioContext.value) return;

  const hihat1 = await fetch(
    new URL("~/assets/HH_AcardeBullet11.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer));

  const hihat2 = await fetch(
    new URL("~/assets/HH_AcardeBullet41.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  const kick1 = await fetch(
    new URL("~/assets/Tom_BleepBullet3.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  const kick2 = await fetch(
    new URL("~/assets/BD_KastleBullet1.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  const snare1 = await fetch(
    new URL("~/assets/SD_KastleBullet6.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  const snare2 = await fetch(
    new URL("~/assets/SD_LunchBullet4.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  const arp1 = await fetch(
    new URL("~/assets/ArpFallST_AcardeBullet002.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.value!.decodeAudioData(arrayBuffer)!);

  for (const s of samples.value) {
    samples.value.pop();
  }

  for (const f of figures.value) {
    figures.value.pop();
  }

  samples.value.push(createSample(kick1, "kick1", audioContext.value));
  samples.value.push(createSample(hihat1, "hihat1", audioContext.value));
  samples.value.push(createSample(snare1, "snare1", audioContext.value));
  samples.value.push(createSample(kick2, "kick2", audioContext.value));
  samples.value.push(createSample(hihat2, "hihat2", audioContext.value));
  samples.value.push(createSample(snare2, "kick2", audioContext.value));
  samples.value.push(createSample(arp1, "arp1", audioContext.value));

  for (let i = 0; i < 3; i++) {
    let kickNotes = "";
    let hihatNotes = "";
    let snareNotes = "";
    let phraseName = "";
    let arpNotes = "";
    let keyBind = "";

    if (i === 0) {
      kickNotes = "5---:-13-:-5--:5---";
      hihatNotes = "5-5-5555:5-5-5-23:13575-55:135-5-5-";
      snareNotes = "--5-:-5--";
      phraseName = "sweet";
      keyBind = "KeyA";
    }
    if (i === 1) {
      kickNotes = "5-5-:5-5-";
      hihatNotes = "-5-5:-5-5";
      snareNotes = "--5-:--5-";
      phraseName = "damn";
      keyBind = "KeyS";
    }
    if (i === 2) {
      arpNotes = "5--5:--3-";
      phraseName = "arpy";
      keyBind = "KeyD";
    }

    if (kickNotes.length > 0) {
      const kickM: Measure = {
        index: 1,
        vNotes: kickNotes,
        m64Notes: initialize64Melody(kickNotes),
        v64Notes: convertTo64Rhythm(kickNotes),
      };
      const hihatM: Measure = {
        index: 1,
        vNotes: hihatNotes,
        m64Notes: initialize64Melody(hihatNotes),
        v64Notes: convertTo64Rhythm(hihatNotes),
      };
      const snareM: Measure = {
        index: 1,
        vNotes: snareNotes,
        m64Notes: initialize64Melody(snareNotes),
        v64Notes: convertTo64Rhythm(snareNotes),
      };

      let j = 0;
      if (i > 0) {
        j = 3;
      }

      const kickP = createPattern(samples.value[0 + j]!, [kickM], audioContext.value);
      const hihatP = createPattern(samples.value[1 + j]!, [hihatM], audioContext.value);
      const snareP = createPattern(samples.value[2 + j]!, [snareM], audioContext.value);

      figures.value.push(
        createFigure(
          phraseName,
          keyBind,
          1,
          [kickP, hihatP, snareP],
          audioContext.value
        )
      );
    } else {
      const arpM: Measure = {
        index: 1,
        vNotes: arpNotes,
        m64Notes: initialize64Melody(arpNotes),
        v64Notes: convertTo64Rhythm(arpNotes),
      };

      const arpP = createPattern(samples.value[6]!, [arpM], audioContext.value);

      figures.value.push(createFigure(phraseName, keyBind, 1, [arpP], audioContext.value));
    }
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
    playSample,
    stopSample,
    playTracker,
    stopTracker,
    mixerConnectChildToParent,
    loadFigures
  };
});
