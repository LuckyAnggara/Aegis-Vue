<template>
  <div class="flex h-screen bg-background text-foreground">
    <aside class="hidden md:flex md:flex-col w-64 border-r bg-muted/40">
      <div class="p-4 border-b">
        <router-link to="/" class="flex items-center gap-2">
          <AppLogo class="h-8 w-8 text-primary" />
          <span class="font-semibold text-lg text-primary">RiskWise</span>
        </router-link>
      </div>
      <nav class="flex-1 overflow-y-auto p-2">
        <SidebarNav
          v-if="authStore.isAuthenticated"
          :profile-incomplete="!authStore.isProfileComplete"
          @item-click="() => {}"
        />
      </nav>
      <div class="p-2 mt-auto border-t text-xs text-muted-foreground">
        &copy; {{ new Date().getFullYear() }} RiskWise
      </div>
    </aside>

    <Sheet :open="mobileSidebarOpen" @update:open="setMobileSidebarOpen">
      <SheetTrigger as-child> </SheetTrigger>
      <SheetContent side="left" class="p-0 pt-10 w-72 flex flex-col">
        <div class="p-4 border-b">
          <router-link
            to="/"
            class="flex items-center gap-2"
            @click="setMobileSidebarOpen(false)"
          >
            <AppLogo class="h-8 w-8 text-primary" />
            <span class="font-semibold text-lg text-primary">RiskWise</span>
          </router-link>
        </div>
        <nav class="flex-1 overflow-y-auto p-2">
          <SidebarNav
            v-if="authStore.isAuthenticated"
            :profile-incomplete="!authStore.isProfileComplete"
            @item-click="setMobileSidebarOpen(false)"
          />
        </nav>
        <div class="p-2 mt-auto border-t text-xs text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} RiskWise
        </div>
      </SheetContent>
    </Sheet>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header
        class="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6"
      >
        <Button
          variant="ghost"
          size="icon"
          class="md:hidden"
          @click="setMobileSidebarOpen(true)"
        >
          <Menu class="h-6 w-6" />
          <span class="sr-only">Buka menu</span>
        </Button>

        <div class="hidden md:flex items-center gap-2 ml-auto mr-4">
          <div v-if="authStore.appUser" class="text-sm text-muted-foreground">
            <span class="font-semibold">UPR:</span>
            {{ authStore.appUser.display_name || '...' }} |
            <span class="font-semibold">Periode:</span>
            <span
              :class="{
                'text-orange-500':
                  !authStore.appUser.active_period &&
                  authStore.isProfileComplete,
              }"
            >
              {{
                authStore.appUser.active_period ||
                (authStore.isProfileComplete ? 'Belum Diatur' : '...')
              }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon">
                <Sun v-if="theme === 'light'" class="h-[1.2rem] w-[1.2rem]" />
                <Moon v-else class="h-[1.2rem] w-[1.2rem]" />
                <span class="sr-only">Ganti tema</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="setTheme('light')"
                >Terang</DropdownMenuItem
              >
              <DropdownMenuItem @click="setTheme('dark')"
                >Gelap</DropdownMenuItem
              >
              <DropdownMenuItem @click="setTheme('system')"
                >Sistem</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu v-if="authStore.currentUser && authStore.appUser">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="rounded-full">
                <Avatar class="h-8 w-8">
                  <AvatarImage
                    :src="
                      authStore.appUser.photo_url ||
                      authStore.currentUser.user_metadata?.avatar_url ||
                      'https://placehold.co/100x100.png'
                    "
                    :alt="authStore.appUser.display_name || 'User'"
                  />
                  <AvatarFallback>{{
                    (authStore.appUser.display_name || 'U')
                      .substring(0, 2)
                      .toUpperCase()
                  }}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{{
                authStore.appUser.display_name || authStore.currentUser.email
              }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <router-link to="/settings" custom v-slot="{ navigate }">
                <DropdownMenuItem @click="navigateAndCloseMobileMenu(navigate)">
                  <SettingsIcon class="mr-2 h-4 w-4" />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
              </router-link>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="handleLogoutAndCloseMobileMenu">
                <LogOut class="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 overflow-y-auto">
        <div
          v-if="
            authStore.appUser &&
            !authStore.appUser.active_period &&
            authStore.isProfileComplete
          "
          class="md:hidden text-sm text-muted-foreground mb-4 text-center"
        >
          <span class="font-semibold">UPR:</span>
          {{ authStore.appUser.display_name || '...' }} |
          <span class="font-semibold">Periode:</span>
          <span class="text-orange-500">Belum Diatur</span>
        </div>
        <Alert
          v-if="
            authStore.isAuthenticated &&
            !authStore.isProfileComplete &&
            route.name !== 'settings' &&
            route.name !== 'profile-setup'
          "
          variant="destructive"
          class="mb-4"
        >
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>Profil Belum Lengkap!</AlertTitle>
          <AlertDescription>
            Harap lengkapi profil Anda di halaman
            <router-link
              to="/settings"
              class="font-semibold underline hover:text-destructive-foreground/80 ml-1"
              @click="setMobileSidebarOpen(false)"
            >
              Pengaturan </router-link
            >.
          </AlertDescription>
        </Alert>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLogo from '@/components/global/AppLogo.vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'vue-sonner'
import {
  LogOut,
  Settings as SettingsIcon,
  Sun,
  Moon,
  AlertTriangle,
  Menu,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const mobileSidebarOpen = ref(false)
const setMobileSidebarOpen = (value) => {
  mobileSidebarOpen.value = value
}

// --- Theme Logic ---
const theme = ref('system')
const applyUserTheme = (themeToApply) => {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  if (themeToApply === 'system') {
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
    root.classList.add(systemPrefersDark ? 'dark' : 'light')
  } else {
    root.classList.add(themeToApply)
  }
}
const setTheme = (newTheme) => {
  theme.value = newTheme
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme', newTheme)
    applyUserTheme(newTheme)
  }
}
onMounted(() => {
  if (typeof window !== 'undefined') {
    const storedTheme = localStorage.getItem('theme') || 'system'
    setTheme(storedTheme) // This will also call applyUserTheme

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (theme.value === 'system') {
          applyUserTheme('system')
        }
      })
  }
})
// --- End Theme Logic ---

function navigateAndCloseMobileMenu(navigateFn) {
  navigateFn()
  setMobileSidebarOpen(false)
}
async function handleLogoutAndCloseMobileMenu() {
  setMobileSidebarOpen(false)
  await handleLogout()
}
async function handleLogout() {
  try {
    await authStore.logout()
    toast({
      title: 'Keluar Berhasil',
      description: 'Anda telah berhasil keluar.',
    })
  } catch (error) {
    console.error('Error logging out:', error)
    toast({
      title: 'Gagal Keluar',
      description: 'Terjadi kesalahan saat keluar.',
      variant: 'destructive',
    })
  }
}
</script>
