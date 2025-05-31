// src/stores/app.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

// Import Appwrite services
import {
  addGoal as addGoalToService,
  getGoals as fetchGoalsFromService,
  updateGoal as updateGoalInService,
  deleteGoal as deleteGoalFromService,
  getGoalById as getGoalByIdFromService,
} from '@/services/goalService'
import {
  addPotentialRisk as addPotentialRiskToService,
  getPotentialRisksByGoalId as fetchPotentialRisksByGoalIdFromService,
  updatePotentialRisk as updatePotentialRiskInService,
  deletePotentialRiskAndSubCollections as deletePotentialRiskFromService,
  getPotentialRiskById as getPotentialRiskByIdFromService,
} from '@/services/potentialRiskService'
import {
  addRiskCause as addRiskCauseToService,
  getRiskCausesByPotentialRiskId as fetchRiskCausesByPotentialRiskIdFromService,
  updateRiskCause as updateRiskCauseInService,
  deleteRiskCauseAndSubCollections as deleteRiskCauseFromService,
  getRiskCauseById as getRiskCauseByIdFromService,
} from '@/services/riskCauseService'
import {
  addControlMeasure as addControlMeasureToService,
  getControlMeasuresByRiskCauseId as fetchControlMeasuresByRiskCauseIdFromService,
  updateControlMeasure as updateControlMeasureInService,
  deleteControlMeasure as deleteControlMeasureFromService,
  getControlMeasureById as getControlMeasureByIdFromService,
} from '@/services/controlMeasureService'
import {
  addMonitoringSession as addMonitoringSessionToService,
  getMonitoringSessions as fetchMonitoringSessionsFromService,
  getMonitoringSessionById as getMonitoringSessionByIdFromService,
} from '@/services/monitoringService'
import {
  getRiskExposuresBySession as fetchRiskExposuresBySessionFromService,
  upsertRiskExposure as upsertRiskExposureToService,
} from '@/services/riskExposureService'

// Import constants and utility functions
import { CONTROL_MEASURE_TYPE_KEYS } from '@/lib/types' // Pastikan path ini benar dan file types.js Anda sudah dibuat/diadaptasi

export const useAppStore = defineStore('app', () => {
  // --- State ---
  const goals = ref([])
  const goalsLoading = ref(false)

  const potentialRisks = ref([])
  const potentialRisksLoading = ref(false)

  const riskCauses = ref([])
  const riskCausesLoading = ref(false)

  const controlMeasures = ref([])
  const controlMeasuresLoading = ref(false)

  const monitoringSessions = ref([])
  const monitoringSessionsLoading = ref(false)
  const currentMonitoringSession = ref(null)
  const currentMonitoringSessionLoading = ref(false)
  const riskExposures = ref([])
  const riskExposuresLoading = ref(false)

  const dataFetchedForPeriod = ref(null)

  // --- Actions ---

  const triggerInitialDataFetch = async (uprId, period) => {
    if (!uprId || !period) {
      console.warn(
        '[AppStore] triggerInitialDataFetch: uprId or period is missing. Resetting data.'
      )
      resetAllData()
      return
    }
    if (
      period === dataFetchedForPeriod.value &&
      !goalsLoading.value &&
      !potentialRisksLoading.value &&
      !riskCausesLoading.value &&
      !controlMeasuresLoading.value &&
      !monitoringSessionsLoading.value
    ) {
      console.log(
        `[AppStore] Data for period ${period} already available or not in loading state. Skipping fetch chain.`
      )
      return
    }

    console.log(
      `[AppStore] Triggering initial data fetch for uprId: ${uprId}, period: ${period}. Current dataFetchedForPeriod: ${dataFetchedForPeriod.value}`
    )
    dataFetchedForPeriod.value = period
    goalsLoading.value = true
    potentialRisksLoading.value = true
    riskCausesLoading.value = true
    controlMeasuresLoading.value = true
    monitoringSessionsLoading.value = true
    riskExposuresLoading.value = false

    try {
      // Fetch Goals, which will chain fetchPotentialRisks -> fetchRiskCauses -> fetchControlMeasures
      await fetchGoals(uprId, period)
      // Fetch monitoring sessions separately
      await fetchMonitoringSessions(uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] Error during triggerInitialDataFetch chain:',
        serviceErrorMessage
      )
      // Reset loading flags and dataFetchedForPeriod on error to allow re-fetch attempt
      goalsLoading.value = false
      potentialRisksLoading.value = false
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      monitoringSessionsLoading.value = false
      dataFetchedForPeriod.value = null
    }
  }

  const resetAllData = () => {
    console.log('[AppStore] resetAllData called.')
    goals.value = []
    goalsLoading.value = false
    potentialRisks.value = []
    potentialRisksLoading.value = false
    riskCauses.value = []
    riskCausesLoading.value = false
    controlMeasures.value = []
    controlMeasuresLoading.value = false
    monitoringSessions.value = []
    monitoringSessionsLoading.value = false
    currentMonitoringSession.value = null
    currentMonitoringSessionLoading.value = false
    riskExposures.value = []
    riskExposuresLoading.value = false
    dataFetchedForPeriod.value = null
  }

  const getControlTypeName = (typeKey) => {
    const types = {
      Prv: 'Preventif',
      RM: 'Mitigasi Risiko',
      Crr: 'Korektif',
    }
    return types[typeKey] || typeKey
  }

  // --- Goals Actions ---
  const fetchGoals = async (uprId, period) => {
    if (!uprId || !period) {
      goals.value = []
      goalsLoading.value = false
      potentialRisksLoading.value = false
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      dataFetchedForPeriod.value = null
      return
    }
    console.log(`[AppStore] fetchGoals called for ${uprId}, ${period}`)
    goalsLoading.value = true
    try {
      const result = await fetchGoalsFromService(uprId, period)
      if (result.success && result.goals) {
        goals.value = result.goals.sort((a, b) =>
          (a.code || '').localeCompare(b.code || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        )
        await fetchPotentialRisks(uprId, period)
      } else {
        const message = result.message || 'Unknown error fetching goals.'
        console.error('[AppStore] fetchGoals: Failed:', message)
        goals.value = []
        potentialRisksLoading.value = false
        riskCausesLoading.value = false
        controlMeasuresLoading.value = false
        dataFetchedForPeriod.value = null
        throw new Error(`Gagal memuat sasaran dari store: ${message}`)
      }
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] fetchGoals: Error:', serviceErrorMessage)
      goals.value = []
      potentialRisksLoading.value = false
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      dataFetchedForPeriod.value = null
      throw error
    } finally {
      goalsLoading.value = false
    }
  }

  const addGoal = async (goalData, uprId, period) => {
    try {
      const newGoal = await addGoalToService(goalData, uprId, period)
      if (newGoal) {
        goals.value = [...goals.value, newGoal].sort((a, b) =>
          (a.code || '').localeCompare(b.code || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        )
      }
      return newGoal
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] addGoal: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal menambahkan sasaran di store: ${serviceErrorMessage}`
      )
    }
  }

  const updateGoal = async (goalId, updatedData) => {
    try {
      const updatedGoalFromService = await updateGoalInService(
        goalId,
        updatedData
      )
      if (updatedGoalFromService) {
        goals.value = goals.value
          .map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  ...updatedData,
                  updatedAt: updatedGoalFromService.updatedAt,
                }
              : g
          )
          .sort((a, b) =>
            (a.code || '').localeCompare(b.code || '', undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          )
        return goals.value.find((g) => g.id === goalId) || null
      }
      return null
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] updateGoal: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal memperbarui sasaran di store: ${serviceErrorMessage}`
      )
    }
  }

  const deleteGoal = async (goalId, uprId, period) => {
    try {
      await deleteGoalFromService(goalId, uprId, period)
      goals.value = goals.value.filter((g) => g.id !== goalId)
      potentialRisks.value = potentialRisks.value.filter(
        (pr) => pr.goalId !== goalId
      )
      riskCauses.value = riskCauses.value.filter((rc) => rc.goalId !== goalId)
      controlMeasures.value = controlMeasures.value.filter(
        (cm) => cm.goalId !== goalId
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] deleteGoal: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal menghapus sasaran di store: ${serviceErrorMessage}`
      )
    }
  }

  const getGoalById = async (id, uprId, period) => {
    const goalFromStore = goals.value.find(
      (g) => g.id === id && g.uprId === uprId && g.period === period
    )
    if (goalFromStore) {
      console.log(`[AppStore] getGoalById: Found goal ${id} in store.`)
      return goalFromStore
    }
    console.log(
      `[AppStore] getGoalById: Goal ${id} not in store, fetching from service...`
    )
    try {
      return await getGoalByIdFromService(id, uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] getGoalById: Error fetching goal ${id} from service:`,
        serviceErrorMessage
      )
      throw new Error(
        `Gagal mengambil detail sasaran dari store/service: ${serviceErrorMessage}`
      )
    }
  }

  // --- PotentialRisks Actions ---
  const fetchPotentialRisks = async (uprId, period) => {
    if (!uprId || !period) {
      potentialRisks.value = []
      potentialRisksLoading.value = false
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      return
    }
    console.log(`[AppStore] fetchPotentialRisks called for ${uprId}, ${period}`)
    potentialRisksLoading.value = true
    try {
      const currentGoals = goals.value
      if (currentGoals.length === 0 && !goalsLoading.value) {
        console.warn(
          '[AppStore] fetchPotentialRisks: No goals loaded. fetchGoals should handle this chain, or no goals exist for this context.'
        )
        potentialRisks.value = []
        riskCausesLoading.value = false
        controlMeasuresLoading.value = false
        await fetchRiskCauses(uprId, period)
        return
      }
      let allPRs = []
      for (const goal of currentGoals) {
        if (goal.uprId === uprId && goal.period === period) {
          const prsForGoal = await fetchPotentialRisksByGoalIdFromService(
            goal.id,
            uprId,
            period
          )
          allPRs.push(...prsForGoal)
        }
      }
      potentialRisks.value = allPRs.sort(
        (a, b) =>
          (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
          a.description.localeCompare(b.description)
      )
      await fetchRiskCauses(uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] fetchPotentialRisks: Failed:',
        serviceErrorMessage
      )
      potentialRisks.value = []
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      throw error
    } finally {
      potentialRisksLoading.value = false
    }
  }

  const addPotentialRisk = async (
    data,
    goalId,
    uprId,
    period,
    sequenceNumber
  ) => {
    try {
      const newPotentialRisk = await addPotentialRiskToService(
        data,
        goalId,
        uprId,
        period,
        sequenceNumber
      )
      if (newPotentialRisk) {
        potentialRisks.value = [...potentialRisks.value, newPotentialRisk].sort(
          (a, b) =>
            (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
            a.description.localeCompare(b.description)
        )
      }
      return newPotentialRisk
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] addPotentialRisk: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal menambahkan potensi risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const updatePotentialRisk = async (potentialRiskId, updatedData) => {
    try {
      const updatedPR = await updatePotentialRiskInService(
        potentialRiskId,
        updatedData
      )
      if (updatedPR) {
        potentialRisks.value = potentialRisks.value
          .map((pr) => (pr.id === potentialRiskId ? updatedPR : pr))
          .sort(
            (a, b) =>
              (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
              a.description.localeCompare(b.description)
          )
      }
      return updatedPR
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] updatePotentialRisk: Failed:',
        serviceErrorMessage
      )
      throw new Error(
        `Gagal memperbarui potensi risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const deletePotentialRisk = async (potentialRiskId, uprId, period) => {
    try {
      await deletePotentialRiskFromService(potentialRiskId, uprId, period)
      potentialRisks.value = potentialRisks.value.filter(
        (pr) => pr.id !== potentialRiskId
      )
      riskCauses.value = riskCauses.value.filter(
        (rc) => rc.potentialRiskId !== potentialRiskId
      )
      controlMeasures.value = controlMeasures.value.filter(
        (cm) => cm.potentialRiskId !== potentialRiskId
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] deletePotentialRisk: Failed:',
        serviceErrorMessage
      )
      throw new Error(
        `Gagal menghapus potensi risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const getPotentialRiskById = async (id, uprId, period) => {
    const riskFromStore = potentialRisks.value.find(
      (pr) => pr.id === id && pr.uprId === uprId && pr.period === period
    )
    if (riskFromStore) {
      console.log(`[AppStore] getPotentialRiskById: Found PR ${id} in store.`)
      return riskFromStore
    }
    console.log(
      `[AppStore] getPotentialRiskById: PR ${id} not in store, fetching from service...`
    )
    try {
      return await getPotentialRiskByIdFromService(id, uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] getPotentialRiskById: Error fetching PR ${id} from service:`,
        serviceErrorMessage
      )
      throw new Error(
        `Gagal mengambil detail potensi risiko dari store/service: ${serviceErrorMessage}`
      )
    }
  }

  // --- RiskCauses Actions ---
  const fetchRiskCauses = async (uprId, period) => {
    if (!uprId || !period) {
      riskCauses.value = []
      riskCausesLoading.value = false
      controlMeasuresLoading.value = false
      return
    }
    console.log(`[AppStore] fetchRiskCauses called for ${uprId}, ${period}`)
    riskCausesLoading.value = true
    try {
      const currentPotentialRisks = potentialRisks.value
      if (currentPotentialRisks.length === 0 && !potentialRisksLoading.value) {
        console.warn(
          '[AppStore] fetchRiskCauses: No potential risks loaded. fetchPotentialRisks should handle this chain, or no PRs exist.'
        )
        riskCauses.value = []
        controlMeasuresLoading.value = false
        await fetchControlMeasures(uprId, period)
        return
      }
      let allRCs = []
      for (const pRisk of currentPotentialRisks) {
        if (pRisk.uprId === uprId && pRisk.period === period) {
          const rcsForPR = await fetchRiskCausesByPotentialRiskIdFromService(
            pRisk.id,
            uprId,
            period
          )
          allRCs.push(...rcsForPR)
        }
      }
      riskCauses.value = allRCs.sort(
        (a, b) =>
          (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
          a.description.localeCompare(b.description)
      )
      await fetchControlMeasures(uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] fetchRiskCauses: Failed:', serviceErrorMessage)
      riskCauses.value = []
      controlMeasuresLoading.value = false
      throw error
    } finally {
      riskCausesLoading.value = false
    }
  }

  const addRiskCause = async (
    data,
    potentialRiskId,
    goalId,
    uprId,
    period,
    sequenceNumber
  ) => {
    try {
      const newRiskCause = await addRiskCauseToService(
        data,
        potentialRiskId,
        goalId,
        uprId,
        period,
        sequenceNumber
      )
      if (newRiskCause) {
        riskCauses.value = [...riskCauses.value, newRiskCause].sort(
          (a, b) =>
            (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
            a.description.localeCompare(b.description)
        )
      }
      return newRiskCause
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] addRiskCause: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal menambahkan penyebab risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const updateRiskCause = async (riskCauseId, updatedData) => {
    try {
      const updatedRC = await updateRiskCauseInService(riskCauseId, updatedData)
      if (updatedRC) {
        riskCauses.value = riskCauses.value
          .map((rc) => (rc.id === riskCauseId ? updatedRC : rc))
          .sort(
            (a, b) =>
              (a.sequenceNumber || 0) - (b.sequenceNumber || 0) ||
              a.description.localeCompare(b.description)
          )
      }
      return updatedRC
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] updateRiskCause: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal memperbarui penyebab risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const deleteRiskCause = async (riskCauseId, uprId, period) => {
    try {
      await deleteRiskCauseFromService(riskCauseId, uprId, period)
      riskCauses.value = riskCauses.value.filter((rc) => rc.id !== riskCauseId)
      controlMeasures.value = controlMeasures.value.filter(
        (cm) => cm.riskCauseId !== riskCauseId
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error('[AppStore] deleteRiskCause: Failed:', serviceErrorMessage)
      throw new Error(
        `Gagal menghapus penyebab risiko di store: ${serviceErrorMessage}`
      )
    }
  }

  const getRiskCauseById = async (id, uprId, period) => {
    const causeFromStore = riskCauses.value.find(
      (rc) => rc.id === id && rc.uprId === uprId && rc.period === period
    )
    if (causeFromStore) {
      console.log(`[AppStore] getRiskCauseById: Found RC ${id} in store.`)
      return causeFromStore
    }
    console.log(
      `[AppStore] getRiskCauseById: RC ${id} not in store, fetching from service...`
    )
    try {
      return await getRiskCauseByIdFromService(id, uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] getRiskCauseById: Error fetching RC ${id} from service:`,
        serviceErrorMessage
      )
      throw new Error(
        `Gagal mengambil detail penyebab risiko dari store/service: ${serviceErrorMessage}`
      )
    }
  }

  // --- ControlMeasures Actions ---
  const fetchControlMeasures = async (uprId, period, riskCauseId_optional) => {
    if (!uprId || !period) {
      controlMeasures.value = []
      controlMeasuresLoading.value = false
      return
    }
    console.log(
      `[AppStore] fetchControlMeasures called for ${uprId}, ${period}, RC_ID_OPT: ${riskCauseId_optional}`
    )
    controlMeasuresLoading.value = true
    try {
      let fetchedCMs = []
      if (riskCauseId_optional) {
        console.log(
          `[AppStore] fetchControlMeasures: Fetching for specific RC ID: ${riskCauseId_optional}`
        )
        fetchedCMs = await fetchControlMeasuresByRiskCauseIdFromService(
          riskCauseId_optional,
          uprId,
          period
        )
        controlMeasures.value = [
          ...controlMeasures.value.filter(
            (cm) => cm.riskCauseId !== riskCauseId_optional
          ),
          ...fetchedCMs,
        ].sort(
          (a, b) =>
            CONTROL_MEASURE_TYPE_KEYS.indexOf(a.controlType) -
              CONTROL_MEASURE_TYPE_KEYS.indexOf(b.controlType) ||
            a.sequenceNumber - b.sequenceNumber
        )
      } else {
        console.log(
          `[AppStore] fetchControlMeasures: Fetching all for period ${period}`
        )
        const currentRiskCauses = riskCauses.value
        if (currentRiskCauses.length === 0 && !riskCausesLoading.value) {
          console.warn(
            '[AppStore] fetchControlMeasures: No risk causes loaded. fetchRiskCauses should handle this chain, or no RCs exist.'
          )
          controlMeasures.value = []
          return
        }
        for (const riskCause of currentRiskCauses) {
          if (riskCause.uprId === uprId && riskCause.period === period) {
            const cmsForRC = await fetchControlMeasuresByRiskCauseIdFromService(
              riskCause.id,
              uprId,
              period
            )
            fetchedCMs.push(...cmsForRC)
          }
        }
        controlMeasures.value = fetchedCMs.sort(
          (a, b) =>
            CONTROL_MEASURE_TYPE_KEYS.indexOf(a.controlType) -
              CONTROL_MEASURE_TYPE_KEYS.indexOf(b.controlType) ||
            a.sequenceNumber - b.sequenceNumber
        )
      }
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] fetchControlMeasures: Failed:',
        serviceErrorMessage
      )
      controlMeasures.value = []
      throw error
    } finally {
      controlMeasuresLoading.value = false
    }
  }

  const addControlMeasure = async (
    data,
    riskCauseId,
    potentialRiskId,
    goalId,
    uprId,
    period,
    sequenceNumber
  ) => {
    try {
      const newCM = await addControlMeasureToService(
        data,
        riskCauseId,
        potentialRiskId,
        goalId,
        uprId,
        period,
        sequenceNumber
      )
      if (newCM) {
        controlMeasures.value = [...controlMeasures.value, newCM].sort(
          (a, b) =>
            CONTROL_MEASURE_TYPE_KEYS.indexOf(a.controlType) -
              CONTROL_MEASURE_TYPE_KEYS.indexOf(b.controlType) ||
            a.sequenceNumber - b.sequenceNumber
        )
      }
      return newCM
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] addControlMeasure: Failed:',
        serviceErrorMessage
      )
      throw new Error(
        `Gagal menambahkan tindakan pengendalian di store: ${serviceErrorMessage}`
      )
    }
  }

  const updateControlMeasure = async (controlMeasureId, updatedData) => {
    try {
      const updatedCM = await updateControlMeasureInService(
        controlMeasureId,
        updatedData
      )
      if (updatedCM) {
        controlMeasures.value = controlMeasures.value
          .map((cm) => (cm.id === controlMeasureId ? updatedCM : cm))
          .sort(
            (a, b) =>
              CONTROL_MEASURE_TYPE_KEYS.indexOf(a.controlType) -
                CONTROL_MEASURE_TYPE_KEYS.indexOf(b.controlType) ||
              a.sequenceNumber - b.sequenceNumber
          )
      }
      return updatedCM
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] updateControlMeasure: Failed:',
        serviceErrorMessage
      )
      throw new Error(
        `Gagal memperbarui tindakan pengendalian di store: ${serviceErrorMessage}`
      )
    }
  }

  const deleteControlMeasure = async (controlMeasureId) => {
    try {
      await deleteControlMeasureFromService(controlMeasureId)
      controlMeasures.value = controlMeasures.value.filter(
        (cm) => cm.id !== controlMeasureId
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] deleteControlMeasure: Failed:',
        serviceErrorMessage
      )
      throw new Error(
        `Gagal menghapus tindakan pengendalian di store: ${serviceErrorMessage}`
      )
    }
  }

  const getControlMeasureById = async (id, uprId, period) => {
    const cmFromStore = controlMeasures.value.find(
      (cm) => cm.id === id && cm.uprId === uprId && cm.period === period
    )
    if (cmFromStore) {
      console.log(`[AppStore] getControlMeasureById: Found CM ${id} in store.`)
      return cmFromStore
    }
    console.log(
      `[AppStore] getControlMeasureById: CM ${id} not in store, fetching from service...`
    )
    try {
      return await getControlMeasureByIdFromService(id, uprId, period)
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] getControlMeasureById: Error fetching CM ${id} from service:`,
        serviceErrorMessage
      )
      throw new Error(
        `Gagal mengambil detail tindakan pengendalian dari store/service: ${serviceErrorMessage}`
      )
    }
  }

  // --- Monitoring Actions ---
  const fetchMonitoringSessions = async (uprId, period) => {
    if (!uprId || !period) {
      monitoringSessions.value = []
      monitoringSessionsLoading.value = false
      return
    }
    console.log(
      `[AppStore] fetchMonitoringSessions called for ${uprId}, ${period}`
    )
    monitoringSessionsLoading.value = true
    try {
      const sessions = await fetchMonitoringSessionsFromService(uprId, period)
      monitoringSessions.value = sessions.sort(
        (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        '[AppStore] fetchMonitoringSessions: Failed:',
        serviceErrorMessage
      )
      monitoringSessions.value = []
    } finally {
      monitoringSessionsLoading.value = false
    }
  }

  const addMonitoringSessionToState = (session) => {
    monitoringSessions.value = [...monitoringSessions.value, session].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    )
  }

  const fetchCurrentMonitoringSession = async (sessionId, uprId, appPeriod) => {
    if (!sessionId || !uprId || !appPeriod) {
      currentMonitoringSession.value = null
      currentMonitoringSessionLoading.value = false
      riskExposures.value = []
      riskExposuresLoading.value = false
      return
    }
    console.log(
      `[AppStore] fetchCurrentMonitoringSession called for session: ${sessionId}, user: ${uprId}, appPeriod: ${appPeriod}`
    )
    currentMonitoringSessionLoading.value = true
    riskExposuresLoading.value = true
    try {
      const session = await getMonitoringSessionByIdFromService(
        sessionId,
        uprId,
        appPeriod
      )
      currentMonitoringSession.value = session
      if (session) {
        await fetchRiskExposuresForSession(sessionId, uprId, session.period)
      } else {
        riskExposures.value = []
        riskExposuresLoading.value = false
      }
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] fetchCurrentMonitoringSession (ID: ${sessionId}): Failed:`,
        serviceErrorMessage
      )
      currentMonitoringSession.value = null
      riskExposures.value = []
      riskExposuresLoading.value = false
    } finally {
      currentMonitoringSessionLoading.value = false
    }
  }

  const fetchRiskExposuresForSession = async (
    monitoringSessionId,
    uprId,
    sessionPeriod
  ) => {
    if (!monitoringSessionId || !uprId || !sessionPeriod) {
      riskExposures.value = []
      riskExposuresLoading.value = false
      return
    }
    console.log(
      `[AppStore] fetchRiskExposuresForSession called for sessionID: ${monitoringSessionId}, user: ${uprId}, sessionPeriod: ${sessionPeriod}`
    )
    riskExposuresLoading.value = true
    try {
      riskExposures.value = await fetchRiskExposuresBySessionFromService(
        monitoringSessionId,
        uprId,
        sessionPeriod
      )
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] fetchRiskExposuresForSession (SessionID: ${monitoringSessionId}): Failed:`,
        serviceErrorMessage
      )
      riskExposures.value = []
    } finally {
      riskExposuresLoading.value = false
    }
  }

  const upsertRiskExposureInState = async (exposureData) => {
    try {
      const upsertedExposureFromService = await upsertRiskExposureToService(
        exposureData
      )
      const existingIndex = riskExposures.value.findIndex(
        (re) =>
          re.riskCauseId === upsertedExposureFromService.riskCauseId &&
          re.monitoringSessionId ===
            upsertedExposureFromService.monitoringSessionId
      )
      if (existingIndex > -1) {
        riskExposures.value[existingIndex] = upsertedExposureFromService
      } else {
        riskExposures.value.push(upsertedExposureFromService)
      }
      return upsertedExposureFromService
    } catch (error) {
      const serviceErrorMessage = error.message || String(error)
      console.error(
        `[AppStore] upsertRiskExposureInState (CauseID: ${exposureData.riskCauseId}): Failed:`,
        serviceErrorMessage
      )
      throw new Error(
        `Gagal menyimpan data paparan di store: ${serviceErrorMessage}`
      )
    }
  }

  return {
    // State
    goals,
    goalsLoading,
    potentialRisks,
    potentialRisksLoading,
    riskCauses,
    riskCausesLoading,
    controlMeasures,
    controlMeasuresLoading,
    monitoringSessions,
    monitoringSessionsLoading,
    currentMonitoringSession,
    currentMonitoringSessionLoading,
    riskExposures,
    riskExposuresLoading,
    dataFetchedForPeriod,

    // Actions
    triggerInitialDataFetch,
    resetAllData,
    getControlTypeName,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalById,
    fetchPotentialRisks,
    addPotentialRisk,
    updatePotentialRisk,
    deletePotentialRisk,
    getPotentialRiskById,
    fetchRiskCauses,
    addRiskCause,
    updateRiskCause,
    deleteRiskCause,
    getRiskCauseById,
    fetchControlMeasures,
    addControlMeasure,
    updateControlMeasure,
    deleteControlMeasure,
    getControlMeasureById,
    fetchMonitoringSessions,
    addMonitoringSessionToState,
    fetchCurrentMonitoringSession,
    fetchRiskExposuresForSession,
    upsertRiskExposureInState,
  }
})
