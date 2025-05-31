// src/services/riskExposureService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import {
  DATABASE_ID,
  RISK_EXPOSURES_COLLECTION_ID,
} from './appwriteCollectionIds' // Pastikan path benar

export async function getRiskExposuresBySession(
  monitoringSessionId,
  userId,
  period
) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      RISK_EXPOSURES_COLLECTION_ID,
      [
        Query.equal('monitoringSessionId', monitoringSessionId),
        Query.equal('userId', userId),
        Query.equal('period', period),
        Query.orderAsc('riskCauseId'), // Urutkan berdasarkan riskCauseId
      ]
    )

    const exposures = response.documents.map((doc) => ({
      id: doc.$id,
      monitoringSessionId: doc.monitoringSessionId,
      riskCauseId: doc.riskCauseId,
      potentialRiskId: doc.potentialRiskId,
      goalId: doc.goalId,
      userId: doc.userId,
      period: doc.period,
      exposureValue: doc.exposureValue || null,
      exposureUnit: doc.exposureUnit || null,
      exposureNotes: doc.exposureNotes || null,
      recordedAt: doc.$createdAt,
      monitoredControls: doc.monitoredControls || [],
      updatedAt: doc.$updatedAt,
    }))
    return exposures
  } catch (error) {
    console.error(
      '[riskExposureService] Error getting risk exposures from Appwrite:',
      error
    )
    throw new Error(`Gagal mengambil data paparan risiko: ${error.message}`)
  }
}

export async function upsertRiskExposure(data) {
  try {
    const docId = `${data.monitoringSessionId}_${data.riskCauseId}` // ID gabungan untuk unik

    // Cek apakah dokumen sudah ada
    const existingDoc = await databases
      .listDocuments(DATABASE_ID, RISK_EXPOSURES_COLLECTION_ID, [
        Query.equal('monitoringSessionId', data.monitoringSessionId),
        Query.equal('riskCauseId', data.riskCauseId),
      ])
      .then((response) => response.documents[0] || null)

    const docDataToSave = {
      monitoringSessionId: data.monitoringSessionId,
      riskCauseId: data.riskCauseId,
      potentialRiskId: data.potentialRiskId,
      goalId: data.goalId,
      userId: data.userId,
      period: data.period,
      exposureValue: data.exposureValue,
      exposureUnit: data.exposureUnit,
      exposureNotes: data.exposureNotes,
      monitoredControls: data.monitoredControls,
      // Appwrite otomatis menangani $createdAt dan $updatedAt
    }

    let document
    if (existingDoc) {
      document = await databases.updateDocument(
        DATABASE_ID,
        RISK_EXPOSURES_COLLECTION_ID,
        existingDoc.$id,
        docDataToSave
      )
    } else {
      document = await databases.createDocument(
        DATABASE_ID,
        RISK_EXPOSURES_COLLECTION_ID,
        ID.unique(), // Gunakan ID.unique() karena kita tidak bisa set $id secara langsung
        docDataToSave
      )
    }

    return {
      id: document.$id,
      monitoringSessionId: document.monitoringSessionId,
      riskCauseId: document.riskCauseId,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      exposureValue: document.exposureValue,
      exposureUnit: document.exposureUnit,
      exposureNotes: document.exposureNotes,
      recordedAt: document.$createdAt,
      monitoredControls: document.monitoredControls,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[riskExposureService] Error upserting risk exposure to Appwrite:',
      error
    )
    throw new Error(`Gagal menyimpan data paparan risiko: ${error.message}`)
  }
}
