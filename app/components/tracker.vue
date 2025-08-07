<script setup lang="ts">
import {
  isFigure,
  isSample,
  sleep,
  type Figure,
  type Measure,
  type Sample,
  type Track,
  type Tracker,
} from "~/types2";
const props = defineProps<{
  figures: Figure[];
  samples: Sample[];
}>();
const emit = defineEmits(["playSample", "stopSample"]);
const tracker = ref<Tracker>({ bpm: 120, tracks: [{ figure: undefined }] });
const activeTrack = ref<Track>({ figure: undefined });
const isPlaying = ref<boolean>(false);
const isChangingActiveTrack = ref<boolean>(false);
const cursor = ref<number>(0);

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
      cursor.value = j;
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
            noteLength = (1 / (64 / 4)) * (60 / tracker.value.bpm) * 1000; // milliseconds
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

function changeTrackerBpm(e: Event) {
  const element = e.target as HTMLInputElement;
  const value = element.value;
  if (Number(value)) {
    if (tracker.value) {
      tracker.value.bpm = Number(value);
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
function handleChangeActiveTrackFigure(e: KeyboardEvent) {
  if (e.code === "Tab") {
    return;
  }
  e.preventDefault();
  if (tracker.value) {
    if (activeTrack.value) {
      if (e.code === "KeyQ") {
        activeTrack.value.figure = undefined;
        return;
      }
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

function handlePlayOrStop(e: KeyboardEvent) {
  e.preventDefault();
  switch (isPlaying.value) {
    case true:
      isPlaying.value = false;
      cursor.value = 0;
      break;
    case false:
      playTracker();
      break;
  }
}

onMounted(() => {
  activeTrack.value = tracker.value.tracks[0]!;
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      handlePlayOrStop(e);
    }
  });
});
</script>

<template>
  <!-- Tracker -->
  <div
    id="tracker-ui"
    v-if="tracker"
    class="flex flex-col w-full overflow-hidden h-[80%] border border-black"
  >
    <!-- Options -->
    <div id="tracker-options" class="flex w-full h-[5%] border-b border-black">
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
          v-for="(f, idxF) in props.figures"
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
  <!-- ActiveTrack -->
  <ActiveTrack
    v-if="activeTrack"
    :active-track="activeTrack"
    :cursor="cursor"
    :tracker="tracker"
    @change-active-track="
      (t: Track) => {
        activeTrack = t;
      }
    "
    @change-active-track-figure="
      (e: KeyboardEvent) => handleChangeActiveTrackFigure(e)
    "
  ></ActiveTrack>
</template>
