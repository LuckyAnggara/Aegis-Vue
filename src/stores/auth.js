// src/stores/auth.js
import { defineStore } from 'pinia'
import {
  getCurrentAccount,
  getAppUser,
  updateAppUserProfileData,
  logout,
} from '@/services/authService'
import { getUprById } from '@/services/uprService'

import { client } from '@/lib/appwrite/config' // Impor client Appwrite
import { useAppStore } from './app' // Impor useAppStore untuk reset data
import { useUprStore } from './upr'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: null, // Objek pengguna dari Appwrite Account Service
    appUser: null,
    uprUser: null, // Objek pengguna dari koleksi 'users' di Appwrite Database
    authLoading: true,
    profileLoading: false,
    isProfileComplete: false,
  }),
  getters: {
    isAuthenticated(state) {
      console.log(
        '[authStore Getter] isAuthenticated called. currentUser is:',
        state.currentUser === null
          ? 'null'
          : state.currentUser === undefined
          ? 'undefined'
          : 'object'
      )
      return !!state.currentUser
    },
    // isProfileComplete(state) {
    //   if (!state.appUser) return false
    //   return !!(
    //     state.appUser.display_name &&
    //     state.appUser.upr_id &&
    //     state.appUser.active_period &&
    //     state.appUser.available_periods?.length > 0 &&
    //     state.appUser.risk_appetite !== null &&
    //     state.appUser.monitoring_settings !== undefined
    //   )
    // },
  },
  actions: {
    async initializeAuth() {
      console.log('[AuthStore] initializeAuth: Starting...')
      const uprStore = useUprStore()

      if (this.currentUser && this.appUser && this.uprUser) {
        console.log(
          '[AuthStore] Already initialized with currentUser, appUser, and uprUser.'
        )

        return // Sudah diinisialisasi
      }
      console.log('[AuthStore] No currentUser, fetching from Appwrite...')
      this.authLoading = true
      try {
        const appwriteAccount = await getCurrentAccount() // Mendapatkan sesi pengguna saat ini dari Appwrite
        this.currentUser = appwriteAccount
          ? {
              uid: appwriteAccount.$id, // Appwrite User ID
              email: appwriteAccount.email,
              displayName: appwriteAccount.name,
              photoURL: null, // Appwrite tidak menyediakan photoURL langsung dari Account service
            }
          : null

        if (this.currentUser) {
          await this.fetchAppUser(this.currentUser.uid)
        } else {
          this.appUser = null
          this.isProfileComplete = false
          useAppStore().resetAllData() // Reset store jika tidak ada user
        }
      } catch (error) {
        console.error('[AuthStore] initializeAuth: Error fetching user:', error)
        this.currentUser = null
        this.appUser = null
        this.isProfileComplete = false
        useAppStore().resetAllData()
      } finally {
        this.authLoading = false
      }
    },

    async fetchAppUser(uid) {
      this.profileLoading = true
      try {
        const userDoc = await getAppUser(uid) // Fungsi ini akan mencari dokumen di koleksi 'users'
        this.appUser = userDoc
        const uprDoc = await getUprById(userDoc.uprId) // Ambil UPR terkait jika ada
        this.uprUser = uprDoc
        this.isProfileComplete = this.determineProfileCompleteness(userDoc)
        console.log(
          '[AuthStore] fetchAppUser: Profile complete status:',
          this.isProfileComplete
        )

        if (
          userDoc &&
          userDoc.uid &&
          userDoc.activePeriod &&
          this.isProfileComplete
        ) {
          // Trigger initial data fetch dari useAppStore
          useAppStore().triggerInitialDataFetch(
            userDoc.uid,
            userDoc.activePeriod
          )
        } else if (userDoc && !this.isProfileComplete) {
          console.log(
            '[AuthStore] Profile incomplete, not triggering initial data fetch yet.'
          )
          useAppStore().resetAllData()
        }
      } catch (error) {
        console.error(
          '[AuthStore] fetchAppUser: Failed to fetch AppUser from database:',
          error
        )
        this.appUser = null
        this.isProfileComplete = false
        useAppStore().resetAllData()
      } finally {
        this.profileLoading = false
      }
    },

    determineProfileCompleteness(userProfile) {
      if (!userProfile) return false
      return !!userProfile.uprId
    },

    async refreshAppUser() {
      if (this.currentUser) {
        await this.fetchAppUser(this.currentUser.uid)
      } else {
        this.appUser = null
        this.isProfileComplete = false
        useAppStore().resetAllData()
      }
    },

    async updateUserProfile(profileData) {
      if (!this.currentUser) {
        throw new Error('User is not authenticated')
      }
      this.profileLoading = true
      try {
        const updatedUser = await updateAppUserProfileData(
          this.currentUser.uid,
          profileData
        )
        this.appUser = updatedUser
        this.isProfileComplete = this.determineProfileCompleteness(updatedUser)
        console.log(
          '[AuthStore] User profile updated successfully:',
          updatedUser
        )
        return updatedUser
      } catch (error) {
        console.error('[AuthStore] Error updating user profile:', error)
        throw error
      } finally {
        this.profileLoading = false
      }
    },

    async logoutUser() {
      try {
        await logout() // Panggil fungsi logout dari authService
        this.currentUser = null
        this.appUser = null
        this.isProfileComplete = false
        useAppStore().resetAllData() // Reset semua data di store lain
        return true
      } catch (error) {
        console.error('[AuthStore] Error during logout:', error)
        throw error
      }
    },
  },
})

// Listener Appwrite Auth State
client.subscribe('account', (response) => {
  const authStore = useAuthStore()
  if (response.events.includes('users.*.sessions.*.create')) {
    // User logged in
    console.log('Appwrite: User logged in, fetching account data...')
    authStore.initializeAuth()
  } else if (response.events.includes('users.*.sessions.*.delete')) {
    // User logged out
    console.log('Appwrite: User logged out, resetting auth store...')
    authStore.logoutUser() // Atau panggil logout dari sini jika Anda ingin membersihkan sesi Appwrite internal
  }
})
