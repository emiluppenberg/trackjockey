<script setup lang="ts">
const audioStore = useAudioStore();
const audioContext = audioStore.audioContext!;
const tracker = audioStore.tracker!;
const activeMixer = audioStore.activeMixer!;
const activeTrackIdx = ref<number>(0);

function changePitch(e: Event) {
  if (!activeMixer.pitcherNode) return;

  const element = e.target as HTMLInputElement;
  activeMixer.pitchValue = Number(element.value);

  activeMixer.pitcherNode.parameters.get("pitch")!.value =
    activeMixer.pitchValue;

  element.select();
}
function inputPitch(e: Event) {
  e.preventDefault();
  const element = e.target as HTMLInputElement;
  if (!activeMixer.pitcherNode) {
    element.value = "";
    return;
  }

  activeMixer.pitchValue = Number(element.value);
  activeMixer.pitcherNode.parameters.get("pitch")!.value =
    activeMixer.pitchValue;
}
function activatePitcherNode(e: KeyboardEvent) {
  if (!e.code.includes("Control")) return;

  if (activeMixer.pitcherNode) activeMixer.pitcherNode = undefined;
  else {
    activeMixer.pitcherNode = new AudioWorkletNode(
      audioContext,
      "pitch-processor"
    );

    audioStore.mixerConnectChildToParent(activeMixer, tracker.mixer);
  }
}
</script>

<template>
  <div id="active-mixer" class="w-full bg-blue-600">
    <input
      id="pitch"
      type="number"
      :value="activeMixer.pitchValue"
      class="w-[20%] h-[25%] border-b border-r border-white"
      :class="{
        'bg-green-600': activeMixer.pitcherNode,
        'bg-red-600': !activeMixer.pitcherNode,
      }"
      @keydown="(e) => activatePitcherNode(e)"
      @change="(e) => changePitch(e)"
      @input="(e) => inputPitch(e)"
    />
  </div>
</template>
