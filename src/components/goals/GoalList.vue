<template>
  <div v-if="goals.length === 0" class="text-center text-gray-500 py-8">
    Belum ada sasaran yang dibuat untuk periode ini.
  </div>
  <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <GoalCard
      v-for="goal in goals"
      :key="goal.id"
      :goal="goal"
      @editGoal="handleEditGoal"
      @deleteGoal="handleDeleteGoal"
    />
  </div>
</template>

<script setup>
import GoalCard from './GoalCard.vue'
import { useAppStore } from '@/stores/app'

const props = defineProps({
  goals: {
    type: Array,
    default: () => [],
  },
})

const appStore = useAppStore()

const handleEditGoal = (goal) => {
  // Emit event to parent (GoalsPage.vue) to open dialog in edit mode
  emit('editGoal', goal)
}

const handleDeleteGoal = async (goalId) => {
  if (confirm('Apakah Anda yakin ingin menghapus sasaran ini?')) {
    try {
      await appStore.deleteGoal(goalId)
      alert('Sasaran berhasil dihapus!')
      // Tidak perlu emit karena Pinia state sudah terupdate
    } catch (error) {
      alert(
        'Gagal menghapus sasaran: ' + (error.message || 'Terjadi kesalahan.')
      )
    }
  }
}

const emit = defineEmits(['editGoal']) // Emit editGoal event to parent
</script>
