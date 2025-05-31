// src/lib/appwrite/config.js
import { Client, Account, Databases } from 'appwrite'

// Ganti dengan Project ID dan Endpoint Appwrite Anda
// Anda bisa mendapatkan ini dari Appwrite Console setelah membuat proyek baru
const client = new Client()

const APPWRITE_ENDPOINT = import.meta.env.VUE_APP_APPWRITE_PUBLIC_ENDPOINT
const APPWRITE_PROJECT_ID = import.meta.env.VUE_APP_APPWRITE_PROJECT_ID

client
  .setEndpoint(APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(APPWRITE_PROJECT_ID) // Your project ID

const account = new Account(client)
const databases = new Databases(client)

export { client, account, databases }
