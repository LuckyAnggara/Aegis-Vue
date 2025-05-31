// src/services/potentialRiskService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import {
  DATABASE_ID,
  POTENTIAL_RISKS_COLLECTION_ID,
  RISK_CAUSES_COLLECTION_ID,
} from './appwriteCollectionIds' // Pastikan path benar
import { deleteRiskCauseAndSubCollections } from './riskCauseService' // Untuk cascading delete

export async function addPotentialRisk(
  data,
  goalId,
  userId,
  period,
  sequenceNumber
) {
  try {
    const docDataToSave = {
      description: data.description,
      goalId: goalId,
      userId: userId,
      period: period,
      sequenceNumber: sequenceNumber,
      category: data.category || null,
      owner: data.owner || null,
      // Appwrite otomatis menangani $createdAt dan $updatedAt
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      ID.unique(),
      docDataToSave
    )

    return {
      id: document.$id,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      description: document.description,
      category: document.category,
      owner: document.owner,
      identifiedAt: document.$createdAt, // Appwrite creation timestamp
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[potentialRiskService] Error adding potential risk to Appwrite:',
      error
    )
    throw new Error(
      `Gagal menambahkan potensi risiko ke database: ${error.message}`
    )
  }
}

export async function getPotentialRisksByGoalId(goalId, userId, period) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      [
        Query.equal('goalId', goalId),
        Query.equal('userId', userId),
        Query.equal('period', period),
        Query.orderAsc('sequenceNumber'),
      ]
    )

    const potentialRisks = response.documents.map((doc) => ({
      id: doc.$id,
      goalId: doc.goalId,
      userId: doc.userId,
      period: doc.period,
      sequenceNumber: doc.sequenceNumber,
      description: doc.description,
      category: doc.category,
      owner: doc.owner,
      identifiedAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }))
    return potentialRisks
  } catch (error) {
    console.error(
      '[potentialRiskService] Error getting potential risks from Appwrite:',
      error
    )
    throw new Error(
      `Gagal mengambil daftar potensi risiko dari database: ${error.message}`
    )
  }
}

export async function getPotentialRiskById(id, userId, period) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      id
    )
    if (document.userId !== userId || document.period !== period) {
      throw new Error(
        'Potensi risiko tidak cocok dengan konteks pengguna/periode.'
      )
    }
    return {
      id: document.$id,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      description: document.description,
      category: document.category,
      owner: document.owner,
      identifiedAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    if (error.code === 404) return null
    console.error(
      `[potentialRiskService] Error getting potential risk by ID ${id} from Appwrite:`,
      error
    )
    throw new Error(`Gagal mengambil detail potensi risiko: ${error.message}`)
  }
}

export async function updatePotentialRisk(id, updatedData) {
  try {
    // Appwrite tidak otomatis memperbarui updatedAt, jadi jika ada field
    // yang harus diperbarui, Anda perlu menambahkannya ke updatedData
    // sebelum memanggil updateDocument.
    const document = await databases.updateDocument(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      id,
      updatedData
    )
    return {
      id: document.$id,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      description: document.description,
      category: document.category,
      owner: document.owner,
      identifiedAt: document.$createdAt,
      updatedAt: document.$updatedAt, // Appwrite akan mengupdate ini secara otomatis
    }
  } catch (error) {
    console.error(
      '[potentialRiskService] Error updating potential risk in Appwrite:',
      error
    )
    throw new Error(
      `Gagal memperbarui potensi risiko di database: ${error.message}`
    )
  }
}

export async function deletePotentialRiskAndSubCollections(
  potentialRiskId,
  userId,
  period
) {
  try {
    // Pastikan potensi risiko milik pengguna dan periode yang benar
    const prDoc = await databases.getDocument(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      potentialRiskId
    )
    if (prDoc.userId !== userId || prDoc.period !== period) {
      throw new Error(
        'Operasi tidak diizinkan: potensi risiko tidak cocok dengan konteks pengguna/periode.'
      )
    }

    // 1. Hapus RiskCauses terkait
    const rcsResponse = await databases.listDocuments(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      [Query.equal('potentialRiskId', potentialRiskId)]
    )
    for (const rcDoc of rcsResponse.documents) {
      await deleteRiskCauseAndSubCollections(rcDoc.$id, userId, period) // Rekursif
    }

    // 2. Hapus dokumen PotentialRisk
    await databases.deleteDocument(
      DATABASE_ID,
      POTENTIAL_RISKS_COLLECTION_ID,
      potentialRiskId
    )
    return true
  } catch (error) {
    if (error.code === 404) {
      console.warn(
        `[potentialRiskService] PotentialRisk dengan ID ${potentialRiskId} tidak ditemukan saat mencoba menghapus.`
      )
      return // Tidak perlu melempar error jika dokumen tidak ada
    }
    console.error(
      '[potentialRiskService] Error deleting potential risk and its sub-collections from Appwrite:',
      error
    )
    throw new Error(
      `Gagal menghapus potensi risiko dan data terkaitnya: ${error.message}`
    )
  }
}
