<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <Lightbulb class="mr-2 h-5 w-5 text-primary" />
          Saran Potensi Risiko dari AI
        </DialogTitle>
        <DialogDescription>
          Berikut adalah saran potensi risiko berdasarkan konteks yang Anda
          berikan untuk sasaran "{{ goal?.code }}". Pilih risiko yang relevan
          untuk ditambahkan.
        </DialogDescription>
      </DialogHeader>

      <div
        class="my-2 flex justify-between items-center"
        v-if="suggestions.length > 0"
      >
        <div class="text-sm text-muted-foreground">
          Menampilkan {{ suggestions.length }} saran. Dipilih:
          {{ selectedSuggestions.size }}
        </div>
        <div>
          <Button
            variant="ghost"
            size="sm"
            @click="toggleSelectAll"
            v-if="suggestions.length > 0"
          >
            <component
              :is="areAllSelected ? CheckSquare : Square"
              class="mr-2 h-4 w-4"
            />
            {{ areAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua' }}
          </Button>
        </div>
      </div>

      <div
        class="flex-grow overflow-y-auto border rounded-md p-1"
        v-if="!isLoadingSuggestions && suggestions.length > 0"
      >
        <div
          v-for="(suggestion, index) in suggestions"
          :key="suggestion.id || `suggestion-${index}`"
          class="flex items-start p-3 hover:bg-muted/50 rounded-md cursor-pointer"
          @click="toggleSuggestionSelection(suggestion)"
        >
          <Checkbox
            :id="`suggestion-check-${suggestion.id || index}`"
            class="mr-3 mt-1 shrink-0"
            :checked="selectedSuggestions.has(suggestion.description)"
            @update:checked="toggleSuggestionSelection(suggestion)"
          />
          <div class="flex-grow">
            <p class="text-sm font-medium">{{ suggestion.description }}</p>
            <p v-if="suggestion.category" class="text-xs text-muted-foreground">
              Kategori (saran):
              <Badge variant="outline" size="sm">{{
                suggestion.category
              }}</Badge>
            </p>
          </div>
        </div>
      </div>
      <div
        v-else-if="isLoadingSuggestions"
        class="flex flex-col items-center justify-center py-10 flex-grow"
      >
        <Loader2 class="h-10 w-10 animate-spin text-primary mb-3" />
        <p class="text-muted-foreground">AI sedang berpikir keras...</p>
      </div>
      <div
        v-else
        class="text-center py-10 flex-grow flex flex-col justify-center items-center"
      >
        <HelpCircle class="h-12 w-12 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">
          {{
            suggestions.length === 0 && initialLoadDone
              ? 'Tidak ada saran yang dihasilkan AI untuk konteks ini.'
              : 'Belum ada saran.'
          }}
        </p>
      </div>

      <DialogFooter class="mt-auto pt-6">
        <Button
          type="button"
          variant="outline"
          @click="closeDialog"
          :disabled="isAdding"
        >
          Batal
        </Button>
        <Button
          type="button"
          @click="handleAddSelectedSuggestions"
          :disabled="isAdding || selectedSuggestions.size === 0"
        >
          <Loader2 v-if="isAdding" class="mr-2 h-4 w-4 animate-spin" />
          <PlusCircle v-else class="mr-2 h-4 w-4" />
          Tambah {{ selectedSuggestions.size }} Risiko Terpilih
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  PlusCircle,
  Loader2,
  HelpCircle,
  Square,
  CheckSquare,
} from 'lucide-vue-next'
// import { toast } from 'vue-sonner';

const props = defineProps({
  modelValue: Boolean,
  goal: { type: Object, required: true, default: () => ({}) }, // Objek Goal yang menjadi konteks
  suggestions: { type: Array, default: () => [] }, // Array of { description: string, category?: string }
  isLoadingSuggestions: Boolean,
})

const emit = defineEmits(['update:modelValue', 'addSelected'])

const selectedSuggestions = ref(new Set())
const isAdding = ref(false)
const initialLoadDone = ref(false) // Untuk membedakan state awal kosong dengan hasil AI kosong

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      selectedSuggestions.value.clear() // Reset pilihan saat dialog dibuka
      initialLoadDone.value = false // Reset status load awal
      // Jika suggestions sudah ada saat dibuka, tandai initialLoadDone
      if (props.suggestions.length > 0 || !props.isLoadingSuggestions) {
        initialLoadDone.value = true
      }
    }
  }
)

watch(
  () => props.isLoadingSuggestions,
  (newLoading) => {
    if (!newLoading) {
      initialLoadDone.value = true // AI selesai loading, hasil (atau tidak ada hasil) sudah final
    }
  }
)

function handleOpenChange(openState) {
  emit('update:modelValue', openState)
}

function closeDialog() {
  emit('update:modelValue', false)
}

function toggleSuggestionSelection(suggestion) {
  if (selectedSuggestions.value.has(suggestion.description)) {
    selectedSuggestions.value.delete(suggestion.description)
  } else {
    selectedSuggestions.value.add(suggestion.description)
  }
}

const areAllSelected = computed(
  () =>
    props.suggestions.length > 0 &&
    selectedSuggestions.value.size === props.suggestions.length
)

function toggleSelectAll() {
  if (areAllSelected.value) {
    selectedSuggestions.value.clear()
  } else {
    props.suggestions.forEach((s) =>
      selectedSuggestions.value.add(s.description)
    )
  }
}

async function handleAddSelectedSuggestions() {
  if (selectedSuggestions.value.size === 0) return

  isAdding.value = true
  const risksToAdd = props.suggestions
    .filter((s) => selectedSuggestions.value.has(s.description))
    .map((s) => ({
      description: s.description,
      category: s.category || null, // Ambil kategori jika ada
      // Anda mungkin ingin menambahkan field lain di sini atau di store saat benar-benar menambahkannya
    }))

  console.log('Adding selected suggestions:', risksToAdd)
  // Simulasi penambahan ke store
  await new Promise((resolve) => setTimeout(resolve, 1000))

  emit('addSelected', risksToAdd) // Kirim array objek risiko yang dipilih

  // toast.success(`${risksToAdd.length} Potensi Risiko Ditambahkan`, {
  //   description: 'Saran dari AI telah berhasil ditambahkan ke daftar risiko Anda.',
  // });

  isAdding.value = false
  closeDialog()
}
</script>
