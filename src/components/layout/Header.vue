<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6"
  >
    <div class="flex items-center gap-2">
      <div v-if="authStore.uprUser" class="text-sm text-muted-foreground">
        <span class="font-semibold">UPR:</span>
        {{ authStore.uprUser.name }}
      </div>
      <div class="text-sm text-muted-foreground">
        <span class="font-semibold">Periode:</span>
        {{ authStore.uprUser.activePeriod || '...' }}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <DarkModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="rounded-full">
            <Avatar class="h-8 w-8">
              <AvatarFallback>{{
                (
                  authStore.appUser?.display_name ||
                  authStore.currentUser?.email ||
                  'RW'
                )
                  .substring(0, 2)
                  .toUpperCase()
              }}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{{
            authStore.appUser?.display_name || authStore.currentUser?.email
          }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem as-child>
            <router-link to="/settings">
              <span>Pengaturan</span>
            </router-link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <span>Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// Impor ikon lucide-vue-next jika diperlukan
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner' // Sesuaikan path jika berbeda
import { useUprStore } from '@/stores/upr'
import DarkModeToggle from './DarkModeToggle.vue'

const authStore = useAuthStore()
const uprStore = useUprStore() // Jika ada store lain yang perlu diakses
const router = useRouter()

const handleLogout = async () => {
  try {
    await authStore.logoutUser()
    toast.success('Keluar Berhasil', {
      description: 'Anda telah berhasil keluar.',
    })
    router.push('/login')
  } catch (error) {
    console.error('Error logging out:', error)
    toast.error('Gagal Keluar', {
      description: 'Terjadi kesalahan saat keluar.',
    })
  }
}
</script>
