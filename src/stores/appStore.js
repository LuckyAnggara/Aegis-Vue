// src/stores/appStore.js
import { defineStore } from 'pinia'
import { Query, ID } from 'appwrite' // Permission, Role jika diperlukan untuk createDocument
import { databases } from '@/lib/appwriteClient'
import { useAuthStore } from './authStore'
import {
  getGoalById,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
} from '@/services/goalService'

const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const GOALS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_GOALS_COLLECTION_ID
const POTENTIAL_RISKS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_POTENTIAL_RISKS_COLLECTION_ID
// const RISK_CAUSES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RISK_CAUSES_COLLECTION_ID;
// const CONTROL_MEASURES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CONTROL_MEASURES_COLLECTION_ID;

export const useAppStore = defineStore('app', {
  state: () => ({
    goals: [],
    goalsLoading: false,

    /** @type {PotentialRisk[]} */
    potentialRisks: [],
    potentialRisksLoading: false,

    /** @type {RiskCause[]} */
    riskCauses: [],
    riskCausesLoading: false,

    /** @type {ControlMeasure[]} */
    controlMeasures: [],
    controlMeasuresLoading: false,

    dataFetchedForPeriod: null,
    // ... state lainnya
  }),

  getters: {
    getGoalById: (state) => (id) => {
      return state.goals.find((g) => g.id === id || g.$id === id) // Appwrite menggunakan $id
    },
    getPotentialRisksByGoalId: (state) => (goalId) => {
      return state.potentialRisks.filter((pr) => pr.goal_id === goalId)
    },
    getPotentialRiskById: (state) => (id) => {
      return state.potentialRisks.find((pr) => pr.id === id || pr.$id === id)
    },
    getRiskCausesByPotentialRiskId: (state) => (potentialRiskId) => {
      return state.riskCauses
        .filter((rc) => rc.potential_risk_id === potentialRiskId)
        .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
    },
    getRiskCauseById: (state) => (id) =>
      state.riskCauses.find((rc) => rc.id === id),
    // ... getter lain
  },

  actions: {
    _getCurrentUprIdAndPeriod() {
      const authStore = useAuthStore()
      const uprId = authStore.uprUser?.$id
      const period = authStore.uprUser?.activePeriod
      if (!uprId || !period) {
        console.warn(
          '[appStore] UPR ID atau Periode aktif tidak tersedia untuk operasi store.'
        )
        return null
      }
      return { uprId, period }
    },

    // // --- GOALS ACTIONS (dari sebelumnya, pastikan sudah ada) ---
    // async _generateGoalCode(name, uprId, period) {
    //   // ... implementasi dari sebelumnya ...
    //   if (!uprId || !period) return 'S1'
    //   try {
    //     const response = await databases.listDocuments(
    //       APPWRITE_DATABASE_ID,
    //       GOALS_COLLECTION_ID,
    //       [
    //         Query.equal('uprId', uprId),
    //         Query.equal('period', period),
    //         Query.select(['code']),
    //         Query.limit(5000),
    //       ]
    //     )
    //     const existingGoalsCodes = response.documents.map((doc) => doc.code)
    //     const firstLetter = name.charAt(0).toUpperCase()
    //     const prefix = /^[A-Z]$/.test(firstLetter) ? firstLetter : 'S'
    //     let maxNum = 0
    //     existingGoalsCodes.forEach((code) => {
    //       if (code && typeof code === 'string' && code.startsWith(prefix)) {
    //         const numPart = parseInt(code.substring(prefix.length), 10)
    //         if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart
    //       }
    //     })
    //     return `${prefix}${maxNum + 1}`
    //   } catch (error) {
    //     console.error('Error generating goal code (Appwrite):', error)
    //     return `${name.charAt(0).toUpperCase() || 'S'}1`
    //   }
    // },
    async fetchGoals() {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) {
        this.goals = []
        this.goalsLoading = false
        return
      }
      this.goalsLoading = true
      try {
        const response = await getGoals(context.uprId, context.period)
        this.goals = response.documents.map((doc) => ({
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }))
        this.dataFetchedForPeriod = context.period
        // Setelah goals, fetch potential risks untuk semua goals yang aktif
        await this.fetchPotentialRisksForAllCurrentGoals()
      } catch (error) {
        console.error('Error fetching goals from Appwrite:', error)
        this.goals = []
      } finally {
        this.goalsLoading = false
      }
    },
    async addGoal(goalData) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      const newCode = await this._generateGoalCode(
        goalData.name,
        context.uprId,
        context.period
      )
      const goalToInsert = {
        ...goalData,
        uprId: context.uprId,
        period: context.period,
        code: newCode,
      }
      try {
        const doc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          GOALS_COLLECTION_ID,
          ID.unique(),
          goalToInsert
        )
        const newGoal = {
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }
        this.goals.push(newGoal)
        this.goals.sort((a, b) =>
          (a.code || '').localeCompare(b.code || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        )
        return newGoal
      } catch (error) {
        console.error('Error adding goal:', error)
        throw error
      }
    },
    async updateGoal(goalId, updatedData) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      try {
        const doc = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          GOALS_COLLECTION_ID,
          goalId,
          updatedData
        )
        const updatedGoal = {
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }
        const index = this.goals.findIndex((g) => g.id === goalId)
        if (index !== -1) {
          this.goals[index] = updatedGoal
          this.goals.sort((a, b) =>
            (a.code || '').localeCompare(b.code || '', undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          )
        }
        return updatedGoal
      } catch (error) {
        console.error('Error updating goal:', error)
        throw error
      }
    },
    async deleteGoal(goalId) {
      // ... (implementasi deleteGoal, termasuk cascading delete jika memungkinkan)
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      console.warn(
        `[appStore] Deleting goal ${goalId}. Cascading delete for related PRs, RCs, CMs needs server-side logic or multiple client calls.`
      )
      try {
        // 1. Hapus semua Potential Risks terkait goal ini
        const relatedPRs = this.potentialRisks.filter(
          (pr) =>
            pr.goal_id === goalId &&
            pr.user_id === context.userId &&
            pr.period === context.period
        )
        for (const pr of relatedPRs) {
          await this.deletePotentialRisk(pr.id) // Ini akan menangani cascading ke RC dan CM
        }
        // 2. Hapus Goal itu sendiri
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          GOALS_COLLECTION_ID,
          goalId
        )
        this.goals = this.goals.filter((g) => g.id !== goalId)
      } catch (error) {
        console.error('Error deleting goal:', error)
        throw error
      }
    },
    async getGoalByIdFromDb(id) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) return null
      const goalFromState = this.goals.find((g) => g.id === id)
      if (goalFromState) return goalFromState
      try {
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          GOALS_COLLECTION_ID,
          id
        )
        if (doc.user_id === context.userId && doc.period === context.period) {
          return {
            id: doc.$id,
            ...doc,
            created_at: doc.$createdAt,
            updated_at: doc.$updatedAt,
          }
        }
        return null
      } catch (error) {
        if (error.code === 404) return null
        console.error(`Error fetching goal ${id} by ID:`, error)
        throw error
      }
    },

    // --- POTENTIAL RISKS ACTIONS ---
    /**
     * Membuat kode Potensi Risiko unik dalam konteks Sasaran, User, dan Periode.
     * Contoh: G1.PR1, G1.PR2
     */
    async _generatePotentialRiskCode(goalCode, userId, period, goalId) {
      if (!userId || !period || !goalId) return `${goalCode || 'G?'}.PR1`
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          [
            Query.equal('user_id', userId),
            Query.equal('period', period),
            Query.equal('goal_id', goalId),
            Query.select(['sequence_number']), // Asumsi ada field sequence_number
            Query.limit(5000),
            Query.orderDesc('sequence_number'), // Ambil yang terbesar dulu
          ]
        )
        const maxSeq =
          response.documents.length > 0
            ? response.documents[0].sequence_number
            : 0
        return `${goalCode || 'G?'}.PR${maxSeq + 1}`
      } catch (error) {
        console.error('Error generating potential risk code:', error)
        return `${goalCode || 'G?'}.PR1`
      }
    },

    async fetchPotentialRisksByGoalId(goalId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context || !goalId) {
        // Kosongkan hanya untuk goalId ini jika ada di state
        this.potentialRisks = this.potentialRisks.filter(
          (pr) => pr.goal_id !== goalId
        )
        return
      }
      const { userId, period } = context
      console.log(
        `[appStore] Fetching potential risks for goal: ${goalId}, user: ${userId}, period: ${period}`
      )
      this.potentialRisksLoading = true // Bisa juga loading per goalId
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          [
            Query.equal('goal_id', goalId),
            Query.equal('user_id', userId),
            Query.equal('period', period),
            Query.orderAsc('sequence_number'), // Urutkan berdasarkan sequence_number
          ]
        )
        const newPRs = response.documents.map((doc) => ({
          id: doc.$id,
          ...doc,
          // Map field Appwrite ke field yang diharapkan (jika berbeda)
          // Misal: identified_at dari Appwrite mungkin $createdAt
          identified_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }))
        // Gabungkan dengan yang sudah ada, hindari duplikasi, dan update jika ada
        const existingPRIdsForGoal = new Set(
          this.potentialRisks
            .filter((pr) => pr.goal_id === goalId)
            .map((pr) => pr.id)
        )
        const updatedPRsForGoal = newPRs.filter(
          (pr) => !existingPRIdsForGoal.has(pr.id)
        )

        this.potentialRisks = [
          ...this.potentialRisks.filter((pr) => pr.goal_id !== goalId), // Hapus PR lama untuk goal ini
          ...newPRs, // Tambahkan PR baru/terupdate
        ].sort(
          (a, b) =>
            a.goal_id.localeCompare(b.goal_id) ||
            a.sequence_number - b.sequence_number
        )

        console.log(
          `[appStore] Potential risks fetched for goal ${goalId}:`,
          newPRs.length
        )

        // Setelah PRs diambil, fetch Risk Causes untuk setiap PR baru/terupdate
        // for (const pr of newPRs) {
        //   await this.fetchRiskCausesByPotentialRiskId(pr.id);
        // }
      } catch (error) {
        console.error(
          `Error fetching potential risks for goal ${goalId}:`,
          error
        )
      } finally {
        this.potentialRisksLoading = false
      }
    },

    async fetchPotentialRisksForAllCurrentGoals() {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context || this.goals.length === 0) {
        this.potentialRisks = []
        return
      }
      console.log(
        '[appStore] Fetching all potential risks for current active goals.'
      )
      this.potentialRisksLoading = true
      let allFetchedPRs = []
      try {
        for (const goal of this.goals) {
          // Asumsi this.goals sudah terisi untuk user & period aktif
          const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            POTENTIAL_RISKS_COLLECTION_ID,
            [
              Query.equal('goal_id', goal.id), // atau goal.$id jika dari fetchGoals
              Query.equal('user_id', context.userId),
              Query.equal('period', context.period),
              Query.orderAsc('sequence_number'),
            ]
          )
          allFetchedPRs.push(
            ...response.documents.map((doc) => ({
              id: doc.$id,
              ...doc,
              identified_at: doc.$createdAt,
              updated_at: doc.$updatedAt,
            }))
          )
        }
        this.potentialRisks = allFetchedPRs.sort(
          (a, b) =>
            a.goal_id.localeCompare(b.goal_id) ||
            a.sequence_number - b.sequence_number
        )
        console.log(
          '[appStore] All potential risks fetched:',
          this.potentialRisks.length
        )

        // Selanjutnya fetch semua risk causes
        // await this.fetchRiskCausesForAllCurrentPotentialRisks();
      } catch (error) {
        console.error('Error fetching all potential risks:', error)
        this.potentialRisks = []
      } finally {
        this.potentialRisksLoading = false
      }
    },

    /**
     * @param {Omit<PotentialRisk, 'id' | 'identified_at' | 'user_id' | 'period' | 'sequence_number' | 'updated_at'>} prData
     * @param {string} goalId
     */
    async addPotentialRisk(prData, goalId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      const { userId, period } = context

      const parentGoal = this.goals.find(
        (g) => g.id === goalId && g.user_id === userId && g.period === period
      )
      if (!parentGoal)
        throw new Error('Sasaran induk tidak ditemukan atau tidak valid.')

      // Hitung sequence_number baru untuk PR dalam goal ini
      const existingPRsForGoal = this.potentialRisks.filter(
        (pr) => pr.goal_id === goalId
      )
      const newSequenceNumber =
        existingPRsForGoal.reduce(
          (max, pr) => Math.max(max, pr.sequence_number || 0),
          0
        ) + 1

      const prToInsert = {
        ...prData,
        goal_id: goalId,
        user_id: userId,
        period: period,
        sequence_number: newSequenceNumber,
        // identified_at akan diisi oleh $createdAt Appwrite
        // likelihood, impact, analysis_completed_at bisa null/default
        likelihood: null,
        impact: null,
        analysis_completed_at: null,
      }

      try {
        const doc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          ID.unique(),
          prToInsert
        )
        const newPR = {
          id: doc.$id,
          ...doc,
          identified_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }
        this.potentialRisks.push(newPR)
        // Urutkan lagi jika perlu, atau biarkan komponen yang mengurutkan
        this.potentialRisks.sort(
          (a, b) =>
            a.goal_id.localeCompare(b.goal_id) ||
            a.sequence_number - b.sequence_number
        )
        return newPR
      } catch (error) {
        console.error('Error adding potential risk to Appwrite:', error)
        throw error
      }
    },

    /**
     * @param {string} prId - $id dari dokumen Potential Risk
     * @param {Partial<Omit<PotentialRisk, 'id' | 'user_id' | 'period' | 'identified_at' | 'sequence_number' | 'updated_at'>>} prData
     */
    async updatePotentialRisk(prId, prData) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      // Tidak mengizinkan perubahan goal_id, user_id, period, sequence_number dari sini
      const { goal_id, user_id, period, sequence_number, ...dataToUpdate } =
        prData

      try {
        const doc = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          prId,
          dataToUpdate
        )
        const updatedPR = {
          id: doc.$id,
          ...doc,
          identified_at: doc.$createdAt, // Sebenarnya ini tidak berubah, tapi untuk konsistensi
          updated_at: doc.$updatedAt,
        }
        const index = this.potentialRisks.findIndex((p) => p.id === prId)
        if (index !== -1) {
          this.potentialRisks[index] = updatedPR
        }
        return updatedPR
      } catch (error) {
        console.error('Error updating potential risk in Appwrite:', error)
        throw error
      }
    },

    async deletePotentialRisk(prId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')

      console.warn(
        `[appStore] Deleting Potential Risk ${prId}. Cascading delete for its RiskCauses and their ControlMeasures needs to be handled.`
      )
      // TODO: Implement cascading delete for RiskCauses and ControlMeasures
      // 1. Fetch all RiskCauses for this prId
      // 2. For each RiskCause, fetch and delete all its ControlMeasures
      // 3. Delete all RiskCauses for this prId
      // 4. Delete the PotentialRisk itself

      try {
        // Contoh sederhana hanya delete PR, cascading harus diimplementasikan
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          prId
        )
        this.potentialRisks = this.potentialRisks.filter((p) => p.id !== prId)
        // Hapus juga risk causes dan control measures terkait dari state
        // const causesToDelete = this.riskCauses.filter(rc => rc.potential_risk_id === prId);
        // const causeIdsToDelete = causesToDelete.map(rc => rc.id);
        // this.riskCauses = this.riskCauses.filter(rc => rc.potential_risk_id !== prId);
        // this.controlMeasures = this.controlMeasures.filter(cm => !causeIdsToDelete.includes(cm.risk_cause_id));
      } catch (error) {
        console.error('Error deleting potential risk from Appwrite:', error)
        throw error
      }
    },

    async getPotentialRiskByIdFromDb(id) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) return null
      const prFromState = this.potentialRisks.find((pr) => pr.id === id)
      if (prFromState) return prFromState

      try {
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          POTENTIAL_RISKS_COLLECTION_ID,
          id
        )
        if (doc.user_id === context.userId && doc.period === context.period) {
          const mappedDoc = {
            id: doc.$id,
            ...doc,
            identified_at: doc.$createdAt,
            updated_at: doc.$updatedAt,
          }
          // Tambahkan ke state jika belum ada
          if (!this.potentialRisks.some((p) => p.id === mappedDoc.id)) {
            this.potentialRisks.push(mappedDoc)
          }
          return mappedDoc
        }
        return null
      } catch (error) {
        if (error.code === 404) return null
        console.error(`Error fetching potential risk ${id} by ID:`, error)
        throw error
      }
    },

    // --- RISK CAUSES ACTIONS ---
    /**
     * Membuat kode Penyebab Risiko unik dalam konteks Potensi Risiko.
     * Contoh: G1.PR1.C1
     */
    async _generateRiskCauseCode(
      potentialRiskCode,
      userId,
      period,
      potentialRiskId
    ) {
      if (!userId || !period || !potentialRiskId)
        return `${potentialRiskCode || 'PR?'}.C1`
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          [
            Query.equal('user_id', userId),
            Query.equal('period', period),
            Query.equal('potential_risk_id', potentialRiskId),
            Query.select(['sequence_number']),
            Query.limit(5000),
            Query.orderDesc('sequence_number'),
          ]
        )
        const maxSeq =
          response.documents.length > 0
            ? response.documents[0].sequence_number
            : 0
        return `${potentialRiskCode || 'PR?'}.C${maxSeq + 1}`
      } catch (error) {
        console.error('Error generating risk cause code:', error)
        return `${potentialRiskCode || 'PR?'}.C1`
      }
    },

    async fetchRiskCausesByPotentialRiskId(potentialRiskId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context || !potentialRiskId) {
        this.riskCauses = this.riskCauses.filter(
          (rc) => rc.potential_risk_id !== potentialRiskId
        )
        return
      }
      const { userId, period } = context
      console.log(`[appStore] Fetching risk causes for PR: ${potentialRiskId}`)
      // this.riskCausesLoading = true; // Bisa loading per PR atau global
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          [
            Query.equal('potential_risk_id', potentialRiskId),
            Query.equal('user_id', userId),
            Query.equal('period', period),
            Query.orderAsc('sequence_number'),
          ]
        )
        const newRCs = response.documents.map((doc) => ({
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }))

        // Gabungkan dengan yang sudah ada, hindari duplikasi, dan update
        this.riskCauses = [
          ...this.riskCauses.filter(
            (rc) => rc.potential_risk_id !== potentialRiskId
          ), // Hapus RC lama untuk PR ini
          ...newRCs, // Tambahkan RC baru/terupdate
        ].sort(
          (a, b) =>
            a.potential_risk_id.localeCompare(b.potential_risk_id) ||
            a.sequence_number - b.sequence_number
        )

        console.log(
          `[appStore] Risk causes fetched for PR ${potentialRiskId}:`,
          newRCs.length
        )
        // Selanjutnya fetch Control Measures untuk setiap RC
        // for (const rc of newRCs) {
        //   await this.fetchControlMeasuresByRiskCauseId(rc.id);
        // }
      } catch (error) {
        console.error(
          `Error fetching risk causes for PR ${potentialRiskId}:`,
          error
        )
      } finally {
        // this.riskCausesLoading = false;
      }
    },

    async fetchRiskCausesForAllCurrentPotentialRisks() {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context || this.potentialRisks.length === 0) {
        this.riskCauses = []
        // Jika tidak ada RC, tidak perlu fetch CM
        this.controlMeasures = []
        this.riskCausesLoading = false // Pastikan di-set
        return
      }
      console.log(
        '[appStore] Fetching all risk causes for current active potential risks.'
      )
      this.riskCausesLoading = true
      let allFetchedRCs = []
      try {
        const potentialRiskIds = this.potentialRisks.map((pr) => pr.id)
        if (potentialRiskIds.length === 0) {
          this.riskCauses = []
          this.riskCausesLoading = false
          // await this.fetchControlMeasuresForAllCurrentRiskCauses(); // Panggil fetch CM
          return
        }
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          [
            Query.equal('potential_risk_id', potentialRiskIds),
            Query.equal('user_id', context.userId),
            Query.equal('period', context.period),
            Query.orderAsc('potential_risk_id'),
            Query.orderAsc('sequence_number'),
            Query.limit(5000), // Sesuaikan batas jika perlu
          ]
        )
        allFetchedRCs = response.documents.map((doc) => ({
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }))
        this.riskCauses = allFetchedRCs
        console.log(
          '[appStore] All risk causes fetched:',
          this.riskCauses.length
        )
        // Selanjutnya fetch semua control measures
        // await this.fetchControlMeasuresForAllCurrentRiskCauses();
      } catch (error) {
        console.error('Error fetching all risk causes:', error)
        this.riskCauses = []
      } finally {
        this.riskCausesLoading = false
      }
    },

    /**
     * @param {Omit<RiskCause, 'id' | 'created_at' | 'user_id' | 'period' | 'sequence_number' | 'updated_at'>} rcData
     * @param {string} potentialRiskId
     */
    async addRiskCause(rcData, potentialRiskId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      const { userId, period } = context

      const parentPR = this.potentialRisks.find(
        (pr) =>
          pr.id === potentialRiskId &&
          pr.user_id === userId &&
          pr.period === period
      )
      if (!parentPR) throw new Error('Potensi Risiko induk tidak ditemukan.')

      const parentGoal = this.goals.find((g) => g.id === parentPR.goal_id)
      const parentPRCode = `${parentGoal?.code || 'G?'}.PR${
        parentPR.sequence_number
      }`

      const existingRCsForPR = this.riskCauses.filter(
        (rc) => rc.potential_risk_id === potentialRiskId
      )
      const newSequenceNumber =
        existingRCsForPR.reduce(
          (max, rc) => Math.max(max, rc.sequence_number || 0),
          0
        ) + 1

      const rcToInsert = {
        ...rcData,
        potential_risk_id: potentialRiskId,
        user_id: userId,
        period: period,
        sequence_number: newSequenceNumber,
        // likelihood, impact_on_risk, analysis_notes bisa null/default
      }

      try {
        const doc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          ID.unique(),
          rcToInsert
        )
        const newRC = {
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }
        this.riskCauses.push(newRC)
        this.riskCauses.sort(
          (a, b) =>
            a.potential_risk_id.localeCompare(b.potential_risk_id) ||
            a.sequence_number - b.sequence_number
        )
        return newRC
      } catch (error) {
        console.error('Error adding risk cause to Appwrite:', error)
        throw error
      }
    },

    /**
     * @param {string} rcId - $id dari dokumen Risk Cause
     * @param {Partial<Omit<RiskCause, 'id' | 'user_id' | 'period' | 'potential_risk_id' | 'sequence_number' | 'created_at' | 'updated_at'>>} rcData
     */
    async updateRiskCause(rcId, rcData) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')
      const {
        potential_risk_id,
        user_id,
        period,
        sequence_number,
        ...dataToUpdate
      } = rcData

      try {
        const doc = await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          rcId,
          dataToUpdate
        )
        const updatedRC = {
          id: doc.$id,
          ...doc,
          created_at: doc.$createdAt,
          updated_at: doc.$updatedAt,
        }
        const index = this.riskCauses.findIndex((r) => r.id === rcId)
        if (index !== -1) {
          this.riskCauses[index] = updatedRC
        }
        return updatedRC
      } catch (error) {
        console.error('Error updating risk cause in Appwrite:', error)
        throw error
      }
    },

    async deleteRiskCause(rcId) {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) throw new Error('Konteks pengguna tidak valid.')

      console.warn(
        `[appStore] Deleting Risk Cause ${rcId}. Cascading delete for its ControlMeasures needs to be handled.`
      )
      // TODO: Implement cascading delete for ControlMeasures
      // 1. Fetch all ControlMeasures for this rcId
      // 2. Delete all those ControlMeasures
      // 3. Delete the RiskCause itself

      try {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          RISK_CAUSES_COLLECTION_ID,
          rcId
        )
        this.riskCauses = this.riskCauses.filter((r) => r.id !== rcId)
        // Hapus juga control measures terkait dari state
        // this.controlMeasures = this.controlMeasures.filter(cm => cm.risk_cause_id !== rcId);
      } catch (error) {
        console.error('Error deleting risk cause from Appwrite:', error)
        throw error
      }
    },

    // --- ACTIONS UNTUK CONTROL MEASURES ---
    // Akan ditambahkan nanti

    // --- FUNGSI UTILITAS STORE ---
    resetLoadingFlags() {
      this.goalsLoading = false
      this.potentialRisksLoading = false
      this.riskCausesLoading = false
      this.controlMeasuresLoading = false
    },
    resetAllData() {
      console.log('[appStore] resetAllData called.')
      this.goals = []
      this.potentialRisks = []
      this.riskCauses = []
      this.controlMeasures = []
      this.resetLoadingFlags()
      this.dataFetchedForPeriod = null
    },

    async triggerInitialDataFetch() {
      const context = this._getCurrentUprIdAndPeriod()
      if (!context) {
        this.resetAllData()
        return
      }
      const { userId, period } = context

      if (
        period === this.dataFetchedForPeriod &&
        !this.goalsLoading &&
        !this.potentialRisksLoading /* && lainnya */
      ) {
        console.log(
          `[appStore] Data for period ${period} already available or not loading. Skipping fetch.`
        )
        return
      }

      console.log(
        `[appStore] Triggering initial data fetch for userId: ${userId}, period: ${period}.`
      )
      this.goalsLoading = true
      this.potentialRisksLoading = true // Set semua loading jadi true di awal
      this.riskCausesLoading = true
      this.controlMeasuresLoading = true

      try {
        await this.fetchGoals() // Ini akan memicu fetchPotentialRisksForAllCurrentGoals
        // fetchPotentialRisksForAllCurrentGoals akan memicu fetchRiskCausesForAllCurrentPotentialRisks, dst.
        // Jadi, cukup panggil fetchGoals() di sini jika rantai fetch sudah diatur.
      } catch (error) {
        console.error(
          '[appStore] Error during triggerInitialDataFetch chain:',
          error
        )
        this.resetLoadingFlags()
        this.dataFetchedForPeriod = null
      }
      // Flag loading individual akan di-set false oleh fungsi fetch masing-masing.
    },
  },
})

/** JSDoc untuk tipe data (sesuaikan dengan atribut collection Appwrite Anda)
 * @typedef {object} Goal
 * @property {string} id - ($id dari Appwrite)
 * @property {string} user_id
 * @property {string} period
 * @property {string} name
 * @property {string} description
 * @property {string} code
 * @property {string} created_at - ($createdAt dari Appwrite)
 * @property {string} [updated_at] - ($updatedAt dari Appwrite)
 */

/**
 * @typedef {object} PotentialRisk
 * @property {string} id - ($id dari Appwrite)
 * @property {string} goal_id
 * @property {string} user_id
 * @property {string} period
 * @property {number} sequence_number
 * @property {string} description
 * @property {string | null} category - (RiskCategory)
 * @property {string | null} owner
 * @property {string} identified_at - ($createdAt dari Appwrite)
 * @property {string | null} [updated_at] - ($updatedAt dari Appwrite)
 * @property {string | null} [likelihood] - (LikelihoodLevelDesc)
 * @property {string | null} [impact] - (ImpactLevelDesc)
 * @property {string | null} [analysis_completed_at]
 */
// Definisikan JSDoc untuk RiskCause, ControlMeasure juga
