<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-background p-4"
  >
    <Card class="w-full max-w-md shadow-xl">
      <CardHeader class="space-y-1 text-center">
        <AppLogo class="mx-auto h-12 w-12 text-primary mb-2" />
        <CardTitle class="text-2xl">Lengkapi Data </CardTitle>
        <CardDescription>
          Silakan lengkapi data UPR dan periode awal Anda untuk melanjutkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-1.5">
            <Label for="uprName">Nama Unit Pengelola Risiko</Label>
            <Input
              id="uprName"
              type="text"
              placeholder="Masukkan Nama Unit Pengelola Ris Anda"
              v-model="uprName"
              required
              :disabled="isSaving"
            />
            <p class="text-xs text-muted-foreground">
              Nama ini akan digunakan sebagai identitas UPR Anda.
            </p>
            <p v-if="uprNameError" class="text-xs text-destructive mt-1">
              {{ uprNameError }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="description">Deskripsi Unit Pengelola Risiko</Label>
            <Textarea
              id="description"
              placeholder="Masukkan Deskripsi Unit Pengelola Risiko Anda"
              v-model="description"
              :disabled="isSaving"
            ></Textarea>
            <p class="text-xs text-muted-foreground">
              Deskripsi ini akan digunakan untuk menjelaskannya kepada pengguna
              UPR Anda.
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="initialPeriod">Tahun Periode Awal</Label>
            <Input
              id="initialPeriod"
              type="text"
              placeholder="YYYY atau YYYY/YYYY atau YYYY-S1/Q1"
              v-model="initialPeriod"
              required
              pattern="\d{4}(?:[-\/](?:S[1-2]|Q[1-4]|(?:\d{4})))?"
              title="Masukkan tahun dalam format YYYY, YYYY/YYYY atau YYYY-S1/S2/Q1-Q4"
              :disabled="isSaving"
            />
            <p class="text-xs text-muted-foreground">
              Ini akan menjadi periode aktif pertama Anda.
            </p>
            <p v-if="initialPeriodError" class="text-xs text-destructive mt-1">
              {{ initialPeriodError }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="riskAppetite">Selera Risiko Awal (1-25)</Label>
            <Input
              id="riskAppetite"
              type="number"
              min="1"
              max="25"
              v-model="riskAppetite"
              :disabled="isSaving"
            />
            <p class="text-xs text-muted-foreground">
              Skor tingkat risiko di bawah atau sama dengan ini mungkin tidak
              memerlukan prioritas tinggi.
            </p>
            <p v-if="riskAppetiteError" class="text-xs text-destructive mt-1">
              {{ riskAppetiteError }}
            </p>
          </div>
          <div class="space-y-1.5">
            <Label for="defaultMonitoringFrequency"
              >Frekuensi Pemantauan Standar (Opsional)</Label
            >
            <Select v-model="defaultMonitoringFrequency" :disabled="isSaving">
              <SelectTrigger id="defaultMonitoringFrequency">
                <SelectValue placeholder="Pilih frekuensi standar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="NO_FREQUENCY_SENTINEL"
                  >_Tidak Diatur_</SelectItem
                >
                <SelectItem
                  v-for="freq in MONITORING_PERIOD_FREQUENCIES_JS"
                  :key="freq"
                  :value="freq"
                >
                  {{ freq }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" class="w-full" :disabled="isSaving">
            <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            Simpan & Lanjutkan
          </Button>
        </form>
      </CardContent>
      <CardFooter class="text-center text-xs text-muted-foreground pt-4">
        <p>
          &copy; {{ new Date().getFullYear() }} RiskWise. Aplikasi Manajemen
          Risiko.
        </p>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select' //
import { Loader2, Save } from 'lucide-vue-next'
import { toast } from 'vue-sonner' // Pastikan path ini benar

import AppLogo from '@/components/global/AppLogo.vue' // Asumsi Anda buat komponen ini
import { MONITORING_PERIOD_FREQUENCIES as MONITORING_PERIOD_FREQUENCIES_JS } from '@/lib/types' //
import { useUprStore } from '@/stores/upr'
import Textarea from '@/components/ui/textarea/Textarea.vue'

const DEFAULT_INITIAL_PERIOD_JS = new Date().getFullYear().toString() //
const NO_FREQUENCY_SENTINEL = '__NONE__' //

const authStore = useAuthStore()
const uprStore = useUprStore() // Gunakan shallowRef untuk menghindari reactivity yang tidak perlu
const router = useRouter()

const uprName = ref('')
const description = ref('')
const initialPeriod = ref(DEFAULT_INITIAL_PERIOD_JS)
const riskAppetite = ref('5') //
const defaultMonitoringFrequency = ref(NO_FREQUENCY_SENTINEL) //
const isSaving = ref(false)

const uprNameError = ref('')
const initialPeriodError = ref('')
const riskAppetiteError = ref('')

onMounted(() => {
  // Jika pengguna sudah login dan profilnya sudah lengkap, arahkan ke dashboard
  // Atau jika appUser masih null setelah auth selesai (menunggu fetchAppUser)
  if (authStore.authLoading) {
    // Jika authStore masih loading (termasuk fetch profil awal)
    const unwatch = watch(
      () => authStore.authLoading,
      (newLoadingState) => {
        if (!newLoadingState) {
          // Setelah loading selesai
          checkProfileAndRedirect()
          unwatch() // Hentikan watch setelah selesai
        }
      }
    )
  } else {
    checkProfileAndRedirect()
  }
})

function checkProfileAndRedirect() {
  if (authStore.isProfileComplete) {
    console.log('[ProfileSetupPage] Profile sudah lengkap, mengarahkan ke /')
    router.replace('/')
  } else if (!authStore.currentUser) {
    // Jika tidak ada user, kembali ke login
    console.log('[ProfileSetupPage] Tidak ada pengguna, mengarahkan ke /login')
    router.replace('/login')
  }
  // Jika profil belum lengkap dan user ada, biarkan user di halaman ini
}

function validateForm() {
  let isValid = true
  uprNameError.value = ''
  initialPeriodError.value = ''
  riskAppetiteError.value = ''

  if (!uprName.value.trim()) {
    uprNameError.value = 'Nama UPR / Nama Pengguna harus diisi.'
    isValid = false
  }
  if (
    !/^\d{4}(?:[-\/](?:S[1-2]|Q[1-4]|(?:\d{4})))?$/i.test(
      initialPeriod.value.trim()
    )
  ) {
    initialPeriodError.value =
      'Format Periode Awal tidak valid. Gunakan YYYY, YYYY/YYYY, atau YYYY-S1/Q1.'
    isValid = false
  }
  const appetiteNum = parseInt(riskAppetite.value, 10)
  if (isNaN(appetiteNum) || appetiteNum < 1 || appetiteNum > 25) {
    riskAppetiteError.value =
      'Selera Risiko harus berupa angka antara 1 dan 25.'
    isValid = false
  }
  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  // --- Pemeriksaan Kunci di Sini ---
  if (authStore.isAuthenticated === false) {
    // Periksa currentUser DAN $id nya
    toast.error('Sesi Tidak Valid', {
      description:
        'Sesi pengguna tidak ditemukan atau tidak valid. Silakan coba login kembali.',
    })
    // Anda bisa mengarahkan ke login atau mencegah submit lebih lanjut
    // router.push('/login'); // Opsional
    isSaving.value = false // Pastikan isSaving di-reset jika ada
    return
  }
  // --- Akhir Pemeriksaan Kunci ---

  isSaving.value = true
  try {
    const uprData = {
      name: uprName.value.trim(),
      description: description.value.trim(),
      activePeriod: initialPeriod.value.trim(),
      availablePeriods: [initialPeriod.value.trim()],
      riskAppetite: parseInt(riskAppetite.value, 10),
      monitoringSettings:
        defaultMonitoringFrequency.value === NO_FREQUENCY_SENTINEL
          ? null
          : defaultMonitoringFrequency.value,
    }

    await uprStore.addUpr(uprData)

    toast.success('UPR Baru telah disimpan', {
      description: 'Pengaturan UPR Anda telah berhasil disimpan.',
    })

    await authStore.updateUserProfile({
      uprId: uprStore.currentUpr?.id,
    })
    router.push('/')
  } catch (error) {
    console.error('Error saving initial upr:', error)
    toast.error('Gagal Menyimpan UPR', {
      description:
        error.message || 'Terjadi kesalahan saat menyimpan UPR baru.',
    })
  } finally {
    isSaving.value = false
  }
}
</script>
