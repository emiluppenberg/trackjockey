<script setup lang="ts">
import {
  isFigure,
  isSample,
  sleep,
  type Figure,
  type Sample,
  type Track,
  type Tracker,
} from "~/types2";
const props = defineProps<{
  figures: Figure[];
  samples: Sample[];
}>();
const emit = defineEmits(["playSample", "stopSample"]);
const tracker = ref<Tracker>();
const activeTrack = ref<Track>();
const isPlaying = ref<boolean>(false);
const isChangingActiveTrack = ref<boolean>(false);

async function playTracker() {
  if (tracker.value) {
    isPlaying.value = true;
    let noteLength;
    let j = -1;
    let i = 0;
    while (isPlaying.value === true) {
      const maxMeasures = tracker.value.tracks.map((t) => {
        if (t.figure) {
          return t.figure.measureCount;
        }
        return 0;
      });
      const m = Math.max(...maxMeasures);
      j++;
      if (j === 64) {
        j = 0;
      }
      if (j === 0) {
        i++;
      }
      if (i > m) {
        i = 1;
      }
      for (let k = 0; k < tracker.value.tracks.length; k++) {
        if (tracker.value.tracks[k]) {
          if (tracker.value.tracks[k]!.figure) {
            const f = tracker.value.tracks[k]!.figure!;
            noteLength = (1 / (64 / 4)) * (60 / f.tempo) * 1000; // milliseconds
            for (const p of f!.patterns) {
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
                  emit("playSample", p.sample, c);
                }
                if (c === "X") {
                  emit("stopSample", p.sample);
                }
              }
            }
          }
        }
      }
      if (!noteLength) {
        await sleep(30);
      }
      if (noteLength) {
        await sleep(noteLength);
      }
    }
  }
}

function changeActiveTrack(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  if (Number(value)) {
    const idxT = Number(value) - 1;
    if (tracker.value) {
      const t = tracker.value.tracks[idxT];
      if (t) {
        activeTrack.value = t;
        return;
      }
    }
  }
  if (activeTrack.value) {
    if (tracker.value) {
      (e.target as HTMLInputElement).value = (
        tracker.value.tracks.indexOf(activeTrack.value) + 1
      ).toString();
    }
  }
}
function changeTracksLength(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  if (Number(value)) {
    if (tracker.value) {
      const len = Number(value);
      if (tracker.value.tracks.length > len) {
        console.log(len);
        for (let i = tracker.value.tracks.length; i > len; i--) {
          tracker.value.tracks.pop();
        }
      }
      if (tracker.value.tracks.length < len) {
        for (let i = tracker.value.tracks.length; i < len; i++) {
          tracker.value.tracks.push({});
        }
      }
    }
  }
}
function changeTrackFigureWithKeyBind(e: KeyboardEvent) {
  if (e.code === "Tab") {
    return;
  }
  e.preventDefault();
  if (tracker.value) {
    if (activeTrack.value) {
      const f = props.figures.find((_f) => _f.keyBind === e.code);
      if (f) {
        activeTrack.value.figure = f;
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
function handleActiveTrackFocus(e: KeyboardEvent) {
  e.preventDefault();
  isChangingActiveTrack.value = !isChangingActiveTrack.value;
  switch (isChangingActiveTrack.value) {
    case true:
      const activeTrackElement = document.getElementById("active-track-input");
      if (activeTrackElement) {
        activeTrackElement.focus();
      }
      break;
    case false:
      const enableKeysElement = document.getElementById("tracker-enable-keys");
      if (enableKeysElement) {
        enableKeysElement.focus();
      }
  }
}
function handleEnableKeysFocus(e: KeyboardEvent) {
  if (!isChangingActiveTrack.value) {
    e.preventDefault();
    const enableKeysElement = document.getElementById("tracker-enable-keys");
    if (enableKeysElement) {
      enableKeysElement.focus();
    }
  }
}
function handlePlayOrStop(e: KeyboardEvent) {
  e.preventDefault();
  switch (isPlaying.value) {
    case true:
      isPlaying.value = false;
      break;
    case false:
      playTracker();
      break;
  }
}
function selectAllText(e: Event) {
  const target = e.target as HTMLInputElement;
  target.select();
}
onMounted(() => {
  tracker.value = { tracks: [{}, {}, {}] };
  activeTrack.value = tracker.value.tracks[0];
  window.addEventListener("keydown", (e) => {
    if (e.code === "Period") {
      handleActiveTrackFocus(e);
    }
    if (e.code === "Slash") {
      handleEnableKeysFocus(e);
    }
    if (e.code === "Space") {
      handlePlayOrStop(e);
    }
  });
});
</script>

<template>
  <!-- ActiveTrackInput -->
  <div
    id="active-track"
    class="flex flex-col w-full items-center overflow-hidden"
    :class="{ 'h-[50%]': isChangingActiveTrack, 'h-0': !isChangingActiveTrack }"
  >
    <label class="text-center">Active track</label>
    <input
      id="active-track-input"
      type="text"
      class="border-t text-center"
      @change="(e) => changeActiveTrack(e)"
      @focus="(e) => selectAllText(e)"
      @keydown.enter="(e) => handleActiveTrackFocus(e)"
    />
    <button
      id="active-track-figure"
      v-if="activeTrack?.figure"
      class="grow min-h-[25%] min-w-[20%] border border-black text-center select-none overflow-hidden grid place-items-center"
      :style="{ 'background-color': activeTrack.figure.color }"
    >
      <span class="text-center">
        {{ activeTrack.figure.name }}
      </span>
    </button>
  </div>
  <!-- Tracker -->
  <div
    id="tracker-ui"
    v-if="tracker"
    class="flex flex-col w-full overflow-hidden"
    :class="{
      'h-[50%]': !isChangingActiveTrack,
      'h-[0%]': isChangingActiveTrack,
    }"
  >
    <!-- Options -->
    <div id="tracker-options" class="flex w-full h-[15%] border border-black">
      <div
        id="tracker-tracks"
        class="w-[15%] flex flex-col border-r border-black"
      >
        <label class="text-center">Tracks</label>
        <input
          type="text"
          :value="tracker.tracks.length.toString()"
          class="border-t text-center"
          @change="(e) => changeTracksLength(e)"
        />
      </div>
      <div id="tracker-active" class="grow flex flex-col border-r">
        <label id="tracker-active-index" class="text-center">
          Activetrack:
          {{ (tracker.tracks.indexOf(activeTrack!) + 1).toString() }}
        </label>
        <label id="tracker-active-name" class="border-t text-center">
          {{ activeTrack?.figure?.name }}
        </label>
      </div>
      <button
        id="tracker-enable-keys"
        class="grow h-full"
        @keydown="(e) => changeTrackFigureWithKeyBind(e)"
      >
        Enable Keys
      </button>
    </div>
    <!-- Tracker board -->
    <div id="tracker-board" class="flex w-full h-[85%]">
      <!-- Track list -->
      <div id="track-list" class="flex flex-col w-[15%] border-r border-black overflow-y-scroll overflow-x-hidden">
        <div
          id="track-list-item"
          v-for="(t, idxT) in tracker.tracks"
          :key="idxT"
          class="flex flex-col border-b border-black items-start"
          :style="{ backgroundColor: t.figure?.color }"
        >
          <label class="block truncate overflow-hidden">
            {{
              (tracker.tracks.indexOf(t) + 1).toString() + ": " + t.figure?.name
            }}
          </label>
        </div>
      </div>
      <!-- Figures -->
      <div
        class="w-[85%] h-full border-b border-black flex flex-wrap overflow-y-scroll"
      >
        <button
          v-for="(f, idxF) in props.figures"
          tabindex="0"
          :key="idxF"
          class="grow min-h-[25%] min-w-[20%] border border-black text-center select-none overflow-hidden grid place-items-center"
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
  <!-- Visualizer/Mixer -->
  <div class="w-full h-[50%] flex flex-wrap border-t border-black"></div>
</template>
