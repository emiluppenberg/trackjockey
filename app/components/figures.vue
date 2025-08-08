<script setup lang="ts">
import {
  sleep,
  type Figure,
  type Measure,
  type Pattern,
  type Sample,
} from "~/types2";

const props = defineProps<{
  samples: Sample[];
  audioContext: AudioContext;
  figures: Figure[];
}>();
const samples = props.samples;
const audioContext = props.audioContext;
const figures = props.figures;

const isPlaying = ref<boolean>(false);
const sFigure = ref<Figure>();

const emits = defineEmits(["playSample", "stopSample"]);

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
  let dNotes: string = "";
  for (let i = 0; i < value.length; i++) {
    const c = value.charAt(i);
    switch (c) {
      case "1":
        dNotes += c;
        break;
      case "2":
        dNotes += c;
        break;
      case "3":
        dNotes += c;
        break;
      case "4":
        dNotes += c;
        break;
      case "5":
        dNotes += c;
        break;
      case "6":
        dNotes += c;
        break;
      case "7":
        dNotes += c;
        break;
      case "8":
        dNotes += c;
        break;
      case "9":
        dNotes += c;
        break;
      case "X":
        dNotes += c;
        break;
      case "-":
        dNotes += c;
        break;
      case ":":
        dNotes += c;
        break;
      default:
        alert("Invalid note input (character) inputmeasurenotation");
        return;
    }
  }
  m.dNotes = dNotes;
  m.fNotes = convertTo64Subdivision(dNotes);
}
function convertTo64Subdivision(notes: string): string {
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
    while (isPlaying.value === true) {
      const noteLength = // Note length in milliseconds
        (1 / (64 / 4)) * // One quarter note (Measures always noted as 64/4)
        (60 / sFigure.value.tempo) * // BPM (Quarter notes/Minute)
        1000; // milliseconds
      for (let i = 1; i <= sFigure.value.measureCount; i++) {
        for (let j = 0; j < 64; j++) {
          for (const p of sFigure.value.patterns) {
            const m = p.measures.find((_m) => _m.index === i);
            if (m && m.fNotes[j] !== "-") {
              const c = m.fNotes[j]!;
              if (
                c === "1" ||
                "2" ||
                "3" ||
                "4" ||
                "5" ||
                "6" ||
                "7" ||
                "8" ||
                "9"
              ) {
                emits("playSample", p.sample, c);
              }
              if (c === "X") {
                emits("stopSample", p.sample);
              }
            }
          }
          await sleep(noteLength);
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
        dNotes: kickNotes,
        fNotes: convertTo64Subdivision(kickNotes),
      };
      const hihatM: Measure = {
        index: 1,
        dNotes: hihatNotes,
        fNotes: convertTo64Subdivision(hihatNotes),
      };
      const snareM: Measure = {
        index: 1,
        dNotes: snareNotes,
        fNotes: convertTo64Subdivision(snareNotes),
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
        dNotes: arpNotes,
        fNotes: convertTo64Subdivision(arpNotes),
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
        v-for="(pa, idxPa) in sFigure.patterns"
        class="w-full h-[5%] flex border items-center"
      >
        <!-- Pattern sample -->
        <div id="pattern-sample" class="w-[10%] h-full flex flex-col">
          <select
            v-model="pa.sample"
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
            v-if="!pa.measures.some((m) => m.index === idxMc)"
            class="w-full h-full border"
            @click="pa.measures.push({ index: idxMc, dNotes: '', fNotes: '' })"
          >
            +
          </button>
          <template v-for="m in pa.measures">
            <div
              :id="`pattern-measure-${m.index}`"
              v-if="m.index === idxMc"
              class="w-full h-full flex flex-col"
            >
              <textarea
                type="text"
                class="w-full h-full text-center content-center"
                :value="m.dNotes"
                @change="(e) => inputMeasureNotation(e, m)"
                wrap="soft"
              ></textarea>
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
  <!-- Right -->
  <div class="flex flex-col w-[50%] h-full items-center">
    <Sampler
      v-if="audioContext"
      :samples="samples"
      :audio-context="audioContext"
      @play-sample="(s: Sample, c: string) => emits('playSample', s, c)"
    ></Sampler>
  </div>
</template>
