// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth' // Import auth store
import routes from './routes'
import { watch } from 'vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  console.log(`[Guard] Navigating to: ${String(to.name || to.path)}`)
  console.log(
    `[Guard] Initial store state: isLoading=${authStore.authLoading}, isAuthenticated=${authStore.isAuthenticated}, isProfileComplete=${authStore.isProfileComplete}`
  )

  // 1. Tunggu hingga proses loading inisial dari authStore selesai
  // Ini penting agar kita memiliki state auth yang akurat sebelum membuat keputusan.
  if (authStore.authLoading) {
    console.log('[Guard] Waiting for authStore.authLoading to become false...')
    await new Promise((resolve) => {
      // Cek langsung jika isLoading sudah false, karena watch dengan immediate:false
      // tidak akan langsung trigger jika nilai awal sudah sesuai kondisi.
      if (!authStore.authLoading) {
        console.log(
          '[Guard] authStore.authLoading was already false before watch setup.'
        )
        resolve(undefined)
        return
      }

      const unwatch = watch(
        () => authStore.authLoading,
        (loading) => {
          if (!loading) {
            console.log(
              '[Guard] authStore.authLoading changed to false via watch.'
            )
            unwatch() // Hentikan watcher setelah kondisi terpenuhi
            resolve(undefined)
          }
        },
        { immediate: false } // immediate: false berarti watcher hanya aktif saat nilai berubah
      )
    })
  }

  // Setelah loading selesai, dapatkan state terbaru dari store
  const isAuthenticated = authStore.isAuthenticated
  const isProfileComplete = authStore.isProfileComplete // Getter yang sudah ada

  console.log(
    `[Guard] After loading: isAuthenticated=${isAuthenticated}, isProfileComplete=${isProfileComplete}`
  )
  console.log(to.name)

  // Logika Navigasi Utama:

  // A. Rute yang memerlukan autentikasi (`to.meta.requiresAuth === true`)
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      // 1. Jika rute butuh auth, TAPI pengguna TIDAK terotentikasi
      console.log(
        '[Guard] Decision: Route requires auth, user NOT authenticated. Redirecting to /login.'
      )
      next({ name: 'login', query: { redirect: to.fullPath } })
      return // Penting untuk menghentikan eksekusi guard lebih lanjut
    }
    // Pengguna terotentikasi, sekarang cek kelengkapan profil jika rute memerlukannya
    if (to.meta.requiresProfileComplete && !isProfileComplete) {
      console.log(to.meta.requiresProfileComplete)
      // 2. Jika rute butuh profil lengkap, TAPI profil BELUM lengkap
      // DAN pengguna tidak sedang menuju halaman untuk melengkapi profilnya (`profile-setup` atau `settings`)
      if (to.name !== 'profile-setup' && to.name !== 'settings') {
        console.log(
          '[Guard] Decision: Route requires complete profile, profile INCOMPLETE. Redirecting to /profile-setup.'
        )
        next({ name: 'profile-setup' })
        return
      }
    }
  }

  // B. Rute yang hanya untuk tamu/belum login (`to.meta.requiresGuest === true`)
  if (to.meta.requiresGuest && isAuthenticated) {
    // 3. Jika rute hanya untuk tamu, TAPI pengguna SUDAH terotentikasi
    console.log(
      '[Guard] Decision: Route requires guest, user IS authenticated. Redirecting to /home.'
    )
    next({ name: 'dashboard' }) // Ganti 'home' dengan nama rute dashboard default Anda
    return
  }

  // C. Kasus Khusus: Akses ke halaman setup profil padahal profil sudah lengkap
  if (isAuthenticated && isProfileComplete && to.name === 'profile-setup') {
    // 4. Jika pengguna terotentikasi, profil SUDAH lengkap, TAPI mencoba akses /profile-setup
    console.log(
      '[Guard] Decision: User authenticated & profile complete, trying to access /profile-setup. Redirecting to /home.'
    )
    next({ name: 'dashboard' }) // Ganti 'home' dengan nama rute dashboard default Anda
    return
  }
  // E. Kasus Khusus: Pengguna mencoba mengakses halaman login padahal sudah login & profil lengkap
  if (isAuthenticated && isProfileComplete && to.name === 'login') {
    console.log(
      '[Guard] Decision: User already authenticated & profile complete, trying to access /login. Redirecting to /home.'
    )
    next({ name: 'dashboard' }) // atau dashboard sesuai rute kamu
    return
  }

  if (isAuthenticated && !isProfileComplete && to.name === 'login') {
    console.log(
      '[Guard] Decision: User already authenticated & profile incomplete, trying to access /login. Redirecting to /profile-setup.'
    )
    next({ name: 'profile-setup' }) // atau rute yang sesuai untuk melengkapi profil
    return
  }

  // D. Jika semua kondisi di atas tidak terpenuhi, izinkan navigasi
  console.log('[Guard] Decision: Navigation allowed to target route.')
  next()
})

export default router
