<template>
  <Dialog :open="modelValue" @update:open="handleOpenChange">
    <DialogContent
      class="min-w-[400px] sm:max-w-2xl max-h-[90vh] flex flex-col"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center">
          <Sparkles class="mr-2 h-5 w-5 text-primary" />
          Brainstorm Potensi Risiko dengan AI
        </DialogTitle>
        <DialogDescription>
          Sempurnakan konteks untuk AI berdasarkan sasaran "{{ goal?.code }} -
          {{ goal?.name }}". AI akan memberikan saran potensi risiko berdasarkan
          informasi ini.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="handleSubmitContext" class="space-y-4 py-4">
        <div>
          <Label for="ai-goal-description" class="font-semibold"
            >Deskripsi Sasaran (Konteks Utama)</Label
          >
          <p
            class="text-sm text-muted-foreground block mb-1 border-2 border-dashed p-2 rounded-md text-wrap"
          >
            Nama sasaran : {{ goal?.name }} <br />
            Deskripsi : {{ goal?.description }}
          </p>

          <p class="text-xs text-stone-900 mt-1">
            <span class="flex flex-row">
              <TriangleAlert class="mr-2 h-4 w-4 text-yellow-500" /> Deskripsi
              sasaran ini akan digunakan sebagai konteks utama untuk AI.
            </span>
          </p>
        </div>
        <div>
          <Label for="ai-additional-context" class="font-semibold"
            >Konteks Tambahan (Opsional)</Label
          >
          <Textarea
            id="ai-additional-context"
            v-model="additionalContext"
            placeholder="Contoh: Fokus pada risiko terkait perubahan regulasi, teknologi baru, atau keterbatasan SDM..."
            :disabled="isSubmitting"
            rows="5"
            class="mt-1"
          ></Textarea>
        </div>
        <div>
          <Label for="ai-suggestion-count" class="font-semibold"
            >Jumlah Saran Potensi Risiko yang Diinginkan (1-10)</Label
          >
          <Input
            id="ai-suggestion-count"
            type="number"
            v-model.number="suggestionCount"
            min="1"
            max="10"
            :disabled="isSubmitting"
            class="mt-1"
          />
        </div>
        <DialogFooter class="pt-2">
          <Button
            class="cursor-pointer"
            type="button"
            variant="outline"
            @click="closeDialog"
            :disabled="isSubmitting"
          >
            Batal
          </Button>
          <Button type="submit" :disabled="isSubmitting" class="cursor-pointer">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <FlaskConical v-else class="mr-2 h-4 w-4" />
            Mulai Brainstorm
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, computed, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, FlaskConical, Loader2, TriangleAlert } from 'lucide-vue-next'
// import { toast } from 'vue-sonner'; // Akan digunakan untuk notifikasi

const props = defineProps({
  modelValue: Boolean, // Untuk v-model:open
  goal: {
    // Objek Goal yang menjadi konteks
    type: Object,
    required: true,
    default: () => ({
      name: null,
      description: null,
      id: null,
    }), // Default kosong jika tidak ada goal
  },
})

const emit = defineEmits(['update:modelValue', 'submitContext'])

const additionalContext = ref('')
const suggestionCount = ref(5)
const isSubmitting = ref(false)

const contextDescription = computed(
  () =>
    'Nama Sasaran: ' +
    props.goal.name +
    '\nDeskripsi: ' +
    props.goal.description
)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      // Reset form saat dialog dibuka (jika perlu)
      // additionalContext.value = '';
      // suggestionCount.value = 5;
    }
  }
)

function handleOpenChange(openState) {
  emit('update:modelValue', openState)
}

function closeDialog() {
  emit('update:modelValue', false)
}

async function handleSubmitContext() {
  isSubmitting.value = true
  // Simulasi pemanggilan AI
  console.log('Submitting context to AI:', {
    goalId: props.goal.id,
    goalDescription: props.goal.description,
    additionalContext: additionalContext.value,
    suggestionCount: suggestionCount.value,
  })
  await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulasi delay API

  // Emit event dengan data konteks
  emit('submitContext', {
    goalId: props.goal.id,
    goalDescription: props.goal.description, // Kirim juga deskripsi sasaran utama
    additionalContext: additionalContext.value,
    count: suggestionCount.value,
  })

  isSubmitting.value = false
  // Dialog ini akan ditutup oleh parent setelah submitContext
}
</script>
