<script setup lang="ts">
import {
  createMixer,
  isFigure,
  isSample,
  type Figure,
  type Sample,
} from "~/types2";
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
          figure: undefined,
          mixer: createMixer(audioContext),
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
  <!-- Tracker -->
  <div
    id="tracker-ui"
    v-if="tracker"
    class="flex w-full h-[300px] border border-white bg-sky-800"
  >
    <div class="flex flex-col border-r border-white w-[150px]">
      <!-- Options -->
      <div id="tracker-options" class="flex h-[50px] border-b border-white">
        <div class="flex">
          <input
            type="number"
            :value="tracker.tracks.length"
            class="w-[50%] border-r border-white text-center text-3xl text-white bg-sky-400"
            @change="(e) => changeTracksLength(e)"
          />
          <input
            type="text"
            class="w-[50%] text-center text-3xl text-white bg-sky-400"
            :value="tracker.bpm.toString()"
            @change="(e) => changeTrackerBpm(e)"
          />
        </div>
      </div>
      <!-- Track list -->
      <div
        id="track-list"
        class="flex flex-col w-full h-full overflow-y-scroll overflow-x-hidden"
      >
        <div
          id="track-list-item"
          v-for="(t, idxT) in tracker.tracks"
          :key="idxT"
          class="flex flex-col border-b border-cyan-400 items-start bg-cyan-700"
        >
          <label class="block truncate overflow-hidden italic text-cyan-200">
            {{
              (tracker.tracks.indexOf(t) + 1).toString() + ": " + t.figure?.name
            }}
          </label>
        </div>
      </div>
    </div>
    <!-- Figures -->
    <div
      class="w-full h-full flex flex-wrap border-t border-cyan-400 overflow-y-scroll content-start"
    >
      <!-- Empty button -->
      <button
        tabindex="0"
        class="w-[200px] h-[150px] border border-cyan-400 text-center select-none overflow-hidden grid bg-cyan-700 ml-1 mt-1"
      >
        <span class="italic text-center text-4xl text-cyan-200 place-self-center mt-5"> undefined </span>
        <input
          disabled
          class="text-center text-2xl text-white border-t border-cyan-400 place-self-end w-full bg-sky-400"
          value="KeyQ"
        />
      </button>
      <!-- Figure buttons -->
      <button
        v-for="(f, idxF) in figures"
        tabindex="0"
        :key="idxF"
        class="w-[200px] h-[150px] border border-cyan-400 text-center select-none overflow-hidden grid bg-cyan-700 ml-1 mt-1"
      >
        <span class="italic text-center text-4xl text-cyan-200 place-self-center mt-5">
          {{ f.name }}
        </span>
        <input
          class="text-center text-2xl text-white w-full border-t border-cyan-400 place-self-end bg-sky-400"
          :value="f.keyBind ? f.keyBind : 'Bind to key'"
          @keydown="(e) => changeSoundKeyBind(e, f)"
        />
      </button>
    </div>
  </div>
</template>
