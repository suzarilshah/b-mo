import { Client, Account, Storage, Functions } from 'appwrite'
import { env } from '../config/env'

// Initialize Appwrite client
export const appwriteClient = new Client()
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId)

// Initialize Appwrite services
export const appwriteAccount = new Account(appwriteClient)
export const appwriteStorage = new Storage(appwriteClient)
export const appwriteFunctions = new Functions(appwriteClient)

// Helper to get API key client for server-side operations
export function getServerClient() {
  const serverClient = new Client()
    .setEndpoint(env.appwrite.endpoint)
    .setProject(env.appwrite.projectId)
  
  // Set API key via headers for server-side operations
  // Note: Appwrite v15 uses different API for server clients
  // For now, we'll handle this in server functions
  return {
    client: serverClient,
    account: new Account(serverClient),
    storage: new Storage(serverClient),
    functions: new Functions(serverClient),
    apiKey: env.appwrite.apiKey,
  }
}

