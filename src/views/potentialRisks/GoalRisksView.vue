<template>
  <div class="space-y-6">
    <PageHeader
      :title="pageTitle"
      :description="pageDescription"
      :breadcrumbs="breadcrumbItems"
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
          Gunakan AI untuk brainstorming potensi risiko untuk sasaran
          <b>"{{ currentGoal?.code }} - {{ currentGoal?.name }}" </b>. Klik
          tombol di bawah untuk membuka dialog di mana Anda dapat menyempurnakan
          konteks untuk AI dan menentukan jumlah saran yang diinginkan.
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
        <div>
          <h3 class="text-lg font-semibold mr-2">
            Potensi Risiko Teridentifikasi ({{
              risksForCurrentGoal.length
            }}
            dari {{ totalRisksForGoal }})
          </h3>
        </div>
        <div class="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            class="cursor-pointer"
            :class="{ 'bg-muted': viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            ><LayoutGrid class="h-4 w-4"
          /></Button>
          <Button
            variant="ghost"
            size="icon"
            class="cursor-pointer"
            :class="{ 'bg-muted': viewMode === 'list' }"
            @click="viewMode = 'list'"
            ><List class="h-4 w-4"
          /></Button>
        </div>
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
            <PlusCircle class="mr-2 h-4 w-4" /> Identifikasi Potensi Risiko
            Pertama
          </Button>
        </div>
      </div>
      <div v-else>
        <div
          v-if="viewMode === 'grid'"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <PotentialRiskCard
            v-for="risk in filteredAndSortedRisks"
            :key="risk.id"
            :risk="risk"
            :potential-risk="risk"
            :isLoading="appStore.potentialRisksLoading"
            :parent-goal-code="currentGoal.code"
            :isSelected="selectedRisks.has(risk.id)"
            @update:selected="
              (checked) => toggleRiskSelection(risk.id, checked)
            "
            @action="handleRiskAction"
          />
        </div>
        <div class="w-full" v-else-if="viewMode === 'list'">
          <PotentialRiskTable
            :potentialRisksById="filteredAndSortedRisks"
            :parent-goal-code="currentGoal.code"
          />
        </div>
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
      <Button
        variant="outline"
        @click="goBackToGoals"
        class="mt-4 cursor-pointer"
      >
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

    <BrainstormContextModal
      v-model="isBrainstormDialogOpen"
      :goal="currentGoal"
      @submit-context="submitBrainstormAI"
      @update:open="setIsBrainstormDialogOpen"
    />
    <BrainstormSuggestionsModal
      v-model="isSuggestBrainstormDialogOpen"
      :goal="currentGoal"
      @update:open="isSuggestBrainstormDialogOpen = $event"
      @submit-suggestions="appStore.fetchPotentialRisks(goalId)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/global/PageHeader.vue'
import PotentialRiskCard from '@/components/risks/PotentialRiskCard.vue' // Ganti nama dari ListItem
import ManageRiskCausesDialog from '@/components/risks/ManageRiskCausesDialog.vue'
// import BrainstormContextModal from '@/components/risks/BrainstormContextModal.vue'
// import BrainstormSuggestionsModal from '@/components/risks/BrainstormSuggestionsModal.vue'
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
import PotentialRiskTable from '@/components/risks/PotentialRiskTable.vue'

const BrainstormContextModal = defineAsyncComponent(() =>
  import('@/components/risks/BrainstormContextModal.vue')
)
const BrainstormSuggestionsModal = defineAsyncComponent(() =>
  import('@/components/risks/BrainstormSuggestionsModal.vue')
)
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
const isSuggestBrainstormDialogOpen = ref(false)
const isManageCausesDialogOpen = ref(false)
const selectedRiskForCauses = ref(null)

const searchTerm = ref('')
const filterCategory = ref('all')
const filterOwner = ref('all')
const viewMode = ref('grid') // 'grid' atau 'list'

const selectedRisks = ref(new Set())

function navigateToAddPotentialRiskPage() {
  if (currentGoal.value?.id) {
    // Pastikan currentGoal sudah dimuat
    router.push(`/goal/${currentGoal.value.id}/potential-risk/add`)
  } else {
    toast.error('Error', {
      description: 'Tidak dapat menentukan sasaran untuk menambah risiko.',
    })
  }
}
function handleRiskAction(actionPayload) {
  const { type, riskId, potentialRisk } = actionPayload
  appStore.potentialRisk = potentialRisk
  switch (type) {
    case 'edit': // Menggantikan 'edit'
      // Jika Anda ingin halaman edit terpisah:
      router.push(`/goal/${goalId.value}/potential-risk/${riskId}/detail`)
      toast.info('Detail Risiko', {
        description: `Navigasi ke halaman detail untuk risiko ID: ${riskId}. (Belum diimplementasikan)`,
      })
      break
    // ... (aksi lainnya tetap sama: delete, analyze, manage-causes)
  }
}

async function fetchData() {
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

  if (!appStore.potentialRisksLoading) {
    await appStore.fetchPotentialRisks(goalId.value)
  }
  pageLoading.value = false
}

function openManageCausesDialog(risk) {
  selectedRiskForCauses.value = risk
  isManageCausesDialogOpen.value = true
}

onMounted(() => {
  if (appStore.potentialRisks.length < 1 || !appStore.potentialRisksLoading) {
    // Hanya ambil data jika belum ada atau sedang loading
    fetchData()
  } else {
  }
})

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
  if (!currentGoal.value || !Array.isArray(appStore.potentialRisks)) return []
  return appStore.potentialRisks.filter(
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
function openSuggestBrainstormDialog() {
  isSuggestBrainstormDialogOpen.value = true
}
function setIsBrainstormDialogOpen(value) {
  isBrainstormDialogOpen.value = value
}
function submitBrainstormAI() {
  toast.info('Brainstorming AI', {
    description: 'Memulai proses brainstorm dengan AI...',
  })
  setIsBrainstormDialogOpen(false)
  openSuggestBrainstormDialog()
  // Logika pemanggilan AI akan ada di sini
}
</script>
