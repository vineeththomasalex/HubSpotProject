#!/usr/bin/env node

/**
 * HubSpot Test Data Setup Script
 * Creates fictional contacts in HubSpot for testing the Gmail Breeze AI extension
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/**
 * Load HubSpot access token from .env file or environment
 */
function loadAccessToken() {
  // Try to load from .env file
  const envPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/HUBSPOT_ACCESS_TOKEN=(.+)/);

    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Try from environment variable
  return process.env.HUBSPOT_ACCESS_TOKEN || null;
}

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Create a contact in HubSpot
 */
async function createContact(contact, accessToken) {
  const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ properties: contact }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data;
}

/**
 * Main setup function
 */
async function main() {
  console.log(`${colors.bold}${colors.cyan}HubSpot Test Data Setup${colors.reset}\n`);

  // Step 1: Load test contacts
  const contactsPath = path.join(__dirname, 'test-contacts.json');

  if (!fs.existsSync(contactsPath)) {
    console.error(`${colors.red}✗ Error: test-contacts.json not found${colors.reset}`);
    process.exit(1);
  }

  let contacts;
  try {
    const contactsData = fs.readFileSync(contactsPath, 'utf8');
    contacts = JSON.parse(contactsData);
    console.log(`${colors.green}✓${colors.reset} Loaded ${contacts.length} contacts from test-contacts.json\n`);
  } catch (error) {
    console.error(`${colors.red}✗ Error parsing test-contacts.json: ${error.message}${colors.reset}`);
    process.exit(1);
  }

  // Check for placeholder emails
  const hasPlaceholders = contacts.some((c) => c.email.includes('placeholder.local'));
  if (hasPlaceholders) {
    console.log(`${colors.yellow}⚠ Warning: Some emails still use placeholder.local${colors.reset}`);
    console.log(`${colors.yellow}  You should update these to real Gmail addresses for testing${colors.reset}\n`);
  }

  // Step 2: Load HubSpot access token
  let accessToken = loadAccessToken();

  if (!accessToken) {
    console.log(`${colors.yellow}⚠ HubSpot access token not found${colors.reset}`);
    console.log(`  Create a .env file with: HUBSPOT_ACCESS_TOKEN=your_token_here\n`);

    accessToken = await prompt('Enter your HubSpot access token: ');

    if (!accessToken || accessToken.trim() === '') {
      console.error(`${colors.red}✗ Access token is required${colors.reset}`);
      process.exit(1);
    }

    accessToken = accessToken.trim();
  } else {
    console.log(`${colors.green}✓${colors.reset} HubSpot access token found\n`);
  }

  // Step 3: Show summary
  console.log(`${colors.bold}Ready to create ${contacts.length} contacts in HubSpot:${colors.reset}`);
  contacts.forEach((contact, idx) => {
    // Remove the note field before showing summary
    const displayContact = { ...contact };
    delete displayContact.note;

    console.log(`  ${idx + 1}. ${displayContact.firstname} ${displayContact.lastname} (${displayContact.email})`);
  });
  console.log();

  // Step 4: Confirm
  const confirmation = await prompt(`${colors.bold}Proceed with creating contacts? (y/n):${colors.reset} `);

  if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
    console.log(`${colors.yellow}Operation cancelled${colors.reset}`);
    process.exit(0);
  }

  console.log();

  // Step 5: Create contacts
  const results = {
    created: [],
    skipped: [],
    failed: [],
  };

  for (let i = 0; i < contacts.length; i++) {
    const contact = { ...contacts[i] };
    delete contact.note; // Remove note field from API request

    const name = `${contact.firstname} ${contact.lastname}`;
    process.stdout.write(`Creating ${name}... `);

    try {
      await createContact(contact, accessToken);
      console.log(`${colors.green}✓ Created${colors.reset}`);
      results.created.push(name);

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      if (error.status === 409) {
        console.log(`${colors.yellow}⚠ Skipped (already exists)${colors.reset}`);
        results.skipped.push(name);
      } else if (error.status === 401) {
        console.log(`${colors.red}✗ Failed (invalid token)${colors.reset}`);
        results.failed.push({ name, reason: 'Invalid access token' });
        break; // Stop if token is invalid
      } else if (error.status === 429) {
        console.log(`${colors.yellow}⚠ Rate limited, waiting...${colors.reset}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        i--; // Retry this contact
      } else {
        const reason = error.data?.message || 'Unknown error';
        console.log(`${colors.red}✗ Failed (${reason})${colors.reset}`);
        results.failed.push({ name, reason });
      }
    }
  }

  // Step 6: Show summary
  console.log(`\n${colors.bold}${colors.cyan}Summary:${colors.reset}`);
  console.log(`${colors.green}✓ ${results.created.length} contacts created successfully${colors.reset}`);

  if (results.skipped.length > 0) {
    console.log(`${colors.yellow}⚠ ${results.skipped.length} contacts skipped (already exist)${colors.reset}`);
  }

  if (results.failed.length > 0) {
    console.log(`${colors.red}✗ ${results.failed.length} contacts failed${colors.reset}`);
    results.failed.forEach(({ name, reason }) => {
      console.log(`  - ${name}: ${reason}`);
    });
  }

  // Step 7: Next steps
  if (results.created.length > 0 || results.skipped.length > 0) {
    console.log(`\n${colors.bold}Next steps:${colors.reset}`);
    console.log(`1. Log into your HubSpot account to verify the contacts`);
    console.log(`2. Send test emails from the Gmail addresses you configured`);
    console.log(`3. Load the extension and test the "Reply with Breeze" feature in Gmail`);
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
});
