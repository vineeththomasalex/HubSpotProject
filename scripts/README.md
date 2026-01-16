# HubSpot Test Data Setup

This directory contains scripts and data for setting up test contacts in HubSpot to test the Gmail Breeze AI extension.

## Overview

The setup script creates 10 fictional contacts in your HubSpot account, which you can use to test the extension's ability to:
- Fetch contact information from HubSpot
- Enrich AI-generated email responses with CRM context
- Handle various contact profiles and industries

## Prerequisites

Before running the setup script, you need:

1. **HubSpot Private App Access Token**
   - Log into your HubSpot account
   - Go to Settings → Integrations → Private Apps
   - Create a new private app or use an existing one
   - Required scopes: `crm.objects.contacts.write` (to create contacts)
   - Copy the access token

2. **Node.js 18+** installed on your system

## Setup Instructions

### Step 1: Update Email Addresses

Open `test-contacts.json` and replace all placeholder email addresses with real Gmail addresses:

```json
{
  "firstname": "Sarah",
  "lastname": "Chen",
  "email": "your-real-email@gmail.com",  // ← Update this!
  "company": "CloudTech Solutions",
  "jobtitle": "VP of Engineering",
  "phone": "+1-415-555-0101"
}
```

**Important:** Use Gmail addresses that you have access to, so you can send test emails from them to test the extension.

### Step 2: Configure HubSpot Token

Create a `.env` file in the project root:

```bash
cp ../.env.example ../.env
```

Edit the `.env` file and add your HubSpot access token:

```
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Run the Setup Script

From the project root directory, run:

```bash
npm run setup-data
```

Or directly:

```bash
node scripts/setup-test-data.js
```

### Step 4: Follow the Prompts

The script will:
1. Load your test contacts
2. Verify your HubSpot access token
3. Show a summary of contacts to be created
4. Ask for confirmation
5. Create each contact (with progress indicators)
6. Display a final summary

Example output:

```
HubSpot Test Data Setup

✓ Loaded 10 contacts from test-contacts.json
✓ HubSpot access token found

Ready to create 10 contacts in HubSpot:
  1. Sarah Chen (sarah@example.com)
  2. Michael Rodriguez (michael@example.com)
  ...

Proceed with creating contacts? (y/n): y

Creating Sarah Chen... ✓ Created
Creating Michael Rodriguez... ✓ Created
Creating Jennifer Thompson... ⚠ Skipped (already exists)
...

Summary:
✓ 9 contacts created successfully
⚠ 1 contact skipped (already exist)
✗ 0 contacts failed

Next steps:
1. Log into your HubSpot account to verify the contacts
2. Send test emails from the Gmail addresses you configured
3. Load the extension and test the "Reply with Breeze" feature in Gmail
```

## Verification

### In HubSpot

1. Log into your HubSpot account
2. Navigate to Contacts → Contacts
3. Verify all 10 test contacts appear
4. Check that all fields are populated correctly:
   - First Name
   - Last Name
   - Email
   - Company
   - Job Title
   - Phone

### In Gmail Extension

1. Send yourself test emails from the Gmail addresses you configured
2. Open Gmail in your browser with the extension installed
3. Click on one of the test emails
4. Click "Reply"
5. Click the "Reply with Breeze" button
6. Verify that:
   - The extension fetches the contact from HubSpot
   - The AI-generated response includes context from the contact's profile
   - The response references the contact's name, company, or job title

## Test Contact Profiles

The 10 fictional contacts represent diverse industries and roles:

1. **Sarah Chen** - VP of Engineering at CloudTech Solutions
2. **Michael Rodriguez** - CTO at DataDrive Inc
3. **Jennifer Thompson** - Creative Director at BrightWave Marketing
4. **David Park** - Regional Sales Manager at SalesForce Pro
5. **Emily Johnson** - Senior Product Manager at TechFlow Systems
6. **Robert Williams** - Business Consultant at Williams Consulting LLC
7. **Maria Garcia** - E-commerce Manager at Bella Fashion Co
8. **James Anderson** - Founder & CEO at Anderson & Associates
9. **Lisa Martinez** - IT Director at HealthTech Innovations
10. **Christopher Taylor** - Education Technology Coordinator at EduLearn Platform

## Troubleshooting

### Error: "Access token not found"

**Solution:** Create a `.env` file in the project root with your HubSpot token:
```
HUBSPOT_ACCESS_TOKEN=your_token_here
```

### Error: "Invalid token" (401)

**Cause:** The HubSpot access token is invalid or expired.

**Solution:**
1. Go to HubSpot Settings → Integrations → Private Apps
2. Verify your private app exists and is active
3. Copy the access token again
4. Update your `.env` file

### Warning: "Contact already exists" (409)

**Cause:** A contact with that email address already exists in HubSpot.

**Solution:** This is normal if you've run the script before. The script will skip duplicates automatically. If you want to recreate the contact:
1. Delete the existing contact in HubSpot
2. Run the script again

### Error: "Rate limited" (429)

**Cause:** Too many API requests in a short time.

**Solution:** The script automatically waits and retries. If it persists:
1. Wait a few minutes
2. Run the script again

### Placeholder emails warning

**Cause:** You haven't updated the email addresses in `test-contacts.json`.

**Solution:**
1. Open `scripts/test-contacts.json`
2. Replace all `testuser1@placeholder.local` style emails with real Gmail addresses
3. Save the file
4. Run the script again

## Cleaning Up

To remove all test contacts from HubSpot:

1. Log into HubSpot
2. Go to Contacts → Contacts
3. Use filters or search to find the test contacts (search by company name or email)
4. Select all test contacts
5. Click "Delete" from the bulk actions menu

## Files

- **test-contacts.json** - Fictional contact data (10 contacts)
- **setup-test-data.js** - Node.js script to create contacts in HubSpot
- **README.md** - This file

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your HubSpot Private App has the correct scopes
3. Ensure you're using Node.js 18 or higher
4. Check the HubSpot API documentation: https://developers.hubspot.com/docs/api/crm/contacts
