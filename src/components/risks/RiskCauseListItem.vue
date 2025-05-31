<template>
  <div
    class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center mb-1">
        <Badge variant="secondary" class="mr-2 whitespace-nowrap font-normal">
          {{
            parentPrCode
              ? `${parentPrCode}.C${riskCause.sequence_number}`
              : `C.${riskCause.sequence_number}`
          }}
        </Badge>
        <p class="text-sm truncate" :title="riskCause.description">
          {{ riskCause.description }}
        </p>
      </div>
      <div class="text-xs text-muted-foreground space-x-2">
        <span
          >Kategori:
          <Badge variant="outline" size="sm">{{
            riskCause.category || 'N/A'
          }}</Badge></span
        >
        <span v-if="riskCause.likelihood"
          >Likelihood Penyebab: {{ riskCause.likelihood }}</span
        >
      </div>
    </div>
    <div class="flex items-center space-x-1 ml-2 shrink-0">
      <TooltipProvider :delay-duration="200">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              @click="emitAction('analyze-cause')"
            >
              <FlaskConical
                class="h-4 w-4"
                :class="{
                  'text-primary':
                    riskCause.likelihood && riskCause.impact_on_risk,
                }"
              />
              <span class="sr-only">Analisis Penyebab</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {{
                riskCause.likelihood && riskCause.impact_on_risk
                  ? 'Lihat/Edit Analisis Penyebab'
                  : 'Lakukan Analisis Penyebab'
              }}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-7 w-7">
            <MoreVertical class="h-4 w-4" />
            <span class="sr-only">Opsi Lain</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="emitAction('edit-cause')">
            <Pencil class="mr-2 h-4 w-4" /> Edit Penyebab
          </DropdownMenuItem>
          <DropdownMenuItem @click="emitAction('manage-controls')">
            <ShieldCheck class="mr-2 h-4 w-4" /> Kelola Pengendalian
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            @click="emitAction('delete-cause')"
            class="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 class="mr-2 h-4 w-4" /> Hapus Penyebab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FlaskConical,
  MoreVertical,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-vue-next'

const props = defineProps({
  riskCause: {
    // Objek RiskCause
    type: Object,
    required: true,
  },
  parentPrCode: {
    // Kode Potensi Risiko Induk (misal: G1.PR1)
    type: String,
    default: 'PR.?',
  },
})

const emit = defineEmits(['action'])

function emitAction(actionType) {
  emit('action', {
    type: actionType,
    riskCauseId: props.riskCause.id,
    riskCause: props.riskCause,
  })
}
</script>
