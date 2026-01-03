import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { START_IMPORT, GET_IMPORT_RUNS } from '../lib/queries';
import './ImportForm.css';

interface ImportFormData {
  sourceName: string;
  description: string;
  sourceUrl: string;
  algorithmsText: string;
}

export function ImportForm() {
  const [formData, setFormData] = useState<ImportFormData>({
    sourceName: '',
    description: '',
    sourceUrl: '',
    algorithmsText: '',
  });

  const [startImport, { loading: importing, error: importError }] = useMutation(START_IMPORT, {
    refetchQueries: [{ query: GET_IMPORT_RUNS }],
  });

  const { data: importRunsData, loading: loadingRuns } = useQuery(GET_IMPORT_RUNS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceName.trim() || !formData.algorithmsText.trim()) {
      alert('Please provide at least a source name and algorithms text.');
      return;
    }

    try {
      await startImport({
        variables: {
          input: {
            sourceName: formData.sourceName.trim(),
            description: formData.description.trim() || undefined,
            sourceUrl: formData.sourceUrl.trim() || undefined,
            algorithmsText: formData.algorithmsText.trim(),
          },
        },
      });

      // Clear form on success
      setFormData({
        sourceName: '',
        description: '',
        sourceUrl: '',
        algorithmsText: '',
      });

      alert('Import started successfully!');
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleInputChange = (field: keyof ImportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="import-form-container">
      <div className="import-form-section">
        <h3>Import New Algorithms</h3>
        
        <form onSubmit={handleSubmit} className="import-form">
          <div className="form-group">
            <label htmlFor="sourceName">Source Name *</label>
            <input
              id="sourceName"
              type="text"
              value={formData.sourceName}
              onChange={(e) => handleInputChange('sourceName', e.target.value)}
              placeholder="e.g. AlgDB F2L, Speedsolving Wiki OLL"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description of this algorithm set"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sourceUrl">Source URL</label>
            <input
              id="sourceUrl"
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
              placeholder="https://example.com/algorithms"
            />
          </div>

          <div className="form-group">
            <label htmlFor="algorithmsText">Algorithms *</label>
            <textarea
              id="algorithmsText"
              value={formData.algorithmsText}
              onChange={(e) => handleInputChange('algorithmsText', e.target.value)}
              placeholder={`Paste your algorithms here, one per line:

R U R' U'
F R F'
T-Perm: R U R' F' R U R' U' R' F R2 U' R'`}
              rows={10}
              required
            />
            <div className="form-help">
              Paste algorithms one per line. You can optionally prefix with case names like "T-Perm: ..."
            </div>
          </div>

          {importError && (
            <div className="error-message">
              Error: {importError.message}
            </div>
          )}

          <button type="submit" disabled={importing} className="submit-button">
            {importing ? 'Starting Import...' : 'Start Import'}
          </button>
        </form>
      </div>

      <div className="import-history-section">
        <h3>Recent Imports</h3>
        
        {loadingRuns ? (
          <div className="loading">Loading import history...</div>
        ) : (
          <div className="import-runs">
            {importRunsData?.importRuns?.length === 0 ? (
              <div className="no-imports">No imports yet</div>
            ) : (
              importRunsData?.importRuns?.map((run: any) => (
                <div key={run.id} className="import-run">
                  <div className="run-status">
                    <span className={`status-badge ${run.status.toLowerCase()}`}>
                      {run.status}
                    </span>
                    <span className="run-progress">
                      {run.processedAlgorithms}/{run.totalAlgorithms} algorithms
                    </span>
                  </div>
                  <div className="run-time">
                    {new Date(run.startedAt).toLocaleString()}
                  </div>
                  {run.errorMessage && (
                    <div className="run-error">{run.errorMessage}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}