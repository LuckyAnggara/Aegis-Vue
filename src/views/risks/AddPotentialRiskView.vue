<template>
  <div class="h-full flex flex-col">
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumb-items="breadcrumbItems"
      class="mb-6 px-4 md:px-6 pt-6"
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

    <div class="flex-grow overflow-y-auto px-4 md:px-6 pb-6">
      <div class="max-w-3xl mx-auto">
        <Card class="shadow-lg border">
          <CardHeader class="border-b">
            <CardTitle class="text-lg font-semibold"
              >Detail Potensi Risiko</CardTitle
            >
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
            <PotentialRiskForm
              v-else
              :is-submitting="isSubmitting"
              :can-submit="
                authStore.isAuthenticated &&
                authStore.isProfileComplete &&
                !!currentGoal
              "
              :parent-goal-info="currentGoalInfoForForm"
              @submit="handleFormSubmit"
              @cancel="goBackToGoalRisks"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/global/PageHeader.vue'
import PotentialRiskForm from '@/components/risks/PotentialRiskForm.vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card' // CardDescription mungkin tidak dipakai di sini
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const authStore = useAuthStore()
const appStore = useAppStore()

const route = useRoute()
const router = useRouter()

const goalId = ref(route.params.goalId)
const currentGoal = ref(null)
const pageLoading = ref(true)
const isSubmitting = ref(false)

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
    const goal = await appStore.goals.find((x) => x.id === goalId.value)
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

onMounted(fetchGoalData)

const pageTitle = computed(() => 'Tambah Potensi Risiko Baru')
const pageDescription = computed(() =>
  currentGoal.value
    ? `Kelola detail dan penyebab potensi risiko. UPR: ${
        authStore.value.appUser?.display_name || '...'
      }, Periode: ${authStore.value.appUser?.active_period || '...'}.`
    : 'Identifikasi potensi risiko baru.'
)
const breadcrumbItems = computed(() => {
  const items = [
    { label: 'Dasbor', path: '/' }, // Atau nama rute Dasbor Anda
    { label: 'Sasaran', path: '/goals' },
  ]
  if (currentGoal.value) {
    items.push({
      label: currentGoal.value.code || 'Detail Sasaran',
      path: `/risks/${goalId.value}`,
    })
  }
  items.push({ label: 'Tambah Risiko', path: route.fullPath, isCurrent: true })
  return items
})

// Data sasaran untuk ditampilkan di form
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

async function handleFormSubmit(formDataFromComponent) {
  if (!currentGoal.value) {
    toast.error('Sasaran Belum Dimuat', {
      description: 'Tidak dapat menyimpan risiko.',
    })
    return
  }
  if (!authStore.value.isAuthenticated || !authStore.value.isProfileComplete) {
    toast.error('Aksi Tidak Diizinkan', {
      description: 'Anda harus login dan melengkapi profil.',
    })
    return
  }

  isSubmitting.value = true
  try {
    const newRisk = await appStore.addPotentialRisk(
      formDataFromComponent,
      goalId.value
    )
    toast.success('Risiko Berhasil Ditambahkan!', {
      description: `Potensi risiko "${newRisk.description.substring(
        0,
        40
      )}..." telah ditambahkan.`,
      duration: 3000,
    })
    router.push(`/risks/${goalId.value}`)
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
    router.push(`/risks/${goalId.value}`)
  } else {
    router.push('/goals')
  }
}
</script>
