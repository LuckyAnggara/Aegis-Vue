<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogTrigger as-child>
      <slot>
        <Button
          :disabled="
            !authStore?.isAuthenticated || !authStore?.isProfileComplete
          "
        >
          <component
            :is="existingGoal ? Pencil : PlusCircle"
            class="mr-2 h-4 w-4"
          />
          {{ dialogTitleComputed }}
        </Button>
      </slot>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle>{{ dialogTitleComputed }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescriptionComputed }}
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="onSubmit" class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="goal-name" class="text-right"> Nama </Label>
          <div class="col-span-3">
            <Input
              id="goal-name"
              v-model="formData.name"
              placeholder="Nama sasaran strategis"
              :disabled="isSubmitting"
              :class="{ 'border-destructive': errors.name }"
            />
            <p v-if="errors.name" class="text-xs text-destructive mt-1">
              {{ errors.name }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="goal-description" class="text-right"> Deskripsi </Label>
          <div class="col-span-3">
            <Textarea
              id="goal-description"
              v-model="formData.description"
              placeholder="Deskripsikan sasaran secara detail"
              :disabled="isSubmitting"
              :class="{ 'border-destructive': errors.description }"
              rows="3"
            />
            <p v-if="errors.description" class="text-xs text-destructive mt-1">
              {{ errors.description }}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="closeDialog"
            :disabled="isSubmitting"
          >
            Batal
          </Button>
          <Button
            type="submit"
            :disabled="
              isSubmitting ||
              !authStore?.isAuthenticated ||
              !authStore?.isProfileComplete
            "
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <Save v-else class="mr-2 h-4 w-4" />
            {{ existingGoal ? 'Simpan Perubahan' : 'Simpan Sasaran' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { Button } from '@/components/ui/button' //
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog' //
import { Input } from '@/components/ui/input' //
import { Label } from '@/components/ui/label' //
import { Textarea } from '@/components/ui/textarea' //
import { PlusCircle, Pencil, Loader2, Save } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth' // Akan di-uncomment jika logika auth diperlukan
import { toast } from 'vue-sonner' // Akan di-uncomment untuk notifikasi

const authStore = useAuthStore() // Ambil store auth jika diperlukan
// Untuk simulasi, kita buat dummy authStore

const props = defineProps({
  existingGoal: {
    type: Object,
    default: null,
  },
  modelValue: Boolean, // Untuk v-model:open
})

const emit = defineEmits(['update:modelValue', 'save'])

const isOpen = ref(props.modelValue || false)
const formData = ref({ name: '', description: '' })
const errors = ref({ name: '', description: '' })
const isSubmitting = ref(false)

const dialogTitleComputed = computed(() => {
  const codeDisplay = props.existingGoal?.code || '(Kode Baru)'
  return props.existingGoal
    ? `Edit Sasaran (${codeDisplay})`
    : 'Tambah Sasaran Baru'
})

const dialogDescriptionComputed = computed(() => {
  const upr = authStore.uprUser.name || '...'
  const period = authStore.uprUser.activePeriod || '...'
  return props.existingGoal
    ? `Perbarui detail sasaran "${props.existingGoal.name}".`
    : `Definisikan sasaran baru untuk UPR: ${upr}, Periode: ${period}.`
})

watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
  }
)

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
  if (newVal) {
    if (props.existingGoal) {
      formData.value.name = props.existingGoal.name
      formData.value.description = props.existingGoal.description
    } else {
      formData.value.name = ''
      formData.value.description = ''
    }
    errors.value = { name: '', description: '' }
  }
})

function handleOpenChange(openState) {
  isOpen.value = openState
  if (!openState) emit('update:modelValue', false)
}

function validateForm() {
  let isValid = true
  errors.value = { name: '', description: '' }
  if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Nama sasaran minimal 3 karakter.' //
    isValid = false
  }
  if (formData.value.description.trim().length < 10) {
    errors.value.description = 'Deskripsi minimal 10 karakter.' //
    isValid = false
  }
  return isValid
}

async function onSubmit() {
  if (!validateForm()) return

  // Simulasi logika auth store jika diperlukan
  if (!authStore.isAuthenticated || !authStore.isProfileComplete) {
    toast.error('Error', {
      description: 'Konteks pengguna atau periode tidak valid.',
    })
    return
  }

  isSubmitting.value = true
  // Simulasi pemanggilan store/API
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const goalDataPayload = {
    name: formData.value.name,
    description: formData.value.description,
  }

  // Emit data ke parent
  emit('save', goalDataPayload, !props.existingGoal)
  isSubmitting.value = false
  closeDialog()
}

function closeDialog() {
  isOpen.value = false
  emit('update:modelValue', false)
}
</script>
