// src/stores/goalStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from './authStore' // Untuk mendapatkan userId dan periode aktif

export const useGoalStore = defineStore('goals', () => {
  const authStore = useAuthStore()

  /** @type {import('vue').Ref<import('@/lib/constants.js').Goal[]>} */ // Gunakan JSDoc untuk tipe Goal
  const goals = ref([])
  const goalsLoading = ref(false)

  const currentUserId = computed(() => authStore.currentUser?.id)
  const currentPeriod = computed(() => authStore.appUser?.active_period)

  // Ambil dari Project NextJS Anda
  async function _generateGoalCode(name, userId, period) {
    if (!userId || !period) return 'S1' // Fallback jika konteks tidak ada

    const { data: existingGoals, error } = await supabase
      .from('goals')
      .select('code')
      .eq('user_id', userId)
      .eq('period', period)

    if (error) {
      console.error('Error fetching existing goals for code generation:', error)
      return 'S1' // Fallback
    }

    const firstLetter = name.charAt(0).toUpperCase()
    const prefix = /^[A-Z]$/.test(firstLetter) ? firstLetter : 'S'
    let maxNum = 0
    ;(existingGoals || []).forEach((g) => {
      if (g.code && typeof g.code === 'string' && g.code.startsWith(prefix)) {
        const numPart = parseInt(g.code.substring(prefix.length), 10)
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart
        }
      }
    })
    const newNumericPart = maxNum + 1
    return `${prefix}${newNumericPart}`
  }

  async function fetchGoals() {
    if (!currentUserId.value || !currentPeriod.value) {
      console.warn(
        '[goalStore] Cannot fetch goals: userId or period is missing.'
      )
      goals.value = []
      return
    }
    goalsLoading.value = true
    try {
      console.log(
        `[goalStore] Fetching goals for user: ${currentUserId.value}, period: ${currentPeriod.value}`
      )
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', currentUserId.value)
        .eq('period', currentPeriod.value)
        .order('code', { ascending: true }) //

      if (error) throw error
      goals.value = data || []
      console.log('[goalStore] Goals fetched:', goals.value.length)
    } catch (error) {
      console.error('Error fetching goals from Supabase:', error.message)
      goals.value = []
      // Mungkin tampilkan toast error di sini atau biarkan komponen yang menangani
    } finally {
      goalsLoading.value = false
    }
  }

  /**
   * @param {{ name: string; description: string; }} goalData
   */
  async function addGoal(goalData) {
    if (!currentUserId.value || !currentPeriod.value) {
      throw new Error(
        'User ID atau Periode tidak valid untuk menambah sasaran.'
      )
    }
    const newCode = await _generateGoalCode(
      goalData.name,
      currentUserId.value,
      currentPeriod.value
    ) //

    const goalToInsert = {
      ...goalData,
      user_id: currentUserId.value,
      period: currentPeriod.value,
      code: newCode,
      // created_at dan updated_at akan di-handle oleh Supabase (jika ada default atau trigger)
      // Jika tidak, tambahkan: created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('goals')
      .insert(goalToInsert)
      .select()
      .single()

    if (error) {
      console.error('Error adding goal to Supabase:', error.message)
      throw error
    }
    if (data) {
      goals.value.push(data)
      goals.value.sort((a, b) =>
        (a.code || '').localeCompare(b.code || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      ) //
    }
    return data
  }

  /**
   * @param {string} goalId
   * @param {Partial<{ name: string; description: string; }>} updatedData
   */
  async function updateGoal(goalId, updatedData) {
    if (!currentUserId.value || !currentPeriod.value) {
      throw new Error(
        'User ID atau Periode tidak valid untuk memperbarui sasaran.'
      )
    }
    // Jika nama berubah, kode mungkin perlu digenerate ulang.
    // Untuk kesederhanaan, kita tidak regenerate kode saat update nama di sini.
    // Jika ini penting, logikanya perlu ditambahkan.
    // const goalToUpdate = goals.value.find(g => g.id === goalId);
    // if (goalToUpdate && updatedData.name && goalToUpdate.name !== updatedData.name) {
    //   // opsional: regenerate code atau beri warning jika code tergantung nama
    // }

    const { data, error } = await supabase
      .from('goals')
      .update({ ...updatedData, updated_at: new Date().toISOString() })
      .eq('id', goalId)
      .eq('user_id', currentUserId.value) // Pastikan user hanya update miliknya
      .eq('period', currentPeriod.value) // Dan hanya untuk periode aktif
      .select()
      .single()

    if (error) {
      console.error('Error updating goal in Supabase:', error.message)
      throw error
    }
    if (data) {
      const index = goals.value.findIndex((g) => g.id === goalId)
      if (index !== -1) {
        goals.value[index] = data
        goals.value.sort((a, b) =>
          (a.code || '').localeCompare(b.code || '', undefined, {
            numeric: true,
            sensitivity: 'base',
          })
        ) //
      }
    }
    return data
  }

  async function deleteGoal(goalId) {
    if (!currentUserId.value || !currentPeriod.value) {
      throw new Error(
        'User ID atau Periode tidak valid untuk menghapus sasaran.'
      )
    }

    // Hapus semua data terkait (potential_risks, risk_causes, control_measures, dll)
    // Ini perlu dilakukan dengan hati-hati, atau gunakan ON DELETE CASCADE di Supabase jika memungkinkan.
    // Untuk contoh ini, kita hanya hapus goal-nya.
    // Di aplikasi Next.js Anda, ada logika cascading delete.
    // Anda perlu mereplikasi ini menggunakan Supabase Edge Functions atau multiple client calls.

    // Contoh sederhana (tanpa cascading delete di client, asumsikan DB handle atau dilakukan terpisah):
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', currentUserId.value)
      .eq('period', currentPeriod.value)

    if (error) {
      console.error('Error deleting goal from Supabase:', error.message)
      throw error
    }
    goals.value = goals.value.filter((g) => g.id !== goalId)
  }

  // Fungsi untuk mengambil satu goal, mirip dengan getGoalById di store Next.js
  async function getGoalById(id) {
    if (!currentUserId.value || !currentPeriod.value) {
      console.warn(
        '[goalStore] Cannot getGoalById: userId or period is missing.'
      )
      return null
    }
    // Coba dari state dulu
    const goalFromState = goals.value.find(
      (g) =>
        g.id === id &&
        g.user_id === currentUserId.value &&
        g.period === currentPeriod.value
    )
    if (goalFromState) return goalFromState

    // Jika tidak ada, fetch dari DB
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', currentUserId.value)
        .eq('period', currentPeriod.value)
        .single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = 0 rows
      return data
    } catch (error) {
      console.error(`Error fetching goal ${id} from Supabase:`, error.message)
      return null
    }
  }

  return {
    goals,
    goalsLoading,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalById,
  }
})
