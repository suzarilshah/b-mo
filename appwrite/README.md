# Appwrite Functions

This directory contains Appwrite Serverless Functions for B-mo.

## Functions

### 1. invite-user
Handles user invitations with RBAC roles. Creates users and links them to companies with appropriate roles.

**Endpoint**: `POST /functions/invite-user`

**Request Body**:
```json
{
  "email": "user@example.com",
  "role": "finance_team",
  "companyId": "uuid",
  "invitedBy": "appwrite_user_id"
}
```

### 2. document-workflow
Processes document approval/rejection workflows.

**Endpoint**: `POST /functions/document-workflow`

**Request Body**:
```json
{
  "documentId": "uuid",
  "action": "approve",
  "userId": "appwrite_user_id",
  "comments": "Optional comments",
  "companyId": "uuid"
}
```

## Deployment

1. Create functions in Appwrite Console
2. Deploy code from this directory
3. Set environment variables:
   - `APPWRITE_ENDPOINT`
   - `APPWRITE_PROJECT_ID`
   - `APPWRITE_API_KEY`
   - `NEON_DATABASE_URL`
   - `NEON_API_KEY`

## Setup Instructions

1. In Appwrite Console, go to Functions
2. Create new function for each directory
3. Deploy the TypeScript code
4. Configure triggers (if needed)
5. Set execution permissions

