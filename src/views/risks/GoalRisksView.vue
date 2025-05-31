<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumb-items="breadcrumbItems"
    >
      <template #actions>
        <div class="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            @click="goBackToGoals"
            class="w-full sm:w-auto"
          >
            <ArrowLeft class="mr-2 h-4 w-4 cursor-pointer" /> Kembali ke Sasaran
          </Button>
          <Button
            @click="navigateToAddPotentialRiskPage"
            :disabled="
              pageLoading ||
              !authStore.isAuthenticated ||
              !authStore.isProfileComplete
            "
            class="w-full sm:w-auto cursor-pointer"
          >
            <PlusCircle class="mr-2 h-4 w-4" /> Tambah Potensi Risiko Baru
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card class="shadow-md">
      <CardHeader>
        <CardTitle class="text-lg flex items-center">
          <Sparkles class="mr-2 h-5 w-5 text-primary" />
          Identifikasi Potensi Risiko dengan AI
        </CardTitle>
        <CardDescription>
          Gunakan AI untuk brainstorming potensi risiko untuk sasaran "{{
            currentGoal?.code
          }}
          - {{ currentGoal?.name }}". Klik tombol di bawah untuk membuka dialog
          di mana Anda dapat menyempurnakan konteks untuk AI dan menentukan
          jumlah saran yang diinginkan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
        class="cursor-pointer"
          @click="openBrainstormDialog"
          :disabled="
            pageLoading ||
            !authStore.isAuthenticated ||
            !authStore.isProfileComplete
          "
        >
          <FlaskConical class="mr-2 h-4 w-4" /> Brainstorm Potensi Risiko dengan
          AI
        </Button>
      </CardContent>
    </Card>

    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div class="flex items-center">
        <h3 class="text-lg font-semibold mr-2">
          Potensi Risiko Teridentifikasi ({{ risksForCurrentGoal.length }} dari
          {{ totalRisksForGoal }})
        </h3>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div class="relative flex-grow sm:flex-grow-0 sm:w-56">
          <SearchIcon
            class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Cari kode, deskripsi..."
            class="pl-10 w-full"
            v-model="searchTerm"
            :disabled="pageLoading"
          />
        </div>
        <Select v-model="filterCategory" :disabled="pageLoading">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem v-for="cat in riskCategories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select v-model="filterOwner" :disabled="pageLoading">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter Pemilik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pemilik</SelectItem>
            <SelectItem
              v-for="owner in uniqueOwners"
              :key="owner"
              :value="owner"
            >
              {{ owner }}
            </SelectItem>
          </SelectContent>
        </Select>
        <!-- <div class="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" :class="{'bg-muted': viewMode === 'grid'} " @click="viewMode = 'grid'"><LayoutGrid class="h-4 w-4"/></Button>
          <Button variant="ghost" size="icon" :class="{'bg-muted': viewMode === 'list'} " @click="viewMode = 'list'"><List class="h-4 w-4"/></Button>
        </div> -->
      </div>
    </div>

    <div
      v-if="pageLoading"
      class="flex flex-col items-center justify-center py-10"
    >
      <Loader2 class="h-10 w-10 animate-spin text-primary mb-3" />
      <p class="text-muted-foreground">Memuat potensi risiko...</p>
    </div>

    <template v-else-if="currentGoal">
      <div
        v-if="filteredAndSortedRisks.length === 0"
        class="text-center py-10 border-2 border-dashed rounded-lg"
      >
        <ShieldOff class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-2 text-lg font-medium">
          {{
            searchTerm || filterCategory !== 'all' || filterOwner !== 'all'
              ? 'Tidak ada risiko ditemukan'
              : 'Belum ada potensi risiko'
          }}
        </h3>
        <p class="mt-1 text-sm text-muted-foreground">
          {{
            searchTerm || filterCategory !== 'all' || filterOwner !== 'all'
              ? 'Tidak ada potensi risiko yang cocok dengan filter atau pencarian Anda.'
              : `Belum ada potensi risiko yang diidentifikasi untuk sasaran "${currentGoal.name}".`
          }}
        </p>
        <div
          v-if="
            !searchTerm && filterCategory === 'all' && filterOwner === 'all'
          "
          class="mt-6"
        >
          <Button
            class="cursor-pointer"
               @click="navigateToAddPotentialRiskPage"
            :disabled="
              !authStore.isAuthenticated || !authStore.isProfileComplete
            "
          >
            <PlusCircle class="mr-2 h-4 w-4" /> Identifikasi Potensi Risiko Pertama
          </Button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PotentialRiskCard
          v-for="risk in filteredAndSortedRisks"
          :key="risk.id"
          :risk="risk"
          :potential-risk="risk"
          :isLoading="appStore.potentialRisksLoading"
          :parent-goal-code="currentGoal.code"
          :isSelected="selectedRisks.has(risk.id)"
          @update:selected="(checked) => toggleRiskSelection(risk.id, checked)"
          @action="handleRiskAction"
        />
      </div>
    </template>

    <div v-else-if="!pageLoading && !currentGoal" class="text-center py-10">
      <AlertTriangle class="mx-auto h-12 w-12 text-destructive" />
      <h3 class="mt-2 text-lg font-medium text-destructive">
        Sasaran Tidak Ditemukan
      </h3>
      <p class="mt-1 text-sm text-muted-foreground">
        Sasaran dengan ID yang diminta tidak ditemukan atau Anda tidak memiliki
        akses.
      </p>
      <Button variant="outline" @click="goBackToGoals" class="mt-4 cursor-pointer">
        <ArrowLeft class="mr-2 h-4 w-4" /> Kembali
      </Button>
    </div>

    <ManageRiskCausesDialog
      v-if="selectedRiskForCauses"
      v-model="isManageCausesDialogOpen"
      :potential-risk="selectedRiskForCauses"
      :parent-goal-code="currentGoal?.code"
      @causes-updated="appStore.getGoalById(currentGoal.id)"
    />

    <AlertDialog
      :open="isDeleteRiskDialogOpen"
      @update:open="setIsDeleteRiskDialogOpen"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus Risiko</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus potensi risiko "{{
              riskToDelete?.description?.substring(0, 50)
            }}..."? Semua data penyebab dan rencana pengendalian terkait juga
            akan dihapus. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="cancelDeleteRisk">Batal</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDeleteRisk"
            class="bg-destructive hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog
      :open="isBrainstormDialogOpen"
      @update:open="setIsBrainstormDialogOpen"
    >
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Brainstorm Potensi Risiko dengan AI</DialogTitle>
          <DialogDescription>
            Sempurnakan konteks untuk AI dan tentukan jumlah saran yang
            diinginkan untuk sasaran "{{ currentGoal?.code }}".
          </DialogDescription>
        </DialogHeader>
        <p class="py-4">
          Formulir untuk input konteks AI dan jumlah saran akan ada di sini.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="setIsBrainstormDialogOpen(false)"
            >Batal</Button
          >
          <Button type="button" @click="submitBrainstormAI"
            >Mulai Brainstorm</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/global/PageHeader.vue'
import PotentialRiskCard from '@/components/risks/PotentialRiskCard.vue' // Ganti nama dari ListItem
import ManageRiskCausesDialog from '@/components/risks/ManageRiskCausesDialog.vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog' // Untuk Brainstorm Modal
import {
  PlusCircle,
  Loader2,
  ShieldOff,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  FlaskConical,
  Search as SearchIcon,
  LayoutGrid,
  List,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { RISK_CATEGORIES as riskCategoriesConstant } from '@/lib/types'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const authStore = useAuthStore()

const riskCategories = ref(
  riskCategoriesConstant || ['Operasional', 'Keuangan', 'Kepatuhan']
)

const route = useRoute()
const router = useRouter()
const goalId = ref(route.params.goalId)

const currentGoal = ref(null)
const pageLoading = ref(true)

// const isRiskDialogOpen = ref(false)
// const riskToEdit = ref(null)
const isDeleteRiskDialogOpen = ref(false)
const riskToDelete = ref(null)
const isBrainstormDialogOpen = ref(false)
const isManageCausesDialogOpen = ref(false)
const selectedRiskForCauses = ref(null)

const searchTerm = ref('')
const filterCategory = ref('all')
const filterOwner = ref('all')
// const viewMode = ref('grid'); // 'grid' atau 'list'

const selectedRisks = ref(new Set())

function navigateToAddPotentialRiskPage() {
  if (currentGoal.value?.id) {
    // Pastikan currentGoal sudah dimuat
    router.push(`/risks/${currentGoal.value.id}/add-potential-risk`)
  } else {
    toast.error('Error', {
      description: 'Tidak dapat menentukan sasaran untuk menambah risiko.',
    })
  }
}
function handleRiskAction(actionPayload) {
  const { type, risk } = actionPayload
  console.log('Risk action:', type, risk)
  switch (type) {
    case 'edit-details': // Menggantikan 'edit'
      // Jika Anda ingin halaman edit terpisah:
      // router.push(`/risks/${goalId.value}/edit-potential-risk/${risk.id}`);
      // Jika masih ingin dialog, Anda perlu state dan komponen dialog edit di sini.
      // Untuk sekarang, kita asumsikan edit juga akan menjadi halaman.
      toast.info('Edit Risiko', {
        description: `Navigasi ke halaman edit untuk risiko ID: ${risk.id}. (Belum diimplementasikan)`,
      })
      break
    // ... (aksi lainnya tetap sama: delete, analyze, manage-causes)
  }
}

async function fetchData() {
  console.log('Fetching data for goal ID:', goalId.value)
  pageLoading.value = true
  if (!goalId.value) {
    toast.error('Error', { description: 'ID Sasaran tidak valid.' })
    pageLoading.value = false
    router.push('/goals')
    return
  }

  const goal = await appStore.getGoalById(
    goalId.value,
    authStore.uprUser.id,
    authStore.uprUser.activePeriod
  )
  if (goal) {
    currentGoal.value = goal
  } else {
    currentGoal.value = null
    toast.error('Tidak Ditemukan', {
      description: 'Sasaran tidak ditemukan atau Anda tidak memiliki akses.',
    })
  }
  pageLoading.value = false
}

function openManageCausesDialog(risk) {
  selectedRiskForCauses.value = risk
  isManageCausesDialogOpen.value = true
}

onMounted(fetchData)

watch(
  () => route.params.goalId,
  (newGoalId) => {
    if (newGoalId && newGoalId !== goalId.value) {
      goalId.value = newGoalId
      selectedRisks.value.clear() // Bersihkan pilihan saat ganti sasaran
      fetchData()
    }
  }
)

const risksForCurrentGoal = computed(() => {
  if (!currentGoal.value || !Array.isArray(appStore.potentialRisks.value))
    return []
  return appStore.potentialRisks.value.filter(
    (pr) => pr.goalId === currentGoal.value.id
  )
})

const totalRisksForGoal = computed(() => risksForCurrentGoal.value.length)

const uniqueOwners = computed(() => {
  const owners = new Set(
    risksForCurrentGoal.value.map((r) => r.owner).filter(Boolean)
  )
  return Array.from(owners).sort()
})

const filteredAndSortedRisks = computed(() => {
  let risks = [...risksForCurrentGoal.value]
  if (filterCategory.value !== 'all') {
    risks = risks.filter((r) => r.category === filterCategory.value)
  }
  if (filterOwner.value !== 'all') {
    risks = risks.filter((r) => r.owner === filterOwner.value)
  }
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    risks = risks.filter(
      (r) =>
        r.description.toLowerCase().includes(term) ||
        (r.sequence_number &&
          `${currentGoal.value?.code}.PR${r.sequence_number}`
            .toLowerCase()
            .includes(term))
    )
  }
  return risks.sort(
    (a, b) => (a.sequence_number || 0) - (b.sequence_number || 0)
  )
})

const pageTitle = computed(() =>
  currentGoal.value
    ? `Potensi Risiko untuk Sasaran: ${currentGoal.value.code}`
    : 'Memuat Potensi Risiko...'
)
const pageDescription = computed(() =>
  currentGoal.value
    ? `${currentGoal.value.name} - ${currentGoal.value.description}`
    : 'Memuat detail sasaran...'
)
const breadcrumbItems = computed(() => [
  { label: 'Dasbor', path: '/' },
  { label: 'Sasaran', path: '/goals' },
  {
    label: currentGoal.value?.code || 'Risiko Sasaran',
    path: `/goals/${goalId.value}`,
    isCurrent: true,
  },
])

function goBackToGoals() {
  router.push('/goals')
}

function openAddRiskDialog() {
  riskToEdit.value = null
  isRiskDialogOpen.value = true
}

function openEditRiskDialog(risk) {
  riskToEdit.value = risk
  isRiskDialogOpen.value = true
}

async function handleRiskSave(riskDataPayload, isNew) {
  try {
    if (isNew) {
      const newRisk = await appStore.addPotentialRisk(
        riskDataPayload,
        goalId.value
      )
      toast.success('Risiko Ditambahkan', {
        description: `Potensi risiko "${newRisk.description.substring(
          0,
          30
        )}..." berhasil ditambahkan.`,
      })
    } else {
      const updatedRisk = await appStore.updatePotentialRisk(
        riskDataPayload.id,
        riskDataPayload
      )
      toast.success('Risiko Diperbarui', {
        description: `Potensi risiko "${updatedRisk.description.substring(
          0,
          30
        )}..." berhasil diperbarui.`,
      })
    }
  } catch (error) {
    toast.error('Gagal Menyimpan Risiko', {
      description: error.message || 'Terjadi kesalahan.',
    })
  }
  isRiskDialogOpen.value = false
}

function handleDeleteRiskClick(risk) {
  riskToDelete.value = risk
  isDeleteRiskDialogOpen.value = true
}
function setIsDeleteRiskDialogOpen(value) {
  // Untuk menutup dialog dari luar
  isDeleteRiskDialogOpen.value = value
  if (!value) riskToDelete.value = null
}

async function confirmDeleteRisk() {
  if (!riskToDelete.value) return
  try {
    await appStore.deletePotentialRisk(riskToDelete.value.id)
    toast.error('Risiko Dihapus', {
      description: `Potensi risiko "${riskToDelete.value.description.substring(
        0,
        30
      )}..." telah dihapus.`,
    })
  } catch (error) {
    toast.error('Gagal Menghapus Risiko', {
      description: error.message || 'Terjadi kesalahan.',
    })
  } finally {
    setIsDeleteRiskDialogOpen(false)
  }
}

function cancelDeleteRisk() {
  setIsDeleteRiskDialogOpen(false)
}

// function handleRiskAction(actionPayload) {
//   const { type, risk } = actionPayload
//   console.log('Risk action:', type, risk)
//   switch (type) {
//     case 'edit':
//       openEditRiskDialog(risk)
//       break
//     case 'delete':
//       handleDeleteRiskClick(risk)
//       break
//     case 'analyze':
//       toast.info('Analisis Risiko', {
//         description: `Fitur analisis untuk risiko ID: ${risk.id} akan dibuka.`,
//       })
//       // Implementasi modal analisis
//       break
//     case 'manage-causes':
//       openManageCausesDialog(risk)
//       break
//     case 'manage-details-and-causes':
//       toast.info('Kelola Detail & Penyebab', {
//         description: `Navigasi ke halaman detail risiko ID: ${risk.id}.`,
//       })
//       // router.push(`/all-risks/manage/${risk.id}`); // Contoh navigasi ke halaman manage detail
//       break
//     default:
//       console.warn('Aksi tidak dikenal pada item risiko:', type)
//   }
// }

function toggleRiskSelection(riskId, checked) {
  if (checked) {
    selectedRisks.value.add(riskId)
  } else {
    selectedRisks.value.delete(riskId)
  }
  console.log('Selected risks:', Array.from(selectedRisks.value))
}

function openBrainstormDialog() {
  isBrainstormDialogOpen.value = true
}
function setIsBrainstormDialogOpen(value) {
  isBrainstormDialogOpen.value = value
}
function submitBrainstormAI() {
  toast.info('Brainstorming AI', {
    description: 'Memulai proses brainstorm dengan AI...',
  })
  setIsBrainstormDialogOpen(false)
  // Logika pemanggilan AI akan ada di sini
}
</script>
