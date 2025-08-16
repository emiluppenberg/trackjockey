<script setup lang="ts">
import type { Mixer } from "~/types2";
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;
const activeMix = ref<Mixer>();
const props = defineProps<{
  activeTrackIdx: number;
}>();

function ChangePitch(e: Event) {
  if (!activeMix.value) return;

  const element = e.target as HTMLInputElement;
  activeMix.value.pitchValue = Number(element.value);

  if (activeMix.value.pitcherNode)
    activeMix.value.pitcherNode.parameters.get("pitch")!.value =
      activeMix.value.pitchValue;

  element.select();
}
function ActivatePitcherNode(e: KeyboardEvent) {
  if (!activeMix.value) return;
  if (!e.code.includes("Control")) return;

  if (activeMix.value.pitcherNode) activeMix.value.pitcherNode = undefined;
  else {
    activeMix.value.pitcherNode = new AudioWorkletNode(
      audioContext,
      "pitch-processor"
    );

    audioStore.mixerConnectChildToParent(activeMix.value, tracker.mixer);
  }
}

watch(
  () => props.activeTrackIdx,
  (newIdx) => {
    activeMix.value = audioStore.tracker!.tracks[newIdx]!.mixer;
  }
);
</script>

<template>
  <!-- Right -->
  <div
    v-if="activeMix"
    id="active-track-mixer-container"
    class="h-full border-l border-white bg-blue-600"
  >
    <input
      id="active-track-pitch"
      type="number"
      :value="activeMix.pitchValue"
      class="w-[20%] h-[25%] border-b border-r border-white"
      :class="{
        'bg-green-600': activeMix.pitcherNode,
        'bg-red-600': !activeMix.pitcherNode,
      }"
      @keydown="(e) => ActivatePitcherNode(e)"
      @change="(e) => ChangePitch(e)"
    />
  </div>
</template>
