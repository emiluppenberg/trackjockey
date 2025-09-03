<script setup lang="ts">
const audioStore = useAudioStore();
const ctx = audioStore.ctx!;
const tracks = audioStore.tracker!.tracks;
const figures = audioStore.figures;

function handleActiveInputKeyDown(e: KeyboardEvent) {
  const key = e.key;
  const element = e.target as HTMLButtonElement;
  element.style.color = "white";

  if (key === "Tab") return;
  e.preventDefault();

  if (key === "Backspace") {
    element.textContent = "";
    return;
  }

  if (Number(key)) {
    // Digit input
    const idxT = Number(element.textContent + key) - 1;
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = element.textContent + key;
    }
  }

  if (key === "ArrowUp") {
    const idxT = Number(element.textContent); // Zero based index!
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = (idxT + 1).toString();
    }
  }

  if (key === "ArrowDown") {
    const idxT = Number(element.textContent) - 2; // Zero based index!
    const t = tracks[idxT];

    if (t) {
      audioStore.activeTrack = t;
      element.textContent = idxT.toString();
    }
  } else changeActiveTrackFigure(e);
}

function focusActiveInput(e: KeyboardEvent) {
  e.preventDefault();

  const element = document.getElementById("active-input");
  if (element) element.focus();
}

async function changeActiveTrackFigure(e: KeyboardEvent) {
  if (e.code === "Tab") return;

  e.preventDefault();

  if (e.code === "KeyQ") {
    audioStore.activeTrack!.mute = !audioStore.activeTrack!.mute;
    console.log('mute');
    return;
  }

  const f = figures.find((_f) => _f.keyBind === e.code);

  if (f) {
    console.log(f);
    audioStore.activeTrack!.figure = f.clone(ctx);
    await audioStore.mixerConnectTrack(audioStore.activeTrack!);
  }
}

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.code === "BracketLeft") {
      focusActiveInput(e);
    }
  });
});
</script>

<template>
  <div id="tracker-active" class="flex h-[40px] border-t border-b border-white">
    <button
      id="active-input"
      class="w-[950px] border-r border-white text-white text-center text-3xl bg-indigo-700 focus:bg-indigo-400 select-text"
      @keydown="(e) => handleActiveInputKeyDown(e)"
    >
      {{ tracks.indexOf(audioStore.activeTrack!) + 1 }}
    </button>
    <button
      id="active-mix"
      class="w-[950px] text-white text-3xl bg-indigo-700 focus:bg-indigo-400"
      @click="() => (audioStore.activeMixer = audioStore.activeTrack!.mixer)"
    >
      MIX
    </button>
  </div>
</template>
