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
          @click="goBackToGoalRisks"
          class="bg-background hover:bg-muted cursor-pointer"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <button class="cursor-pointer" @click="handleAi">Test</button>
      </template>
    </PageHeader>
    <PotentialRiskForm
      :currentGoal="currentGoal"
      :formData="formData"
      :isEditMode="isEditMode"
      :riskLoading="riskLoading"
      :pageLoading="pageLoading"
      @submit="handleFormSubmit"
    />
    <!-- <Card class="shadow-lg border">
      <CardHeader class="border-b">
        <CardTitle class="text-lg font-semibold">
          {{ isEditMode ? 'Edit' : 'Detail' }} Potensi Risiko
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
            Tidak dapat {{ isEditMode ? 'mengedit' : 'menambahkan' }} risiko
            tanpa sasaran yang valid.
          </p>
        </div>
        <div
          v-else-if="isEditMode && !formData.id && !riskLoading"
          class="py-10 text-center"
        >
          <AlertTriangle class="mx-auto h-10 w-10 text-destructive mb-2" />
          <p class="text-md font-medium text-destructive">
            Potensi Risiko Tidak Ditemukan
          </p>
          <p class="text-sm text-muted-foreground mt-1">
            Data potensi risiko yang ingin Anda edit tidak dapat ditemukan.
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
              class="mt-1 text-sm"
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
            <Button
              class="cursor-pointer"
              type="button"
              variant="outline"
              @click="goBackToGoalRisks"
              :disabled="isSubmitting"
            >
              Batal
            </Button>
            <Button
              type="submit"
              :disabled="isSubmitting || !canSubmit"
              class="cursor-pointer"
            >
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              {{ isEditMode ? 'Update' : 'Simpan' }} Potensi Risiko
            </Button>
          </div>
        </form>
      </CardContent>
    </Card> -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/global/PageHeader.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertTriangle, Save } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types'
import PotentialRiskForm from '@/components/risks/PotentialRiskForm.vue'

const authStore = useAuthStore()
const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const goalId = ref(route.params.goalId)
const riskId = ref(route.params.riskId) // Untuk mode edit

const isEditMode = computed(() => !!riskId.value)

const currentGoal = ref(null)
const pageLoading = ref(true) // Loading untuk goal
const riskLoading = ref(false) // Loading untuk risk (khusus edit mode)
const isSubmitting = ref(false)

const initialFormData = () => ({
  id: null, // Tambahkan id untuk membedakan data baru atau lama
  goalId: '',
  description: '',
  category: '',
  owner: '',
})

const formData = ref(initialFormData())

const errors = ref({
  goalId: '',
  description: '',
  category: '',
  owner: '',
})

const pageTitle = computed(() =>
  isEditMode.value ? 'Edit Potensi Risiko' : 'Tambah Potensi Risiko Baru'
)
const pageDescription = computed(() => {
  let baseDesc = isEditMode.value
    ? 'Ubah detail potensi risiko yang ada.'
    : 'Kelola detail dan penyebab potensi risiko.'
  if (currentGoal.value) {
    baseDesc += ` UPR: ${authStore.uprUser.name || '...'}, Periode: ${
      authStore.uprUser.activePeriod || '...'
    }.`
  } else if (!isEditMode.value) {
    baseDesc = 'Identifikasi potensi risiko baru.'
  }
  return baseDesc
})

const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Dashboard', path: '/' },
    { label: 'Sasaran', path: '/goals' },
  ]
  if (currentGoal.value) {
    items.push({
      label: currentGoal.value.code || 'Detail Sasaran',
      path: `/goal/${goalId.value}`,
    })
  }
  items.push({
    label: isEditMode.value ? 'Edit Risiko' : 'Tambah Risiko',
    path: route.fullPath,
    isCurrent: true,
  })
  return items
})

const canSubmit = computed(() => {
  return (
    authStore.isAuthenticated &&
    authStore.isProfileComplete &&
    !!currentGoal.value &&
    (isEditMode.value ? !!formData.value.id : true) // Jika edit, pastikan data risiko sudah termuat
  )
})
async function fetchGoalData() {
  pageLoading.value = true
  if (!goalId.value) {
    toast.error('Error ID Sasaran', {
      description: 'ID Sasaran tidak ditemukan.',
    })
    router.push('/goals')
    pageLoading.value = false
    return
  }

  try {
    const goal = await appStore.getGoalById(
      goalId.value,
      authStore.uprUser.id,
      authStore.uprUser.activePeriod
    )
    if (goal) {
      currentGoal.value = goal
      formData.value.goalId = goal.id // Set goalId di formData
    } else {
      toast.error('Sasaran Tidak Ditemukan', {
        description: `Sasaran dengan ID "${goalId.value}" tidak ditemukan.`,
      })
      currentGoal.value = null // Pastikan currentGoal null jika tidak ditemukan
    }
  } catch (error) {
    toast.error('Gagal Memuat Sasaran', {
      description: error.message || 'Terjadi kesalahan saat memuat sasaran.',
    })
    currentGoal.value = null
  } finally {
    pageLoading.value = false
  }
}

async function fetchRiskDataForEdit() {
  if (!isEditMode.value || !riskId.value) return

  riskLoading.value = true
  try {
    // Asumsi ada fungsi ini di store Anda
    // Sesuaikan dengan implementasi store Anda
    const riskData = await appStore.getPotentialRiskById(riskId.value)
    if (riskData) {
      formData.value = { ...initialFormData(), ...riskData } // Isi form dengan data risiko
    } else {
      toast.error('Risiko Tidak Ditemukan', {
        description: `Potensi risiko dengan ID "${riskId.value}" tidak ditemukan.`,
      })
      formData.value.id = null // Tandai bahwa risiko tidak ditemukan
    }
  } catch (error) {
    toast.error('Gagal Memuat Risiko', {
      description:
        error.message || 'Terjadi kesalahan saat memuat data risiko.',
    })
    formData.value.id = null
  } finally {
    riskLoading.value = false
  }
}

onMounted(async () => {
  await fetchGoalData() // Selalu fetch goal data
  if (isEditMode.value && currentGoal.value) {
    // Hanya fetch risk data jika goal ada dan mode edit
    await fetchRiskDataForEdit()
  } else if (isEditMode.value && !currentGoal.value && !pageLoading.value) {
    // Jika mode edit tapi goal tidak ada (setelah fetchGoalData selesai)
    toast.warning('Tidak Dapat Memuat Risiko', {
      description:
        'Sasaran induk tidak ditemukan, tidak dapat memuat detail risiko.',
    })
  }
  if (!isEditMode.value) {
    formData.value = initialFormData() // Reset form untuk mode tambah
    if (currentGoal.value) formData.value.goalId = currentGoal.value.id
  }
})

// Jika goalId atau riskId berubah (misalnya navigasi dari edit ke tambah atau sebaliknya di halaman yang sama)
watch(
  [() => route.params.goalId, () => route.params.riskId],
  async (newParams, oldParams) => {
    goalId.value = newParams[0]
    const oldRiskId = riskId.value
    riskId.value = newParams[1]

    // Reset state sebelum fetch baru
    currentGoal.value = null
    formData.value = initialFormData()
    pageLoading.value = true
    if (isEditMode.value) riskLoading.value = true

    await fetchGoalData()
    if (isEditMode.value && currentGoal.value) {
      await fetchRiskDataForEdit()
    } else if (isEditMode.value && !currentGoal.value && !pageLoading.value) {
      toast.warning('Tidak Dapat Memuat Risiko', {
        description:
          'Sasaran induk tidak ditemukan, tidak dapat memuat detail risiko.',
      })
    }
    if (!isEditMode.value) {
      if (currentGoal.value) formData.value.goalId = currentGoal.value.id
    }
  },
  { immediate: false }
) // immediate: false karena onMounted sudah menangani load awal

async function handleFormSubmit(formData) {
  if (!currentGoal.value) {
    toast.error('Sasaran Belum Dimuat', {
      description: 'Tidak dapat menyimpan risiko.',
    })
    return
  }

  if (isEditMode.value && !formData.id) {
    toast.error('Data Risiko Tidak Valid', {
      description:
        'Tidak dapat memperbarui risiko karena data awal tidak termuat.',
    })
    return
  }

  if (!canSubmit.value) {
    toast.error('Aksi Tidak Diizinkan', {
      description:
        'Anda harus login dan melengkapi profil, atau data sasaran/risiko belum lengkap.',
    })
    return
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      // Panggil fungsi update di store
      // Asumsi ada fungsi ini: appStore.updatePotentialRisk(riskId.value, formData.value)
      const updatedRisk = await appStore.updatePotentialRisk(
        riskId.value,
        formData
      ) // Kirim ID dan data
      toast.success('Risiko Berhasil Diperbarui!', {
        description: `Potensi risiko "${updatedRisk.description.substring(
          0,
          40
        )}..." telah diperbarui.`,
        duration: 2000,
      })
    } else {
      // Panggil fungsi add

      const newRisk = await appStore.addPotentialRisk(
        formData, // formData sekarang sudah termasuk goalId
        goalId.value // atau biarkan addPotentialRisk yang mengambilnya dari formData jika strukturnya sesuai
      )
      toast.success('Risiko Berhasil Ditambahkan!', {
        description: `Potensi risiko "${newRisk.description.substring(
          0,
          40
        )}..." telah ditambahkan.`,
        duration: 2000,
      })
    }
    router.push(`/goal/${goalId.value}`) // Kembali ke detail sasaran setelah simpan/update
  } catch (error) {
    toast.error(
      `Gagal ${isEditMode.value ? 'Memperbarui' : 'Menambahkan'} Risiko`,
      {
        description: error.message || 'Terjadi kesalahan.',
        duration: 2000,
      }
    )
  } finally {
    isSubmitting.value = false
  }
}

function goBackToGoalRisks() {
  if (goalId.value) {
    router.push(`/goal/${goalId.value}`)
  } else {
    router.push('/goals') // Fallback jika goalId tidak ada
  }
}

async function handleAi() {
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        name: 'boy',
      },
    }),
  })

  const data = await res.json()
  console.log(data.risks) // hasil list dari Genkit
}
</script>
