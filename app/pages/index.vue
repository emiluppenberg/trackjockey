<script setup lang="ts">
import Sampler from "~/components/sampler.vue";
import type {
  Sample,
  Figure,
  Pattern,
  Measure,
  DragHandler,
  Tracker,
} from "~/types2";
const audioContext = ref<AudioContext>();
const samples = ref<Sample[]>([]);
const figures = ref<Figure[]>([]);
const sComponent = ref<string>("figures");
const tracker = ref<Tracker>({ bpm: 120, tracks: [{ figure: undefined, pitch: 0 }] });

async function playSample(s: Sample, velocity: string, pitch: number) {
  if (audioContext.value) {
    if (Number(velocity)) {
      const gain = (Number(velocity) * 2) / 10;
      const gainNode = audioContext.value.createGain();
      gainNode.gain.value = gain;
      s.source = audioContext.value.createBufferSource();
      s.source.buffer = s.audioBuffer;
      s.source.detune.value = pitch;
      s.source.connect(gainNode).connect(audioContext.value.destination);
      s.source.start();
    }
  }
}
async function stopSample(s: Sample) {
  if (audioContext.value) {
    if (s.source) {
      s.source.stop();
      s.source = undefined;
    }
  }
}
onMounted(() => {
  audioContext.value = new AudioContext();

  figures.value.push({
    name: "",
    color: "#D6B300",
    measureCount: 1,
    tempo: 120,
    patterns: [],
  });
});
</script>

<template>
  <div class="flex flex-col w-full h-screen">
    <div id="component-select" class="flex w-full h-[5%] border-b border-black">
      <button
        class="w-[50%] text-center border-r border-black"
        @click="sComponent = 'figures'"
      >
        Figures
      </button>
      <button
        class="w-[50%] text-center border-r border-black"
        @click="sComponent = 'tracker'"
      >
        Tracker
      </button>
    </div>
    <div id="app-content" class="flex w-full h-[95%]">
      <Figures
        v-if="audioContext && sComponent === 'figures'"
        :samples="samples"
        :figures="figures"
        :audio-context="audioContext"
        @play-sample="(s: Sample, v: string) => playSample(s, v, 0)"
        @stop-sample="(s: Sample) => stopSample(s)"
      ></Figures>
      <Sampler
        v-if="audioContext && sComponent === 'sampler'"
        :samples="samples"
        :audio-context="audioContext"
        @play-sample="(s: Sample, v: string) => playSample(s, v, 0)"
      ></Sampler>
      <Tracker
        v-if="audioContext && sComponent === 'tracker'"
        :figures="figures"
        :samples="samples"
        :tracker="tracker"
        @play-sample="(s: Sample, v: string, p: number) => playSample(s, v, p)"
        @stop-sample="(s: Sample) => stopSample(s)"
      >
      </Tracker>
    </div>
  </div>
</template>
