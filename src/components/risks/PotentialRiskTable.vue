<template>
  <Card class="w-full">
    <CardContent class="p-0">
      <div class="relative w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[40px] sticky left-2 bg-background z-10">
                <Checkbox
                  class="cursor-pointer"
                  :modelValue="checkboxAllState"
                  @update:modelValue="toggleSelectAll"
                  :disabled="
                    potentialRisks.length === 0 ||
                    !currentUser ||
                    isBulkDeleting
                  "
                  aria-label="Pilih semua risiko yang terlihat"
                />
              </TableHead>
              <TableHead class="w-[40px] sticky left-10 bg-background z-10" />
              <TableHead
                class="min-w-[120px] sticky left-[72px] bg-background z-10"
                >Kode PR</TableHead
              >
              <TableHead class="min-w-[300px]">Deskripsi</TableHead>
              <TableHead class="min-w-[120px]">Kategori</TableHead>
              <TableHead class="min-w-[150px]">Pemilik</TableHead>
              <TableHead class="min-w-[100px] text-center">Penyebab</TableHead>
              <TableHead
                class="text-right min-w-[100px] sticky right-0 bg-background z-10"
                >Aksi</TableHead
              >
            </TableRow>
          </TableHeader>

          <TableBody>
            <template v-for="pRisk in potentialRisks" :key="pRisk.id">
              <TableRow :class="isDeleting(pRisk.id) ? 'opacity-50' : ''">
                <TableCell class="sticky left-2 bg-background z-10">
                  <Checkbox
                    :modelValue="selectedRiskIds.includes(pRisk.id)"
                    @update:modelValue="(val) => toggleItem(pRisk.id, val)"
                    :disabled="!currentUser"
                    class="cursor-pointer"
                    aria-label="Pilih item"
                  />
                </TableCell>
                <TableCell class="sticky left-10 bg-background z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 cursor-pointer"
                    :disabled="isDeleting(pRisk.id)"
                    :aria-label="
                      expandedRiskId === pRisk.id
                        ? 'Sembunyikan deskripsi'
                        : 'Tampilkan deskripsi'
                    "
                    @click="toggleExpandRisk(pRisk.id)"
                  >
                    <component
                      :is="
                        expandedRiskId === pRisk.id ? ChevronUp : ChevronDown
                      "
                      class="h-4 w-4"
                    />
                  </Button>
                </TableCell>
                <TableCell
                  class="font-mono text-xs sticky left-[72px] bg-background z-10"
                >
                  {{
                    `${parentGoalCode || 'S?'}.PR${
                      pRisk.sequenceNumber || 'N/A'
                    }`
                  }}
                </TableCell>
                <TableCell
                  class="font-medium text-xs max-w-xs truncate"
                  :title="pRisk.description"
                >
                  {{ pRisk.description }}
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="pRisk.category ? 'secondary' : 'outline'"
                    class="text-xs"
                  >
                    {{ pRisk.category || 'N/A' }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="text-xs truncate max-w-[150px]"
                  :title="pRisk.owner || ''"
                >
                  {{ pRisk.owner || 'N/A' }}
                </TableCell>
                <TableCell class="text-center text-xs">
                  {{ riskCauseCounts[pRisk.id] || 0 }}
                </TableCell>
                <TableCell class="text-right sticky right-0 bg-background z-10">
                  <Loader2
                    v-if="isDeleting(pRisk.id)"
                    class="h-5 w-5 animate-spin mx-auto"
                  />
                  <DropdownMenu v-else>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 cursor-pointer"
                        :disabled="!currentUser"
                      >
                        <Settings2 class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        @click="
                          () =>
                            router.push(
                              `/all-risks/manage/${pRisk.id}?from=${returnPath}`
                            )
                        "
                      >
                        <Edit class="mr-2 h-4 w-4" /> Edit Detail & Penyebab
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="
                          () =>
                            router.push(
                              `/risk-analysis?potentialRisksId=${pRisk.id}&from=${returnPath}`
                            )
                        "
                      >
                        <BarChart3 class="mr-2 h-4 w-4" /> Analisis Semua
                        Penyebab
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="() => handleDuplicateRisk(pRisk.id)"
                        :disabled="!currentUser"
                      >
                        <Copy class="mr-2 h-4 w-4" /> Duplikat Risiko
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="() => handleDeleteSingleRisk(pRisk)"
                        class="text-destructive focus:text-destructive focus:bg-destructive/10"
                        :disabled="!currentUser"
                      >
                        <Trash2 class="mr-2 h-4 w-4" /> Hapus Potensi Risiko
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

              <TableRow
                v-if="expandedRiskId === pRisk.id"
                class="bg-muted/30 hover:bg-muted/40"
              >
                <TableCell class="sticky left-0 bg-muted/30 z-10" />
                <TableCell class="sticky left-10 bg-muted/30 z-10" />
                <TableCell class="sticky left-[72px] bg-muted/30 z-10" />
                <TableCell :colspan="5" class="p-0">
                  <div class="p-3 space-y-1 text-xs">
                    <h4 class="font-semibold text-foreground">
                      <strong>Potensi Risiko:</strong>
                    </h4>
                    <p class="text-muted-foreground whitespace-pre-wrap">
                      {{ pRisk.description }}
                    </p>
                    <div>
                      <strong>Teridentifikasi:</strong>
                      <p class="text-muted-foreground whitespace-pre-wrap">
                        {{ formatDate(pRisk.identifiedAt) }}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox' // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/components/ui/checkbox.tsx]
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Activity,
  ListTree,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Zap,
  BarChart3,
  Copy,
  ChevronDown,
  ChevronUp,
  Edit,
  ShieldCheck,
  Settings2,
} from 'lucide-vue-next'

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// Asumsi ada composable untuk auth
const router = useRouter()
const authStore = useAuthStore()
const props = defineProps({
  potentialRisksById: {
    type: Array,
    required: true,
    default: () => [],
  },
  parentGoalCode: {
    type: String,
    default: 'G?',
  },
})

const potentialRisks = computed(() => props.potentialRisksById || [])
const currentUser = computed(() => authStore.currentUser || null)

onMounted(() => {
  // Inisialisasi atau logika lain yang perlu dijalankan saat komponen dimuat
  console.log('PotentialRiskTable mounted with risks:', potentialRisks.value)
})
const emit = defineEmits(['action', 'update:selected'])

function emitAction(actionType) {
  emit('action', {
    type: actionType,
    riskId: potentialRisks.value.id,
    potentialRisks: potentialRisks.value,
  })
}

function toggleSelection(checked) {
  emit('update:selected', checked)
}

const onDeletepotentialRisks = (potentialRisks) => {
  console.log('Delete', potentialRisks)
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

const goal = ref({ code: 'G1', id: 1 })
const expandedRiskId = ref(null)
const isBulkDeleting = ref(false)
const selectedRiskIds = ref([])
const deletingRiskId = ref(null)
const riskCauseCounts = ref({})

const checkboxAllState = computed(() => {
  if (selectedRiskIds.value.length === 0) return false
  if (selectedRiskIds.value.length === potentialRisks.value.length) return true
  return 'indeterminate'
})

function toggleSelectAll(val) {
  if (val === true) {
    selectedRiskIds.value = potentialRisks.value.map((r) => r.id)
  } else {
    selectedRiskIds.value = []
  }
}

// toggle 1 item
function toggleItem(id, isChecked) {
  if (isChecked) {
    selectedRiskIds.value.push(id)
  } else {
    selectedRiskIds.value = selectedRiskIds.value.filter((rId) => rId !== id)
  }
}

function toggleExpandRisk(id) {
  expandedRiskId.value = expandedRiskId.value === id ? null : id
}

function isDeleting(id) {
  return (
    deletingRiskId.value === id ||
    (isBulkDeleting.value && selectedRiskIds.value.includes(id))
  )
}

function handleDuplicateRisk(id) {
  // logic
}
function handleDeleteSingleRisk(risk) {
  // logic
}

const returnPath = computed(() => `/risks/${goal.value.id}`)
</script>
