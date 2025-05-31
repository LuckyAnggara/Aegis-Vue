<script setup>
import { onMounted, computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app' // Store utama aplikasi
import { toast } from 'vue-sonner' // Akan dikonversi nanti
import { Toaster } from '@/components/ui/sonner' // Shadcn UI Vue
import { Loader2 } from 'lucide-vue-next' // Ikon loader dari Lucide
import AppLayout from '@/components/layout/AppLayout.vue' // Akan dikonversi nanti

const authStore = useAuthStore()
const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

const currentUprDisplay = computed(
  () => authStore.appUser?.displayName || 'UPR...'
)
const currentPeriodDisplay = computed(
  () => authStore.appUser?.activePeriod || '...'
)

const isAuthPage = computed(() => ['login', 'register'].includes(route.name))
const isSetupPage = computed(() => route.name === 'profile-setup')

onMounted(async () => {
  // Inisialisasi autentikasi saat aplikasi dimuat
  await authStore.initializeAuth()
})
</script>

<template>
  <div
    v-if="
      authStore.authLoading ||
      (authStore.currentUser && !authStore.appUser && !authStore.authLoading)
    "
  >
    <div
      class="flex flex-col items-center justify-center h-screen bg-background"
    >
      <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
      <p class="text-xl text-muted-foreground">
        {{
          authStore.authLoading && !authStore.currentUser
            ? 'Memverifikasi sesi...'
            : 'Memuat data profil pengguna...'
        }}
      </p>
    </div>
  </div>
  <div v-else-if="!authStore.currentUser && (isAuthPage || isSetupPage)">
    <RouterView />
  </div>
  <div v-else-if="!authStore.currentUser && !isAuthPage && !isSetupPage">
    <div
      class="flex flex-col items-center justify-center h-screen bg-background"
    >
      <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
      <p class="text-xl text-muted-foreground">
        Mengarahkan ke halaman login...
      </p>
    </div>
  </div>
  <div
    v-else-if="
      authStore.currentUser && !authStore.isProfileComplete && isSetupPage
    "
  >
    <RouterView />
  </div>
  <div
    v-else-if="
      authStore.currentUser && !authStore.isProfileComplete && !isSetupPage
    "
  >
    <div
      class="flex flex-col items-center justify-center h-screen bg-background"
    >
      <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
      <p class="text-xl text-muted-foreground">
        Profil belum lengkap, mengarahkan...
      </p>
    </div>
  </div>
  <div v-else>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
  <!-- <div>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div> -->
  <Toaster />
</template>
