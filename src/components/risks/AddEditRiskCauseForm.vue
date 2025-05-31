<template>
  <form @submit.prevent="handleSubmit" class="grid gap-4 py-4">
    <div class="space-y-1.5">
      <Label for="rc-description" class="font-semibold">Deskripsi Penyebab Risiko</Label>
      <Textarea
        id="rc-description"
        v-model="formData.description"
        placeholder="Jelaskan akar penyebab terjadinya potensi risiko..."
        :disabled="isSubmitting"
        :class="{'border-destructive': localErrors.description}"
        rows="4"
        class="text-sm"
      />
      <p v-if="localErrors.description" class="text-xs text-destructive mt-1">{{ localErrors.description }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <Label for="rc-category" class="font-semibold">Kategori Penyebab</Label>
        <Select v-model="formData.category" :disabled="isSubmitting">
          <SelectTrigger id="rc-category" :class="{'border-destructive': localErrors.category}">
            <SelectValue placeholder="Pilih kategori penyebab" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cat in riskCauseCategories" :key="cat" :value="cat">
              {{ cat }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="localErrors.category" class="text-xs text-destructive mt-1">{{ localErrors.category }}</p>
      </div>
      
      <div class="space-y-1.5">
        <Label for="rc-likelihood" class="font-semibold">Likelihood Penyebab Terjadi</Label>
        <Select v-model="formData.likelihood" :disabled="isSubmitting">
          <SelectTrigger id="rc-likelihood">
            <SelectValue placeholder="Pilih likelihood (opsional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="null" class="text-muted-foreground italic">_Tidak Dianalisis_</SelectItem>
            <SelectItem v-for="level in likelihoodLevels" :key="level" :value="level">
              {{ level }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <div class="space-y-1.5">
        <Label for="rc-impact-on-risk" class="font-semibold">Dampak Penyebab thd Risiko</Label>
        <Select v-model="formData.impact_on_risk" :disabled="isSubmitting">
            <SelectTrigger id="rc-impact-on-risk">
                <SelectValue placeholder="Pilih dampak thd risiko (opsional)" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem :value="null" class="text-muted-foreground italic">_Tidak Dianalisis_</SelectItem>
                <SelectItem v-for="level in impactLevels" :key="level" :value="level">
                    {{ level }}
                </SelectItem>
            </SelectContent>
        </Select>
    </div>

    <div class="space-y-1.5">
        <Label for="rc-analysis-notes" class="font-semibold">Catatan Analisis Penyebab</Label>
        <Textarea
            id="rc-analysis-notes"
            v-model="formData.analysis_notes"
            placeholder="Catatan tambahan mengenai analisis penyebab (opsional)..."
            :disabled="isSubmitting"
            rows="2"
            class="text-sm"
        />
    </div>

    <div class="flex justify-end space-x-2 pt-4">
      <Button type="button" variant="outline" @click="emitCancel" :disabled="isSubmitting">Batal</Button>
      <Button type="submit" :disabled="isSubmitting">
        <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
        {{ existingRiskCause ? 'Simpan Perubahan' : 'Simpan Penyebab' }}
      </Button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-vue-next';
import { 
    RISK_CAUSE_CATEGORIES as riskCauseCategoriesConstant, 
    LIKELIHOOD_LEVELS_DESC as likelihoodLevelsConstant,
    IMPACT_LEVELS_DESC as impactLevelsConstant 
} from '@/lib/types';

const props = defineProps({
    existingRiskCause: {
        type: Object,
        default: null
    },
    isSubmitting: Boolean,
});

const emit = defineEmits(['save', 'cancel']);

const riskCauseCategories = ref(riskCauseCategoriesConstant);
const likelihoodLevels = ref(likelihoodLevelsConstant);
const impactLevels = ref(impactLevelsConstant);

const formData = ref({
    description: '',
    category: null,
    likelihood: null,
    impact_on_risk: null,
    analysis_notes: '',
});

const localErrors = ref({ description: '', category: '' });

function populateForm() {
    if (props.existingRiskCause) {
        formData.value.description = props.existingRiskCause.description || '';
        formData.value.category = props.existingRiskCause.category || null;
        formData.value.likelihood = props.existingRiskCause.likelihood || null;
        formData.value.impact_on_risk = props.existingRiskCause.impact_on_risk || null;
        formData.value.analysis_notes = props.existingRiskCause.analysis_notes || '';
    } else {
        formData.value.description = '';
        formData.value.category = null;
        formData.value.likelihood = null;
        formData.value.impact_on_risk = null;
        formData.value.analysis_notes = '';
    }
    localErrors.value = { description: '', category: '' };
}

onMounted(populateForm);
watch(() => props.existingRiskCause, populateForm, { deep: true });


function validateCauseForm() {
  let isValid = true;
  localErrors.value = { description: '', category: '' };
  if (formData.value.description.trim().length < 5) {
    localErrors.value.description = "Deskripsi penyebab minimal 5 karakter.";
    isValid = false;
  }
  if (!formData.value.category) {
    localErrors.value.category = "Kategori penyebab harus dipilih.";
    isValid = false;
  }
  // Validasi lain bisa ditambahkan
  return isValid;
}

function handleSubmit() {
    if (!validateCauseForm()) return;
    emit('save', { ...formData.value });
}

function emitCancel() {
    emit('cancel');
}
</script>
