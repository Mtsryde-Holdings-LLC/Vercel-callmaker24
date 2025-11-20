# AWS Toolkit for VS Code - Setup Guide

## 🚀 Quick Start

### 1. Install AWS Toolkit Extension

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows) or `Cmd+Shift+X` (Mac)
3. Search for "AWS Toolkit"
4. Click **Install** on "AWS Toolkit for Visual Studio Code"

**Or install via command:**
```bash
code --install-extension amazonwebservices.aws-toolkit-vscode
```

### 2. Configure AWS Credentials

**Option A: Using AWS Toolkit UI**
1. Click AWS icon in sidebar
2. Click "Connect to AWS"
3. Choose credential method:
   - IAM User Credentials
   - SSO
   - Profile from ~/.aws/credentials

**Option B: Using Command Palette**
1. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. Type "AWS: Create Credentials Profile"
3. Follow prompts

**Option C: Manual Setup**
Create/edit `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1

[callmaker24-dev]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1

[callmaker24-prod]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
region = us-east-1
```

## 🎯 Using VS Code Tasks

### Run Deployment Tasks

**Method 1: Command Palette**
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select from menu:
   - `AWS Connect: Deploy Instance`
   - `AWS Connect: Deploy Infrastructure`
   - `AWS Connect: Test Configuration`
   - `AWS Connect: Sync to Vercel`
   - `AWS Connect: Full Deployment` ⭐ (runs all)

**Method 2: Keyboard Shortcut**
1. Press `Ctrl+Shift+B` (default build task)
2. Choose "AWS Connect: Full Deployment"

**Method 3: Terminal Menu**
1. Menu: **Terminal** → **Run Task**
2. Select task

### Available Tasks

| Task | Description | Duration |
|------|-------------|----------|
| Deploy Instance | Creates AWS Connect instance | ~3 min |
| Deploy Infrastructure | Creates flows, queues, profiles | ~2 min |
| Test Configuration | Validates setup | ~10 sec |
| Sync to Vercel | Uploads env vars to Vercel | ~30 sec |
| Full Deployment | Runs all above sequentially | ~6 min |
| List Connect Instances | Shows all instances | ~5 sec |
| Describe Connect Instance | Shows instance details | ~5 sec |
| List Phone Numbers | Shows claimed numbers | ~5 sec |
| List Contact Flows | Shows all flows | ~5 sec |

## 🐛 Using VS Code Debugger

### Debug Deployment Scripts

1. Press `F5` or click **Run and Debug** in sidebar
2. Select configuration:
   - "Deploy AWS Connect Instance"
   - "Deploy AWS Connect Infrastructure"
   - "Test AWS Connect Configuration"
   - "Sync to Vercel"
3. Set breakpoints in scripts
4. Step through code execution

### Debug Features
- ✅ Set breakpoints
- ✅ Inspect variables
- ✅ Step through code
- ✅ Watch expressions
- ✅ Call stack inspection

## 🔍 AWS Explorer Integration

### View AWS Resources in VS Code

1. Click **AWS** icon in sidebar
2. Expand regions
3. Navigate to resources:
   - **Lambda Functions**
   - **CloudFormation Stacks**
   - **S3 Buckets**
   - **CloudWatch Logs**
   - **Systems Manager Parameters**

### Connect Resources

**Note:** AWS Toolkit doesn't have direct Connect UI (yet), but you can:

1. Use integrated terminal with AWS CLI:
   ```bash
   aws connect list-instances
   aws connect describe-instance --instance-id <id>
   ```

2. Use VS Code tasks (configured in `.vscode/tasks.json`)

3. Use CloudFormation templates for infrastructure

## ⚡ Quick Actions

### Deploy with One Click

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Tasks: Run Build Task"
3. Hit Enter (runs default: Full Deployment)

### Test Configuration

1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Test Task"
3. Select "AWS Connect: Test Configuration"

### View Logs

1. AWS Explorer → CloudWatch Logs
2. Right-click log group
3. Select "View Log Stream"

## 🔧 Custom Commands

### Add to Command Palette

Add to `.vscode/settings.json`:
```json
{
  "aws.telemetry": false,
  "aws.profile": "default",
  "aws.region": "us-east-1",
  "terminal.integrated.env.windows": {
    "AWS_REGION": "us-east-1"
  },
  "terminal.integrated.env.linux": {
    "AWS_REGION": "us-east-1"
  },
  "terminal.integrated.env.osx": {
    "AWS_REGION": "us-east-1"
  }
}
```

## 🎨 AWS CDK Integration (Advanced)

### Install AWS CDK Extension

```bash
code --install-extension amazonwebservices.aws-cdk-toolkit
```

### Create CDK Stack for AWS Connect

```typescript
// lib/aws-connect-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as connect from 'aws-cdk-lib/aws-connect';

export class AwsConnectStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const instance = new connect.CfnInstance(this, 'ConnectInstance', {
      identityManagementType: 'CONNECT_MANAGED',
      instanceAlias: 'callmaker24',
      attributes: {
        inboundCalls: true,
        outboundCalls: true
      }
    });
  }
}
```

## 📊 CloudWatch Integration

### View Metrics in VS Code

1. AWS Explorer → CloudWatch
2. Right-click metric
3. "Add to Dashboard"
4. View graphs inline

### Set Alarms

1. AWS Explorer → CloudWatch
2. Right-click alarm
3. "Create Alarm"
4. Configure thresholds

## 🔐 Secrets Management

### Store Credentials Securely

**Use AWS Systems Manager Parameter Store:**

1. AWS Explorer → Systems Manager
2. Right-click Parameters
3. "Create Parameter"
4. Store sensitive values
5. Reference in code:
   ```typescript
   import { SSM } from 'aws-sdk';
   const ssm = new SSM();
   const param = await ssm.getParameter({ 
     Name: '/callmaker24/aws-connect/api-key',
     WithDecryption: true 
   }).promise();
   ```

## 🎯 Best Practices

### 1. Use Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "aws.profile": "callmaker24-dev",
  "aws.region": "us-east-1",
  "terminal.integrated.env.windows": {
    "NODE_ENV": "development"
  }
}
```

### 2. Profile Switching

Quick switch between environments:
1. Click AWS region in status bar
2. Select different profile
3. All tasks use new profile

### 3. Use Tasks for Automation

All repetitive commands → tasks
- No need to remember CLI commands
- Consistent execution
- Easy for team members

### 4. Version Control

**Commit:**
- ✅ `.vscode/tasks.json`
- ✅ `.vscode/launch.json`
- ✅ `.vscode/extensions.json`

**Don't commit:**
- ❌ `.vscode/settings.json` (has credentials)
- ❌ `.aws/credentials`

## 🚀 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Command Palette | `Ctrl+Shift+P` |
| Run Build Task | `Ctrl+Shift+B` |
| Run Test Task | `Ctrl+Shift+T` |
| Start Debugging | `F5` |
| Open Terminal | `Ctrl+`` |
| AWS Explorer | Click AWS icon |

## 🔗 Useful Extensions

Install recommended extensions:
```bash
code --install-extension amazonwebservices.aws-toolkit-vscode
code --install-extension ms-vscode.vscode-node-azure-pack
code --install-extension hashicorp.terraform
code --install-extension redhat.vscode-yaml
```

## 📝 Example Workflow

### Complete Deployment from VS Code

1. **Open workspace** (`Ctrl+K Ctrl+O`)
2. **Configure AWS profile** (AWS Explorer)
3. **Run deployment** (`Ctrl+Shift+B` → Full Deployment)
4. **Monitor progress** (Output panel)
5. **Test** (`Ctrl+Shift+P` → Run Test Task)
6. **View logs** (AWS Explorer → CloudWatch)
7. **Deploy to Vercel** (Run task: Sync to Vercel)

**Total time:** ~6 minutes  
**Manual steps:** 0  
**CLI commands:** 0  

## 🎉 Benefits

### Why Use VS Code + AWS Toolkit?

✅ **No context switching** - Everything in one window  
✅ **Visual interface** - No CLI memorization  
✅ **Debugging** - Step through deployment code  
✅ **IntelliSense** - Auto-complete AWS APIs  
✅ **Integrated logs** - CloudWatch in editor  
✅ **Team friendly** - Share tasks via git  
✅ **Faster development** - Keyboard shortcuts  

## 🆘 Troubleshooting

### AWS Toolkit Not Connecting

1. Check credentials: `aws sts get-caller-identity`
2. Verify profile in status bar
3. Reload window: `Ctrl+Shift+P` → "Reload Window"

### Tasks Not Showing

1. Check `.vscode/tasks.json` exists
2. Reload window
3. Menu: Terminal → Configure Tasks

### Environment Variables Not Loading

1. Restart VS Code
2. Check `.env.local` exists
3. Verify terminal.integrated.env settings

## 📚 Additional Resources

- **AWS Toolkit Docs**: https://docs.aws.amazon.com/toolkit-for-vscode/
- **VS Code Tasks**: https://code.visualstudio.com/docs/editor/tasks
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/
- **Keyboard Shortcuts**: `Ctrl+K Ctrl+S`
