<script setup lang="ts">
import { ref, computed } from 'vue'
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/vue/24/outline'

export interface Props {
  phaseId: string
  maxSize?: number // in MB
  acceptedFormats?: string[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 50,
  acceptedFormats: () => ['pdf', 'docx', 'zip', 'doc', 'txt', 'xlsx'],
  disabled: false,
})

const emit = defineEmits<{
  upload: [files: File[]]
  error: [message: string]
}>()

const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement>()

const acceptString = computed(() => {
  return props.acceptedFormats.map(fmt => `.${fmt}`).join(',')
})

const maxSizeBytes = computed(() => props.maxSize * 1024 * 1024)

const validateFile = (file: File): { valid: boolean; error?: string } => {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (!ext || !props.acceptedFormats.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file format. Accepted: ${props.acceptedFormats.join(', ')}`,
    }
  }

  if (file.size > maxSizeBytes.value) {
    return {
      valid: false,
      error: `File size exceeds ${props.maxSize}MB limit`,
    }
  }

  return { valid: true }
}

const handleFileSelect = async (files: FileList | null) => {
  if (!files || files.length === 0) return

  const newFiles: File[] = []
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const validation = validateFile(file)

    if (validation.valid) {
      newFiles.push(file)
    } else {
      errors.push(`${file.name}: ${validation.error}`)
    }
  }

  if (errors.length > 0) {
    emit('error', errors.join('; '))
    return
  }

  if (newFiles.length > 0) {
    uploadedFiles.value.push(...newFiles)
    // Simulate upload progress
    isUploading.value = true
    uploadProgress.value = 0

    const interval = setInterval(() => {
      uploadProgress.value += Math.random() * 30
      if (uploadProgress.value >= 100) {
        uploadProgress.value = 100
        clearInterval(interval)
        isUploading.value = false
      }
    }, 200)

    emit('upload', newFiles)
  }
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  handleFileSelect(e.dataTransfer?.files)
}

const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <div class="space-y-4">
    <div
      :class="`relative rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="!disabled && triggerFileInput()"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="acceptString"
        multiple
        :disabled="disabled"
        class="hidden"
        @change="(e) => handleFileSelect((e.target as HTMLInputElement).files)"
      />

      <div class="flex flex-col items-center justify-center px-4 py-8 text-center">
        <CloudArrowUpIcon
          :class="`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-slate-400'} transition-colors`"
        />
        <p class="mt-2 text-sm font-medium text-slate-900">
          {{ isDragging ? 'Drop files here' : 'Drag and drop files here' }}
        </p>
        <p class="text-xs text-slate-500">
          or <span class="font-medium text-blue-600 hover:text-blue-700">browse</span> from your device
        </p>
        <p class="mt-2 text-[11px] text-slate-500">
          {{ props.acceptedFormats.join(', ').toUpperCase() }} up to {{ props.maxSize }}MB
        </p>
      </div>

      <div v-if="isUploading" class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/10">
        <div class="text-center">
          <div class="inline-flex items-center justify-center">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <p class="mt-2 text-xs font-medium text-slate-900">{{ Math.round(uploadProgress) }}%</p>
        </div>
      </div>
    </div>

    <div v-if="uploadedFiles.length > 0" class="space-y-2">
      <p class="text-xs font-medium text-slate-700">Uploaded files ({{ uploadedFiles.length }})</p>
      <ul class="space-y-2">
        <li
          v-for="(file, index) in uploadedFiles"
          :key="`${file.name}-${index}`"
          class="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div class="min-w-0">
              <p class="truncate text-xs font-medium text-slate-900">{{ file.name }}</p>
              <p class="text-[11px] text-slate-600">
                {{ (file.size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            :disabled="disabled"
            @click="removeFile(index)"
            class="flex-shrink-0 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Remove file"
          >
            <XMarkIcon class="h-4 w-4" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
