// src/services/goalService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import { DATABASE_ID, GOALS_COLLECTION_ID } from './appwriteCollectionIds' // Pastikan path benar

export async function addGoal(goalData, uprId, period) {
  try {
    // Appwrite tidak otomatis menghasilkan kode seperti Firebase (jika Anda punya logika di backend/trigger)
    // Untuk Vue JS, kita bisa generate di frontend atau biarkan user input.
    // Jika perlu auto-generate, Anda bisa panggil fungsi cloud Appwrite,
    // atau hitung manual di frontend (kurang disarankan untuk concurrency)
    // Untuk sementara, kita biarkan `code` datang dari goalData jika ada, atau tambahkan logic generation di sini.
    const newGoalCode = await generateGoalCode(uprId, period, goalData.name) // Fungsi bantu

    const docData = {
      name: goalData.name,
      description: goalData.description,
      code: newGoalCode,
      uprId: uprId,
      period: period,
      // Appwrite akan otomatis menambahkan $createdAt dan $updatedAt
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      ID.unique(), // ID unik untuk dokumen Appwrite
      docData
    )

    return {
      id: document.$id,
      name: document.name,
      description: document.description,
      code: document.code,
      uprId: document.uprId,
      period: document.period,
      createdAt: document.$createdAt, // Appwrite mengembalikan string ISO
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error('[goalService] Error adding goal to Appwrite:', error)
    throw new Error(`Gagal menambahkan sasaran ke database: ${error.message}`)
  }
}

async function generateGoalCode(uprId, period, goalName) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      [
        Query.equal('uprId', uprId),
        Query.equal('period', period),
        Query.orderDesc('$createdAt'), // Urutkan untuk mendapatkan kode terbaru
      ]
    )

    const existingCodes = response.documents
      .map((doc) => doc.code)
      .filter((code) => code && typeof code === 'string')

    let maxNum = 0
    const firstLetter = goalName.charAt(0).toUpperCase()
    const prefix = /^[A-Z]$/.test(firstLetter) ? firstLetter : 'S'

    existingCodes.forEach((code) => {
      if (code.startsWith(prefix)) {
        const numPart = parseInt(code.substring(prefix.length), 10)
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart
        }
      }
    })
    const newNumericPart = maxNum + 1
    return `${prefix}${newNumericPart}`
  } catch (error) {
    console.error('[goalService] Error generating goal code:', error)
    // Fallback jika gagal generate, atau throw error jika ini kritis
    return `S${Math.floor(Math.random() * 1000)}`
  }
}

export async function getGoals(uprId, period) {
  try {
    if (!uprId || !period) {
      console.warn('[goalService] getGoals: uprId or period is missing.')
      return {
        success: false,
        message: 'Konteks pengguna tidak tersedia.',
        goals: [],
      }
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      [
        Query.equal('uprId', uprId),
        Query.equal('period', period),
        Query.orderAsc('code'), // Urutkan berdasarkan kode
      ]
    )

    const goals = response.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description,
      code: doc.code,
      uprId: doc.uprId,
      period: doc.period,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }))

    return { success: true, goals: goals }
  } catch (error) {
    console.error('[goalService] Error getting goals from Appwrite:', error)
    throw new Error(
      `Gagal mengambil daftar sasaran dari database: ${error.message}`
    )
  }
}

export async function getGoalById(id, uprId, period) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      id
    )
    if (document.uprId !== uprId || document.period !== period) {
      throw new Error('Sasaran tidak cocok dengan konteks pengguna/periode.')
    }
    return {
      id: document.$id,
      name: document.name,
      description: document.description,
      code: document.code,
      uprId: document.uprId,
      period: document.period,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    if (error.code === 404) return null // Dokumen tidak ditemukan
    console.error(
      `[goalService] Error getting goal by ID ${id} from Appwrite:`,
      error
    )
    throw new Error(`Gagal mengambil detail sasaran: ${error.message}`)
  }
}

export async function updateGoal(id, updatedData) {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      GOALS_COLLECTION_ID,
      id,
      updatedData
    )
    return {
      id: document.$id,
      name: document.name,
      description: document.description,
      code: document.code,
      uprId: document.uprId,
      period: document.period,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error('[goalService] Error updating goal in Appwrite:', error)
    throw new Error(`Gagal memperbarui sasaran di database: ${error.message}`)
  }
}

export async function deleteGoal(id, uprId, period) {
  try {
    // Sebelum menghapus sasaran, pastikan tidak ada sub-koleksi yang menggantung.
    // Di Appwrite, Anda perlu menghapus dokumen di sub-koleksi secara manual
    // atau menggunakan fungsi Cloud Appwrite jika ada logika cascading delete.
    // Untuk tujuan konversi ini, kita akan membuat fungsi delete cascading secara manual.

    // 1. Hapus PotentialRisks terkait
    const prsResponse = await databases.listDocuments(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      [Query.equal('goalId', id)]
    )
    for (const prDoc of prsResponse.documents) {
      await deletePotentialRiskAndSubCollections(prDoc.$id, uprId, period) // Rekursif
    }

    // 2. Hapus dokumen Goal
    await databases.deleteDocument(DATABASE_ID, GOALS_COLLECTION_ID, id)
    return true
  } catch (error) {
    console.error('[goalService] Error deleting goal from Appwrite:', error)
    throw new Error(
      `Gagal menghapus sasaran dan data terkait: ${error.message}`
    )
  }
}

// Impor kebutuhan untuk fungsi delete cascading
import { POTENTIAL_RISKS_COLLECTION_ID } from './appwriteCollectionIds'
import { deletePotentialRiskAndSubCollections } from './potentialRiskService'
