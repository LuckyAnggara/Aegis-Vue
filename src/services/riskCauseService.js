// src/services/riskCauseService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import {
  DATABASE_ID,
  RISK_CAUSES_COLLECTION_ID,
  CONTROL_MEASURES_COLLECTION_ID,
} from './appwriteCollectionIds' // Pastikan path benar
import { deleteControlMeasure } from './controlMeasureService' // Untuk cascading delete

export async function addRiskCause(data, sequenceNumber) {
  try {
    const docDataToSave = {
      description: data.description,
      potentialRiskId: data.potentialRiskId,
      goalId: data.goalId,
      uprId: data.uprId,
      userId: data.userId,
      period: data.period,
      sequenceNumber: sequenceNumber,
      source: data.source,
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      ID.unique(),
      docDataToSave
    )

    return {
      id: document.$id,
      description: document.description,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      source: document.source,
      keyRiskIndicator: document.keyRiskIndicator,
      riskTolerance: document.riskTolerance,
      likelihood: document.likelihood,
      impact: document.impact,
      createdAt: document.$createdAt,
      analysisUpdatedAt: document.analysisUpdatedAt || null,
    }
  } catch (error) {
    console.error(
      '[riskCauseService] Error adding risk cause to Appwrite:',
      error
    )
    throw new Error(
      `Gagal menambahkan penyebab risiko ke database: ${error.message}`
    )
  }
}

export async function getRiskCausesByPotentialRiskId(
  potentialRiskId,
  uprId,
  period
) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      [
        Query.equal('potentialRiskId', potentialRiskId),
        Query.equal('uprId', uprId),
        Query.equal('period', period),
        Query.orderAsc('sequenceNumber'),
      ]
    )

    const riskCauses = response.documents.map((doc) => ({
      id: doc.$id,
      description: doc.description,
      potentialRiskId: doc.potentialRiskId,
      goalId: doc.goalId,
      userId: doc.userId,
      period: doc.period,
      sequenceNumber: doc.sequenceNumber,
      source: doc.source,
      keyRiskIndicator: doc.keyRiskIndicator || null,
      riskTolerance: doc.riskTolerance || null,
      likelihood: doc.likelihood || null,
      impact: doc.impact || null,
      createdAt: doc.$createdAt,
      analysisUpdatedAt: doc.analysisUpdatedAt || null,
    }))
    return riskCauses
  } catch (error) {
    console.error(
      '[riskCauseService] Error getting risk causes from Appwrite:',
      error
    )
    throw new Error(
      `Gagal mengambil daftar penyebab risiko dari database: ${error.message}`
    )
  }
}

export async function getRiskCauseById(id, userId, period) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      id
    )
    if (document.userId !== userId || document.period !== period) {
      throw new Error(
        'Penyebab risiko tidak cocok dengan konteks pengguna/periode.'
      )
    }
    return {
      id: document.$id,
      description: document.description,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      source: document.source,
      keyRiskIndicator: document.keyRiskIndicator || null,
      riskTolerance: document.riskTolerance || null,
      likelihood: document.likelihood || null,
      impact: document.impact || null,
      createdAt: document.$createdAt,
      analysisUpdatedAt: document.analysisUpdatedAt || null,
    }
  } catch (error) {
    if (error.code === 404) return null
    console.error(
      `[riskCauseService] Error getting risk cause by ID ${id} from Appwrite:`,
      error
    )
    throw new Error(`Gagal mengambil detail penyebab risiko: ${error.message}`)
  }
}

export async function updateRiskCause(id, data) {
  try {
    const updatedDataPayload = {
      ...data,
      // Appwrite otomatis menangani $updatedAt
    }
    const document = await databases.updateDocument(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      id,
      updatedDataPayload
    )
    return {
      id: document.$id,
      description: document.description,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      sequenceNumber: document.sequenceNumber,
      source: document.source,
      keyRiskIndicator: document.keyRiskIndicator,
      riskTolerance: document.riskTolerance,
      likelihood: document.likelihood,
      impact: document.impact,
      createdAt: document.$createdAt,
      analysisUpdatedAt: document.analysisUpdatedAt || null,
    }
  } catch (error) {
    console.error(
      '[riskCauseService] Error updating risk cause in Appwrite:',
      error
    )
    throw new Error(
      `Gagal memperbarui penyebab risiko di database: ${error.message}`
    )
  }
}

export async function deleteRiskCauseAndSubCollections(
  riskCauseId,
  userId,
  period
) {
  try {
    // Pastikan penyebab risiko milik pengguna dan periode yang benar
    const rcDoc = await databases.getDocument(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      riskCauseId
    )
    if (rcDoc.userId !== userId || rcDoc.period !== period) {
      throw new Error(
        'Operasi tidak diizinkan: penyebab risiko tidak cocok dengan konteks pengguna/periode.'
      )
    }

    // 1. Hapus ControlMeasures terkait
    const cmsResponse = await databases.listDocuments(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      [Query.equal('riskCauseId', riskCauseId)]
    )
    for (const cmDoc of cmsResponse.documents) {
      await deleteControlMeasure(cmDoc.$id) // Appwrite delete dokumen tunggal
    }

    // 2. Hapus dokumen RiskCause
    await databases.deleteDocument(
      DATABASE_ID,
      RISK_CAUSES_COLLECTION_ID,
      riskCauseId
    )
    return true
  } catch (error) {
    if (error.code === 404) {
      console.warn(
        `[riskCauseService] RiskCause dengan ID ${riskCauseId} tidak ditemukan saat mencoba menghapus.`
      )
      return
    }
    console.error(
      '[riskCauseService] Error deleting risk cause and its control measures from Appwrite:',
      error
    )
    throw new Error(
      `Gagal menghapus penyebab risiko dan tindakan pengendalian terkait: ${error.message}`
    )
  }
}
