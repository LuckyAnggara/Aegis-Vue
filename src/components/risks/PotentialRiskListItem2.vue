<template>
  <div
    class="flex items-center justify-between p-3 border-b hover:bg-muted/50 transition-colors"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center mb-1">
        <Badge variant="outline" class="mr-2 whitespace-nowrap">{{
          risk.sequence_number
            ? `${parentGoalCode}.PR${risk.sequence_number}`
            : 'PR.?'
        }}</Badge>
        <p class="text-sm font-medium truncate" :title="risk.description">
          {{ risk.description }}
        </p>
      </div>
      <div class="text-xs text-muted-foreground space-x-2">
        <span
          >Kategori:
          <Badge variant="secondary" size="sm">{{
            risk.category || 'N/A'
          }}</Badge></span
        >
        <span>Pemilik: {{ risk.owner || 'N/A' }}</span>
        <span v-if="risk.likelihood && risk.impact">
          Level:
          <Badge
            :class="getRiskLevelBadgeColor(calculatedRiskLevel?.level)"
            size="sm"
            >{{ calculatedRiskLevel?.level || 'N/A' }} ({{
              calculatedRiskLevel?.score || 'N/A'
            }})</Badge
          >
        </span>
        <span v-else>
          Level: <Badge variant="outline" size="sm">Belum Dianalisis</Badge>
        </span>
      </div>
    </div>
    <div class="flex items-center space-x-1 ml-2 shrink-0">
      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="emitAction('analyze')"
              :disabled="!canAnalyze"
            >
              <Activity
                class="h-4 w-4"
                :class="{ 'text-primary': 'risk.likelihood && risk.impact' }"
              />
              <span class="sr-only">Analisis Risiko</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {{
                risk.likelihood && risk.impact
                  ? 'Lihat/Edit Analisis'
                  : 'Lakukan Analisis Risiko'
              }}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="emitAction('manage-causes')"
              :disabled="!canManageCauses"
            >
              <ListTree class="h-4 w-4" />
              <span class="sr-only">Kelola Penyebab</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Kelola Penyebab Risiko</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <MoreVertical class="h-4 w-4" />
            <span class="sr-only">Opsi Lain</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="emitAction('edit')">
            <Pencil class="mr-2 h-4 w-4" /> Edit Risiko
          </DropdownMenuItem>
          <DropdownMenuItem
            @click="emitAction('delete')"
            class="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 class="mr-2 h-4 w-4" /> Hapus Risiko
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge' // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/components/ui/badge.tsx]
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip' // [cite: luckyanggara/riskwise2/RiskWise2-17f824243bed5e00dc5ca1203f2543448443d719/src/components/ui/tooltip.tsx]
import {
  Activity,
  ListTree,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import { getCalculatedRiskLevel, getRiskLevelColor } from '@/lib/types' // Asumsi fungsi ini ada di types

const props = defineProps({
  risk: {
    // Objek PotentialRisk
    type: Object,
    required: true,
  },
  parentGoalCode: {
    type: String,
    default: 'G?',
  },
  // Flags untuk menonaktifkan tombol jika belum siap
  canAnalyze: { type: Boolean, default: true },
  canManageCauses: { type: Boolean, default: true },
})

const emit = defineEmits(['action']) // Emit satu event dengan tipe aksi

function emitAction(actionType) {
  emit('action', { type: actionType, riskId: props.risk.id, risk: props.risk })
}

const calculatedRiskLevel = computed(() => {
  if (props.risk.likelihood && props.risk.impact) {
    return getCalculatedRiskLevel(props.risk.likelihood, props.risk.impact)
  }
  return null
})

function getRiskLevelBadgeColor(level) {
  // Fungsi ini akan mengembalikan class Tailwind untuk warna badge
  // Anda perlu mengimplementasikannya di lib/utils.js atau lib/types
  // Contoh:
  // switch (level?.toLowerCase()) {
  //   case 'sangat tinggi': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500';
  //   // ... kasus lain
  //   default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500';
  // }
  const colorClasses = getRiskLevelColor(level) // Ambil dari types
  // Hapus bg- classes jika ada, karena Badge variant="outline" sudah punya background sendiri
  // atau buat variant Badge baru di Shadcn-Vue. Untuk sekarang, kita biarkan.
  return colorClasses
    .replace(/bg-\w+-\d{2,3}/g, '')
    .replace(/hover:bg-\w+-\d{2,3}/g, '')
}
</script>
