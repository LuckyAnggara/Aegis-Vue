<template>
  <Card class="shadow-lg border">
    <CardHeader class="border-b">
      <CardTitle class="text-lg font-semibold">
        {{ isEditMode ? 'Detail' : 'Tambah' }} Potensi Risiko
      </CardTitle>
    </CardHeader>
    <CardContent class="">
      <div
        v-if="pageLoading && !currentGoal"
        class="flex justify-center items-center py-10"
      >
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="ml-3 text-muted-foreground">Memuat detail sasaran...</p>
      </div>
      <div
        v-else-if="isEditMode && riskLoading && !formData.id"
        class="flex justify-center items-center py-10"
      >
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="ml-3 text-muted-foreground">Memuat detail risiko...</p>
      </div>
      <div v-else-if="!currentGoal && !pageLoading" class="py-10 text-center">
        <AlertTriangle class="mx-auto h-10 w-10 text-destructive mb-2" />
        <p class="text-md font-medium text-destructive">
          Sasaran Induk Tidak Ditemukan
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          Tidak dapat {{ isEditMode ? 'mengedit' : 'menambahkan' }} risiko tanpa
          sasaran yang valid.
        </p>
      </div>
      <div v-else-if="isEditMode && !formData.id" class="py-10 text-center">
        <AlertTriangle class="mx-auto h-10 w-10 text-destructive mb-2" />
        <p class="text-md font-medium text-destructive">
          Potensi Risiko Tidak Ditemukan
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          Data potensi risiko yang ingin Anda ubah tidak dapat ditemukan.
        </p>
      </div>

      <form
        v-else-if="currentGoal"
        @submit.prevent="handleFormSubmit"
        class="space-y-6"
      >
        <div v-if="parentGoalInfoForForm" class="space-y-1.5">
          <Label class="font-semibold text-base">Sasaran Terkait</Label>

          <div class="p-3 border rounded-md bg-muted/50">
            <p class="text-sm font-medium text-foreground">
              {{ parentGoalInfoForForm.code }} -
              {{ parentGoalInfoForForm.name }}
            </p>
            <p
              class="text-xs text-muted-foreground mt-0.5 line-clamp-2"
              :title="parentGoalInfoForForm.description"
            >
              {{ parentGoalInfoForForm.description }}
            </p>
          </div>
        </div>

        <Separator v-if="parentGoalInfoForForm" />

        <div>
          <Label for="pr-description" class="font-semibold"
            >Deskripsi Potensi Risiko</Label
          >
          <Textarea
            id="pr-description"
            v-model="formData.description"
            placeholder="Jelaskan potensi risiko yang dapat mempengaruhi pencapaian sasaran di atas..."
            :disabled="isSubmitting"
            :class="{ 'border-destructive': errors.description }"
            rows="4"
            class="mt-1 text-sm w-full"
          ></Textarea>
          <p v-if="errors.description" class="text-xs text-destructive mt-1">
            {{ errors.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label for="pr-category" class="font-semibold"
              >Kategori Risiko</Label
            >
            <Select v-model="formData.category" :disabled="isSubmitting">
              <SelectTrigger
                id="pr-category"
                class="mt-1 w-full"
                :class="errors.category ? 'border-destructive' : ''"
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">_Tanpa Kategori_</SelectItem>
                <SelectItem
                  v-for="cat in riskCategoriesConstant"
                  :key="cat"
                  :value="cat"
                >
                  {{ cat }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="errors.category" class="text-xs text-destructive mt-1">
              {{ errors.category }}
            </p>
          </div>

          <div>
            <Label for="pr-owner" class="font-semibold">Pemilik Risiko</Label>
            <Input
              id="pr-owner"
              v-model="formData.owner"
              placeholder="Contoh: Kepala Operasional, Departemen TI"
              :disabled="isSubmitting"
              :class="{ 'border-destructive': errors.owner }"
              class="mt-1 text-sm"
            />
            <p v-if="errors.owner" class="text-xs text-destructive mt-1">
              {{ errors.owner }}
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <Button type="submit" :disabled="isSubmitting" class="cursor-pointer">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            {{ isEditMode ? 'Update' : 'Simpan' }} Potensi Risiko
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2, Save } from 'lucide-vue-next'
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types'

// Props & Emits
const props = defineProps({
  currentGoal: Object,
  isEditMode: Boolean,
  riskLoading: Boolean,
  pageLoading: Boolean,
  initialFormData: Object,
  isSubmitting: {
    Type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

// Form state
const defaultForm = {
  id: null,
  goalId: '',
  description: '',
  category: '',
  owner: '',
}
const defaultErrors = {
  goalId: '',
  description: '',
  category: '',
  owner: '',
}

// Form state
const formData = ref({ ...defaultForm })
const errors = ref({ ...defaultErrors })

// Watcher: tunggu sampai initialFormData tersedia
watch(
  () => props.initialFormData,
  (newVal) => {
    if (props.isEditMode && newVal) {
      formData.value = { ...defaultForm, ...newVal }
      errors.value = { ...defaultErrors }
    }
  },
  { immediate: true }
)

// Compute parent goal info
const parentGoalInfoForForm = computed(() => {
  if (!props.currentGoal) return null
  return {
    id: props.currentGoal.id || '',
    code: props.currentGoal.code || '',
    name: props.currentGoal.name || '',
    description: props.currentGoal.description || '',
  }
})

// Validation
function validateForm() {
  let isValid = true
  errors.value = { ...defaultErrors }

  if (formData.value.description.trim().length < 10) {
    errors.value.description = 'Deskripsi risiko minimal 10 karakter.'
    isValid = false
  }
  if (formData.value.owner.trim() === '') {
    errors.value.owner = 'Pemilik risiko tidak boleh kosong.'
    isValid = false
  }

  return isValid
}

// Handle submit
const handleFormSubmit = () => {
  if (!validateForm()) return
  emit('submit', formData.value)
}
</script>
