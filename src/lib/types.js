// src/lib/types.js

export const LIKELIHOOD_LEVELS_DESC_MAP = {
  'Hampir tidak terjadi (1)': 1,
  'Jarang terjadi (2)': 2,
  'Kadang Terjadi (3)': 3,
  'Sering terjadi (4)': 4,
  'Hampir pasti terjadi (5)': 5,
}
export const LIKELIHOOD_LEVELS_DESC = Object.keys(LIKELIHOOD_LEVELS_DESC_MAP)
export const NO_FREQUENCY_SENTINEL = 'Tidak Ada'
export const RISK_CAUSE_CATEGORIES = Object.freeze(['Internal', 'Eksternal'])

export const IMPACT_LEVELS_DESC_MAP = {
  'Tidak Signifikan (1)': 1,
  'Minor (2)': 2,
  'Moderat (3)': 3,
  'Signifikan (4)': 4,
  'Sangat Signifikan (5)': 5,
}
export const IMPACT_LEVELS_DESC = Object.keys(IMPACT_LEVELS_DESC_MAP)

export const RISK_CATEGORIES = [
  'Kebijakan',
  'Hukum',
  'Reputasi',
  'Kepatuhan',
  'Keuangan',
  'Fraud',
  'Operasional',
]

export const RISK_CONTEXT = [
  'Standar Kinerja',
  'Risiko Fraud',
  'Risiko Keuangan',
]

export const RISK_SOURCES = ['Internal', 'Eksternal']

export const CONTROL_MEASURE_TYPES = {
  Prv: 'Preventif',
  RM: 'Mitigasi Risiko',
  Crr: 'Korektif',
}
export const CONTROL_MEASURE_TYPE_KEYS = Object.keys(CONTROL_MEASURE_TYPES)

export const MONITORING_PERIOD_FREQUENCIES = [
  'Bulanan',
  'Triwulanan',
  'Semesteran',
  'Tahunan',
]

// Fungsi utilitas ini juga bisa dipindahkan ke sini atau ke file utils.js
export const getControlTypeName = (typeKey) => {
  return CONTROL_MEASURE_TYPES[typeKey]
}

export const getCalculatedRiskLevel = (likelihood, impact) => {
  if (!likelihood || !impact) return { level: 'N/A', score: null }

  const likelihoodValue = LIKELIHOOD_LEVELS_DESC_MAP[likelihood]
  const impactValue = IMPACT_LEVELS_DESC_MAP[impact]

  if (likelihoodValue === undefined || impactValue === undefined)
    return { level: 'N/A', score: null }

  const score = likelihoodValue * impactValue

  let level
  if (score >= 20) level = 'Sangat Tinggi'
  else if (score >= 16) level = 'Tinggi'
  else if (score >= 12) level = 'Sedang'
  else if (score >= 6) level = 'Rendah'
  else if (score >= 1) level = 'Sangat Rendah'
  else level = 'Sangat Rendah'

  return { level, score }
}

export const getRiskLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'sangat tinggi':
      return 'bg-red-600 hover:bg-red-700 text-white'
    case 'tinggi':
      return 'bg-orange-500 hover:bg-orange-600 text-white'
    case 'sedang':
      return 'bg-yellow-400 hover:bg-yellow-500 text-black dark:bg-yellow-500 dark:text-black'
    case 'rendah':
      return 'bg-blue-500 hover:bg-blue-600 text-white'
    case 'sangat rendah':
      return 'bg-green-500 hover:bg-green-600 text-white'
    default:
      return 'bg-gray-400 hover:bg-gray-500 text-white'
  }
}

export const getControlGuidance = (riskLevel) => {
  switch (riskLevel) {
    case 'Sangat Tinggi':
    case 'Tinggi':
      return 'Disarankan: Preventif (Prv), Mitigasi (RM), dan Korektif (Crr).'
    case 'Sedang':
      return 'Disarankan: Preventif (Prv) dan Mitigasi (RM).'
    case 'Rendah':
    case 'Sangat Rendah':
      return 'Disarankan: Preventif (Prv).'
    default:
      return 'Tentukan tingkat risiko penyebab terlebih dahulu untuk mendapatkan panduan pengendalian.'
  }
}
