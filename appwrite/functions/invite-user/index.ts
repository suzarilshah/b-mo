/**
 * Appwrite Function: Invite User
 * 
 * This function handles user invitations with RBAC roles
 * Should be deployed as an Appwrite Serverless Function
 * 
 * Requires environment variables:
 * - APPWRITE_ENDPOINT
 * - APPWRITE_PROJECT_ID
 * - APPWRITE_API_KEY
 * - NEON_DATABASE_URL (for storing invitation records)
 */

import { Client, Users, ID } from 'appwrite'
import { neon } from '@neondatabase/serverless'

interface FunctionRequest {
  email: string
  role: 'admin' | 'auditor' | 'finance_team'
  companyId: string
  invitedBy: string // Appwrite user ID
}

export default async function(context: any) {
  const { req, res, log, error } = context
  
  try {
    // Parse request
    const data: FunctionRequest = JSON.parse(req.bodyRaw || '{}')
    const { email, role, companyId, invitedBy } = data

    // Validate input
    if (!email || !role || !companyId || !invitedBy) {
      return res.json({
        success: false,
        error: 'Missing required fields: email, role, companyId, invitedBy',
      }, 400)
    }

    // Initialize Appwrite admin client
    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!)

    const users = new Users(appwriteClient)

    // Get invited by user to find their database user ID
    // This will be used to get the invited_by user ID from NeonDB
    const inviterAppwriteUser = await users.get(invitedBy)

    // Initialize NeonDB client
    const sql = neon(process.env.NEON_DATABASE_URL!)
    
    // Get role ID from role name
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = ${role} LIMIT 1
    `
    
    if (!roleResult || roleResult.length === 0) {
      return res.json({
        success: false,
        error: `Role '${role}' not found in database`,
      }, 400)
    }

    const roleId = roleResult[0].id

    // Get invited_by user ID from NeonDB using Appwrite user ID
    const inviterUserResult = await sql`
      SELECT id FROM users WHERE appwrite_user_id = ${invitedBy} LIMIT 1
    `
    const inviterUserId = inviterUserResult && inviterUserResult.length > 0 
      ? inviterUserResult[0].id 
      : null

    // Create user in Appwrite (or get existing)
    let appwriteUser
    try {
      appwriteUser = await users.create(ID.unique(), email, [], email)
    } catch (err: any) {
      if (err.code === 409) {
        // User already exists, get the existing user
        const list = await users.list()
        appwriteUser = list.users.find((u: any) => u.email === email)
      } else {
        throw err
      }
    }

    if (!appwriteUser) {
      return res.json({
        success: false,
        error: 'Failed to create or find user in Appwrite',
      }, 500)
    }

    // Generate invitation token
    const invitationId = crypto.randomUUID()
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    // Store invitation in NeonDB
    await sql`
      INSERT INTO invitations (
        id, email, role_id, company_id, invited_by, status, token, expires_at
      ) VALUES (
        ${invitationId},
        ${email},
        ${roleId},
        ${companyId},
        ${inviterUserId},
        'pending',
        ${token},
        ${expiresAt.toISOString()}
      )
    `

    // In production, you would:
    // 1. Send invitation email with token/link
    // 2. User clicks link and creates password
    // 3. On password creation, call acceptInvitation with token

    log(`Invitation created for ${email} with role ${role} by ${inviterAppwriteUser.email}`)

    return res.json({
      success: true,
      userId: appwriteUser.$id,
      invitationId,
      token,
      message: 'User invitation created successfully',
    })
  } catch (err: any) {
    error(err.message)
    return res.json({
      success: false,
      error: err.message || 'Failed to create invitation',
    }, 500)
  }
}

