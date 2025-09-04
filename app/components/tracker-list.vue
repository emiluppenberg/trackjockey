<script setup lang="ts">
import { Track } from "~/types2";

const audioStore = useAudioStore();
const ctx = audioStore.ctx!;
const tracker = audioStore.tracker!;

function changeTrackerBpm(e: Event) {
  const element = e.target as HTMLInputElement;
  const value = element.value;

  if (Number(value)) tracker.bpm = Number(value);
}

function changeTracksLength(e: Event) {
  const value = (e.target as HTMLInputElement).value;

  if (Number(value)) {
    const len = Number(value);

    if (tracker.tracks.length > len) {
      for (let i = tracker.tracks.length; i > len; i--) {
        const t = tracker.tracks[i - 1]!;

        t.disconnect();
        
        tracker.tracks.pop();
      }
    }

    if (tracker.tracks.length < len) {
      for (let i = tracker.tracks.length; i < len; i++) {
        tracker.tracks.push(new Track(ctx));
      }
    }
  }
}

function changeTrackFigure(e: KeyboardEvent, t: Track) {
  if (e.code === "Tab") return;

  e.preventDefault();

  if (e.code === "KeyQ") {
    t.mute = !t.mute;
    return;
  }

  const f = audioStore.figures.find((_f) => _f.keyBind === e.code);

  if (f) {
    if (t.figure) {
      t.figure.patterns.forEach((p) => p.disconnect());
    }

    t.currentMeasure = 0;
    t.figure = f.clone(ctx);
    t.connect(tracker);
  }
}

function changeTrackNextFigure(e: KeyboardEvent, t: Track) {
  if (e.code === "Tab") return;

  e.preventDefault();

  const f = audioStore.figures.find((_f) => _f.keyBind === e.code);

  if (f) {
    t.nextFigure = f.clone(ctx);
  }
}

function focusTrackNextFigure(e: MouseEvent, idxT: number, t: Track) {
  e.preventDefault();

  if (!t.nextFigure) t.nextFigure = tracker.tracks[0]!.figure;

  nextTick(() => {
    const element = document.getElementById(`track-${idxT}-next-figure`);
    console.log(element);
    if (element) element.focus();
  });
}

function pushTracksNextFigure() {
  const tracks = tracker.tracks.filter((t) => t.nextFigure);

  for (const t of tracks) {
     if (t.figure) {
      t.figure.patterns.forEach((p) => p.disconnect());
    }

    t.currentMeasure = 0;
    t.figure = t.nextFigure;
    t.nextFigure = undefined;
    t.connect(tracker);
  }
}
</script>

<template>
  <div class="flex">
    <!-- Options -->
    <div id="tracker-options" class="flex flex-col w-[100px] min-h-[80px]">
      <input
        type="number"
        :value="tracker.tracks.length"
        class="w-[100px] h-[40px] border-r border-b border-white text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
        @change="(e) => changeTracksLength(e)"
      />
      <input
        type="text"
        class="w-[100px] h-[40px] border-r border-white text-center text-3xl text-white bg-sky-400 focus:bg-sky-200"
        :value="tracker.bpm.toString()"
        @change="(e) => changeTrackerBpm(e)"
      />
      <button
        v-if="tracker.tracks.some((t) => t.nextFigure)"
        class="w-[100px] h-[40px] border-r border-t border-white text-center text-xl text-white bg-sky-400 focus:bg-sky-200"
        @click="pushTracksNextFigure"
      >
        PUSH ->
      </button>
    </div>
    <!-- Track list -->
    <div id="tracker-list" class="flex w-full min-h-[80px] overflow-x-auto">
      <div
        :id="`track-${idxT}`"
        v-for="(t, idxT) in tracker.tracks"
        :key="idxT"
        class="max-w-[150px] min-w-[150px] min-h-[80px] flex flex-col border-r border-cyan-400"
        :class="{
          'bg-cyan-700': t !== audioStore.activeTrack,
          'bg-lime-700': t === audioStore.activeTrack,
        }"
      >
        <button
          class="w-full min-h-[80px] flex flex-col justify-center items-center overflow-hidden select-none"
          @focus="audioStore.activeTrack = t"
          @keydown="(e) => changeTrackFigure(e, t)"
          @click.right="(e) => focusTrackNextFigure(e, idxT, t)"
        >
          <label
            class="text-3xl text-center"
            :class="{
              'text-cyan-200': t !== audioStore.activeTrack,
              'text-lime-200': t === audioStore.activeTrack,
            }"
          >
            {{ (tracker.tracks.indexOf(t) + 1).toString() }}
          </label>
          <div
            class="max-w-[130px] italic text-2xl text-center truncate pointer-events-none focus:outline-none"
            :class="{
              'text-cyan-200': t !== audioStore.activeTrack,
              'text-lime-200': t === audioStore.activeTrack,
            }"
          >
            {{ t.figure?.name || "undefined" }}
          </div>
        </button>
        <input
          tabindex="-1"
          v-if="t.nextFigure"
          :id="`track-${idxT}-next-figure`"
          class="w-full h-[40px] flex flex-col justify-center text-xl text-center truncate pointer-events-none focus:outline-indigo-200 bg-slate-400 text-lime-300"
          :value="t.nextFigure.name"
          @keydown="(e) => changeTrackNextFigure(e, t)"
        />
      </div>
    </div>
  </div>
</template>
