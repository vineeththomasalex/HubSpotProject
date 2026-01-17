import { useState, useEffect } from 'react';
import { getStorageData, saveStorageData } from '../utils/storage';
import { testHubSpotConnection } from '../api/hubspot';
import { testOpenAIConnection } from '../api/openai';
import './settings.css';

function Settings() {
  // Check if API keys are set in environment variables
  const envHubspotToken = import.meta.env.VITE_HUBSPOT_ACCESS_TOKEN || '';
  const envOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const isHubspotLocked = !!envHubspotToken;
  const isOpenaiLocked = !!envOpenaiKey;

  const [hubspotToken, setHubspotToken] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [hubspotTestStatus, setHubspotTestStatus] = useState('');
  const [openaiTestStatus, setOpenaiTestStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // User context fields
  const [userName, setUserName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [department, setDepartment] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [useCustomSignature, setUseCustomSignature] = useState(false);
  const [customSignature, setCustomSignature] = useState('');

  // Load saved values on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getStorageData();
      // Use env variables if set, otherwise use stored values
      setHubspotToken(envHubspotToken || data.hubspotToken || '');
      setOpenaiKey(envOpenaiKey || data.openaiKey || '');

      // Load user context fields
      setUserName(data.userName || '');
      setJobTitle(data.jobTitle || '');
      setCompanyName(data.companyName || '');
      setDepartment(data.department || '');
      setCommunicationStyle(data.communicationStyle || '');
      setCustomInstructions(data.customInstructions || '');
      setUseCustomSignature(data.useCustomSignature || false);
      setCustomSignature(data.customSignature || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('Saving...');
      await saveStorageData({
        hubspotToken,
        openaiKey,
        userName,
        jobTitle,
        companyName,
        department,
        communicationStyle,
        customInstructions,
        useCustomSignature,
        customSignature,
      });
      setSaveStatus('✓ Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('✗ Error saving settings');
      console.error('Error saving settings:', error);
    }
  };

  const handleTestHubSpot = async () => {
    if (!hubspotToken) {
      setHubspotTestStatus('✗ Please enter a HubSpot token');
      return;
    }

    setHubspotTestStatus('Testing...');
    const success = await testHubSpotConnection(hubspotToken);

    if (success) {
      setHubspotTestStatus('✓ Connection successful!');
    } else {
      setHubspotTestStatus('✗ Connection failed. Check your token.');
    }

    setTimeout(() => setHubspotTestStatus(''), 5000);
  };

  const handleTestOpenAI = async () => {
    if (!openaiKey) {
      setOpenaiTestStatus('✗ Please enter an OpenAI API key');
      return;
    }

    setOpenaiTestStatus('Testing...');
    const success = await testOpenAIConnection(openaiKey);

    if (success) {
      setOpenaiTestStatus('✓ Connection successful!');
    } else {
      setOpenaiTestStatus('✗ Connection failed. Check your API key.');
    }

    setTimeout(() => setOpenaiTestStatus(''), 5000);
  };

  if (isLoading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <header>
        <h1>HubSpot Gmail Breeze AI - Settings</h1>
        <p className="subtitle">
          Configure your API credentials to enable AI-powered email responses
        </p>
      </header>

      <main>
        <section className="setting-section">
          <h2>HubSpot Configuration</h2>
          <p className="help-text">
            Enter your HubSpot Private App access token. This is used to fetch contact
            information from your CRM.
          </p>
          <p className="help-text">
            <a
              href="https://developers.hubspot.com/docs/api/private-apps"
              target="_blank"
              rel="noopener noreferrer"
            >
              How to create a Private App →
            </a>
          </p>
          <div className="input-group">
            <label htmlFor="hubspot-token">Private App Access Token:</label>
            {isHubspotLocked && (
              <p className="env-notice">
                ✓ Set via environment variable (.env file)
              </p>
            )}
            <input
              type="password"
              id="hubspot-token"
              value={hubspotToken}
              onChange={(e) => setHubspotToken(e.target.value)}
              placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              disabled={isHubspotLocked}
              className={isHubspotLocked ? 'locked' : ''}
            />
            <button onClick={handleTestHubSpot} className="test-button">
              Test Connection
            </button>
            {hubspotTestStatus && (
              <span className="status-message">{hubspotTestStatus}</span>
            )}
          </div>
        </section>

        <section className="setting-section">
          <h2>OpenAI Configuration</h2>
          <p className="help-text">
            Enter your OpenAI API key. This powers the AI response generation.
          </p>
          <p className="help-text">
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key from OpenAI →
            </a>
          </p>
          <div className="input-group">
            <label htmlFor="openai-key">OpenAI API Key:</label>
            {isOpenaiLocked && (
              <p className="env-notice">
                ✓ Set via environment variable (.env file)
              </p>
            )}
            <input
              type="password"
              id="openai-key"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isOpenaiLocked}
              className={isOpenaiLocked ? 'locked' : ''}
            />
            <button onClick={handleTestOpenAI} className="test-button">
              Test Connection
            </button>
            {openaiTestStatus && (
              <span className="status-message">{openaiTestStatus}</span>
            )}
          </div>
        </section>

        <section className="setting-section">
          <h2>Your Profile</h2>
          <p className="help-text">
            Tell us about yourself to help AI generate more personalized responses.
            All fields are optional.
          </p>
          <div className="input-group">
            <label htmlFor="user-name">Your Name:</label>
            <input
              type="text"
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="input-group">
            <label htmlFor="job-title">Job Title:</label>
            <input
              type="text"
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Sales Engineer"
            />
          </div>
          <div className="input-group">
            <label htmlFor="company-name">Company Name:</label>
            <input
              type="text"
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div className="input-group">
            <label htmlFor="department">Department:</label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Sales"
            />
          </div>
        </section>

        <section className="setting-section">
          <h2>Communication Preferences</h2>
          <p className="help-text">
            Customize how AI generates your email responses.
          </p>
          <div className="input-group">
            <label htmlFor="communication-style">Communication Style:</label>
            <select
              id="communication-style"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
            >
              <option value="">Select a style...</option>
              <option value="Formal">Formal</option>
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
              <option value="Friendly">Friendly</option>
              <option value="Concise">Concise</option>
              <option value="Detailed">Detailed</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="custom-instructions">About You / Custom Instructions:</label>
            <p className="help-text-small">
              Describe your role and any guidelines for email responses (2-3 sentences)
            </p>
            <textarea
              id="custom-instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="I'm a technical sales engineer who helps enterprise customers integrate our API. I typically provide detailed technical explanations and can schedule demos."
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{customInstructions.length} / 500</span>
          </div>
        </section>

        <section className="setting-section">
          <h2>Signature Override</h2>
          <p className="help-text">
            By default, Gmail will add your signature. Enable this to use a custom signature for AI-generated responses.
          </p>
          <div className="input-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useCustomSignature}
                onChange={(e) => setUseCustomSignature(e.target.checked)}
              />
              Use custom signature (overrides Gmail signature)
            </label>
          </div>
          {useCustomSignature && (
            <div className="input-group">
              <label htmlFor="custom-signature">Custom Signature:</label>
              <textarea
                id="custom-signature"
                value={customSignature}
                onChange={(e) => setCustomSignature(e.target.value)}
                placeholder="Best regards,&#10;John Doe&#10;Sales Engineer&#10;Acme Corp"
                rows={4}
                maxLength={1000}
              />
              <span className="char-count">{customSignature.length} / 1000</span>
            </div>
          )}
        </section>

        <section className="button-section">
          <button onClick={handleSave} className="save-button">
            Save Settings
          </button>
          {saveStatus && <span className="status-message">{saveStatus}</span>}
        </section>

        <section className="info-section">
          <h3>About</h3>
          <p>
            This extension combines HubSpot contact data with OpenAI's GPT-4 to generate
            contextually relevant email responses directly in Gmail.
          </p>
          <p>
            <strong>Note:</strong> Both API keys are required for full functionality.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Settings;
