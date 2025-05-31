import AppLayout from '@/components/layout/AppLayout.vue'

const routes = [
  {
    path: '/',
    component: AppLayout, // Layout utama untuk halaman yang memerlukan autentikasi dan sidebar
    // meta: { requiresAuth: true }, // Akan kita tambahkan nanti untuk route guarding
    children: [
      {
        path: '', // Halaman default (Dashboard)
        name: 'dashboard',
        // component: HomeView, // Ganti dengan komponen Dashboard Anda nanti
        component: () => import('@/views/DashboardView.vue'), // Contoh lazy loading
        meta: {
          title: 'Dasbor Risiko',
          requiresAuth: true,
          requiresProfileComplete: true,
        },
      },
      {
        path: 'goals',
        name: 'Goals',
        // component: GoalsView,
        component: () => import('@/views/GoalsView.vue'),
        meta: {
          title: 'Dasbor Risiko',
          requiresAuth: true,
          requiresProfileComplete: true,
        },
      },
      {
        path: '/goal/:goalId', // Parameter dinamis goalId
        name: 'goal-risks',
        component: () => import('@/views/risks/GoalRisksView.vue'),
        props: true, // Ini akan meneruskan route.params sebagai props ke komponen
        meta: {
          requiresAuth: true,
          requiresProfileComplete: true,
          layout: 'DefaultLayout',
        },
      },
      {
        path: '/risks/:goalId/add-potential-risk', // Rute baru
        name: 'add-potential-risk',
        component: () => import('@/views/risks/AddPotentialRiskView.vue'),
        props: true, // Ini akan meneruskan route.params (termasuk goalId) sebagai props
        meta: {
          requiresAuth: true,
          requiresProfileComplete: true, // Asumsi menambah risiko butuh profil lengkap
          layout: 'DefaultLayout',
        },
      },
      // {
      //   path: 'all-risks',
      //   name: 'AllRisks',
      //   // component: AllRisksView,
      //   component: () => import('../views/AllRisksView.vue'),
      //   meta: { title: 'Identifikasi Risiko (Semua)' },
      // },
      // {
      //   // :potentialRiskId bisa 'new' atau ID spesifik
      //   path: 'all-risks/manage/:potentialRiskId',
      //   name: 'ManagePotentialRisk',
      //   // component: ManagePotentialRiskView,
      //   component: () => import('../views/ManagePotentialRiskView.vue'),
      //   props: true, // Mengirim params sebagai props ke komponen
      //   meta: { title: 'Kelola Potensi Risiko' },
      // },
      // {
      //   path: 'risks/:goalId', // Detail risiko per sasaran
      //   name: 'GoalRisks',
      //   // component: GoalRisksView,
      //   component: () => import('../views/GoalRisksView.vue'),
      //   props: true,
      //   meta: { title: 'Risiko Sasaran' },
      // },
      // {
      //   path: 'risk-analysis',
      //   name: 'RiskAnalysis',
      //   // component: RiskAnalysisView,
      //   component: () => import('../views/RiskAnalysisView.vue'),
      //   meta: { title: 'Analisis Risiko Penyebab' },
      // },
      // {
      //   path: 'risk-cause-analysis/:riskCauseId',
      //   name: 'RiskCauseAnalysis',
      //   // component: RiskCauseAnalysisView,
      //   component: () => import('../views/RiskCauseAnalysisView.vue'),
      //   props: true,
      //   meta: { title: 'Analisis Detail Penyebab Risiko' },
      // },
      // {
      //   path: 'control-measure-manage/:controlMeasureId',
      //   name: 'ManageControlMeasure',
      //   // component: ControlMeasureManageView,
      //   component: () => import('../views/ControlMeasureManageView.vue'),
      //   props: true,
      //   meta: { title: 'Kelola Tindakan Pengendalian' },
      // },
      // {
      //   path: 'risk-priority',
      //   name: 'RiskPriority',
      //   // component: RiskPriorityView,
      //   component: () => import('../views/RiskPriorityView.vue'),
      //   meta: { title: 'Prioritas Risiko' },
      // },
      // {
      //   path: 'settings',
      //   name: 'Settings',
      //   // component: SettingsView,
      //   component: () => import('../views/SettingsView.vue'),
      //   meta: { title: 'Pengaturan' },
      // },
      // Tambahkan route lainnya di sini
    ],
  },
  {
    path: '/login',
    name: 'login',
    // component: LoginView,
    component: () => import('@/views/LoginView.vue'),
    // meta: { guestOnly: true } // Untuk halaman yang hanya bisa diakses jika belum login
  },
  {
    path: '/register',
    name: 'register',
    // component: RegisterView,
    component: () => import('@/views/RegisterView.vue'),
    // meta: { guestOnly: true }
  },
  // Profile setup mungkin tidak lagi diperlukan jika alurnya dipindah ke /settings
  {
    path: '/profile-setup',
    name: 'profile-setup',
    component: () => import('@/views/ProfileSetupView.vue'),
    meta: { requiresAuth: true }, // Contoh meta
  },
]

export default routes
