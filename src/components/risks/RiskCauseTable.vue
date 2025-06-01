<template>
  <Card class="w-full">
    <CardContent class="p-0">
      <div class="relative w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[40px] sticky left-0 bg-background z-10">
                <Checkbox
                  :checked="
                    selectedCauseIds.length ===
                      filteredAndSortedCauses.length &&
                    filteredAndSortedCauses.length > 0
                  "
                  :disabled="
                    filteredAndSortedCauses.length === 0 || !currentUser
                  "
                  aria-label="Pilih semua penyebab yang terlihat"
                  @change="
                    (e) => handleSelectAllVisibleCauses(e.target.checked)
                  "
                />
              </TableHead>
              <TableHead class="min-w-[120px] sticky left-10 bg-background z-10"
                >Kode</TableHead
              >
              <TableHead
                class="min-w-[250px] max-w-xs sticky left-[170px] bg-background z-10"
                >Penyebab Potensi Risiko</TableHead
              >
              <TableHead v-if="columnVisibility.sumber" class="min-w-[100px]"
                >Sumber</TableHead
              >
              <TableHead
                v-if="columnVisibility.kri"
                class="min-w-[180px] max-w-xs"
                >KRI</TableHead
              >
              <TableHead
                v-if="columnVisibility.toleransi"
                class="min-w-[180px] max-w-xs"
                >Toleransi</TableHead
              >
              <TableHead
                v-if="columnVisibility.kemungkinan"
                class="min-w-[150px]"
                >Kemungkinan</TableHead
              >
              <TableHead v-if="columnVisibility.dampak" class="min-w-[150px]"
                >Dampak</TableHead
              >
              <TableHead
                v-if="columnVisibility.tingkatRisiko"
                class="min-w-[150px]"
                >Tingkat Risiko</TableHead
              >
              <TableHead
                v-if="columnVisibility.potensiRisikoInduk"
                class="min-w-[250px] max-w-xs"
                >Potensi Risiko Induk</TableHead
              >
              <TableHead
                v-if="columnVisibility.sasaranInduk"
                class="min-w-[200px] max-w-sm"
                >Sasaran Induk</TableHead
              >
              <TableHead
                class="text-right w-[100px] sticky right-0 bg-background z-10 pr-4"
                >Aksi</TableHead
              >
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="cause in filteredAndSortedCauses" :key="cause.id">
              <TableCell class="sticky left-0 bg-background z-10">
                <Checkbox
                  :checked="selectedCauseIds.includes(cause.id)"
                  :disabled="!currentUser"
                  :aria-label="`Pilih penyebab ${cause.description}`"
                  @change="(e) => handleSelectCause(cause.id, e.target.checked)"
                />
              </TableCell>
              <TableCell
                class="text-xs font-mono sticky left-10 bg-background z-10"
              >
                {{ getCauseCode(cause) }}
              </TableCell>
              <TableCell
                class="font-medium text-xs max-w-xs truncate sticky left-[170px] bg-background z-10"
                :title="cause.description"
              >
                {{ cause.description }}
              </TableCell>
              <TableCell v-if="columnVisibility.sumber" class="text-xs">
                <Badge variant="outline">{{ cause.source }}</Badge>
              </TableCell>
              <TableCell
                v-if="columnVisibility.kri"
                class="text-xs max-w-xs truncate"
                :title="cause.keyRiskIndicator || ''"
              >
                {{ cause.keyRiskIndicator || '-' }}
              </TableCell>
              <TableCell
                v-if="columnVisibility.toleransi"
                class="text-xs max-w-xs truncate"
                :title="cause.riskTolerance || ''"
              >
                {{ cause.riskTolerance || '-' }}
              </TableCell>
              <TableCell v-if="columnVisibility.kemungkinan">
                <Badge
                  :variant="cause.likelihood ? 'outline' : 'ghost'"
                  class="text-xs"
                  :class="!cause.likelihood ? 'text-muted-foreground' : ''"
                >
                  {{
                    cause.likelihood
                      ? `${cause.likelihood} (${
                          LIKELIHOOD_LEVELS_DESC_MAP[cause.likelihood]
                        })`
                      : 'N/A'
                  }}
                </Badge>
              </TableCell>
              <TableCell v-if="columnVisibility.dampak">
                <Badge
                  :variant="cause.impact ? 'outline' : 'ghost'"
                  class="text-xs"
                  :class="!cause.impact ? 'text-muted-foreground' : ''"
                >
                  {{
                    cause.impact
                      ? `${cause.impact} (${
                          IMPACT_LEVELS_DESC_MAP[cause.impact]
                        })`
                      : 'N/A'
                  }}
                </Badge>
              </TableCell>
              <TableCell v-if="columnVisibility.tingkatRisiko">
                <Badge
                  :class="[
                    getRiskLevelColor(
                      getCalculatedRiskLevel(cause.likelihood, cause.impact)
                        .level
                    ),
                    'text-xs',
                  ]"
                >
                  {{
                    getCalculatedRiskLevel(cause.likelihood, cause.impact)
                      .level === 'N/A'
                      ? 'N/A'
                      : `${
                          getCalculatedRiskLevel(cause.likelihood, cause.impact)
                            .level
                        } (${
                          getCalculatedRiskLevel(cause.likelihood, cause.impact)
                            .score || 'N/A'
                        })`
                  }}
                </Badge>
              </TableCell>
              <TableCell
                v-if="columnVisibility.potensiRisikoInduk"
                class="text-xs max-w-xs truncate"
                :title="cause.potentialRiskDescription"
              >
                PR{{ cause.potentialRiskSequenceNumber || 'N/A' }} -
                {{ cause.potentialRiskDescription }}
                <Badge
                  v-if="cause.potentialRiskCategory"
                  variant="secondary"
                  class="ml-1 text-[10px]"
                >
                  {{ cause.potentialRiskCategory }}
                </Badge>
              </TableCell>
              <TableCell
                v-if="columnVisibility.sasaranInduk"
                class="text-xs max-w-sm truncate text-muted-foreground"
                :title="cause.goalName"
              >
                {{ getGoalCodeDisplay(cause.goalCode) }} - {{ cause.goalName }}
              </TableCell>
              <TableCell
                class="text-right sticky right-0 bg-background z-10 pr-4"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <Settings2 class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <RouterLink
                        :to="`/risk-cause-analysis/${
                          cause.id
                        }?from=${encodeURIComponent('/risk-analysis')}`"
                      >
                        <BarChart3 class="mr-2 h-4 w-4" /> Analisis Detail
                      </RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="() => handleDeleteSingleCause(cause)"
                      class="text-destructive focus:text-destructive focus:bg-destructive/10"
                      :disabled="!currentUser"
                    >
                      <Trash2 class="mr-2 h-4 w-4" /> Hapus Penyebab
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Settings2, BarChart3, Trash2 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Props or state
const selectedCauseIds = ref([])
const filteredAndSortedCauses = ref([])
const columnVisibility = ref({
  sumber: true,
  kri: true,
  toleransi: true,
  kemungkinan: true,
  dampak: true,
  tingkatRisiko: true,
  potensiRisikoInduk: true,
  sasaranInduk: true,
})
const currentUser = ref(true)

// Methods
const handleSelectAllVisibleCauses = (checked) => {
  /* ... */
}
const handleSelectCause = (id, checked) => {
  /* ... */
}
const handleDeleteSingleCause = (cause) => {
  /* ... */
}

const getCalculatedRiskLevel = (likelihood, impact) => {
  // return { level: 'Tinggi', score: 12 }
}
const getRiskLevelColor = (level) => {
  // return 'bg-yellow-200'
}
const getGoalCodeDisplay = (goalCode) => {
  return goalCode && goalCode.trim() !== '' ? goalCode : '[Tanpa Kode]'
}
const getCauseCode = (cause) => {
  const goalCode = getGoalCodeDisplay(cause.goalCode)
  return `${goalCode}.PR${cause.potentialRiskSequenceNumber || 'N/A'}.PC${
    cause.sequenceNumber || 'N/A'
  }`
}

// Constant Maps
const LIKELIHOOD_LEVELS_DESC_MAP = {
  /* ... */
}
const IMPACT_LEVELS_DESC_MAP = {
  /* ... */
}
</script>
