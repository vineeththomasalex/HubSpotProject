import { useState } from 'react';

interface BreezeButtonProps {
  onGenerate: () => Promise<void>;
}

function BreezeButton({ onGenerate }: BreezeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setIsLoading(true);
    setError('');

    try {
      await onGenerate();
    } catch (err) {
      setError('Failed to generate response');
      console.error('Error generating response:', err);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="breeze-button-container">
      <button
        className="breeze-button"
        onClick={handleClick}
        disabled={isLoading}
        title="Generate AI-powered response using HubSpot context"
      >
        {isLoading ? (
          <>
            <span className="breeze-spinner"></span>
            Generating...
          </>
        ) : (
          <>
            <svg
              className="breeze-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reply with Breeze
          </>
        )}
      </button>
      {error && <span className="breeze-error">{error}</span>}
    </div>
  );
}

export default BreezeButton;
