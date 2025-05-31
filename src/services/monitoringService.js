// src/services/monitoringService.js
import { databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import {
  DATABASE_ID,
  MONITORING_SESSIONS_COLLECTION_ID,
} from './appwriteCollectionIds' // Pastikan path benar

export async function addMonitoringSession(data, userId, period) {
  try {
    const docDataToSave = {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      userId: userId,
      period: period,
      // Appwrite otomatis menangani $createdAt dan $updatedAt
    }

    const document = await databases.createDocument(
      DATABASE_ID,
      MONITORING_SESSIONS_COLLECTION_ID,
      ID.unique(),
      docDataToSave
    )

    return {
      id: document.$id,
      name: document.name,
      startDate: document.startDate,
      endDate: document.endDate,
      status: document.status,
      userId: document.userId,
      period: document.period,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[monitoringService] Error adding monitoring session to Appwrite:',
      error
    )
    throw new Error(
      `Gagal menambahkan sesi pemantauan ke database: ${error.message}`
    )
  }
}

export async function getMonitoringSessions(userId, period) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MONITORING_SESSIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('period', period),
        Query.orderDesc('endDate'),
      ]
    )

    const sessions = response.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: doc.status,
      userId: doc.userId,
      period: doc.period,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    }))
    return sessions
  } catch (error) {
    console.error(
      '[monitoringService] Error getting monitoring sessions from Appwrite:',
      error
    )
    throw new Error(`Gagal mengambil daftar sesi pemantauan: ${error.message}`)
  }
}

export async function getMonitoringSessionById(sessionId, userId, period) {
  try {
    const document = await databases.getDocument(
      DATABASE_ID,
      MONITORING_SESSIONS_COLLECTION_ID,
      sessionId
    )
    if (document.userId !== userId || document.period !== period) {
      throw new Error(
        'Sesi pemantauan tidak cocok dengan konteks pengguna/periode.'
      )
    }
    return {
      id: document.$id,
      name: document.name,
      startDate: document.startDate,
      endDate: document.endDate,
      status: document.status,
      userId: document.userId,
      period: document.period,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    if (error.code === 404) return null
    console.error(
      `[monitoringService] Error getting monitoring session by ID ${sessionId} from Appwrite:`,
      error
    )
    throw new Error(`Gagal mengambil detail sesi pemantauan: ${error.message}`)
  }
}
