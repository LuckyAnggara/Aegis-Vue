<template>
  <Card class="flex flex-col h-full">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <Target class="h-8 w-8 text-primary mb-2" />
        <div class="flex">
          <Button
            class="cursor-pointer"
            variant="ghost"
            size="icon"
            :aria-label="`Edit sasaran ${goal.name} (${goal.code})`"
            @click="emitEdit"
          >
            <Edit class="h-4 w-4" />
          </Button>
          <Button
            class="cursor-pointer"
            variant="ghost"
            size="icon"
            :aria-label="`Hapus sasaran ${goal.name} (${goal.code})`"
            @click.stop="emitDelete"
          >
            <Trash2 class="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <CardTitle class="text-lg">{{ goal.code }} - {{ goal.name }}</CardTitle>
      <CardDescription class="line-clamp-3 min-h-[30px] text-sm">
        {{ goal.description }}
      </CardDescription>
    </CardHeader>
    <CardContent class="flex-grow pt-0 pb-3">
      <p class="text-sm text-muted-foreground">
        Konteks Risiko: <Badge>{{ goal.riskContext }}</Badge>
      </p>
      <p class="text-sm text-muted-foreground mt-1">
        Dibuat: {{ formatDate(goal.created_at || goal.createdAt) }}
      </p>
      <p class="text-sm text-muted-foreground mt-1">
        {{ relatedRisksCount }} Potensi Risiko Teridentifikasi
      </p>
    </CardContent>
    <CardFooter class="flex justify-end items-center pt-0">
      <router-link :to="`/goal/${goal.id}`">
        <Button variant="outline" size="sm" class="cursor-pointer">
          <ShieldAlert class="mr-2 h-4 w-4" />
          Lihat Potensi Risiko
        </Button>
      </router-link>
    </CardFooter>
  </Card>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, ShieldAlert, Pencil, Trash2, Edit } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app' // Akan di-uncomment saat store siap
const appStore = useAppStore() // Simulasi store untuk demo

const props = defineProps({
  goal: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit-goal', 'delete-goal'])

const relatedRisksCount = computed(() => {
  // Saat store sebenarnya digunakan:
  return appStore.potentialRisks.filter((risk) => risk.goalId === props.goal.id)
    .length
})

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

function emitEdit() {
  emit('edit-goal', props.goal)
}

function emitDelete() {
  emit('delete-goal', props.goal.id)
}
</script>
