// src/services/controlMeasureService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import {
  DATABASE_ID,
  CONTROL_MEASURES_COLLECTION_ID,
} from './appwriteCollectionIds' // Pastikan path benar

export async function addControlMeasure(
  data,
  riskCauseId,
  potentialRiskId,
  goalId,
  userId,
  period,
  sequenceNumber
) {
  try {
    const docDataToSave = {
      description: data.description,
      riskCauseId: riskCauseId,
      potentialRiskId: potentialRiskId,
      goalId: goalId,
      userId: userId,
      period: period,
      controlType: data.controlType,
      sequenceNumber: sequenceNumber,
      keyControlIndicator: data.keyControlIndicator || null,
      target: data.target || null,
      responsiblePerson: data.responsiblePerson || null,
      deadline: data.deadline || null,
      budget: data.budget || null,
      // Appwrite otomatis menangani $createdAt dan $updatedAt
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      ID.unique(),
      docDataToSave
    )

    return {
      id: document.$id,
      description: document.description,
      riskCauseId: document.riskCauseId,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      controlType: document.controlType,
      sequenceNumber: document.sequenceNumber,
      keyControlIndicator: document.keyControlIndicator,
      target: document.target,
      responsiblePerson: document.responsiblePerson,
      deadline: document.deadline,
      budget: document.budget,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[controlMeasureService] Error adding control measure to Appwrite:',
      error
    )
    throw new Error(
      `Gagal menambahkan tindakan pengendalian ke database: ${error.message}`
    )
  }
}

export async function getControlMeasuresByRiskCauseId(
  riskCauseId,
  userId,
  period
) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      [
        Query.equal('riskCauseId', riskCauseId),
        Query.equal('userId', userId),
        Query.equal('period', period),
        // Appwrite Query tidak memiliki ORDER BY untuk multiple fields dengan tipe berbeda secara langsung
        // Anda mungkin perlu melakukan sorting di frontend jika urutan sangat penting
        // Untuk sekarang, kita akan urutkan berdasarkan controlType dan sequenceNumber di frontend (useAppStore)
      ]
    )

    const controlMeasures = response.documents.map((doc) => ({
      id: doc.$id,
      description: doc.description,
      riskCauseId: doc.riskCauseId,
      potentialRiskId: doc.potentialRiskId,
      goalId: doc.goalId,
      userId: doc.userId,
      period: doc.period,
      controlType: doc.controlType,
      sequenceNumber: doc.sequenceNumber,
      keyControlIndicator: doc.keyControlIndicator || null,
      target: doc.target || null,
      responsiblePerson: doc.responsiblePerson || null,
      deadline: doc.deadline || null,
      budget: doc.budget || null,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }))
    return controlMeasures
  } catch (error) {
    console.error(
      '[controlMeasureService] Error getting control measures from Appwrite:',
      error
    )
    throw new Error(
      `Gagal mengambil daftar tindakan pengendalian dari database: ${error.message}`
    )
  }
}

export async function getControlMeasureById(id, userId, period) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      id
    )
    if (document.userId !== userId || document.period !== period) {
      throw new Error(
        'Tindakan pengendalian tidak cocok dengan konteks pengguna/periode.'
      )
    }
    return {
      id: document.$id,
      description: document.description,
      riskCauseId: document.riskCauseId,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      controlType: document.controlType,
      sequenceNumber: document.sequenceNumber,
      keyControlIndicator: document.keyControlIndicator || null,
      target: document.target || null,
      responsiblePerson: document.responsiblePerson || null,
      deadline: document.deadline || null,
      budget: document.budget || null,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    if (error.code === 404) return null
    console.error(
      `[controlMeasureService] Error getting control measure by ID ${id} from Appwrite:`,
      error
    )
    throw new Error(
      `Gagal mengambil detail tindakan pengendalian: ${error.message}`
    )
  }
}

export async function updateControlMeasure(id, data) {
  try {
    const updatedDataPayload = {
      ...data,
      // Appwrite otomatis menangani $updatedAt
    }
    const document = await databases.updateDocument(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      id,
      updatedDataPayload
    )
    return {
      id: document.$id,
      description: document.description,
      riskCauseId: document.riskCauseId,
      potentialRiskId: document.potentialRiskId,
      goalId: document.goalId,
      userId: document.userId,
      period: document.period,
      controlType: document.controlType,
      sequenceNumber: document.sequenceNumber,
      keyControlIndicator: document.keyControlIndicator,
      target: document.target,
      responsiblePerson: document.responsiblePerson,
      deadline: document.deadline,
      budget: document.budget,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[controlMeasureService] Error updating control measure in Appwrite:',
      error
    )
    throw new Error(
      `Gagal memperbarui tindakan pengendalian di database: ${error.message}`
    )
  }
}

export async function deleteControlMeasure(id) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      CONTROL_MEASURES_COLLECTION_ID,
      id
    )
    return true
  } catch (error) {
    if (error.code === 404) {
      console.warn(
        `[controlMeasureService] ControlMeasure dengan ID ${id} tidak ditemukan saat mencoba menghapus.`
      )
      return
    }
    console.error(
      '[controlMeasureService] Error deleting control measure from Appwrite:',
      error
    )
    throw new Error(
      `Gagal menghapus tindakan pengendalian dari database: ${error.message}`
    )
  }
}
