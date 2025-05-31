<template>
  <div class="space-y-6">
    <PageHeader :title="pageTitle" :description="pageDescription" />

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
      <p class="text-xl text-muted-foreground">Memuat data Dashboard...</p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Total Sasaran</CardTitle>
          <Target class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ appStore.goalsCount }}</div>
          <p class="text-xs text-muted-foreground">
            Sasaran yang dilacak untuk UPR/Periode ini
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Total Potensi Risiko</CardTitle
          >
          <AlertCircle class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ appStore.potentialRisksCount }}
          </div>
          <p class="text-xs text-muted-foreground">
            Jumlah potensi risiko teridentifikasi.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Total Penyebab Dianalisis</CardTitle
          >
          <ListChecks class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ appStore.analyzedRiskCausesCount }}
          </div>
          <p class="text-xs text-muted-foreground">
            Penyebab risiko yang telah dinilai kemungkinan & dampaknya.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Total Tindakan Pengendalian</CardTitle
          >
          <ShieldCheck class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ appStore.totalControlsCount }}
          </div>
          <p class="text-xs text-muted-foreground">
            Jumlah total rencana pengendalian yang disusun.
          </p>
        </CardContent>
      </Card>
    </div>

    <div v-if="!isLoading" class="grid gap-4 md:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Tambahan</CardTitle>
          <CardDescription
            >Analisis risiko detail dilakukan pada tingkat penyebab
            risiko.</CardDescription
          >
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Untuk melihat dan menganalisis tingkat risiko, silakan navigasi ke
            modul "Analisis Risiko" di mana setiap penyebab risiko dapat dinilai
            kemungkinan dan dampaknya. Modul "Identifikasi Risiko" digunakan
            untuk mencatat potensi risiko dan penyebab-penyebabnya.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

// Komponen UI Shadcn-Vue
import PageHeader from '@/components/ui/page-header/PageHeader.vue' // Sesuaikan jika PageHeader adalah file tunggal
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Ikon Lucide
import {
  Loader2,
  Target,
  AlertCircle,
  ListChecks,
  ShieldCheck,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const appStore = useAppStore()

const pageTitle = computed(() => 'Dasbor Risiko')
const pageDescription = computed(
  () =>
    `Ringkasan lanskap risiko Anda saat ini untuk UPR: ${authStore.uprUser?.name}, Periode: ${authStore.uprUser?.activePeriod}.`
)

// Kombinasi state loading dari auth dan app store
const isLoading = computed(() => {
  return (
    authStore.loadingInitial ||
    appStore.profileLoading ||
    appStore.isDashboardDataLoading
  )
})

// Fungsi untuk memicu pengambilan data jika belum ada
const ensureDataFetched = () => {
  if (
    authStore.isAuthenticated &&
    appStore.isProfileComplete &&
    appStore.appUser?.id &&
    appStore.appUser?.active_period
  ) {
    // Cek apakah data sudah pernah di-fetch untuk periode ini atau sedang loading
    if (
      appStore.dataFetchedForPeriod !== appStore.appUser.active_period &&
      !appStore.isDashboardDataLoading
    ) {
      console.log(
        '[DashboardView] Data not fetched for current period or not loading, triggering initial data fetch.'
      )
      appStore.triggerInitialDataFetch(
        appStore.appUser.id,
        appStore.appUser.active_period
      )
    } else if (appStore.isDashboardDataLoading) {
      console.log(
        '[DashboardView] Dashboard data is currently loading via appStore.'
      )
    } else {
      console.log(
        '[DashboardView] Dashboard data already fetched for period or no need to fetch.'
      )
    }
  } else {
    console.log(
      '[DashboardView] Pre-conditions for data fetch not met (auth/profile/period).'
    )
  }
}

// Panggil saat komponen dimuat
onMounted(() => {
  console.log(
    '[DashboardView] Mounted. isLoading (initial computed):',
    isLoading.value
  )
  ensureDataFetched()
})

// Panggil juga saat user atau periode aktif berubah (jika appUser sudah ada)
watch(
  () => [
    appStore.appUser?.id,
    appStore.appUser?.active_period,
    appStore.isProfileComplete,
    authStore.isAuthenticated,
  ],
  ([userId, activePeriod, profileComplete, authenticated]) => {
    console.log('[DashboardView] Watched properties changed:', {
      userId,
      activePeriod,
      profileComplete,
      authenticated,
    })
    if (authenticated && profileComplete && userId && activePeriod) {
      ensureDataFetched()
    }
  },
  { immediate: false } // immediate: true bisa menyebabkan pemanggilan ganda dengan onMounted, false lebih aman di sini
)
</script>
