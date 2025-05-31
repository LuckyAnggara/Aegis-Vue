// src/stores/auth.js
import { defineStore } from 'pinia'
import {
  getUprById,
  getUprs,
  addDocUpr,
  updateUpr,
  deleteUpr,
} from '@/services/uprService' // authService menggantikan userService
import { useAuthStore } from './auth' // Impor useAuthStore untuk akses pengguna saat ini

export const useUprStore = defineStore('upr', {
  state: () => ({
    uprs: [], // Array untuk menyimpan daftar UPR
    uprLoading: true, // Status loading untuk UPR
    currentUpr: null, // UPR yang sedang aktif
    isUprComplete: false, // Status apakah UPR sudah lengkap
  }),
  actions: {
    async fetchUprs(userId, period) {
      this.uprLoading = true
      try {
        const uprs = await getUprs(userId, period)
        this.uprs = uprs
        console.log('[UprStore] Fetched UPRs:', uprs)
      } catch (error) {
        console.error('[UprStore] Error fetching UPRs:', error)
        throw error
      } finally {
        this.uprLoading = false
      }
    },
    async fetchCurrentUpr(uprId) {
      this.uprLoading = true
      try {
        const upr = await getUprById(uprId)
        this.currentUpr = upr
        this.isUprComplete = !!(
          upr.name &&
          upr.description &&
          upr.activePeriod &&
          upr.availablePeriods?.length > 0 &&
          upr.riskAppetite !== null &&
          upr.monitoringSettings !== undefined
        )
        console.log('[UprStore] Current UPR fetched:', upr)
      } catch (error) {
        console.error('[UprStore] Error fetching current UPR:', error)
        throw error
      } finally {
        this.uprLoading = false
      }
    },
    async updateUpr(uprData) {
      this.uprLoading = true
      try {
        const updatedUpr = await updateUpr(uprData, this.currentUpr.id)
        const index = this.uprs.findIndex((upr) => upr.id === updatedUpr.id)
        if (index !== -1) {
          this.uprs[index] = updatedUpr
        }
        this.currentUpr = updatedUpr // Update current UPR
        console.log('[UprStore] UPR updated successfully:', updatedUpr)
      } catch (error) {
        console.error('[UprStore] Error updating UPR:', error)
        throw error
      } finally {
        this.uprLoading = false
      }
    },
    async deleteUpr() {
      this.uprLoading = true
      try {
        await deleteUpr(this.currentUpr.id)
        this.uprs = this.uprs.filter((upr) => upr.id !== this.currentUpr.id)
        this.currentUpr = null // Reset current UPR after deletion
        console.log('[UprStore] UPR deleted successfully')
      } catch (error) {
        console.error('[UprStore] Error deleting UPR:', error)
        throw error
      } finally {
        this.uprLoading = false
      }
    },
    async addUpr(uprData) {
      const authStore = useAuthStore() // Ambil instance authStore
      this.uprLoading = true
      const userId = authStore.currentUser.uid
      try {
        const newUpr = await addDocUpr(uprData, userId)
        this.uprs.push(newUpr)
        this.currentUpr = newUpr // Set the newly added UPR as current
      } catch (error) {
        throw error
      } finally {
        this.uprLoading = false
      }
    },
  },
})
