<script setup>
import { ref, onMounted } from 'vue'
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
import { Loader2, LogIn } from 'lucide-vue-next' // Ganti dari lucide-react ke lucide-vue-next

// Import Appwrite auth functions
import { loginWithEmailPassword, loginWithGoogle } from '@/services/authService'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  isLoading.value = true
  try {
    await loginWithEmailPassword(email.value, password.value)
    toast('Login Berhasil', { description: 'Selamat datang kembali!' })
    router.push('/')
  } catch (error) {
    const errorMessage =
      error.message || 'Terjadi kesalahan. Silakan coba lagi.'
    console.error('Kesalahan pada proses login email/password:', errorMessage)
    let toastDescription = 'Terjadi kesalahan. Silakan coba lagi.'

    if (error.code) {
      // Appwrite errors might have a code
      switch (error.code) {
        case 400:
          toastDescription = 'Email atau password salah.'
          break
        case 401:
          toastDescription = 'Email atau password salah.'
          break
        case 404:
          toastDescription = 'Akun tidak ditemukan.'
          break
        case 403:
          toastDescription = 'Akun pengguna ini telah dinonaktifkan.'
          break // Example Appwrite code
        default:
          toastDescription = `Login gagal: ${errorMessage}`
      }
    } else {
      toastDescription = errorMessage
    }
    toast.error('Login Gagal', {
      description: toastDescription,
      duration: 7000,
    })
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  isGoogleLoading.value = true
  try {
    await loginWithGoogle() // Appwrite akan melakukan redirect
    // Setelah redirect, AuthContext (yang akan jadi Pinia store) akan mendeteksi sesi dan mengarahkan
  } catch (error) {
    const errorMessage =
      error.message || 'Terjadi kesalahan. Silakan coba lagi.'
    console.error('Kesalahan pada proses login Google:', errorMessage)
    let toastDescription = 'Terjadi kesalahan. Silakan coba lagi.'

    if (error.code) {
      // Appwrite errors might have a code
      switch (error.code) {
        case 400:
          toastDescription =
            'Permintaan tidak valid (contoh: URL redirect tidak terdaftar).'
          break
        case 401:
          toastDescription = 'Sesi Google dibatalkan atau gagal.'
          break
        default:
          toastDescription = `Login Google gagal: ${errorMessage}`
      }
    } else {
      toastDescription = errorMessage
    }
    toast.error('Login Google Gagal', {
      description: toastDescription,
      duration: 7000,
    })
  } finally {
    isGoogleLoading.value = false
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
        <CardTitle class="text-2xl">Masuk ke RiskWise</CardTitle>
        <CardDescription>Masuk dengan akun Anda atau Google.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-1.5">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@contoh.com"
              v-model="email"
              required
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              v-model="password"
              required
              :disabled="isLoading || isGoogleLoading"
            />
          </div>
          <Button
            type="submit"
            class="w-full"
            :disabled="isLoading || isGoogleLoading"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            <LogIn v-else class="mr-2 h-4 w-4" />
            Masuk dengan Email
          </Button>
        </form>

        <div class="relative my-4">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground"> Atau </span>
          </div>
        </div>

        <Button
          variant="outline"
          class="w-full"
          @click="handleGoogleSignIn"
          :disabled="isGoogleLoading || isLoading"
        >
          <svg viewBox="0 0 48 48" class="mr-2 h-5 w-5">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Masuk dengan Google
        </Button>
      </CardContent>
      <CardFooter class="flex flex-col items-center space-y-2 text-xs">
        <router-link to="/register" class="text-primary hover:underline">
          Belum punya akun? Daftar di sini
        </router-link>
        <p class="text-muted-foreground">
          &copy; {{ new Date().getFullYear() }} RiskWise. Aplikasi Manajemen
          Risiko.
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
