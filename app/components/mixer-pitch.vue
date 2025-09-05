<script setup lang="ts">
import { handleScrollAudioParam, selectAllText } from '~/types2';

const audioStore = useAudioStore();
</script>

<template>
    <div class="flex flex-col w-[100px] rounded-tl-xl rounded-bl-xl text-white">
        <div
        class="max-h-[50px] grow text-xs text-center border-b border-cyan-400 bg-sky-800/20 hover:cursor-pointer"
        >
        Pan
        <input
        id="pan"
        type="number"
        step="0.1"
        min="-1"
        max="1"
        class="w-[100px] h-[30px] text-center text-3xl text-cyan-400 bg-transparent hover:cursor-pointer"
        v-model="audioStore.activeMixer!.pannerNode.pan.value"
        @wheel.prevent="(e) => handleScrollAudioParam(e, audioStore.activeMixer!.pannerNode.pan)"
        @focus="(e) => selectAllText(e)"
        />
      </div>
    </div>
</template>