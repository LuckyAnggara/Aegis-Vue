<template>
  <form @submit.prevent="handleSubmit" class="grid gap-4 py-4">
    <div class="space-y-1.5">
      <Label for="rc-description" class="font-semibold"
        >Deskripsi Penyebab Risiko</Label
      >
      <Textarea
        id="rc-description"
        v-model="formData.description"
        placeholder="Jelaskan akar penyebab terjadinya potensi risiko..."
        :disabled="isSubmitting"
        :class="{ 'border-destructive': localErrors.description }"
        rows="5"
        class="text-sm"
      />
      <p v-if="localErrors.description" class="text-xs text-destructive mt-1">
        {{ localErrors.description }}
      </p>
    </div>

    <div class="space-y-1.5">
      <Label for="rc-source" class="font-semibold">Sumber Penyebab</Label>
      <Select v-model="formData.source" :disabled="isSubmitting">
        <SelectTrigger
          id="rc-source"
          class="w-full"
          :class="localErrors.source ?? 'border-destructive'"
        >
          <SelectValue placeholder="Sumber Risiko" :disabled="isSubmitting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="cat in riskCauseCategories"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </SelectItem>
        </SelectContent>
      </Select>
      <p v-if="localErrors.source" class="text-xs text-destructive mt-1">
        {{ localErrors.source }}
      </p>
    </div>

    <div class="flex space-x-2">
      <Button type="submit" :disabled="isSubmitting" class="cursor-pointer">
        <CirclePlus class="mr-2 h-4 w-4" />
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ existingRiskCause ? 'Simpan Perubahan' : 'Simpan Penyebab' }}
      </Button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CirclePlus } from 'lucide-vue-next'
import { RISK_CAUSE_CATEGORIES as riskCauseCategoriesConstant } from '@/lib/types'

const props = defineProps({
  existingRiskCause: {
    type: Object,
    default: null,
  },
  isSubmitting: Boolean,
})

const emit = defineEmits(['submit', 'cancel'])

const riskCauseCategories = ref(riskCauseCategoriesConstant)

const formData = ref({
  description: '',
  source: 'internal',
})

const localErrors = ref({ description: '', source: '' })

function populateForm() {
  if (props.existingRiskCause) {
    formData.value.description = props.existingRiskCause.description || ''
    formData.value.source = props.existingRiskCause.source || null
  } else {
    formData.value.description = ''
    formData.value.source = null
  }
  localErrors.value = { description: '', source: '' }
}

onMounted(populateForm)
watch(() => props.existingRiskCause, populateForm, { deep: true })

function validateCauseForm() {
  let isValid = true
  localErrors.value = { description: '', source: '' }
  if (formData.value.description.trim().length < 5) {
    localErrors.value.description = 'Deskripsi penyebab minimal 5 karakter.'
    isValid = false
  }
  if (!formData.value.source) {
    localErrors.value.source = 'Kategori penyebab harus dipilih.'
    isValid = false
  }
  return isValid
}

function handleSubmit() {
  if (!validateCauseForm()) return
  console.info('Saving risk cause:', formData.value)
  emit('submit', { ...formData.value })
}
</script>
