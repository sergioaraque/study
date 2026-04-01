<template>
  <div>
    <label v-if="label" class="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
      {{ label }} <span v-if="required" class="text-[var(--color-danger)]">*</span>
    </label>
    <input
      v-bind="$attrs"
      :value="modelValue"
      :required="required"
      :placeholder="placeholder"
      :type="type"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-sm placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
    />
    <p v-if="error" class="text-xs text-[var(--color-danger)] mt-1">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  required?: boolean
  error?: string
}>(), { type: 'text' })

defineEmits<{ 'update:modelValue': [value: string] }>()
defineOptions({ inheritAttrs: false })
</script>
