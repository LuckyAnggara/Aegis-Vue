<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumbs="breadcrumbItems"
    >
      <template #actions>
        <Button
          variant="outline"
          @click="goBack"
          class="bg-background hover:bg-muted cursor-pointer"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </template>
    </PageHeader>

    <PotentialRiskForm
      :initialFormData="appStore.potentialRisk"
      :isEditMode="true"
      :currentGoal="currentGoalForPR"
      :pageLoading="pageLoading"
      :isSubmitting="isSavingPR"
      @submit="handlePotentialRiskFormSubmit"
    />

    <Card class="shadow-lg border">
      <CardHeader class="border-b">
        <div
          class="flex flex-col sm:flex-row justify-between sm:items-center gap-2"
        >
          <div>
            <CardTitle class="text-lg font-semibold">
              Penyebab Risiko untuk: ({{ potentialRiskCodeDisplay }})
            </CardTitle>
            <CardDescription
              class="mt-1 line-clamp-1"
              :title="currentPotentialRisk?.description"
            >
              {{ currentPotentialRisk?.description }}
            </CardDescription>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              @click="openBrainstormCausesDialog"
              :disabled="
                !currentPotentialRisk ||
                !currentGoalForPR ||
                !authStore.isAuthenticated ||
                appStore.riskCausesCurrentPRLoading
              "
              class="text-xs h-8"
            >
              <Sparkles class="mr-1.5 h-3.5 w-3.5" />
              Brainstorm Penyebab (AI)
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="">
        <div class="shadow-md p-6 rounded-xl border-2">
          <h3 class="text-md font-semibold mb-3">
            Tambah Penyebab Baru (Manual)
          </h3>
          <AddEditRiskCauseForm
            :isSubmitting="isAddingCause"
            @submit="handleAddRiskCauseSubmit"
            ref="addRiskCauseFormRef"
          />
        </div>
        <Separator class="my-5" />
        <div>
          <div
            class="flex flex-row space-x-2 mb-2 items-center justify-between"
          >
            <h3 class="text-md font-semibold">
              Penyebab yang Ada ({{ appStore.riskCausesCurrentPR.length || 0 }})
            </h3>
            <div class="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                class="cursor-pointer"
                :class="{ 'bg-muted': viewMode === 'grid' }"
                @click="viewMode = 'grid'"
                ><LayoutGrid class="h-4 w-4"
              /></Button>
              <Button
                variant="ghost"
                size="icon"
                class="cursor-pointer"
                :class="{ 'bg-muted': viewMode === 'list' }"
                @click="viewMode = 'list'"
                ><List class="h-4 w-4"
              /></Button>
            </div>
          </div>

          <div>
            <div
              v-if="
                appStore.riskCausesLoading &&
                appStore.riskCausesCurrentPR.length === 0
              "
              class="flex justify-center items-center py-8 h-full"
            >
              <Loader2 class="h-6 w-6 animate-spin text-primary" />
              <p class="ml-2 text-sm text-muted-foreground">
                Memuat penyebab risiko...
              </p>
            </div>
            <div
              v-else-if="appStore.riskCausesCurrentPR.length === 0"
              class="text-center py-8 text-sm text-muted-foreground"
            >
              Belum ada penyebab yang teridentifikasi.
            </div>
            <div v-else>
              <div
                v-if="viewMode === 'grid'"
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4"
              >
                <RiskCauseCard
                  v-for="cause in appStore.riskCausesCurrentPR"
                  :key="cause.id"
                  :riskCause="cause"
                  :parentPrCode="potentialRiskCodeDisplay"
                  @action="handleCauseAction"
                />
              </div>
              <div v-else></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

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

    <Dialog
      :open="isEditCauseDialogOpen"
      @update:open="setIsEditCauseDialogOpen"
    >
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Penyebab Risiko</DialogTitle>
          <DialogDescription>
            Perbarui detail untuk penyebab:
            {{
              causeToEdit?.sequence_number
                ? `${potentialRiskCodeDisplay}.C${causeToEdit.sequence_number}`
                : '...'
            }}
          </DialogDescription>
        </DialogHeader>
        <AddEditRiskCauseForm
          @submit="handleSubmitRiskCause"
          @cancel="setIsEditCauseDialogOpen(false)"
        />
      </DialogContent>
    </Dialog>

    <BrainstormCausesContextModal
      v-if="
        isBrainstormCausesContextModalOpen &&
        currentPotentialRisk &&
        currentGoalForPR
      "
      :is-open="isBrainstormCausesContextModalOpen"
      :potentialRisk="currentPotentialRisk"
      :goalDescription="currentGoalForPR.description"
      @open-change="setIsBrainstormCausesContextModalOpen"
      @suggestions-ready="handleAICauseSuggestionsReady"
    />
    <BrainstormCausesSuggestionsModal
      v-if="isBrainstormCausesSuggestionsModalOpen && currentPotentialRisk"
      :is-open="isBrainstormCausesSuggestionsModalOpen"
      :suggestions="aiCauseSuggestions"
      :potentialRiskId="currentPotentialRisk.id"
      :existingCausesCount="riskCausesForCurrentPR.length"
      @open-change="setIsBrainstormCausesSuggestionsModalOpen"
      @save-selected-causes="handleSaveAISelectedCauses"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/global/PageHeader.vue'
import PotentialRiskForm from '@/components/risks/PotentialRiskForm.vue'
import AddEditRiskCauseForm from '@/components/risks/AddEditRiskCauseForm.vue'
import RiskCauseCard from '@/components/risks/RiskCauseCard.vue'
import BrainstormCausesContextModal from '@/components/risks/modal/BrainstormCausesContextModal.vue' // Asumsi nama ini
import BrainstormCausesSuggestionsModal from '@/components/risks/modal/BrainstormCausesSuggestionsModal.vue' // Asumsi nama ini
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  ArrowLeft,
  Loader2,
  List,
  LayoutGrid,
  AlertTriangle,
  Save,
  PlusCircle,
  Sparkles,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()

const potentialRiskId = ref(route.params.potentialRiskId)

const currentPotentialRisk = computed(
  () =>
    appStore.potentialRisk ??
    appStore.potentialRisks.find((pr) => pr.id === potentialRiskId.value)
)

const currentGoalForPR = computed(() => {
  if (!appStore.goal) return null
  return appStore.goal
})
const pageLoading = ref(true)
const isSavingPR = ref(false) // Untuk loading simpan detail PR
const viewMode = ref('grid') // Untuk toggle antara grid dan list view
const addRiskCauseFormRef = ref(null) // Ref untuk form tambah penyebab
const isAddingCause = ref(false) // Untuk loading tambah penyebab manual

const isEditCauseDialogOpen = ref(false)
const causeToEdit = ref(null)
const isSubmittingCauseEdit = ref(false) // Untuk loading edit penyebab
const isDeleteCauseDialogOpen = ref(false)
const causeToDelete = ref(null)

// State untuk AI Brainstorm Penyebab
const isBrainstormCausesContextModalOpen = ref(false)
const isBrainstormCausesSuggestionsModalOpen = ref(false)
const aiCauseSuggestions = ref([])
// const isLoadingAICauseSuggestions = ref(false); // Ini bisa di-handle di store

async function fetchData() {
  pageLoading.value = true
  if (appStore.potentialRisk === null) {
    await appStore.getPotentialRiskById(potentialRiskId.value)
  }
  if (appStore.goal === null) {
    console.log(
      `[DetailPotentialRiskView] Fetching goal for PR ID: ${potentialRiskId.value}`
    )
    await appStore.getGoalById(appStore.potentialRisk.goalId)
  }
  if (appStore.riskCausesCurrentPR.length === 0) {
    console.log(
      `[DetailPotentialRiskView] Fetching risk causes for PR ID: ${potentialRiskId.value}`
    )
    await appStore.fetchSingleRiskCauses(potentialRiskId.value)
  }
  pageLoading.value = false
}

onMounted(() => {
  fetchData()
})

watch(
  () => route.params.potentialRiskId,
  (newId) => {
    if (newId) {
      potentialRiskId.value = newId
      fetchData() // Muat ulang data jika ID berubah (misalnya, dari create baru ke mode edit)
    }
  }
)

const potentialRiskCodeDisplay = computed(
  () =>
    `${appStore.goal?.code || 'G?'}.PR${
      appStore.potentialRisk?.sequenceNumber || '?'
    }`
)

const pageTitle = computed(
  () => `Detail Potensi Risiko (${potentialRiskCodeDisplay.value})`
)
const pageDescription = computed(
  () =>
    `Kelola detail dan penyebab potensi risiko. UPR: ${
      authStore.uprUser.name || '...'
    }, Periode: ${authStore.uprUser.activePeriod || '...'}.`
)
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Dashboard', path: '/' },
    { label: 'Sasaran', path: '/goals' },
  ]
  if (appStore.goal) {
    items.push({
      label: appStore.goal.code || 'Detail Sasaran',
      path: `/goal/${appStore.goal.id}`,
    })
  }
  items.push({
    label: `Detail Potensi Risiko (${potentialRiskCodeDisplay.value})`,
    path: route.fullPath,
    isCurrent: true,
  })
  return items
})

async function handlePotentialRiskFormSubmit(formData) {
  isSavingPR.value = true
  try {
    if (currentPotentialRisk.value?.id) {
      const updatedRisk = await appStore.updatePotentialRisk(
        currentPotentialRisk.value.id,
        formData
      )
      currentPotentialRisk.value = updatedRisk // Update state lokal
      toast.success('Perubahan Disimpan', {
        description: `Detail potensi risiko "${updatedRisk.description.substring(
          0,
          40
        )}..." telah diperbarui.`,
      })
    }
  } catch (error) {
    toast.error('Gagal Menyimpan Risiko', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    isSavingPR.value = false
  }
}

const riskCausesForCurrentPR = computed(() => {
  if (!appStore.riskCausesCurrentPR.length > 0) return []
  // return appStoreInstance.getRiskCausesByPotentialRiskId(currentPotentialRisk.value.id); // Akan di-uncomment
  return appStore.fetchSingleRiskCauses(potentialRiskId.value)
})

async function handleAddRiskCauseSubmit(causeFormData) {
  if (!currentPotentialRisk.value?.id) return
  isAddingCause.value = true
  try {
    // const newCause = await appStoreInstance.addRiskCause(causeFormData, currentPotentialRisk.value.id); // Akan di-uncomment
    const newCause = await appStore.addRiskCause(causeFormData)
    toast.success('Penyebab Ditambahkan', {
      description: `Penyebab "${newCause.description.substring(
        0,
        40
      )}..." berhasil ditambahkan.`,
    })
    if (
      addRiskCauseFormRef.value &&
      typeof addRiskCauseFormRef.value.resetForm === 'function'
    ) {
      // Panggil reset jika form terpisah
      addRiskCauseFormRef.value.resetForm()
    } else {
      // Jika form lokal, reset manual (sudah ada di AddEditRiskCauseForm)
      // addRiskCauseFormRef.value.form.reset(); // Ini asumsi jika form diref langsung
    }
  } catch (error) {
    toast.error('Gagal Menambah Penyebab', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    isAddingCause.value = false
  }
}

function openEditCauseDialog(cause) {
  causeToEdit.value = cause
  isEditCauseDialogOpen.value = true
}
function setIsEditCauseDialogOpen(value) {
  isEditCauseDialogOpen.value = value
  if (!value) causeToEdit.value = null
}
// async function handleSubmitRiskCause(causeFormData) {
//   isSubmittingCause.value = true
//   try {
//     // await appStoreInstance.updateRiskCause(causeToEdit.value.id, causeFormData); // Akan di-uncomment
//     await appStore.addRiskCause(causeFormData)
//     toast.success('Penyebab Ditambahkan')
//   } catch (error) {
//     toast.error('Gagal Menambahkan Penyebab', { description: error.message })
//   } finally {
//     isSubmittingCause.value = false
//   }
// }

// async function handleUpdateRiskCauseSubmit(causeFormData) {
//   if (!causeToEdit.value?.id) return
//   isSubmittingCauseEdit.value = true
//   try {
//     // await appStoreInstance.updateRiskCause(causeToEdit.value.id, causeFormData); // Akan di-uncomment
//     await appStore.updateRiskCause(causeToEdit.value.id, causeFormData)
//     toast.success('Penyebab Diperbarui')
//     setIsEditCauseDialogOpen(false)
//   } catch (error) {
//     toast.error('Gagal Memperbarui Penyebab', { description: error.message })
//   } finally {
//     isSubmittingCauseEdit.value = false
//   }
// }

function handleDeleteCauseClick(cause) {
  causeToDelete.value = cause
  isDeleteCauseDialogOpen.value = true
}
function setIsDeleteCauseDialogOpen(value) {
  isDeleteCauseDialogOpen.value = value
  if (!value) causeToDelete.value = null
}
async function confirmDeleteCause() {
  if (!causeToDelete.value?.id) return
  try {
    // await appStoreInstance.deleteRiskCause(causeToDelete.value.id); // Akan di-uncomment
    await appStore.deleteRiskCause(causeToDelete.value.id)
    toast.error('Penyebab Dihapus', {
      description: `Penyebab "${causeToDelete.value.description.substring(
        0,
        40
      )}..." telah dihapus.`,
    })
  } catch (error) {
    toast.error('Gagal Menghapus Penyebab', { description: error.message })
  } finally {
    setIsDeleteCauseDialogOpen(false)
  }
}
function cancelDeleteCause() {
  setIsDeleteCauseDialogOpen(false)
}

// function handleCauseAction(actionPayload) {
//   const { type, riskCause } = actionPayload
//   if (type === 'edit-cause') {
//     openEditCauseDialog(riskCause)
//   } else if (type === 'delete-cause') {
//     handleDeleteCauseClick(riskCause)
//   } else if (type === 'analyze-cause') {
//     toast.info('Analisis Penyebab', {
//       description: `Navigasi ke halaman analisis untuk penyebab ID: ${riskCause.id}`,
//     })
//     // router.push(`/risk-cause-analysis/${riskCause.id}?from=${encodeURIComponent(route.fullPath)}`);
//   } else if (type === 'manage-controls') {
//     toast.info('Kelola Pengendalian', {
//       description: `Buka dialog kelola pengendalian untuk penyebab ID: ${riskCause.id}`,
//     })
//     // Buka dialog kelola pengendalian
//   }
// }

function openBrainstormCausesDialog() {
  if (!currentPotentialRisk.value || !currentGoalForPR.value) {
    toast.error('Konteks Tidak Lengkap', {
      description: 'Data potensi risiko atau sasaran induk belum dimuat.',
    })
    return
  }
  isBrainstormCausesContextModalOpen.value = true
}
async function handleAICauseSuggestionsReady(suggestions) {
  aiCauseSuggestions.value = suggestions
  isBrainstormCausesContextModalOpen.value = false
  if (suggestions.length > 0) {
    isBrainstormCausesSuggestionsModalOpen.value = true
  } else {
    toast.info('Tidak Ada Saran AI', {
      description: 'AI tidak menghasilkan saran penyebab untuk konteks ini.',
    })
  }
}
async function handleSaveAISelectedCauses(selectedCausesData) {
  if (!currentPotentialRisk.value?.id) return
  // const addedCauses = await appStoreInstance.addMultipleRiskCauses(selectedCausesData, currentPotentialRisk.value.id);
  // Untuk simulasi, kita panggil addRiskCause berulang kali
  let successCount = 0
  for (const causeData of selectedCausesData) {
    try {
      await appStore.addRiskCause(causeData, currentPotentialRisk.value.id)
      successCount++
    } catch (e) {
      console.error('Error adding AI cause:', e)
    }
  }
  if (successCount > 0) {
    toast.success(`${successCount} Penyebab dari AI Ditambahkan`)
  }
  isBrainstormCausesSuggestionsModalOpen.value = false
}

function goBack() {
  if (appStore.goal.id) {
    router.push(`/goal/${appStore.goal.id}`)
  } else {
    router.push('/goals') // Fallback jika goalId tidak ada
  }
}
</script>
