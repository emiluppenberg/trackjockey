<script setup lang="ts">
import type { Track } from "~/types2";
const props = defineProps<{
  activeTrack: Track;
}>();
const activeTrack = props.activeTrack;
const emits = defineEmits(["changeActiveTrackPitch"]);

const currentKeyDown = ref<string>("");
const intervalIds = ref<number[]>([]);

function onChangePitch(e: Event) {
  const element = e.target as HTMLInputElement;
  const pitch = Number(element.value) * 100;
  emits("changeActiveTrackPitch", pitch);
  element.select();
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <!-- Master Mix -->
    <div
      id="master-mixer-container"
      class="h-[80%] border-b border-black"
    ></div>
    <!-- ActiveTrack Mix -->
    <div
      id="active-track-mixer-container"
      class="h-[20%] border-l border-white bg-black"
    >
      <input
        id="active-track-pitch"
        type="number"
        class="w-[20%] h-[25%] border-b border-r border-white"
        @change="(e) => onChangePitch(e)"
      />
    </div>
  </div>
</template>
