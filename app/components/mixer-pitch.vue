<script setup lang="ts">
import { handleScrollValue, selectAllText } from '~/types2';

const audioStore = useAudioStore();

function setPitch(e: Event) {
  e.preventDefault();

  const element = e.target as HTMLInputElement;
  audioStore.activeMixer!.pitch = Number(element.value);
  audioStore.activeMixer!.pitcherNode.parameters.get("pitch")!.value =
    audioStore.activeMixer!.pitch;
}
</script>

<template>
    <div
      class="flex flex-col text-white border-r border-cyan-400"
    >
      <div
        class="bg-sky-800/20 relative h-[50px] w-[50px] pt-1 flex flex-col text-xs text-center border-b border-cyan-400 hover:cursor-pointer"
      >
        Pitch
        <input
          id="pitch"
          type="number"
          step="1"
          class="absolute inset-0 pt-4 h-full text-center text-xl text-cyan-400 bg-transparent hover:cursor-pointer"
          :value="audioStore.activeMixer!.pitch"
          @wheel.prevent="
            (e) => {
              handleScrollValue(e);
              setPitch(e);
            }
          "
          @input="(e) => setPitch(e)"
          @focus="(e) => selectAllText(e)"
        />
      </div>
      </div>
</template>