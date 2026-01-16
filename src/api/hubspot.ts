import { HubSpotContact, HubSpotSearchResponse } from '../types';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Search for a contact by email in HubSpot
 */
export async function searchContactByEmail(
  email: string,
  accessToken: string
): Promise<HubSpotContact | null> {
  try {
    const searchPayload = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
              value: email,
            },
          ],
        },
      ],
      properties: [
        'email',
        'firstname',
        'lastname',
        'company',
        'jobtitle',
        'phone',
      ],
    };

    const response = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(searchPayload),
      }
    );

    if (!response.ok) {
      console.error('HubSpot API error:', response.statusText);
      return null;
    }

    const data: HubSpotSearchResponse = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results[0];
    }

    return null;
  } catch (error) {
    console.error('Error searching HubSpot contact:', error);
    return null;
  }
}

/**
 * Test HubSpot API connection
 */
export async function testHubSpotConnection(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('HubSpot connection test failed:', error);
    return false;
  }
}

/**
 * Format contact data for AI context
 */
export function formatContactForAI(contact: HubSpotContact): string {
  const { properties } = contact;
  const parts: string[] = [];

  if (properties.firstname || properties.lastname) {
    parts.push(`Name: ${properties.firstname || ''} ${properties.lastname || ''}`.trim());
  }

  if (properties.email) {
    parts.push(`Email: ${properties.email}`);
  }

  if (properties.company) {
    parts.push(`Company: ${properties.company}`);
  }

  if (properties.jobtitle) {
    parts.push(`Job Title: ${properties.jobtitle}`);
  }

  if (properties.phone) {
    parts.push(`Phone: ${properties.phone}`);
  }

  return parts.length > 0
    ? `Contact Information:\n${parts.join('\n')}`
    : 'No contact information available.';
}
