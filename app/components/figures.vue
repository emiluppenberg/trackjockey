<script setup lang="ts">
import { flatMap } from "lodash-es";
import { renderToSimpleStream } from "vue/server-renderer";
import {
  selectAllText,
  sleep,
  type Figure,
  type Measure,
  type Pattern,
  type Sample,
} from "~/types2";
const audioStore = useAudioStore();

const samples = audioStore.samples;
const figures = audioStore.figures;
const audioContext = audioStore.audioContext!;

const isEditingMeasure = ref<Measure>();
const isPlaying = ref<boolean>(false);
const sFigure = ref<Figure>();

function addPattern() {
  if (sFigure.value) {
    if (samples[0]) {
      sFigure.value.patterns.push({
        mute: false,
        sample: samples[0],
        measures: [],
      });
    }
  }
}
function addFigure() {
  const fLen = figures.push({
    name: "",
    color: "#D6B300",
    measureCount: 1,
    tempo: 120,
    patterns: [],
  });
  sFigure.value = figures[fLen - 1];
}

function inputMeasureNotation(e: Event, m: Measure) {
  const value = (e.target as HTMLInputElement).value.toUpperCase();
  let rNotes: string = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charAt(i);
    switch (c) {
      case "1":
        rNotes += c;
        break;
      case "2":
        rNotes += c;
        break;
      case "3":
        rNotes += c;
        break;
      case "4":
        rNotes += c;
        break;
      case "5":
        rNotes += c;
        break;
      case "6":
        rNotes += c;
        break;
      case "7":
        rNotes += c;
        break;
      case "8":
        rNotes += c;
        break;
      case "9":
        rNotes += c;
        break;
      case "X":
        rNotes += c;
        break;
      case "-":
        rNotes += c;
        break;
      case ":":
        rNotes += c;
        break;
      default:
        alert("Invalid note input (character) inputmeasurenotation");
        return;
    }
  }
  m.rNotes = rNotes;
  m.fNotes = convertTo64Rhythm(rNotes);
  m.mNotes = initialize64Melody(rNotes);
}
function convertTo64Rhythm(notes: string): string {
  const fLen = 64 / notes.length;
  let fNotes = "";
  let fIdx = 0;

  const formatNotes = (c: string) => {
    fNotes += c;
    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      fNotes += "-";
    }
    fIdx += fLen;
  };

  for (let i = 0; i < notes.length; i++) {
    const c = notes.charAt(i);
    switch (c) {
      case "1":
        formatNotes(c);
        break;
      case "2":
        formatNotes(c);
        break;
      case "3":
        formatNotes(c);
        break;
      case "4":
        formatNotes(c);
        break;
      case "5":
        formatNotes(c);
        break;
      case "6":
        formatNotes(c);
        break;
      case "7":
        formatNotes(c);
        break;
      case "8":
        formatNotes(c);
        break;
      case "9":
        formatNotes(c);
        break;
      case "X":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      case ":":
        break;
      default:
        alert("Invalid note input (character) conversion");
        return "";
    }
  }
  return fNotes;
}
function initialize64Melody(rNotes: string): string[] {
  const fLen = 64 / rNotes.length;
  let mNotes: string[] = [];
  let fIdx = 0;

  const formatNotes = (c: string) => {
    if (Number(c)) {
      mNotes.push("0");
    } else {
      mNotes.push(c);
    }

    for (let j = fIdx + 1; j < fLen + fIdx; j++) {
      mNotes.push("-");
    }
    fIdx += fLen;
  };

  for (let i = 0; i < rNotes.length; i++) {
    const c = rNotes.charAt(i);
    switch (c) {
      case "1":
        formatNotes(c);
        break;
      case "2":
        formatNotes(c);
        break;
      case "3":
        formatNotes(c);
        break;
      case "4":
        formatNotes(c);
        break;
      case "5":
        formatNotes(c);
        break;
      case "6":
        formatNotes(c);
        break;
      case "7":
        formatNotes(c);
        break;
      case "8":
        formatNotes(c);
        break;
      case "9":
        formatNotes(c);
        break;
      case "X":
        formatNotes(c);
        break;
      case "-":
        formatNotes(c);
        break;
      case ":":
        break;
      default:
        alert("Invalid note input (character) conversion");
        return [];
    }
  }
  return mNotes;
}
function getMelodyIndex(idxC: number, rNotes: string): number {
  let idxM = 0;
  let _rNotes = "";

  for (let i = 0; i < idxC; i++) {
    const c = rNotes.charAt(i);
    if (c !== ":") idxM++;
  }

  for (let i = 0; i < rNotes.length; i++) {
    const c = rNotes.charAt(i);
    if (c !== ":") _rNotes += c;
  }

  const fLen = 64 / _rNotes.length;
  return fLen * idxM;
}

function changeFigureTempo(e: Event) {
  if (sFigure.value) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(value)) {
      sFigure.value.tempo = Number(value);
    } else if (value === "") {
      return;
    } else if (!Number(value)) {
      alert("Tempo must be a number");
    }
  }
}
function changeFigureMeasures(e: Event) {
  if (sFigure.value) {
    const value = (e.target as HTMLInputElement).value;
    if (Number(value)) {
      if (sFigure.value.patterns[0]) {
        const mPop = sFigure.value.patterns.flatMap((p) =>
          p.measures.filter((m) => m.index > Number(value))
        );
        if (mPop.length > 0) {
          const ok = confirm(`Continuing will remove ${mPop.length} measures`);
          if (ok) {
            for (const mp of mPop) {
              sFigure.value.patterns.flatMap((p) => {
                const idx = p.measures.findIndex((_mp) => _mp === mp);
                idx >= 0 && p.measures.splice(idx, 1);
              });
            }
          }
        }
      }
      sFigure.value.measureCount = Number(value);
    } else if (value === "") {
      return;
    } else if (!Number(value)) {
      alert("Measures must be a number");
    }
  }
}

async function playSelectedFigure() {
  if (sFigure.value && sFigure.value.measureCount > 0) {
    isPlaying.value = true;
    const channel = audioContext.createChannelMerger(sFigure.value.patterns.length);
    const panner = audioContext.createStereoPanner();
    panner.pan.value = 0.5;

    channel
      .connect(panner)
      .connect(audioContext.destination);

    while (true) {
      const noteLength = // Note length in milliseconds
        (1 / (64 / 4)) * // One quarter note (Measures always noted as 64/4)
        (60 / sFigure.value.tempo) * // BPM (Quarter notes/Minute)
        1000; // milliseconds

      for (let i = 1; i <= sFigure.value.measureCount; i++) {
        for (let j = 0; j < 64; j++) {
          for (const p of sFigure.value.patterns) {
            const m = p.measures.find((_m) => _m.index === i);

            if (m && m.fNotes[j] !== "-") {
              const velocity = Number(m.fNotes[j]);
              const melody = Number(m.mNotes[j]) || 0;

              if (velocity) {
                audioStore.playSample(p.sample, velocity, melody, channel);
              }
              if (m.fNotes[j] === "X") {
                audioStore.stopSample(p.sample);
              }
            }
          }
          await sleep(noteLength);
          if (!isPlaying.value) {
            return;
          }
        }
      }
    }
  }
}
async function loadFigures() {
  const hihat1 = await fetch(
    new URL("~/assets/HH_AcardeBullet11.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const hihat2 = await fetch(
    new URL("~/assets/HH_AcardeBullet41.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const kick1 = await fetch(
    new URL("~/assets/Tom_BleepBullet3.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const kick2 = await fetch(
    new URL("~/assets/BD_KastleBullet1.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const snare1 = await fetch(
    new URL("~/assets/SD_KastleBullet6.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const snare2 = await fetch(
    new URL("~/assets/SD_LunchBullet4.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  const arp1 = await fetch(
    new URL("~/assets/ArpFallST_AcardeBullet002.wav/", import.meta.url).href
  )
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)!);

  for (const s of samples) {
    samples.pop();
  }

  samples.push({ audioBuffer: kick1, name: "kick1" });
  samples.push({
    audioBuffer: hihat1,
    name: "hihat1",
  });
  samples.push({
    audioBuffer: snare1,
    name: "snare1",
  });
  samples.push({ audioBuffer: kick2, name: "kick2" });
  samples.push({
    audioBuffer: hihat2,
    name: "hihat2",
  });
  samples.push({
    audioBuffer: snare2,
    name: "snare2",
  });
  samples.push({ audioBuffer: arp1, name: "arp1" });

  for (const f of figures) {
    figures.pop();
  }

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
        rNotes: kickNotes,
        mNotes: initialize64Melody(kickNotes),
        fNotes: convertTo64Rhythm(kickNotes),
      };
      const hihatM: Measure = {
        index: 1,
        rNotes: hihatNotes,
        mNotes: initialize64Melody(hihatNotes),
        fNotes: convertTo64Rhythm(hihatNotes),
      };
      const snareM: Measure = {
        index: 1,
        rNotes: snareNotes,
        mNotes: initialize64Melody(snareNotes),
        fNotes: convertTo64Rhythm(snareNotes),
      };

      let j = 0;
      if (i > 0) {
        j = 3;
      }

      const kickP: Pattern = {
        mute: false,
        sample: samples[0 + j]!,
        measures: [kickM],
      };
      const hihatP: Pattern = {
        mute: false,
        sample: samples[1 + j]!,
        measures: [hihatM],
      };
      const snareP: Pattern = {
        mute: false,
        sample: samples[2 + j]!,
        measures: [snareM],
      };

      figures.push({
        name: phraseName,
        color: "#D6B300",
        keyBind: keyBind,
        measureCount: 1,
        tempo: 120,
        patterns: [kickP, hihatP, snareP],
      });
    } else {
      const arpM: Measure = {
        index: 1,
        rNotes: arpNotes,
        mNotes: initialize64Melody(arpNotes),
        fNotes: convertTo64Rhythm(arpNotes),
      };

      const arpP: Pattern = {
        mute: false,
        sample: samples[6]!,
        measures: [arpM],
      };

      figures.push({
        name: phraseName,
        color: "#D6B300",
        keyBind: keyBind,
        measureCount: 1,
        tempo: 120,
        patterns: [arpP],
      });
    }
  }
  sFigure.value = figures[0];
}

function handleEditMeasureRhythm(idxP: number, idxMc: number, m: Measure) {
  isEditingMeasure.value = m;
  const textarea = document.getElementById(
    `pattern-${idxP}-measure-${idxMc}-rhythm-textarea`
  ) as HTMLTextAreaElement;

  if (textarea) {
    textarea.classList.remove("hidden");
    textarea.focus();
  }
}
onMounted(() => {
  sFigure.value = figures[0];
});
</script>

<template>
  <!-- Left -->
  <div class="flex flex-col w-[50%] h-full border-r border-black items-center">
    <!-- Figure config -->
    <div
      id="figure-options"
      v-if="sFigure"
      class="flex w-full border border-black items-center"
    >
      <div id="figure-select" class="grow flex flex-col border-l border-r">
        <select v-model="sFigure" class="w-full border-b text-center">
          <option v-for="(f, idxF) in figures" :key="idxF" :value="f">
            {{ f.name }}
          </option>
        </select>
        <button class="w-full text-center" @click="addFigure">
          New phrase
        </button>
      </div>
      <div id="figure-name" class="grow flex flex-col border-l border-r">
        <label class="text-center">Name</label>
        <input
          type="text"
          v-model="sFigure.name"
          class="border-t text-center"
          placeholder="Enter name"
        />
      </div>
      <div
        id="figure-measure-count"
        class="grow flex flex-col border-l border-r"
      >
        <label class="text-center">Measures</label>
        <input
          type="text"
          :value="sFigure.measureCount"
          class="border-t text-center"
          @change="(e) => changeFigureMeasures(e)"
        />
      </div>
      <div id="figure-tempo" class="grow flex flex-col border-l border-r">
        <label class="text-center">Tempo</label>
        <input
          type="text"
          class="border-t text-center"
          :value="sFigure.tempo.toString()"
          @change="(e) => changeFigureTempo(e)"
        />
      </div>
      <div id="figure-color" class="grow flex flex-col border-l border-r">
        <label class="text-center h-[20%]">Color</label>
        <input v-model="sFigure.color" type="color" class="border-t w-full" />
      </div>
      <button
        class="grow h-full border text-center bg-green-600"
        @click="playSelectedFigure"
      >
        Play
      </button>
      <button
        class="grow h-full border text-center bg-red-600"
        @click="isPlaying = false"
      >
        Stop
      </button>
      <button
        class="grow h-full border text-center bg-blue-600"
        @click="loadFigures"
      >
        (Load)
      </button>
    </div>
    <!-- Patterns text editor -->
    <div
      id="pattern-editor"
      v-if="sFigure"
      class="w-full h-full flex flex-col items-center"
    >
      <div
        id="pattern"
        v-for="(p, idxP) in sFigure.patterns"
        class="w-full h-[5%] flex border items-center"
      >
        <!-- Pattern sample -->
        <div id="pattern-sample" class="w-[10%] h-full flex flex-col">
          <select
            v-model="p.sample"
            class="w-full h-full border text-center bg-blue-600"
          >
            <option
              v-for="(s, idxS) in samples"
              :key="idxS"
              class="bg-blue-600"
              :value="s"
            >
              {{ s.name }}
            </option>
          </select>
        </div>
        <!-- Pattern measures -->
        <div
          id="pattern-measures"
          v-for="idxMc in sFigure.measureCount"
          :key="idxMc"
          class="border h-full flex items-center justify-center"
          :style="{ width: 100 / sFigure.measureCount + '%' }"
        >
          <button
            v-if="!p.measures.some((m) => m.index === idxMc)"
            class="w-full h-full border"
            @click="
              p.measures.push({
                index: idxMc,
                rNotes: '',
                mNotes: [],
                fNotes: '',
              })
            "
          >
            +
          </button>
          <template v-for="m in p.measures">
            <div
              :id="`pattern-measure-${m.index}`"
              v-if="m.index === idxMc"
              class="w-full h-full flex flex-col"
            >
              <div class="flex w-full h-[50%] border-b items-start">
                <div
                  tabindex="0"
                  class="w-full h-full flex justify-evenly"
                  :class="{ hidden: isEditingMeasure === m }"
                  @focus="handleEditMeasureRhythm(idxP, idxMc, m)"
                >
                  <div
                    v-for="(c, idxC) in m.rNotes"
                    class="text-center w-[1em]"
                  >
                    {{ c }}
                  </div>
                </div>
                <textarea
                  :id="`pattern-${idxP}-measure-${idxMc}-rhythm-textarea`"
                  type="text"
                  class="w-full field-sizing-content text-center content-center"
                  rows="1"
                  :class="{ hidden: isEditingMeasure !== m }"
                  :value="m.rNotes"
                  @change="(e) => inputMeasureNotation(e, m)"
                  @focus="(e) => selectAllText(e)"
                  @focusout="isEditingMeasure = undefined"
                  wrap="soft"
                ></textarea>
              </div>
              <div class="flex w-full h-[50%]">
                <div class="w-full h-full flex justify-evenly">
                  <div v-for="(c, idxC) in m.rNotes" class="w-[1em]">
                    <div
                      v-if="Number(c)"
                      class="relative w-full h-full flex justify-center"
                    >
                      <input
                        tabindex="0"
                        type="number"
                        class="opacity-0 absolute inset-0 peer"
                        v-model="m.mNotes[getMelodyIndex(idxC, m.rNotes)]"
                      />
                      <div
                        class="flex font-thin text-xs text-center justify-center items-center select-none peer-focus:ring-2 peer-focus:ring-blue-600"
                      >
                        <div>
                          {{ m.mNotes[getMelodyIndex(idxC, m.rNotes)] }}
                        </div>
                      </div>
                    </div>
                    <div v-else-if="c === ':'" class="text-center">{{ c }}</div>
                    <div v-else></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <button
        v-if="samples[0]"
        class="w-full h-[5%] border rounded-lg text-center"
        @click="addPattern"
      >
        New pattern
      </button>
      <button
        v-if="samples.length === 0"
        class="w-full h-[5%] border rounded-lg text-center"
      >
        Add samples to create patterns
      </button>
    </div>
  </div>
</template>
