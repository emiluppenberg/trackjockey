<script setup lang="ts">
import { NuxtLink } from "#components";
</script>

<template>
  <nav class="flex border-b border-black justify-evenly">
    <NuxtLink to="editor" class="grow text-center border-r">Editor</NuxtLink>
    <NuxtLink to="tracker" class="grow text-center">Tracker</NuxtLink>
  </nav>
  <main>
    <slot></slot>
  </main>
</template>
