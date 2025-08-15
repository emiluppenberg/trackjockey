<script setup lang="ts">
import { createMixer, isFigure, isSample, type Figure, type Sample } from "~/types2";
const audioStore = useAudioStore();
const tracker = audioStore.tracker!;
const audioContext = audioStore.audioContext!;
const figures = audioStore.figures;
const isKeyDown = ref<boolean>(false);

function changeTrackerBpm(e: Event) {
  // TODO Change input to number
  const element = e.target as HTMLInputElement;
  const value = element.value;

  if (Number(value)) tracker.bpm = Number(value);
}

function changeTracksLength(e: Event) {
  // TODO Change input to number
  const value = (e.target as HTMLInputElement).value;

  if (Number(value)) {
    const len = Number(value);

    if (tracker.tracks.length > len) {
      for (let i = tracker.tracks.length; i > len; i--) {
        tracker.tracks.pop();
      }
    }

    if (tracker.tracks.length < len) {
      for (let i = tracker.tracks.length; i < len; i++) {
        // Make nicer
        tracker.tracks.push({
          figure: figures[0]!,
          channelNode: audioContext.createChannelMerger(),
          mixer: createMixer(audioContext)
        });
      }
    }
  }
}

function changeSoundKeyBind(e: KeyboardEvent, sound: Figure | Sample) {
  if (e.code === "Slash" || e.code === "Period" || e.code === "Tab") {
    return;
  }

  e.preventDefault();

  if (isFigure(sound)) {
    sound.keyBind = e.code;
  }
  if (isSample(sound)) {
    sound.keyBind = e.code;
  }
}

function handlePlayOrStop(e: KeyboardEvent) {
  switch (audioStore.isPlaying) {
    case true:
      audioStore.stopTracker();
      return;
    case false:
      audioStore.playTracker();
      return;
  }
}

onMounted(() => {
  const spaceKeyDownListener = (e: KeyboardEvent) => {
    if (e.code === "Space" && !isKeyDown.value) {
      isKeyDown.value = true;
      handlePlayOrStop(e);
    }
  };
  const spaceKeyUpListener = (e: KeyboardEvent) => {
    isKeyDown.value = false;
  };

  window.addEventListener("keydown", spaceKeyDownListener);
  window.addEventListener("keyup", spaceKeyUpListener);

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", spaceKeyDownListener);
    window.removeEventListener("keyup", spaceKeyUpListener);
  });
});
</script>

<template>
  <!-- Left -->
  <div class="flex flex-col w-[50%] h-full border-r border-black items-center">
    <!-- Tracker -->
    <div
      id="tracker-ui"
      v-if="tracker"
      class="flex flex-col w-full overflow-hidden h-full border border-black"
    >
      <!-- Options -->
      <div
        id="tracker-options"
        class="flex w-full h-[5%] border-b border-black"
      >
        <input
          type="number"
          :value="tracker.tracks.length"
          class="w-[15%] border-r border-black text-center text-3xl"
          @change="(e) => changeTracksLength(e)"
        />
        <input
          type="text"
          class="grow text-center text-3xl"
          :value="tracker.bpm.toString()"
          @change="(e) => changeTrackerBpm(e)"
        />
      </div>
      <!-- Tracker board -->
      <div id="tracker-board" class="flex w-full h-[95%]">
        <!-- Track list -->
        <div
          id="track-list"
          class="flex flex-col w-[15%] border-r border-black overflow-y-scroll overflow-x-hidden"
        >
          <div
            id="track-list-item"
            v-for="(t, idxT) in tracker.tracks"
            :key="idxT"
            class="flex flex-col border-b border-black items-start"
            :style="{ backgroundColor: t.figure ? t.figure.color : '#000000' }"
          >
            <label class="block truncate overflow-hidden">
              {{ (tracker.tracks.indexOf(t) + 1).toString() + ": " + t.figure?.name }}
            </label>
          </div>
        </div>
        <!-- Figures -->
        <div
          class="w-[85%] h-full flex flex-wrap overflow-y-scroll content-start"
        >
          <!-- Empty button -->
          <button
            tabindex="0"
            class="w-[25%] h-[25%] border-b border-r border-black text-center select-none overflow-hidden grid place-items-center bg-white"
          >
            <span class="text-center"> (Empty) </span>
            <input disabled class="text-center" value="KeyQ" />
          </button>
          <!-- Figure buttons -->
          <button
            v-for="(f, idxF) in figures"
            tabindex="0"
            :key="idxF"
            class="w-[25%] h-[25%] border-b border-r border-black text-center select-none overflow-hidden grid place-items-center"
            :style="{ 'background-color': f.color }"
          >
            <span class="text-center">
              {{ f.name }}
            </span>
            <input
              class="text-center"
              :value="f.keyBind ? f.keyBind : 'Bind to key'"
              @keydown="(e) => changeSoundKeyBind(e, f)"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
