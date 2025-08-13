export const useAudioStore = defineStore("audioStore", () => {
  const audioContext = ref<AudioContext>();

  onMounted(async () => {
    audioContext.value = new AudioContext();
    await audioContext.value.audioWorklet.addModule("/pitch-processor.js");
  });
  return { audioContext };
});
