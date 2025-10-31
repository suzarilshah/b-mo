import { appwriteAccount } from './client'
import type { Models } from 'appwrite'
import { ID } from 'appwrite'

export interface AuthUser extends Models.User<Models.Preferences> {
  // Extended with our custom fields
  company_id?: string
  role_id?: string
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  return await appwriteAccount.create(ID.unique(), email, password, name)
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  return await appwriteAccount.createEmailPasswordSession(email, password)
}

/**
 * Sign out current user
 */
export async function signOut() {
  return await appwriteAccount.deleteSession('current')
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  try {
    return await appwriteAccount.getSession('current')
  } catch (error) {
    return null
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await appwriteAccount.get() as AuthUser
  } catch (error) {
    return null
  }
}

/**
 * Send password recovery email
 */
export async function sendPasswordRecovery(email: string) {
  return await appwriteAccount.createRecovery(
    email,
    `${window.location.origin}/reset-password`
  )
}

/**
 * Update password
 */
export async function updatePassword(password: string, oldPassword?: string) {
  return await appwriteAccount.updatePassword(password, oldPassword)
}

/**
 * Update user name
 */
export async function updateName(name: string) {
  return await appwriteAccount.updateName(name)
}

/**
 * Update user email
 */
export async function updateEmail(email: string, password: string) {
  return await appwriteAccount.updateEmail(email, password)
}

/**
 * Verify email
 */
export async function verifyEmail(userId: string, secret: string) {
  return await appwriteAccount.updateVerification(userId, secret)
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail() {
  // Appwrite doesn't have direct resend, but we can create a new verification
  const user = await getCurrentUser()
  if (user) {
    return await appwriteAccount.createVerification(
      `${window.location.origin}/verify-email`
    )
  }
  throw new Error('No user logged in')
}

