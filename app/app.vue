<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: "bg-emerald-300",
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

.bg-color1 {
  background-color: #B0C6CE;
}

.input-color1 {
  background-color: #b0c6ce1e;
}
</style>
