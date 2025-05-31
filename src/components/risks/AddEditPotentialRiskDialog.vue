<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogTrigger as-child>
      <slot>
        <Button>
          <PlusCircle class="mr-2 h-4 w-4" />
          {{ existingRisk ? 'Edit Risiko' : 'Tambah Potensi Risiko' }}
        </Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="grid gap-4 py-4">
        <div class="space-y-1.5">
          <Label for="pr-description">Deskripsi Potensi Risiko</Label>
          <Textarea
            id="pr-description"
            v-model="formData.description"
            placeholder="Jelaskan potensi risiko secara detail..."
            :disabled="isSubmitting"
            :class="{ 'border-destructive': errors.description }"
            rows="3"
          />
          <p v-if="errors.description" class="text-xs text-destructive mt-1">
            {{ errors.description }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <Label for="pr-category">Kategori Risiko</Label>
            <Select v-model="formData.category" :disabled="isSubmitting">
              <SelectTrigger id="pr-category">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in riskCategories"
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

          <div class="space-y-1.5">
            <Label for="pr-owner">Pemilik Risiko</Label>
            <Input
              id="pr-owner"
              v-model="formData.owner"
              placeholder="cth: Manajer Operasional"
              :disabled="isSubmitting"
              :class="{ 'border-destructive': errors.owner }"
            />
            <p v-if="errors.owner" class="text-xs text-destructive mt-1">
              {{ errors.owner }}
            </p>
          </div>
        </div>

        <!-- <Button type="button" variant="outline" size="sm" @click="openBrainstormModal" :disabled="isSubmitting">
          <Sparkles class="mr-2 h-4 w-4" /> Brainstorm dengan AI
        </Button> -->

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="closeDialog"
            :disabled="isSubmitting"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="
              isSubmitting ||
              !authStore?.isAuthenticated ||
              !authStore?.isProfileComplete
            "
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            {{ existingRisk ? 'Simpan Perubahan' : 'Simpan Risiko' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select' // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/components/ui/select.tsx]
import { PlusCircle, Pencil, Loader2, Save, Sparkles } from 'lucide-vue-next'
// import { useAuthStore } from '@/stores/authStore'; // Akan di-uncomment
// import { useAppStore } from '@/stores/appStore'; // Akan di-uncomment
// import { toast } from 'vue-sonner';
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types' // Asumsi Anda punya file ini

// Simulasi store
const authStore = ref({ isAuthenticated: true, isProfileComplete: true })
// const appStore = useAppStore(); // Akan digunakan nanti

const props = defineProps({
  modelValue: Boolean, // Untuk v-model:open
  existingRisk: {
    type: Object,
    default: null,
  },
  goalId: {
    // ID Sasaran induk
    type: String,
    required: true,
  },
  goalCode: {
    // Kode Sasaran induk, untuk info di dialog
    type: String,
    default: 'G?',
  },
})

const emit = defineEmits(['update:modelValue', 'save'])

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
) // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/lib/types.ts]

const isOpen = ref(props.modelValue || false)
const formData = ref({
  description: '',
  category: null, // atau string kosong
  owner: '',
})
const errors = ref({ description: '', category: '', owner: '' })
const isSubmitting = ref(false)

const dialogTitle = computed(() =>
  props.existingRisk
    ? `Edit Potensi Risiko (ID: ${props.existingRisk.id?.substring(0, 6)}...)`
    : 'Tambah Potensi Risiko Baru'
)
const dialogDescription = computed(
  () =>
    `Untuk Sasaran: ${props.goalCode}. ${
      props.existingRisk
        ? 'Perbarui detail potensi risiko.'
        : 'Identifikasi potensi risiko baru yang dapat mempengaruhi sasaran ini.'
    }`
)

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
  }
)

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal) {
    if (props.existingRisk) {
      formData.value.description = props.existingRisk.description || ''
      formData.value.category = props.existingRisk.category || null
      formData.value.owner = props.existingRisk.owner || ''
    } else {
      formData.value.description = ''
      formData.value.category = null
      formData.value.owner = ''
    }
    errors.value = { description: '', category: '', owner: '' }
  }
})

function handleOpenChange(openState) {
  isOpen.value = openState
  if (!openState) emit('update:modelValue', false)
}

function validateForm() {
  let isValid = true
  errors.value = { description: '', category: '', owner: '' }
  if (formData.value.description.trim().length < 10) {
    errors.value.description = 'Deskripsi risiko minimal 10 karakter.'
    isValid = false
  }
  if (!formData.value.category) {
    errors.value.category = 'Kategori risiko harus dipilih.'
    isValid = false
  }
  if (formData.value.owner.trim().length < 3) {
    errors.value.owner = 'Pemilik risiko minimal 3 karakter.'
    isValid = false
  }
  return isValid
}

async function onSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  // Simulasi pemanggilan store/API
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const riskDataPayload = {
    description: formData.value.description,
    category: formData.value.category,
    owner: formData.value.owner,
    // goal_id akan ditambahkan oleh store action jika ini add, atau sudah ada jika edit
  }

  // Emit data ke parent
  emit(
    'save',
    {
      id: props.existingRisk?.id, // Kirim ID jika edit
      goal_id: props.goalId,
      ...riskDataPayload,
    },
    !props.existingRisk
  )

  // toast.success(props.existingRisk ? 'Risiko Diperbarui!' : 'Risiko Ditambahkan!', {
  //   description: `Potensi risiko "${riskDataPayload.description.substring(0,30)}..." telah disimpan.`,
  // });
  console.log(
    props.existingRisk ? 'Risiko Diperbarui!' : 'Risiko Ditambahkan!',
    `Potensi risiko "${riskDataPayload.description.substring(
      0,
      30
    )}..." telah disimpan.`
  )

  isSubmitting.value = false
  closeDialog()
}

function closeDialog() {
  isOpen.value = false
  emit('update:modelValue', false)
}

// function openBrainstormModal() {
//   // Logika untuk membuka modal brainstorm AI
//   toast.info('Fitur Brainstorm AI', { description: 'Modal untuk brainstorm AI akan muncul di sini.' });
// }
</script>
