<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: "bg-slate-400",
  },
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background-color: #065f46;
}

::-webkit-scrollbar-thumb {
  background-color: #14b8a6;
  border-radius: 10px;
  width: 50px;
}
</style>