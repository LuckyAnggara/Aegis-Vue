<template>
  <div class="space-y-6">
    <PageHeader
      title="Sasaran"
      :description="`Definisikan dan kelola tujuan strategis Anda untuk UPR: ${
        authStore.appUser?.display_name || '...'
      }, Periode: ${authStore.appUser?.active_period || '...'}.`"
    >
      <template #actions>
        <Button
          class="cursor-pointer"
          variant="outline"
          @click="fetchData()"
          :disabled="
            appStore.goalsLoading ||
            !authStore.isAuthenticated ||
            !authStore.isProfileComplete
          "
        >
          <RefreshCcw
            class="h-4 w-4"
            :class="appStore.goalsLoading ? ' animate-spin' : ''"
          />
        </Button>
        <Button
          class="cursor-pointer"
          @click="openAddGoalDialog()"
          :disabled="
            appStore.goalsLoading ||
            !authStore.isAuthenticated ||
            !authStore.isProfileComplete
          "
        >
          <PlusCircle class="mr-2 h-4 w-4" /> Tambah Sasaran Baru
        </Button>
      </template>
    </PageHeader>

    <div class="mb-4">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Cari sasaran berdasarkan kode, nama, atau deskripsi..."
          class="pl-10 w-full md:w-1/2 lg:w-1/3"
          v-model="searchTerm"
          :disabled="appStore.goalsLoading"
        />
      </div>
    </div>

    <div
      v-if="appStore.goalsLoading"
      class="flex flex-col items-center justify-center py-10"
    >
      <Loader2 class="h-10 w-10 animate-spin text-primary mb-3" />
      <p class="text-muted-foreground">Memuat daftar sasaran...</p>
    </div>

    <template v-else>
      <div
        v-if="
          filteredGoals.length === 0 && appStore.goals.length > 0 && searchTerm
        "
        class="text-center py-10 border-2 border-dashed rounded-lg"
      >
        <Search class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-lg font-medium">Tidak ada sasaran ditemukan</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Tidak ada sasaran yang cocok dengan kata kunci pencarian Anda: "{{
            searchTerm
          }}".
        </p>
      </div>

      <div
        v-else-if="appStore.goals.length === 0 && !searchTerm"
        class="text-center py-10 border-2 border-dashed rounded-lg"
      >
        <Target class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-lg font-medium">
          Belum ada sasaran untuk UPR/Periode ini
        </h3>
        <p class="mt-1 text-sm text-muted-foreground">
          Mulailah dengan menambahkan sasaran pertama Anda.
        </p>
        <div class="mt-6">
          <Button
            @click="openAddGoalDialog()"
            :disabled="
              !authStore.isAuthenticated || !authStore.isProfileComplete
            "
          >
            <PlusCircle class="mr-2 h-4 w-4" /> Tambah Sasaran Baru
          </Button>
        </div>
      </div>

      <div
        v-else-if="filteredGoals.length > 0"
        class="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <GoalCard
          v-for="goal in filteredGoals"
          :key="goal.id"
          :goal="goal"
          @edit-goal="openEditGoalDialog"
          @delete-goal="handleDeleteGoalClick"
        />
      </div>
    </template>

    <AddGoalDialog
      v-model="isGoalDialogOpen"
      :existing-goal="goalToEdit"
      @save="handleGoalSave"
    />

    <AlertDialog
      :open="isDeleteDialogOpen"
      @update:open="setIsDeleteDialogOpen"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus Sasaran</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus sasaran "{{ goalToDelete?.name }}"
            ({{ goalToDelete?.code }})? Semua data terkait (potensi risiko,
            penyebab, rencana pengendalian) juga akan dihapus. Tindakan ini
            tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDelete">Batal</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
// import { useRouter } from 'vue-router'; // Tidak digunakan saat ini
import PageHeader from '@/components/global/PageHeader.vue' // Asumsi Anda buat PageHeader.vue
import GoalCard from '@/components/goals/GoalCard.vue'
import AddGoalDialog from '@/components/goals/AddGoalDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  PlusCircle,
  Target,
  Loader2,
  Search,
  RefreshCcw,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner' // Menggunakan vue-sonner
// import { useAuthStore } from '@/stores/authStore'; // Akan di-uncomment
import { useAppStore } from '@/stores/app' // Akan di-uncomment (untuk data goals)
import { useAuthStore } from '@/stores/auth'

const appStore = useAppStore() // Ganti dengan Pinia store Anda
// Simulasi store untuk UI rendering
const authStore = useAuthStore() // Ganti dengan Pinia store Anda

const setIsDeleteDialogOpen = (value) => {
  isDeleteDialogOpen.value = value
}

const searchTerm = ref('')
const isGoalDialogOpen = ref(false)
const goalToEdit = ref(null)
const isDeleteDialogOpen = ref(false)
const goalToDelete = ref(null)

onMounted(() => {
  if (authStore.isAuthenticated && authStore.isProfileComplete) {
    fetchData()
  }
})

function fetchData() {
  if (authStore.isAuthenticated && authStore.isProfileComplete) {
    if(appStore.goals.length < 1)
    appStore.fetchGoals(authStore.uprUser.id, authStore.uprUser.activePeriod)
  } else {
    appStore.goals.value = [] // Reset goals jika tidak ada konteks pengguna
  }
}

watch(
  () => [
    authStore.isAuthenticated,
    authStore.isProfileComplete,
    authStore.uprUser?.activePeriod,
  ],
  ([newAuth, newProfileComplete, newPeriod]) => {
    if (newAuth && newProfileComplete && newPeriod) {
      appStore.fetchGoals(authStore.uprUser.id, authStore.uprUser.activePeriod)
    } else {
      appStore.goals.value = []
    }
  }
)

const filteredGoals = computed(() => {
  if (!Array.isArray(appStore.goals)) return []
  if (!searchTerm.value) {
    return appStore.goals
  }
  return appStore.goals.filter(
    (goal) =>
      goal.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (goal.code &&
        goal.code.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})

function openAddGoalDialog() {
  goalToEdit.value = null
  isGoalDialogOpen.value = true
}

function openEditGoalDialog(goal) {
  goalToEdit.value = goal
  isGoalDialogOpen.value = true
}

async function handleGoalSave(goalData, isNew) {
  // Logika ini akan dipindahkan ke AddGoalDialog atau store yang sebenarnya
  const uprId = authStore.uprUser.id
  const period = authStore.uprUser.activePeriod

  if (!uprId || !period) {
    toast.error('Error', { description: 'Konteks pengguna tidak valid.' })
    return
  }

  try {
    if (isNew) {
      const newGoal = await appStore.addGoal(goalData, uprId, period)
      toast.success('Sasaran Ditambahkan!', {
        description: `Sasaran "${newGoal.name}" (${newGoal.code}) berhasil ditambahkan.`,
      })
    } else {
      const updatedGoal = await appStore.updateGoal(
        goalToEdit.value.id,
        goalData
      )
      toast.success('Sasaran Diperbarui!', {
        description: `Sasaran "${updatedGoal.name}" (${updatedGoal.code}) berhasil diperbarui.`,
      })
    }
  } catch (error) {
    toast.error('Gagal Menyimpan', {
      description: error.message || 'Terjadi kesalahan.',
    })
  }
  isGoalDialogOpen.value = false // Tutup dialog setelah save
}

function handleDeleteGoalClick(goalId) {
  const G = appStore.goals.value.find((g) => g.id === goalId)
  if (G) {
    goalToDelete.value = G
    isDeleteDialogOpen.value = true
  }
}

async function confirmDelete() {
  if (!goalToDelete.value) return
  const userId = authStore.appUser?.id
  const period = authStore.appUser?.active_period
  if (!userId || !period) {
    toast.error('Error', {
      description: 'Konteks pengguna tidak valid untuk menghapus.',
    })
    return
  }

  try {
    await appStore.deleteGoal(goalToDelete.value.id, userId, period)
    toast.error('Sasaran Dihapus!', {
      // vue-sonner menggunakan toast.error untuk destructive
      description: `Sasaran "${goalToDelete.value.name}" (${goalToDelete.value.code}) telah dihapus.`,
      // class: 'bg-destructive text-destructive-foreground', // Jika perlu styling custom
    })
  } catch (error) {
    toast.error('Gagal Menghapus', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    isDeleteDialogOpen.value = false
    goalToDelete.value = null
  }
}

function cancelDelete() {
  isDeleteDialogOpen.value = false
  goalToDelete.value = null
}
</script>
