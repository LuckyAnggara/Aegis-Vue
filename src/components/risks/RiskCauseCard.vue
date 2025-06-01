<template>
  <Card class="p-4">
    <div class="flex justify-between items-start mb-3">
      <h2 class="font-semibold text-sm md:text-base leading-snug max-w-[90%]">
        {{ code }} - {{ description }}
      </h2>
      <Button variant="ghost" size="icon" class="text-muted-foreground">
        <Settings class="w-4 h-4" />
      </Button>
    </div>

    <div class="text-sm mb-2">
      <span class="font-medium">Sumber:</span>s
      <Badge variant="secondary" class="ml-2">{{ source }}</Badge>
    </div>

    <div class="text-sm mt-4">
      <p class="font-semibold">KRI:</p>
      <p>{{ kriDescription }}</p>
    </div>

    <div class="text-sm mt-3">
      <p class="font-semibold">Toleransi Risiko:</p>
      <p>{{ kriTolerance }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
      <div>
        <p class="text-sm font-medium text-muted-foreground">Kemungkinan:</p>
        <Badge variant="outline" class="bg-blue-100 text-blue-700">
          {{ likelihood }}
        </Badge>
      </div>

      <div>
        <p class="text-sm font-medium text-muted-foreground">Dampak:</p>
        <Badge variant="outline" class="bg-yellow-100 text-yellow-700">
          {{ impact }}
        </Badge>
      </div>

      <div>
        <p class="text-sm font-medium text-muted-foreground">Tingkat Risiko:</p>
        <Badge variant="outline" class="bg-orange-500 text-white">
          {{ riskLevel }}
        </Badge>
      </div>
    </div>

    <div class="mt-6">
      <Button variant="outline" class="w-full">
        <FileText class="mr-2 h-4 w-4" />
        Analisis Detail Penyebab
      </Button>
    </div>
  </Card>
</template>

<script setup>
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, FileText } from 'lucide-vue-next'
import {
  LIKELIHOOD_LEVELS_DESC_MAP,
  IMPACT_LEVELS_DESC_MAP,
  RISK_LEVELS_DESC_MAP,
} from '@/lib/types'

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

const code = props.riskCause.code || 'K1.PR3.PC1'
const description = props.riskCause.description || ''
const source = props.riskCause.source || 'Internal'

const kriDescription = props.riskCause.kriDescription || ''
const kriTolerance =
  props.riskCause.kriTolerance || 'Toleransi Risiko Tidak Ditetapkan'
const likelihood =
  LIKELIHOOD_LEVELS_DESC_MAP[props.riskCause.likelihood] || 'N/A'
const impact = IMPACT_LEVELS_DESC_MAP[props.riskCause.impact] || 'N/A'
const riskLevel = RISK_LEVELS_DESC_MAP[props.riskCause.riskLevel] || 'N/A'
</script>
