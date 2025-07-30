import type { AudioSample } from "~/types";

export const useAudioStore = defineStore('audioStore', () => {
    const audioLoops = ref<AudioSample[]>([]);

    return { audioLoops }
})