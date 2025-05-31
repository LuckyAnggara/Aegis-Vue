<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogTrigger as-child>
      <slot> </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle
          >Kelola Penyebab Risiko untuk:
          {{
            potentialRisk?.sequence_number
              ? `${parentGoalCode}.PR${potentialRisk.sequence_number}`
              : 'PR.?'
          }}</DialogTitle
        >
        <DialogDescription
          class="line-clamp-2"
          :title="potentialRisk?.description"
        >
          Risiko: {{ potentialRisk?.description || 'Memuat...' }}
        </DialogDescription>
      </DialogHeader>

      <div class="my-4">
        <Button
          @click="openAddEditCauseDialog(null)"
          :disabled="isLoadingCauses || !authStore.isAuthenticated"
        >
          <PlusCircle class="mr-2 h-4 w-4" /> Tambah Penyebab Risiko Baru
        </Button>
        <!-- <Button variant="outline" @click="openBrainstormCausesDialog" class="ml-2">
            <Sparkles class="mr-2 h-4 w-4" /> Brainstorm Penyebab (AI)
        </Button> -->
      </div>

      <div v-if="isLoadingCauses" class="flex justify-center items-center py-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <p class="ml-2 text-muted-foreground">Memuat penyebab risiko...</p>
      </div>
      <div
        v-else-if="riskCausesForPR.length === 0"
        class="text-center py-8 border-2 border-dashed rounded-md"
      >
        <HelpCircle class="mx-auto h-10 w-10 text-muted-foreground" />
        <p class="mt-2 text-sm text-muted-foreground">
          Belum ada penyebab risiko yang diidentifikasi untuk potensi risiko
          ini.
        </p>
      </div>
      <div v-else class="border rounded-md max-h-[50vh] overflow-y-auto">
        <RiskCauseListItem
          v-for="cause in riskCausesForPR"
          :key="cause.id"
          :riskCause="cause"
          :parentPrCode="parentPrCodeForListItem"
          @action="handleCauseAction"
        />
      </div>

      <DialogFooter class="mt-6">
        <Button type="button" variant="outline" @click="closeDialog"
          >Tutup</Button
        >
      </DialogFooter>
    </DialogContent>

    <Dialog
      :open="isAddEditCauseDialogOpen"
      @update:open="setIsAddEditCauseDialogOpen"
    >
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{
            causeToEdit ? 'Edit Penyebab Risiko' : 'Tambah Penyebab Risiko Baru'
          }}</DialogTitle>
          <DialogDescription>
            Untuk risiko:
            {{
              potentialRisk?.sequence_number
                ? `${parentGoalCode}.PR${potentialRisk.sequence_number}`
                : 'PR.?'
            }}
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSaveCause" class="grid gap-4 py-4">
          <div class="space-y-1.5">
            <Label for="rc-description">Deskripsi Penyebab Risiko</Label>
            <Textarea
              id="rc-description"
              v-model="causeFormData.description"
              placeholder="Jelaskan penyebab risiko..."
              :disabled="isSubmittingCause"
              :class="{ 'border-destructive': causeFormErrors.description }"
              rows="3"
            />
            <p
              v-if="causeFormErrors.description"
              class="text-xs text-destructive mt-1"
            >
              {{ causeFormErrors.description }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="rc-category">Kategori Penyebab</Label>
            <Select
              v-model="causeFormData.category"
              :disabled="isSubmittingCause"
            >
              <SelectTrigger id="rc-category">
                <SelectValue placeholder="Pilih kategori penyebab" />
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
            <p
              v-if="causeFormErrors.category"
              class="text-xs text-destructive mt-1"
            >
              {{ causeFormErrors.category }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="rc-likelihood">Likelihood Penyebab Terjadi</Label>
            <Select
              v-model="causeFormData.likelihood"
              :disabled="isSubmittingCause"
            >
              <SelectTrigger id="rc-likelihood">
                <SelectValue placeholder="Pilih likelihood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">_Tidak Dianalisis_</SelectItem>
                <SelectItem
                  v-for="level in likelihoodLevels"
                  :key="level"
                  :value="level"
                >
                  {{ level }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="setIsAddEditCauseDialogOpen(false)"
              :disabled="isSubmittingCause"
              >Batal</Button
            >
            <Button type="submit" :disabled="isSubmittingCause">
              <Loader2
                v-if="isSubmittingCause"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ causeToEdit ? 'Simpan Perubahan' : 'Simpan Penyebab' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AlertDialog
      :open="isDeleteCauseDialogOpen"
      @update:open="setIsDeleteCauseDialogOpen"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus Penyebab</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus penyebab risiko: "{{
              causeToDelete?.description?.substring(0, 50)
            }}..."? Semua rencana pengendalian terkait juga akan dihapus.
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDeleteCause"
            >Batal</AlertDialogCancel
          >
          <AlertDialogAction
            @click="confirmDeleteCause"
            class="bg-destructive hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import RiskCauseListItem from './RiskCauseListItem.vue'
import {
  PlusCircle,
  Loader2,
  HelpCircle,
  Pencil,
  Trash2,
  Sparkles,
  FlaskConical,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  RISK_CAUSE_CATEGORIES as riskCauseCategoriesConstant,
  LIKELIHOOD_LEVELS_DESC as likelihoodLevelsConstant,
} from '@/lib/types' // Asumsi Anda punya ini
// import { useAuthStore } from '@/stores/authStore';
// import { useAppStore } from '@/stores/appStore';

// Simulasi Store
const authStore = ref({ isAuthenticated: true, isProfileComplete: true })
const appStore = {
  // Ganti dengan Pinia store Anda
  riskCauses: ref([]),
  riskCausesLoading: ref(false),
  async fetchRiskCausesByPotentialRiskId(prId) {
    console.log(`[Simulated AppStore] Fetching risk causes for PR ID: ${prId}`)
    this.riskCausesLoading.value = true
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Hanya isi jika belum ada, untuk simulasi
    if (
      prId === 'pr1' &&
      !this.riskCauses.value.some((rc) => rc.potential_risk_id === 'pr1')
    ) {
      this.riskCauses.value.push(
        {
          id: 'rc1',
          potential_risk_id: 'pr1',
          sequence_number: 1,
          description: 'Kurangnya pelatihan staf terkait keamanan data.',
          category: 'Manusia',
          likelihood: 'Kadang Terjadi (3)',
        },
        {
          id: 'rc2',
          potential_risk_id: 'pr1',
          sequence_number: 2,
          description: 'Sistem firewall tidak terupdate.',
          category: 'Sistem',
        }
      )
    } else if (
      prId === 'pr2' &&
      !this.riskCauses.value.some((rc) => rc.potential_risk_id === 'pr2')
    ) {
      this.riskCauses.value.push({
        id: 'rc3',
        potential_risk_id: 'pr2',
        sequence_number: 1,
        description: 'Jumlah staf CS tidak sebanding dengan volume keluhan.',
        category: 'Manusia',
      })
    }
    this.riskCausesLoading.value = false
  },
  async addRiskCause(rcData, prId) {
    console.log('[Simulated AppStore] Adding risk cause:', rcData, prId)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const newRC = {
      ...rcData,
      id: `rc${Date.now()}`,
      potential_risk_id: prId,
      sequence_number:
        this.riskCauses.value.filter((r) => r.potential_risk_id === prId)
          .length + 1,
    }
    this.riskCauses.value.push(newRC)
    return newRC
  },
  async updateRiskCause(rcId, rcData) {
    console.log('[Simulated AppStore] Updating risk cause:', rcId, rcData)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const index = this.riskCauses.value.findIndex((r) => r.id === rcId)
    if (index !== -1) {
      this.riskCauses.value[index] = {
        ...this.riskCauses.value[index],
        ...rcData,
      }
      return this.riskCauses.value[index]
    }
    return null
  },
  async deleteRiskCause(rcId) {
    console.log('[Simulated AppStore] Deleting risk cause:', rcId)
    await new Promise((resolve) => setTimeout(resolve, 300))
    this.riskCauses.value = this.riskCauses.value.filter((r) => r.id !== rcId)
  },
  getRiskCausesByPotentialRiskId(prId) {
    return this.riskCauses.value
      .filter((rc) => rc.potential_risk_id === prId)
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
  },
}
// Akhir Simulasi Store

const props = defineProps({
  modelValue: Boolean, // Untuk v-model:open pada dialog utama
  potentialRisk: {
    // Objek PotentialRisk yang dipilih
    type: Object,
    default: null,
  },
  parentGoalCode: String, // Untuk tampilan kode PR
})

const emit = defineEmits(['update:modelValue', 'causesUpdated'])

const riskCauseCategories = ref(
  riskCauseCategoriesConstant || ['Manusia', 'Proses', 'Sistem', 'Eksternal']
) // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/lib/types.ts]
const likelihoodLevels = ref(
  likelihoodLevelsConstant || [
    'Hampir tidak terjadi (1)',
    'Jarang terjadi (2)',
    'Kadang Terjadi (3)',
    'Sering terjadi (4)',
    'Hampir pasti terjadi (5)',
  ]
)

const isOpen = ref(props.modelValue || false)
const isLoadingCauses = ref(false)

const isAddEditCauseDialogOpen = ref(false)
const causeToEdit = ref(null)
const causeFormData = ref({ description: '', category: null, likelihood: '' })
const causeFormErrors = ref({ description: '', category: '' })
const isSubmittingCause = ref(false)

const isDeleteCauseDialogOpen = ref(false)
const causeToDelete = ref(null)

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
    if (newVal && props.potentialRisk?.id) {
      fetchCausesForCurrentPR()
    }
  }
)

watch(
  () => props.potentialRisk,
  (newPR) => {
    if (isOpen.value && newPR?.id) {
      fetchCausesForCurrentPR()
    }
  },
  { immediate: true }
)

function handleOpenChange(openState) {
  isOpen.value = openState
  if (!openState) emit('update:modelValue', false)
}

async function fetchCausesForCurrentPR() {
  if (!props.potentialRisk?.id) return
  isLoadingCauses.value = true
  await appStore.fetchRiskCausesByPotentialRiskId(props.potentialRisk.id)
  isLoadingCauses.value = false
}

const riskCausesForPR = computed(() => {
  if (!props.potentialRisk?.id) return []
  return appStore.getRiskCausesByPotentialRiskId(props.potentialRisk.id)
})

const parentPrCodeForListItem = computed(() =>
  props.potentialRisk?.sequence_number
    ? `${props.parentGoalCode}.PR${props.potentialRisk.sequence_number}`
    : 'PR.?'
)

function openAddEditCauseDialog(cause = null) {
  causeToEdit.value = cause
  if (cause) {
    causeFormData.value.description = cause.description
    causeFormData.value.category = cause.category
    causeFormData.value.likelihood = cause.likelihood || ''
  } else {
    causeFormData.value.description = ''
    causeFormData.value.category = null
    causeFormData.value.likelihood = ''
  }
  causeFormErrors.value = { description: '', category: '' }
  isAddEditCauseDialogOpen.value = true
}
function setIsAddEditCauseDialogOpen(value) {
  isAddEditCauseDialogOpen.value = value
  if (!value) causeToEdit.value = null // Reset saat ditutup
}

function validateCauseForm() {
  let isValid = true
  causeFormErrors.value = { description: '', category: '' }
  if (causeFormData.value.description.trim().length < 5) {
    causeFormErrors.value.description = 'Deskripsi penyebab minimal 5 karakter.'
    isValid = false
  }
  if (!causeFormData.value.category) {
    causeFormErrors.value.category = 'Kategori penyebab harus dipilih.'
    isValid = false
  }
  return isValid
}

async function handleSaveCause() {
  if (!validateCauseForm() || !props.potentialRisk?.id) return

  isSubmittingCause.value = true
  const payload = {
    description: causeFormData.value.description,
    category: causeFormData.value.category,
    likelihood: causeFormData.value.likelihood || null, // Kirim null jika kosong
    // potential_risk_id akan ditambahkan oleh store action
  }

  try {
    if (causeToEdit.value?.id) {
      await appStore.updateRiskCause(causeToEdit.value.id, payload)
      toast.success('Penyebab Diperbarui', {
        description: 'Perubahan penyebab risiko telah disimpan.',
      })
    } else {
      await appStore.addRiskCause(payload, props.potentialRisk.id)
      toast.success('Penyebab Ditambahkan', {
        description: 'Penyebab risiko baru telah ditambahkan.',
      })
    }
    emit('causesUpdated') // Beri tahu parent bahwa data penyebab berubah
    fetchCausesForCurrentPR() // Muat ulang daftar penyebab
    setIsAddEditCauseDialogOpen(false)
  } catch (error) {
    toast.error('Gagal Menyimpan', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    isSubmittingCause.value = false
  }
}

function handleDeleteCauseClick(cause) {
  causeToDelete.value = cause
  isDeleteCauseDialogOpen.value = true
}
function setIsDeleteCauseDialogOpen(value) {
  isDeleteCauseDialogOpen.value = value
  if (!value) causeToDelete.value = null
}
async function confirmDeleteCause() {
  if (!causeToDelete.value) return
  try {
    await appStore.deleteRiskCause(causeToDelete.value.id)
    toast.error('Penyebab Dihapus', {
      description: 'Penyebab risiko telah dihapus.',
    })
    emit('causesUpdated')
    fetchCausesForCurrentPR() // Muat ulang
  } catch (error) {
    toast.error('Gagal Menghapus', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    setIsDeleteCauseDialogOpen(false)
  }
}
function cancelDeleteCause() {
  setIsDeleteCauseDialogOpen(false)
}

function handleCauseAction(actionPayload) {
  const { type, riskCause } = actionPayload
  switch (type) {
    case 'edit-cause':
      openAddEditCauseDialog(riskCause)
      break
    case 'delete-cause':
      handleDeleteCauseClick(riskCause)
      break
    case 'analyze-cause':
      toast.info('Analisis Penyebab', {
        description: `Fitur analisis untuk penyebab ID: ${riskCause.id}`,
      })
      // Buka modal/form analisis penyebab
      break
    case 'manage-controls':
      toast.info('Kelola Pengendalian', {
        description: `Fitur kelola pengendalian untuk penyebab ID: ${riskCause.id}`,
      })
      // Buka modal/dialog kelola pengendalian
      break
    default:
      console.warn('Aksi penyebab tidak dikenal:', type)
  }
}

function closeDialog() {
  isOpen.value = false
  emit('update:modelValue', false)
}

// function openBrainstormCausesDialog() {
//     toast.info('Brainstorm Penyebab (AI)', {description: 'Membuka dialog brainstorm penyebab dengan AI...'});
// }
</script>
