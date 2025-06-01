<template>
  <div :class="cn('mb-6 md:mb-8', className)">
    <div class="flex flex-col gap-2">
      <!-- Breadcrumb -->
      <div>
        <Breadcrumb v-if="breadcrumbs && breadcrumbs.length">
          <BreadcrumbList>
            <BreadcrumbItem v-for="(crumb, index) in breadcrumbs" :key="index">
              <span v-if="crumb.isCurrent" class="text-muted-foreground">
                {{ crumb.label }}
              </span>
              <span v-else class="text-sm text-muted-foreground">
                <RouterLink :to="crumb.path" class="text-sm font-semibold">
                  {{ crumb.label }}
                </RouterLink>
              </span>

              <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1">
                <ChevronRight />
              </BreadcrumbSeparator>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div
        class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 class="text-xl font-bold tracking-tight md:text-2xl">
            {{ title }}
          </h1>
          <p v-if="description" class="mt-1 text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>
        <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import { cn } from '@/lib/utils' //
import { ChevronRight } from 'lucide-vue-next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

defineProps({
  title: { type: String, required: true },
  description: String,
  className: String,
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
})
</script>
