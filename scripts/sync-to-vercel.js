/**
 * Vercel Environment Variables Sync
 * 
 * Automatically syncs AWS Connect configuration to Vercel
 * Run with: node scripts/sync-to-vercel.js
 * 
 * Requires: VERCEL_TOKEN environment variable
 * Get token from: https://vercel.com/account/tokens
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const envVars = {}
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        envVars[key] = value
      }
    })
  }
  
  return envVars
}

function makeVercelRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const token = process.env.VERCEL_TOKEN
    
    if (!token) {
      reject(new Error('VERCEL_TOKEN not set'))
      return
    }
    
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    
    const req = https.request(options, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'))
        } else {
          reject(new Error(`Vercel API error: ${res.statusCode} - ${body}`))
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

async function syncToVercel() {
  console.log('\n🔄 Syncing AWS Connect Config to Vercel\n')
  console.log('='.repeat(70))
  
  // Load environment variables
  const envVars = loadEnv()
  
  // AWS Connect variables to sync
  const awsConnectVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_CONNECT_INSTANCE_ID',
    'AWS_CONNECT_INSTANCE_ARN',
    'AWS_CONNECT_INSTANCE_ALIAS',
    'AWS_CONNECT_CONTACT_FLOW_ID',
    'AWS_CONNECT_QUEUE_ID',
    'AWS_CONNECT_PHONE_NUMBER'
  ]
  
  // Get project details
  console.log('\n📋 Getting Vercel project...')
  
  let projectId
  try {
    // First, get the project
    const projectName = process.env.VERCEL_PROJECT_NAME || 'callmaker24'
    const projects = await makeVercelRequest('GET', `/v9/projects/${projectName}`)
    projectId = projects.id
    
    console.log(`✅ Project found: ${projects.name} (${projectId})`)
  } catch (error) {
    console.error('❌ Failed to get project:', error.message)
    console.log('\nTip: Set VERCEL_PROJECT_NAME environment variable')
    process.exit(1)
  }
  
  // Sync each variable
  console.log('\n🔧 Syncing environment variables...\n')
  
  let successCount = 0
  let skipCount = 0
  
  for (const varName of awsConnectVars) {
    const value = envVars[varName]
    
    if (!value || value.includes('your-') || value === 'us-east-1' && varName !== 'AWS_REGION') {
      console.log(`   ⏭️  ${varName}: Skipped (not configured)`)
      skipCount++
      continue
    }
    
    try {
      await makeVercelRequest('POST', `/v10/projects/${projectId}/env`, {
        key: varName,
        value: value,
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      })
      
      // Mask sensitive values in output
      let displayValue = value
      if (varName.includes('SECRET') || varName.includes('KEY')) {
        displayValue = value.substring(0, 8) + '...' + value.slice(-4)
      }
      
      console.log(`   ✅ ${varName}: ${displayValue}`)
      successCount++
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  ${varName}: Already exists (use Vercel dashboard to update)`)
        skipCount++
      } else {
        console.log(`   ❌ ${varName}: ${error.message}`)
      }
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Synced: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skipCount}`)
  console.log(`   📦 Total: ${awsConnectVars.length}`)
  
  if (successCount > 0) {
    console.log('\n🔄 Triggering deployment...')
    try {
      const deployment = await makeVercelRequest('POST', `/v13/deployments`, {
        name: projectId,
        gitSource: {
          type: 'github',
          ref: 'main'
        }
      })
      
      console.log(`✅ Deployment triggered: ${deployment.url}`)
    } catch (error) {
      console.log('⚠️  Could not trigger deployment:', error.message)
      console.log('   Please deploy manually or push to GitHub')
    }
  }
  
  console.log('\n✅ Sync complete!')
  console.log('\n📝 Note: Existing variables are not overwritten.')
  console.log('   Update them manually in Vercel dashboard if needed.\n')
}

// Run sync
if (require.main === module) {
  syncToVercel()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Sync failed:', error.message)
      console.log('\n💡 Make sure you have:')
      console.log('   1. VERCEL_TOKEN set (get from https://vercel.com/account/tokens)')
      console.log('   2. VERCEL_PROJECT_NAME set (your project name)')
      console.log('   3. Token has write access to the project\n')
      process.exit(1)
    })
}

module.exports = { syncToVercel }
