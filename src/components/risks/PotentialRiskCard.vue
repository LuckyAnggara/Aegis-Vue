<template>
  <Card
    class="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200"
  >
    <CardHeader class="pb-2">
      <div class="flex items-start justify-between mb-1">
        <div class="flex items-center">
          <Checkbox
            :id="'potentialRisk-checkbox-' + potentialRisk.id"
            class="mr-2"
            :checked="isSelected"
            @update:checked="toggleSelection"
          />
          <Badge variant="outline" class="whitespace-nowrap font-semibold">
            {{
              potentialRisk.sequenceNumber
                ? `${parentGoalCode}.PR${potentialRisk.sequenceNumber}`
                : 'PR.?'
            }}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-7 w-7 cursor-pointer">
              <MoreVertical class="h-4 w-4" />
              <span class="sr-only">Opsi Lain</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              class="cursor-pointer"
              @click="emitAction('edit')"
            >
              <Pencil class="mr-2 h-4 w-4" /> Edit Detail Risiko
            </DropdownMenuItem>
            <DropdownMenuItem
              class="cursor-pointer"
              @click="emitAction('analyze')"
            >
              <Activity class="mr-2 h-4 w-4" />
              {{
                potentialRisk.likelihood && potentialRisk.impact
                  ? 'Lihat/Edit Analisis'
                  : 'Lakukan Analisis'
              }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              @click="emitAction('delete')"
              class="focus:bg-destructive focus:text-white text-destructive cursor-pointer"
            >
              <Trash2 class="mr-2 h-4 w-4 focus:text-white" />
              Hapus Risiko
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CardTitle
        class="text-base font-medium leading-tight line-clamp-2"
        :title="potentialRisk.description"
      >
        {{ potentialRisk.description }}
      </CardTitle>
      <CardDescription class="pt-1">
        <div class="text-xs text-muted-foreground space-y-0.5 mt-1">
          <div>
            <strong>Teridentifikasi:</strong>
            {{ formatDate(potentialRisk.identifiedAt) }}
          </div>
          <div class="flex flex-wrap gap-x-2 items-center">
            <div>
              <strong>Kategori:</strong>
              <Badge variant="secondary" class="text-xs font-normal">{{
                potentialRisk.category || 'N/A'
              }}</Badge>
            </div>
            <span class="text-muted-foreground/50">|</span>
            <div>
              <strong>Pemilik:</strong>
              <Badge variant="secondary" class="text-xs font-normal">{{
                potentialRisk.owner || 'N/A'
              }}</Badge>
            </div>
          </div>
        </div>
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 pt-2 pb-3 flex-grow">
      <div>
        <h4 class="text-sm font-semibold mb-1 flex items-center">
          <Zap class="h-4 w-4 mr-2 text-primary" />
          Penyebab Risiko:
          <Badge variant="outline" class="ml-1">{{ riskCausesCount }}</Badge>
        </h4>
        <Button
          v-if="riskCausesCount > 0"
          variant="link"
          size="sm"
          class="p-0 h-auto mt-1.5 text-primary hover:underline text-xs cursor-pointer"
          @click="emitAction('edit')"
          :disabled="isDeleting"
        >
          Lihat/Kelola Semua Penyebab
        </Button>
        <p v-else class="text-xs text-muted-foreground italic">
          Belum ada penyebab teridentifikasi.
        </p>
      </div>
    </CardContent>
    <CardFooter class="pt-2 pb-3 border-t flex-col items-stretch space-y-2">
      <Button
        variant="outline"
        size="sm"
        class="w-full justify-start cursor-pointer"
        @click="emitAction('edit')"
      >
        <ListTree class="mr-2 h-4 w-4" /> Lihat/Kelola Semua Penyebab
      </Button>
      <Button
        variant="default"
        size="sm"
        class="w-full justify-start"
        @click="emitAction('manage-details-and-causes')"
      >
        <Settings2 class="mr-2 h-4 w-4" /> Kelola Detail & Penyebab
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Zap,
  Settings2,
} from 'lucide-vue-next'
import { getCalculatedRiskLevel, getRiskLevelColor } from '@/lib/types' // Asumsi fungsi ini ada di types.js
import { useRouter } from 'vue-router'
const props = defineProps({
  potentialRisk: {
    type: Object,
    required: true,
  },
  parentGoalCode: {
    type: String,
    default: 'G?',
  },
  isSelected: {
    // Untuk checkbox jika ada fitur bulk action
    type: Boolean,
    default: false,
  },
})

const riskCausesCount = computed(() => {
  return props.potentialRisk.causes ? props.potentialRisk.causes.length : 0
})
const emit = defineEmits(['action', 'update:selected'])

function emitAction(actionType) {
  emit('action', {
    type: actionType,
    riskId: props.potentialRisk.id,
    potentialRisk: props.potentialRisk,
  })
}

function toggleSelection(checked) {
  emit('update:selected', checked)
}

const onDeletePotentialRisk = (potentialRisk) => {
  console.log('Delete', potentialRisk)
}

const router = useRouter()
const goToAnalysis = (id) => {
  router.push(
    `/potentialRisk-analysis?potentialRiskId=${id}&from=${encodeURIComponent(
      props.returnPath
    )}`
  )
}

const calculatedRiskLevel = computed(() => {
  if (props.potentialRisk.likelihood && props.potentialRisk.impact) {
    return getCalculatedRiskLevel(
      props.potentialRisk.likelihood,
      props.potentialRisk.impact
    )
  }
  return { level: 'N/A', score: 'N/A' } // Kembalikan objek default agar tidak error
})

function getRiskLevelBadgeColor(level) {
  const colorClasses = getRiskLevelColor(level) // Ambil dari types.js
  // Hapus bg- classes jika ada, karena Badge variant="outline" sudah punya background sendiri
  // atau buat variant Badge baru di Shadcn-Vue. Untuk sekarang, kita biarkan.
  // Ini mungkin perlu disesuaikan agar warna badge sesuai dengan gambar Anda.
  // Gambar Anda menggunakan warna solid untuk badge level risiko.
  // Fungsi getRiskLevelColor di types.js harus mengembalikan class yang sesuai,
  // misal 'bg-red-500 text-white', 'bg-yellow-400 text-black', dll.
  return colorClasses
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
</script>
