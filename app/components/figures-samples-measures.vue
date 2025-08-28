<script setup lang="ts">
import {
  type Measure,
  convertTo64Velocity,
  getMelodyIndex,
  initialize64Melody,
} from "~/types2";
const props = defineProps<{ editMode: boolean }>();
const audioStore = useAudioStore();

const editMeasure = ref<Measure>();

function handleEditMeasureRhythm(idxP: number, idxMc: number, m: Measure) {
  editMeasure.value = m;
  const textarea = document.getElementById(
    `pattern-${idxP}-measure-${idxMc}-rhythm-textarea`
  ) as HTMLTextAreaElement;

  if (textarea) {
    textarea.classList.remove("hidden");
    textarea.focus();
  }
}

function inputMeasureNotation(e: Event, m: Measure) {
  const notes = (e.target as HTMLInputElement).value.toUpperCase();
  let vNotes: string = "";

  for (let i = 0; i < notes.length; i++) {
    const c = notes.charAt(i);
    switch (c) {
      case "1":
        vNotes += c;
        break;
      case "2":
        vNotes += c;
        break;
      case "3":
        vNotes += c;
        break;
      case "4":
        vNotes += c;
        break;
      case "5":
        vNotes += c;
        break;
      case "6":
        vNotes += c;
        break;
      case "7":
        vNotes += c;
        break;
      case "8":
        vNotes += c;
        break;
      case "9":
        vNotes += c;
        break;
      case "X":
        vNotes += c;
        break;
      case "-":
        vNotes += c;
        break;
      case ":":
        vNotes += c;
        break;
      default:
        alert("Invalid note input (character) inputmeasurenotation");
        return;
    }
  }
  m.vNotes = vNotes;
  m.v64Notes = convertTo64Velocity(vNotes);
  m.m64Notes = initialize64Melody(vNotes);
}
</script>

<template>
  <!-- Patterns -->
  <div
    v-if="audioStore.activeFigure"
    id="pattern-columns"
    class="max-w-[1700px] flex flex-col items-start overflow-x-auto bg-black"
  >
    <div
      id="pattern"
      v-for="(s, idxS) in audioStore.activeFigure.samples"
      class="w-auto h-[40px] flex items-center"
    >
      <!-- Pattern measures -->
      <div id="pattern-measures" class="w-full h-full flex justify-start">
        <div
          :id="`pattern-measure-${idxM}`"
          v-for="(m, idxM) in audioStore.activeFigure.measures[idxS]"
          :key="idxM"
          class="min-w-[400px] max-w-[400px] h-full flex"
        >
            <!-- Measure -->
            <div
              class="w-full flex flex-col border-r border-cyan-400"
            >
              <!-- Textarea/Hidden -->
              <textarea
                :id="`pattern-${idxS}-measure-${idxM}-rhythm-textarea`"
                type="text"
                class="w-full field-sizing-content text-center text-xl content-center bg-black text-white"
                rows="1"
                :class="{ hidden: editMeasure !== m }"
                :value="m.vNotes"
                @change="(e) => inputMeasureNotation(e, m)"
                @focusout="editMeasure = undefined"
                wrap="soft"
              ></textarea>
              <!-- Velocity -->
              <div
                class="flex w-full h-full border-b border-cyan-400 items-start"
                :class="{ hidden: editMeasure === m || editMode }"
              >
                <div
                  tabindex="0"
                  class="w-full h-full flex items-center justify-evenly text-2xl"
                  @focus="handleEditMeasureRhythm(idxS, idxM, m)"
                >
                  <div
                    v-for="(c, idxC) in m.vNotes"
                    class="text-center w-[2em]"
                  >
                    {{ c }}
                  </div>
                </div>
              </div>
              <!-- Melody -->
              <div
                class="flex w-full h-full border-b border-cyan-400 bg-sky-900"
                :class="{ hidden: !editMode }"
              >
                <div class="w-full h-full flex justify-between text-xl">
                  <div
                    v-for="(c, idxC) in m.vNotes"
                    class="w-[2em] h-1/2 place-self-center select-none"
                  >
                    <!-- Value -->
                    <div
                      v-if="Number(c)"
                      class="relative w-full h-full flex justify-center"
                    >
                      <input
                        tabindex="0"
                        type="number"
                        class="opacity-0 absolute inset-0 peer"
                        v-model="m.m64Notes[getMelodyIndex(idxC, m.vNotes)]"
                      />
                      <div
                        class="flex italic text-xs text-center justify-center border-l border-cyan-400 peer-focus:ring-0 peer-focus:bg-lime-700 peer-focus:text-lime-200"
                      >
                        {{ m.m64Notes[getMelodyIndex(idxC, m.vNotes)] }}
                      </div>
                    </div>
                    <!-- NonValue -->
                    <div
                      v-else
                      class="relative w-full h-full flex justify-center"
                    >
                      <div class="text-xs text-center">{{ c }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
