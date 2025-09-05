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
      class="flex flex-col w-[100px] rounded-tl-xl rounded-bl-xl text-white"
    >
      <div
        class="max-h-[50px] grow text-xs text-center border-b rounded-tl-xl border-cyan-400 bg-sky-800/20 hover:cursor-pointer"
      >
        Pitch
        <input
          id="pitch"
          type="number"
          step="1"
          class="w-[100px] h-[30px] text-center text-3xl text-cyan-400 bg-transparent hover:cursor-pointer"
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