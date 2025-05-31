// src/services/goalService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import { DATABASE_ID, UPR_COLLECTION_ID } from './appwriteCollectionIds' // Pastikan path benar

export async function addDocUpr(uprData, userId) {
  try {
    const docData = {
      uprId: ID.unique(),
      name: uprData.name,
      description: uprData.description,
      userId: userId,
      activePeriod: uprData.activePeriod, // Akan diisi saat setup profil
      availablePeriods: [], // Akan diisi saat setup profil
      riskAppetite: uprData.riskAppetite,
      monitoringSettings: uprData.monitoringSettings,
    }
    console.log('[uprService] Adding UPR to Appwrite:', docData)

    const document = await databases.createDocument(
      DATABASE_ID,
      UPR_COLLECTION_ID,
      ID.unique(), // ID unik untuk dokumen Appwrite
      docData
    )

    return {
      id: document.$id,
      uprId: document.uprId,
      name: document.name,
      description: document.description,
      userId: document.userId,
      activePeriod: document.activePeriod,
      availablePeriods: document.availablePeriods,
      riskAppetite: document.riskAppetite,
      monitoringSettings: document.monitoringSettings,
      createdAt: document.$createdAt, // Appwrite mengembalikan string ISO
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error('[uprService] Error adding UPR to Appwrite:', error)
    throw new Error(`Gagal menambahkan UPR ke database: ${error.message}`)
  }
}

export async function getUprs(userId, period) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      UPR_COLLECTION_ID,
      [
        Query.orderAsc('name'), // Urutkan berdasarkan nama
      ]
    )

    const uprs = response.documents.map((doc) => ({
      id: doc.$id,
      uprData: doc.uprId,
      name: doc.name,
      description: doc.description,
      userId: doc.userId,
      activePeriod: doc.activePeriod,
      availablePeriods: doc.availablePeriods,
      riskAppetite: doc.riskAppetite,
      monitoringSettings: doc.monitoringSettings,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }))

    return { success: true, uprs: uprs }
  } catch (error) {
    console.error('[uprService] Error getting uprs from Appwrite:', error)
    throw new Error(
      `Gagal mengambil daftar UPR dari database: ${error.message}`
    )
  }
}

export async function getUprById(id) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      UPR_COLLECTION_ID,
      id
    )

    return {
      id: document.$id,
      name: document.name,
      description: document.description,
      activePeriod: document.activePeriod,
      availablePeriods: document.availablePeriods,
      riskAppetite: document.riskAppetite,
      monitoringSettings: document.monitoringSettings,
      userId: document.userId,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    if (error.code === 404) return null // Dokumen tidak ditemukan
    console.error(
      `[uprService] Error getting UPR by ID ${id} from Appwrite:`,
      error
    )
    throw new Error(`Gagal mengambil detail UPR : ${error.message}`)
  }
}

export async function updateUpr(id, updatedData) {
  try {
    const document = await databases.updateDocument(
      DATABASE_ID,
      UPR_COLLECTION_ID,
      id,
      updatedData
    )
    return {
      id: document.$id,
      uprData: doc.uprId,

      name: document.name,
      description: document.description,
      activePeriod: document.activePeriod,
      availablePeriods: document.availablePeriods,
      riskAppetite: document.riskAppetite,
      monitoringSettings: document.monitoringSettings,

      userId: document.userId,
      createdAt: document.$createdAt,
      updatedAt: new Date().toISOString(), // Perbarui updatedAt secara manual
    }
  } catch (error) {
    console.error('[uprService] Error updating UPR in Appwrite:', error)
    throw new Error(`Gagal memperbarui UPR di database: ${error.message}`)
  }
}

export async function deleteUpr(id) {
  try {
    // Sebelum menghapus UPR, pastikan tidak ada sub-koleksi yang menggantung.
    // Di Appwrite, Anda perlu menghapus dokumen di sub-koleksi secara manual
    // atau menggunakan fungsi Cloud Appwrite jika ada logika cascading delete.
    // Untuk tujuan konversi ini, kita akan membuat fungsi delete cascading secara manual.

    // 1. Hapus PotentialRisks terkait
    const prsResponse = await databases.listDocuments(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      [Query.equal('uprId', id)]
    )
    // for (const prDoc of prsResponse.documents) {
    //   await deletePotentialRiskAndSubCollections(prDoc.$id, userId, period) // Rekursif
    // }

    // 2. Hapus dokumen UPR
    await databases.deleteDocument(DATABASE_ID, UPR_COLLECTION_ID, id)
    return true
  } catch (error) {
    console.error('[uprService] Error deleting UPR from Appwrite:', error)
    throw new Error(`Gagal menghapus UPR dan data terkait: ${error.message}`)
  }
}

// Impor kebutuhan untuk fungsi delete cascading
import { POTENTIAL_RISKS_COLLECTION_ID } from './appwriteCollectionIds'
import { deletePotentialRiskAndSubCollections } from './potentialRiskService'
