<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div v-if="parentGoalInfo" class="space-y-1.5">
      <Label class="font-semibold text-base">Sasaran Terkait</Label>
      <div class="p-3 border rounded-md bg-muted/50">
        <p class="text-sm font-medium text-foreground">
          {{ parentGoalInfo.code }} - {{ parentGoalInfo.name }}
        </p>
        <p
          class="text-xs text-muted-foreground mt-0.5 line-clamp-2"
          :title="parentGoalInfo.description"
        >
          {{ parentGoalInfo.description }}
        </p>
      </div>
    </div>
    <Separator v-if="parentGoalInfo" />

    <div>
      <Label for="pr-description" class="font-semibold"
        >Deskripsi Potensi Risiko</Label
      >
      <Textarea
        id="pr-description"
        v-model="localFormData.description"
        placeholder="Jelaskan potensi risiko yang dapat mempengaruhi pencapaian sasaran di atas..."
        :disabled="isSubmitting"
        :class="{ 'border-destructive': localErrors.description }"
        rows="4"
        class="mt-1 text-sm"
      />
      <p v-if="localErrors.description" class="text-xs text-destructive mt-1">
        {{ localErrors.description }}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label for="pr-category" class="font-semibold">Kategori Risiko</Label>
        <Select v-model="localFormData.category" :disabled="isSubmitting">
          <SelectTrigger
            id="pr-category"
            class="mt-1"
            :class="{ 'border-destructive': localErrors.category }"
          >
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">_Tanpa Kategori_</SelectItem>
            <SelectItem v-for="cat in riskCategories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="localErrors.category" class="text-xs text-destructive mt-1">
          {{ localErrors.category }}
        </p>
      </div>

      <div>
        <Label for="pr-owner" class="font-semibold"
          >Pemilik Risiko (Opsional)</Label
        >
        <Input
          id="pr-owner"
          v-model="localFormData.owner"
          placeholder="Contoh: Kepala Operasional, Departemen TI"
          :disabled="isSubmitting"
          :class="{ 'border-destructive': localErrors.owner }"
          class="mt-1 text-sm"
        />
        <p v-if="localErrors.owner" class="text-xs text-destructive mt-1">
          {{ localErrors.owner }}
        </p>
      </div>
    </div>

    <div class="flex justify-end space-x-3 pt-4">
      <Button
        type="button"
        variant="outline"
        @click="handleCancel"
        :disabled="isSubmitting"
      >
        Batal
      </Button>
      <Button type="submit" :disabled="isSubmitting || !canSubmit">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        <Save v-else class="mr-2 h-4 w-4" />
        {{ existingRisk ? 'Simpan Perubahan' : 'Simpan Potensi Risiko' }}
      </Button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator' // Impor Separator
import { Save, Loader2 } from 'lucide-vue-next'
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types'

const props = defineProps({
  existingRisk: {
    type: Object,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  canSubmit: {
    type: Boolean,
    default: true,
  },
  parentGoalInfo: {
    // Prop baru untuk info sasaran induk
    type: Object,
    default: null, // { id, code, name, description }
  },
})

const emit = defineEmits(['submit', 'cancel'])

const riskCategories = ref(
  riskCategoriesConstant || [
    'Operasional',
    'Keuangan',
    'Kepatuhan',
    'Strategis',
    'Reputasi',
    'Hukum',
    'Lainnya',
  ]
)

const localFormData = ref({
  description: '',
  category: '', // Default ke string kosong agar placeholder SelectItem "_Tanpa Kategori_" bisa dipilih
  owner: '',
})
const localErrors = ref({ description: '', category: '', owner: '' })

function populateForm() {
  if (props.existingRisk) {
    localFormData.value.description = props.existingRisk.description || ''
    localFormData.value.category = props.existingRisk.category || ''
    localFormData.value.owner = props.existingRisk.owner || ''
  } else {
    localFormData.value.description = ''
    localFormData.value.category = '' // Default ke string kosong
    localFormData.value.owner = ''
  }
  localErrors.value = { description: '', category: '', owner: '' }
}

onMounted(populateForm)
watch(() => props.existingRisk, populateForm, { deep: true, immediate: true })

function validateForm() {
  let isValid = true
  localErrors.value = { description: '', category: '', owner: '' }
  if (localFormData.value.description.trim().length < 10) {
    localErrors.value.description = 'Deskripsi risiko minimal 10 karakter.'
    isValid = false
  }
  // Kategori sekarang opsional karena ada "_Tanpa Kategori_"
  // if (!localFormData.value.category) {
  //   localErrors.value.category = "Kategori risiko harus dipilih.";
  //   isValid = false;
  // }
  // Pemilik risiko juga opsional sesuai gambar
  // if (localFormData.value.owner.trim().length < 3) {
  //   localErrors.value.owner = "Pemilik risiko minimal 3 karakter.";
  //   isValid = false;
  // }
  return isValid
}

function handleSubmit() {
  if (!validateForm()) return
  const payload = { ...localFormData.value }
  // Jika kategori adalah string kosong (dari "_Tanpa Kategori_"), kirim null atau biarkan kosong
  if (payload.category === '') {
    payload.category = null
  }
  emit('submit', payload)
}

function handleCancel() {
  emit('cancel')
}
</script>
