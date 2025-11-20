/**
 * AWS Connect Service
 * 
 * Handles all AWS Connect interactions for call center functionality
 * - Outbound calling
 * - Contact management
 * - Agent status
 * - Call recording
 * - Contact flows
 */

import { 
  ConnectClient,
  StartOutboundVoiceContactCommand,
  DescribeInstanceCommand,
  ListContactFlowsCommand,
  ListQueuesCommand,
  GetContactAttributesCommand,
  UpdateContactAttributesCommand,
  DescribeUserCommand,
  ListUsersCommand,
  GetCurrentMetricDataCommand,
  GetMetricDataCommand
} from '@aws-sdk/client-connect'

export class AWSConnectService {
  private client: ConnectClient | null = null
  private instanceId: string
  private instanceArn: string
  private region: string

  constructor() {
    const region = process.env.AWS_CONNECT_REGION || process.env.AWS_REGION || 'us-east-1'
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    
    this.instanceId = process.env.AWS_CONNECT_INSTANCE_ID || ''
    this.instanceArn = process.env.AWS_CONNECT_INSTANCE_ARN || ''
    this.region = region

    // Only initialize if credentials are available
    if (accessKeyId && 
        secretAccessKey && 
        accessKeyId !== 'your-aws-access-key-id' &&
        secretAccessKey !== 'your-aws-secret-access-key') {
      this.client = new ConnectClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      })
    }
  }

  /**
   * Check if AWS Connect is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null && !!this.instanceId
  }

  /**
   * Get AWS Connect instance information
   */
  async getInstance() {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new DescribeInstanceCommand({
      InstanceId: this.instanceId
    })

    const response = await this.client.send(command)
    return response.Instance
  }

  /**
   * Start an outbound voice call
   */
  async startOutboundCall(params: {
    destinationPhoneNumber: string
    contactFlowId: string
    sourcePhoneNumber?: string
    queueId?: string
    attributes?: Record<string, string>
    clientToken?: string
  }) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new StartOutboundVoiceContactCommand({
      InstanceId: this.instanceId,
      ContactFlowId: params.contactFlowId,
      DestinationPhoneNumber: params.destinationPhoneNumber,
      SourcePhoneNumber: params.sourcePhoneNumber || process.env.AWS_CONNECT_PHONE_NUMBER,
      QueueId: params.queueId,
      Attributes: params.attributes,
      ClientToken: params.clientToken
    })

    const response = await this.client.send(command)
    return {
      contactId: response.ContactId,
      success: true
    }
  }

  /**
   * List all contact flows (IVR flows)
   */
  async listContactFlows() {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new ListContactFlowsCommand({
      InstanceId: this.instanceId,
      ContactFlowTypes: ['CONTACT_FLOW', 'CUSTOMER_QUEUE', 'AGENT_TRANSFER']
    })

    const response = await this.client.send(command)
    return response.ContactFlowSummaryList || []
  }

  /**
   * List all queues
   */
  async listQueues() {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new ListQueuesCommand({
      InstanceId: this.instanceId
    })

    const response = await this.client.send(command)
    return response.QueueSummaryList || []
  }

  /**
   * Get contact attributes
   */
  async getContactAttributes(contactId: string) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new GetContactAttributesCommand({
      InstanceId: this.instanceId,
      InitialContactId: contactId
    })

    const response = await this.client.send(command)
    return response.Attributes || {}
  }

  /**
   * Update contact attributes
   */
  async updateContactAttributes(contactId: string, attributes: Record<string, string>) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new UpdateContactAttributesCommand({
      InstanceId: this.instanceId,
      InitialContactId: contactId,
      Attributes: attributes
    })

    await this.client.send(command)
    return { success: true }
  }

  /**
   * List all users (agents)
   */
  async listUsers() {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new ListUsersCommand({
      InstanceId: this.instanceId
    })

    const response = await this.client.send(command)
    return response.UserSummaryList || []
  }

  /**
   * Get user (agent) details
   */
  async getUser(userId: string) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new DescribeUserCommand({
      InstanceId: this.instanceId,
      UserId: userId
    })

    const response = await this.client.send(command)
    return response.User
  }

  /**
   * Get current metrics (real-time data)
   */
  async getCurrentMetrics(queueId?: string) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new GetCurrentMetricDataCommand({
      InstanceId: this.instanceId,
      Filters: {
        Queues: queueId ? [queueId] : undefined,
        Channels: ['VOICE']
      },
      CurrentMetrics: [
        { Name: 'AGENTS_ONLINE', Unit: 'COUNT' },
        { Name: 'AGENTS_AVAILABLE', Unit: 'COUNT' },
        { Name: 'AGENTS_ON_CALL', Unit: 'COUNT' },
        { Name: 'CONTACTS_IN_QUEUE', Unit: 'COUNT' },
        { Name: 'OLDEST_CONTACT_AGE', Unit: 'SECONDS' }
      ]
    })

    const response = await this.client.send(command)
    return response.MetricResults || []
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(startTime: Date, endTime: Date, queueId?: string) {
    if (!this.client || !this.instanceId) {
      throw new Error('AWS Connect not configured')
    }

    const command = new GetMetricDataCommand({
      InstanceId: this.instanceId,
      StartTime: startTime,
      EndTime: endTime,
      Filters: {
        Queues: queueId ? [queueId] : undefined,
        Channels: ['VOICE']
      },
      HistoricalMetrics: [
        { Name: 'CONTACTS_HANDLED', Unit: 'COUNT', Statistic: 'SUM' },
        { Name: 'CONTACTS_ABANDONED', Unit: 'COUNT', Statistic: 'SUM' },
        { Name: 'HANDLE_TIME', Unit: 'SECONDS', Statistic: 'AVG' },
        { Name: 'SERVICE_LEVEL', Unit: 'PERCENT', Statistic: 'AVG' }
      ]
    })

    const response = await this.client.send(command)
    return response.MetricResults || []
  }

  /**
   * Get CCP URL for embedding in your application
   */
  getCCPUrl(): string {
    const instanceAlias = process.env.AWS_CONNECT_INSTANCE_ALIAS || 'your-instance'
    return `https://${instanceAlias}.my.connect.aws/ccp-v2/`
  }

  /**
   * Get configuration details
   */
  getConfig() {
    return {
      isConfigured: this.isConfigured(),
      region: this.region,
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      ccpUrl: this.getCCPUrl()
    }
  }
}

// Export singleton instance
export const awsConnectService = new AWSConnectService()
