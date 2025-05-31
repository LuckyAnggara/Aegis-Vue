<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumb-items="breadcrumbItems"
    >
      <template #actions>
        <Button
          variant="outline"
          @click="goBackToGoalRisks"
          class="bg-background hover:bg-muted"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </template>
    </PageHeader>


        <Card class="shadow-lg border">
          <CardHeader class="border-b">
            <CardTitle class="text-lg font-semibold">
              Detail Potensi Risiko
            </CardTitle>
          </CardHeader>
          <CardContent class="p-6">
            <div
              v-if="pageLoading && !currentGoal"
              class="flex justify-center items-center py-10"
            >
              <Loader2 class="h-8 w-8 animate-spin text-primary" />
              <p class="ml-3 text-muted-foreground">Memuat detail sasaran...</p>
            </div>
            <div
              v-else-if="!currentGoal && !pageLoading"
              class="py-10 text-center"
            >
              <AlertTriangle class="mx-auto h-10 w-10 text-destructive mb-2" />
              <p class="text-md font-medium text-destructive">
                Sasaran Induk Tidak Ditemukan
              </p>
              <p class="text-sm text-muted-foreground mt-1">
                Tidak dapat menambahkan risiko tanpa sasaran yang valid.
              </p>
            </div>

            <form v-else @submit.prevent="handleFormSubmit" class="space-y-6">
              <div v-if="parentGoalInfoForForm" class="space-y-1.5">
                 <Label class="font-semibold text-base">Sasaran Terkait</Label>
                  
                <div class="p-3 border rounded-md bg-muted/50">
                  <p class="text-sm font-medium text-foreground">
                    {{ parentGoalInfoForForm.code }} - {{ parentGoalInfoForForm.name }}
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
                <Label for="pr-description" class="font-semibold">Deskripsi Potensi Risiko</Label>
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
                  <Label for="pr-category" class="font-semibold">Kategori Risiko</Label>
                  <Select v-model="formData.category" :disabled="isSubmitting">
                    <SelectTrigger
                      id="pr-category"
                      class="mt-1"
                      :class="{ 'border-destructive': errors.category }"
                    >
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">_Tanpa Kategori_</SelectItem>
                      <SelectItem v-for="cat in riskCategories" :key="cat" :value="cat">
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
                  type="button"
                  variant="outline"
                  @click="goBackToGoalRisks"
                  :disabled="isSubmitting"
                >
                  Batal
                </Button>
                <Button type="submit" :disabled="isSubmitting || !canSubmit">
                  <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                  <Save v-else class="mr-2 h-4 w-4" />
                  Simpan Potensi Risiko
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
 
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertTriangle, Save } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types'

const authStore = useAuthStore()
const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const goalId = ref(route.params.goalId)
const currentGoal = ref(null)
const pageLoading = ref(true)
const isSubmitting = ref(false)

const formData = ref({
  goalId:'',
  description: '',
  category: '',
})
const errors = ref({
  goalId:'',
  description: '',
  category: '',
})

const riskCategories = ref(riskCategoriesConstant)

const pageTitle = computed(() => 'Tambah Potensi Risiko Baru')
const pageDescription = computed(() =>
  currentGoal.value
    ? `Kelola detail dan penyebab potensi risiko. UPR: ${
        authStore.uprUser.name || '...'
      }, Periode: ${authStore.uprUser.activePeriod || '...'}.`
    : 'Identifikasi potensi risiko baru.'
)
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Dasbor', path: '/' },
    { label: 'Sasaran', path: '/goals' },
  ]
  if (currentGoal.value) {
    items.push({
      label: currentGoal.value.code || 'Detail Sasaran',
      path: `/goal/${goalId.value}`,
    })
  }
  items.push({ label: 'Tambah Risiko', path: route.fullPath, isCurrent: true })
  return items
})

const parentGoalInfoForForm = computed(() => {
  if (currentGoal.value) {
    return {
      id: currentGoal.value.id,
      code: currentGoal.value.code,
      name: currentGoal.value.name,
      description: currentGoal.value.description,
    }
  }
  return null
})

const canSubmit = computed(() => {
  return (
    authStore.isAuthenticated &&
    authStore.isProfileComplete &&
    !!currentGoal.value
  )
})

function validateForm() {
  let isValid = true
  errors.value = { description: '', category: '', owner: '' }

  if (formData.value.description.trim().length < 10) {
    errors.value.description = 'Deskripsi risiko minimal 10 karakter.'
    isValid = false
  }

  return isValid
}

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
    } else {
      toast.error('Sasaran Tidak Ditemukan', {
        description: `Sasaran dengan ID "${goalId.value}" tidak ditemukan.`,
      })
    }
  } catch (error) {
    toast.error('Gagal Memuat Sasaran', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  fetchGoalData()
})

async function handleFormSubmit() {
  if (!validateForm()) return

  if (!currentGoal.value) {
    toast.error('Sasaran Belum Dimuat', {
      description: 'Tidak dapat menyimpan risiko.',
    })
    return
  }

  if (!canSubmit.value) {
    toast.error('Aksi Tidak Diizinkan', {
      description: 'Anda harus login dan melengkapi profil.',
    })
    return
  }

  isSubmitting.value = true
  try {
    const newRisk = await appStore.addPotentialRisk(
      formData.value,
      goalId.value
    )
    toast.success('Risiko Berhasil Ditambahkan!', {
      description: `Potensi risiko "${newRisk.description.substring(0, 40)}..." telah ditambahkan.`,
      duration: 3000,
    })
    router.push(`/goal/${goalId.value}`)
  } catch (error) {
    toast.error('Gagal Menambahkan Risiko', {
      description: error.message || 'Terjadi kesalahan.',
      duration: 5000,
    })
  } finally {
    isSubmitting.value = false
  }
}

function goBackToGoalRisks() {
  if (goalId.value) {
    router.push(`/goal/${goalId.value}`)
  } else {
    router.push('/goals')
  }
}
</script>
