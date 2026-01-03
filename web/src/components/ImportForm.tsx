import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { START_IMPORT, GET_SOURCES } from '../lib/queries';
import { ImportProgress } from './ImportProgress';
import './ImportForm.css';

export function ImportForm() {
  const [sourceName, setSourceName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [algorithmsText, setAlgorithmsText] = useState('');
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);

  const [startImport, { loading, error }] = useMutation(START_IMPORT, {
    refetchQueries: [{ query: GET_SOURCES }], // Refresh sources list after import
    onCompleted: (data) => {
      console.log('Import started:', data.startImport);
      setCurrentImportId(data.startImport.id);
      
      // Don't reset form immediately - wait for completion
    },
    onError: (error) => {
      console.error('Import failed:', error);
      setCurrentImportId(null);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceName.trim() || !algorithmsText.trim()) {
      alert('Please provide at least a source name and algorithms text.');
      return;
    }

    try {
      await startImport({
        variables: {
          input: {
            sourceName: sourceName.trim(),
            sourceUrl: sourceUrl.trim() || undefined,
            description: description.trim() || undefined,
            algorithmsText: algorithmsText.trim(),
          }
        }
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="import-form">
      <div className="form-description">
        <p>Import speedcubing algorithms to analyze common triggers and patterns.</p>
        <p>Paste your algorithms below - one per line or separated by commas.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sourceName">Source Name *</label>
          <input
            id="sourceName"
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="e.g., OLL Algorithms, My F2L Collection"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sourceUrl">Source URL (optional)</label>
          <input
            id="sourceUrl"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://example.com/algorithms"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this algorithm set"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="algorithmsText">Algorithms *</label>
          <textarea
            id="algorithmsText"
            value={algorithmsText}
            onChange={(e) => setAlgorithmsText(e.target.value)}
            placeholder="R U R' U' R U R' F' R U R' U' R' F R
F R U R' U' F'
R U2 R' U' R U' R'
T-Perm: R U R' F' R U R' U' R' F R2 U' R'"
            rows={10}
            required
            disabled={loading}
          />
          <div className="algorithm-count">
            {algorithmsText.split('\n').filter(line => line.trim()).length} algorithms
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading || !sourceName.trim() || !algorithmsText.trim()}
            className="submit-btn"
            style={{
              background: loading ? '#6c757d' : '#007acc',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Processing...' : 'Start Import'}
          </button>
        </div>
      </form>

      {/* Real-time import progress */}
      {currentImportId && (
        <ImportProgress
          importRunId={currentImportId}
          onComplete={() => {
            // Reset form on completion
            setSourceName('');
            setSourceUrl('');
            setDescription('');
            setAlgorithmsText('');
            setCurrentImportId(null);
          }}
          onError={(errorMsg) => {
            console.error('Import failed:', errorMsg);
            setCurrentImportId(null);
          }}
        />
      )}

      {error && !currentImportId && (
        <div className="error-message" style={{
          background: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          Error: {error.message}
        </div>
      )}

      {loading && !currentImportId && (
        <div className="import-status" style={{
          background: '#d1ecf1',
          border: '1px solid #bee5eb',
          color: '#0c5460',
          padding: '15px',
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <p><strong>Starting import...</strong></p>
          <p>Preparing to process your algorithms...</p>
        </div>
      )}
    </div>
  );
}