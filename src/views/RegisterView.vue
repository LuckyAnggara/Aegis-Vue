<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner' // Akan dikonversi nanti
import AppLogo from '@/components/global/AppLogo.vue' // Akan dikonversi nanti
import { Button } from '@/components/ui/button' // Shadcn UI Vue
import { Input } from '@/components/ui/input' // Shadcn UI Vue
import { Label } from '@/components/ui/label' // Shadcn UI Vue
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card' // Shadcn UI Vue
import { Loader2, UserPlus } from 'lucide-vue-next' // Ganti dari lucide-react ke lucide-vue-next

// Import Appwrite auth functions
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
} from '@/services/authService'

const email = ref('anggara@gmail.com')
const password = ref('12345678') // Password minimal 8 karakter
const confirmPassword = ref('12345678') // Sama dengan password untuk testing
const isLoading = ref(false)
const router = useRouter()

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    toast.error('Registrasi Gagal', {
      description: 'Password dan konfirmasi password tidak cocok.',
    })
    return
  }
  isLoading.value = true
  try {
    // Appwrite create account will also handle display name if passed
    await registerWithEmailPassword(
      email.value,
      password.value,
      email.value.split('@')[0]
    )
    loginWithEmailPassword(email.value, password.value) // Auto-login after registration
    toast.success('Akun Berhasil Dibuat', {
      description: 'Silakan lengkapi profil Anda di halaman Pengaturan.',
    })
    router.push('/') // Akan diarahkan ke /profile-setup oleh guard/layout jika profil belum lengkap
  } catch (error) {
    const errorMessage =
      error.message || 'Terjadi kesalahan pada proses registrasi.'
    console.error('Kesalahan pada proses registrasi:', errorMessage)
    let userMessage = 'Terjadi kesalahan pada proses registrasi.'

    if (error.code) {
      // Appwrite errors might have a code
      switch (error.code) {
        case 409: // Conflict: Email already exists
          userMessage = 'Alamat email ini sudah terdaftar.'
          break
        case 400: // Bad Request: Weak password or invalid email format
          userMessage =
            'Password terlalu lemah (minimal 8 karakter) atau format email tidak valid.'
          break
        // Tambahkan case lain jika ada kode error spesifik Appwrite yang relevan
        default:
          userMessage = `Registrasi Akun Gagal: ${errorMessage}`
      }
    } else {
      userMessage = `Registrasi Gagal: ${errorMessage}`
    }

    toast('Registrasi Gagal', {
      description: userMessage,
      duration: 7000,
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen flex-col items-center justify-center bg-background p-4"
  >
    <Card class="w-full max-w-sm shadow-xl">
      <CardHeader class="space-y-1 text-center">
        <AppLogo class="mx-auto h-12 w-12 text-primary mb-2" />
        <CardTitle class="text-2xl">Daftar Akun RiskWise</CardTitle>
        <CardDescription>Buat akun baru untuk memulai.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="space-y-1.5">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.com"
              v-model="email"
              required
              :disabled="isLoading"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              v-model="password"
              required
              :disabled="isLoading"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              v-model="confirmPassword"
              required
              :disabled="isLoading"
            />
          </div>
          <Button type="submit" class="w-full" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            <UserPlus v-else class="mr-2 h-4 w-4" />
            Daftar
          </Button>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col items-center space-y-2 text-xs">
        <router-link to="/login" class="text-primary hover:underline">
          Sudah punya akun? Masuk di sini
        </router-link>
        <p class="text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} RiskWise. Aplikasi Manajemen
          Risiko.
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
