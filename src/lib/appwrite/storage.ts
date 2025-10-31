import { appwriteStorage } from './client'
import { ID } from 'appwrite'
import { env } from '../config/env'

/**
 * Upload a file to Appwrite Storage
 */
export async function uploadFile(
  file: File,
  _fileName?: string
): Promise<{ fileId: string; url: string }> {
  const fileId = ID.unique()
  
  const uploadedFile = await appwriteStorage.createFile(
    env.appwrite.bucketId,
    fileId,
    file,
  )

  // Get file preview URL (public)
  const url = appwriteStorage.getFilePreview(
    env.appwrite.bucketId,
    fileId
  ).toString()

  return {
    fileId: uploadedFile.$id,
    url,
  }
}

/**
 * Get file download URL
 */
export function getFileUrl(fileId: string): string {
  return appwriteStorage.getFileView(
    env.appwrite.bucketId,
    fileId
  ).toString()
}

/**
 * Get file preview URL
 */
export function getFilePreviewUrl(fileId: string): string {
  return appwriteStorage.getFilePreview(
    env.appwrite.bucketId,
    fileId
  ).toString()
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileId: string): Promise<void> {
  await appwriteStorage.deleteFile(env.appwrite.bucketId, fileId)
}

/**
 * List files in storage
 */
export async function listFiles(queries?: string[]) {
  return await appwriteStorage.listFiles(env.appwrite.bucketId, queries)
}

/**
 * Get file metadata
 */
export async function getFile(fileId: string) {
  return await appwriteStorage.getFile(env.appwrite.bucketId, fileId)
}

