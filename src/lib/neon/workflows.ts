import { query } from './client'
import type { Workflow, WorkflowInstance, WorkflowApproval } from './schema'

/**
 * Get workflows for a company
 */
export async function getWorkflows(
  companyId: string,
  isActive?: boolean
): Promise<Workflow[]> {
  let sql = 'SELECT * FROM workflows WHERE company_id = $1'
  const params: any[] = [companyId]

  if (isActive !== undefined) {
    sql += ' AND is_active = $2'
    params.push(isActive)
  }

  sql += ' ORDER BY name'

  return await query<Workflow>(sql, params)
}

/**
 * Create a workflow
 */
export async function createWorkflow(
  companyId: string,
  data: {
    name: string
    description?: string
    workflow_type: string
    steps: Array<{
      step_number: number
      approver_role?: string
      approver_user_id?: string
      required: boolean
    }>
  }
): Promise<Workflow> {
  const workflowId = crypto.randomUUID()

  const result = await query<Workflow>(
    `INSERT INTO workflows (id, company_id, name, description, workflow_type, steps, is_active)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, true)
     RETURNING *`,
    [
      workflowId,
      companyId,
      data.name,
      data.description || null,
      data.workflow_type,
      JSON.stringify(data.steps),
    ]
  )

  return result[0]
}

/**
 * Start a workflow instance
 */
export async function startWorkflow(
  workflowId: string,
  companyId: string,
  resourceType: string,
  resourceId: string,
  initiatedBy: string
): Promise<WorkflowInstance> {
  const instanceId = crypto.randomUUID()

  const result = await query<WorkflowInstance>(
    `INSERT INTO workflow_instances (
      id, workflow_id, company_id, resource_type, resource_id,
      current_step, status, initiated_by
    ) VALUES ($1, $2, $3, $4, $5, 0, 'pending', $6)
    RETURNING *`,
    [instanceId, workflowId, companyId, resourceType, resourceId, initiatedBy]
  )

  // Create initial approval records for first step
  const workflow = await query<Workflow>(
    'SELECT * FROM workflows WHERE id = $1',
    [workflowId]
  )

  if (workflow[0] && workflow[0].steps && Array.isArray(workflow[0].steps)) {
    const firstStep = workflow[0].steps[0]
    if (firstStep) {
      await query(
        `INSERT INTO workflow_approvals (
          id, workflow_instance_id, step_number, approver_id, status
        ) VALUES (gen_random_uuid(), $1, $2, $3, 'pending')`,
        [instanceId, firstStep.step_number, firstStep.approver_user_id || null]
      )
    }
  }

  return result[0]
}

/**
 * Approve a workflow step
 */
export async function approveWorkflowStep(
  instanceId: string,
  stepNumber: number,
  _approverId: string,
  comments?: string
): Promise<WorkflowApproval> {
  // Update approval
  const result = await query<WorkflowApproval>(
    `UPDATE workflow_approvals 
     SET status = 'approved', comments = $1, approved_at = CURRENT_TIMESTAMP
     WHERE workflow_instance_id = $2 AND step_number = $3
     RETURNING *`,
    [comments || null, instanceId, stepNumber]
  )

  if (!result[0]) {
    throw new Error('Approval not found')
  }

  // Get workflow instance
  const instance = await query<WorkflowInstance>(
    'SELECT * FROM workflow_instances WHERE id = $1',
    [instanceId]
  )

  if (!instance[0]) {
    throw new Error('Workflow instance not found')
  }

  // Get workflow to determine next steps
  const workflow = await query<Workflow>(
    'SELECT * FROM workflows WHERE id = $1',
    [instance[0].workflow_id]
  )

  if (!workflow[0]) {
    throw new Error('Workflow not found')
  }

  const steps = workflow[0].steps as Array<{
    step_number: number
    approver_role?: string
    approver_user_id?: string
    required: boolean
  }>

  const currentStepIndex = steps.findIndex(s => s.step_number === stepNumber)
  const nextStep = steps[currentStepIndex + 1]

  if (nextStep) {
    // Move to next step
    await query(
      `UPDATE workflow_instances 
       SET current_step = $1, status = 'in_progress'
       WHERE id = $2`,
      [nextStep.step_number, instanceId]
    )

    // Create approval record for next step
    await query(
      `INSERT INTO workflow_approvals (
        id, workflow_instance_id, step_number, approver_id, status
      ) VALUES (gen_random_uuid(), $1, $2, $3, 'pending')`,
      [instanceId, nextStep.step_number, nextStep.approver_user_id || null]
    )
  } else {
    // Workflow complete
    await query(
      `UPDATE workflow_instances 
       SET status = 'approved', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [instanceId]
    )
  }

  return result[0]
}

/**
 * Reject a workflow step
 */
export async function rejectWorkflowStep(
  instanceId: string,
  stepNumber: number,
  _approverId: string,
  comments?: string
): Promise<WorkflowApproval> {
  const result = await query<WorkflowApproval>(
    `UPDATE workflow_approvals 
     SET status = 'rejected', comments = $1, approved_at = CURRENT_TIMESTAMP
     WHERE workflow_instance_id = $2 AND step_number = $3
     RETURNING *`,
    [comments || null, instanceId, stepNumber]
  )

  // Reject the workflow instance
  await query(
    `UPDATE workflow_instances 
     SET status = 'rejected', completed_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [instanceId]
  )

  return result[0]
}

/**
 * Get workflow instances for a company
 */
export async function getWorkflowInstances(
  companyId: string,
  status?: string
): Promise<WorkflowInstance[]> {
  let sql = 'SELECT * FROM workflow_instances WHERE company_id = $1'
  const params: any[] = [companyId]

  if (status) {
    sql += ' AND status = $2'
    params.push(status)
  }

  sql += ' ORDER BY created_at DESC'

  return await query<WorkflowInstance>(sql, params)
}

/**
 * Get approvals for a workflow instance
 */
export async function getWorkflowApprovals(
  instanceId: string
): Promise<WorkflowApproval[]> {
  return await query<WorkflowApproval>(
    'SELECT * FROM workflow_approvals WHERE workflow_instance_id = $1 ORDER BY step_number',
    [instanceId]
  )
}

