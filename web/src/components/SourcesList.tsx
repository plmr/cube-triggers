import { useQuery } from '@apollo/client';
import { GET_SOURCES } from '../lib/queries';
import './SourcesList.css';

interface Source {
  id: string;
  name: string;
  description?: string;
  url?: string;
  createdAt: string;
}

export function SourcesList() {
  const { loading, error, data } = useQuery<{ sources: Source[] }>(GET_SOURCES);

  if (loading) return <div className="loading">Loading sources...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const sources = data?.sources || [];

  if (sources.length === 0) {
    return (
      <div className="no-sources">
        <p>No algorithm sources found.</p>
        <p>Import some algorithms to get started!</p>
      </div>
    );
  }

  return (
    <div className="sources-list">
      <div className="sources-header">
        <div className="source-count">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="sources-grid">
        {sources.map((source) => (
          <div key={source.id} className="source-card">
            <div className="source-header">
              <h3 className="source-name">{source.name}</h3>
              <div className="source-date">
                {new Date(source.createdAt).toLocaleDateString()}
              </div>
            </div>

            {source.description && (
              <div className="source-description">
                {source.description}
              </div>
            )}

            {source.url && (
              <div className="source-url">
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  🔗 View Source
                </a>
              </div>
            )}

            <div className="source-actions">
              <button 
                className="view-triggers-btn"
                onClick={() => {
                  // TODO: Filter triggers by this source
                  console.log('Filter by source:', source.id);
                }}
              >
                View Triggers
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}