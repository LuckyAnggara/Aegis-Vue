// src/services/authService.js
import { account, databases } from '@/lib/appwrite/config'
import { ID, Query } from 'appwrite'
import { USERS_COLLECTION_ID, DATABASE_ID } from './appwriteCollectionIds' // Pastikan path ini benar
import { rand } from '@vueuse/core'

const DEFAULT_RISK_APPETITE = 5
const DEFAULT_MONITORING_SETTINGS = null

// Mirip dengan `getUserDocument`
export async function getAppUser(uid) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('uid', uid)]
    )
    if (response.documents.length > 0) {
      const data = response.documents[0]
      return {
        id: data.$id, // ID dokumen Appwrite
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        uprId: data.uprId,
        createdAt: data.createdAt, // Appwrite mengembalikan string ISO
        updatedAt: data.updatedAt,
      }
    }
    return null
  } catch (error) {
    console.error('[authService] Error getting AppUser from Appwrite:', error)
    throw new Error(`Gagal mengambil data pengguna: ${error.message}`)
  }
}

// Mirip dengan `checkAndCreateUserDocument` (bagian create)
export async function createNewAppUserDocument(
  appwriteUserId,
  email,
  displayName
) {
  try {
    const newUserDocData = {
      uid: appwriteUserId,
      email: email,
      displayName: displayName,
      photoURL: null,
      role: 'user', // Default role
      // Appwrite otomatis menangani $createdAt dan $updatedAt
    }
    const document = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(), // ID unik untuk dokumen Appwrite
      newUserDocData
    )
    return {
      id: document.$id,
      uid: document.uid,
      email: document.email,
      displayName: document.displayName,
      photoURL: document.photoURL,
      role: document.role,
      uprId: document.uprId,
      createdAt: document.$createdAt,
      updatedAt: document.$updatedAt,
    }
  } catch (error) {
    console.error(
      '[authService] Error creating new AppUser document in Appwrite:',
      error
    )
    throw new Error(`Gagal membuat dokumen pengguna baru: ${error.message}`)
  }
}

// Mirip dengan `updateUserProfileData`
export async function updateAppUserProfileData(uid, data) {
  try {
    // Kita perlu menemukan dokumen berdasarkan UID karena ID dokumen Appwrite unik ($id)
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.equal('uid', uid)]
    )
    if (response.documents.length === 0) {
      throw new Error(
        'Dokumen pengguna tidak ditemukan untuk UID yang diberikan.'
      )
    }
    const documentId = response.documents[0].$id // Dapatkan $id dokumen Appwrite

    const updates = {
      displayName:
        data.displayName !== undefined ? data.displayName : undefined,
      photoURL: data.photoURL !== undefined ? data.photoURL : undefined,
      uprId: data.uprId !== undefined ? data.uprId : undefined, // Sinkronkan uprId dengan displayName
    }

    // Hapus properti undefined agar tidak menimpa dengan null jika tidak ada perubahan
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    )

    await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      documentId,
      updates
    )
    return true
  } catch (error) {
    console.error(
      '[authService] Error updating AppUser profile in Appwrite:',
      error
    )
    throw new Error(`Gagal memperbarui profil pengguna: ${error.message}`)
  }
}

// --- Appwrite Authentication (Login/Register/Logout) ---

export async function registerWithEmailPassword(email, password, displayName) {
  try {
    const user = await account.create(ID.unique(), email, password, displayName)
    // Setelah membuat akun Appwrite, buat dokumen profil pengguna di database
    await createNewAppUserDocument(user.$id, email, displayName)
    return user
  } catch (error) {
    console.error(
      '[authService] Error registering with email/password in Appwrite:',
      error
    )
    throw new Error(`Registrasi gagal: ${error.message}`)
  }
}

export async function loginWithEmailPassword(email, password) {
  try {
    const session = await account.createEmailPasswordSession(email, password)
    return session
  } catch (error) {
    console.error(
      '[authService] Error logging in with email/password in Appwrite:',
      error
    )
    throw new Error(`Login gagal: ${error.message}`)
  }
}

export async function loginWithGoogle() {
  try {
    // Appwrite akan mengarahkan ke halaman Google, lalu kembali ke URL yang Anda tentukan
    // Pastikan URL redirect dikonfigurasi di Appwrite Console
    const session = await account.createOAuth2Session(
      'google',
      'http://localhost:5173/',
      'http://localhost:5173/login'
    ) // Ganti URL dengan URL aplikasi Anda
    return session
  } catch (error) {
    console.error(
      '[authService] Error logging in with Google in Appwrite:',
      error
    )
    throw new Error(`Login Google gagal: ${error.message}`)
  }
}

export async function logout() {
  try {
    await account.deleteSession('current') // Hapus sesi saat ini
    return true
  } catch (error) {
    console.error('[authService] Error logging out from Appwrite:', error)
    throw new Error(`Gagal keluar: ${error.message}`)
  }
}

export async function getCurrentAccount() {
  try {
    const user = await account.get()
    return user
  } catch (error) {
    if (error.code === 401) {
      // Unauthorized, session expired/no session
      return null
    }
    console.error(
      '[authService] Error getting current account from Appwrite:',
      error
    )
    throw new Error(`Gagal mendapatkan akun saat ini: ${error.message}`)
  }
}
