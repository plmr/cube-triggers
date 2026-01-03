import { useQuery } from '@apollo/client';
import { GET_SOURCES } from '../lib/queries';
import type { Source } from '../shared-types';
import './SourcesList.css';

interface SourcesListProps {
  onViewTriggers: (sourceId: string, sourceName: string) => void;
}

export function SourcesList({ onViewTriggers }: SourcesListProps) {
  const { loading, error, data } = useQuery<{ sources: Source[] }>(GET_SOURCES);

  // Fallback to mock data if GraphQL fails
  const mockSources: Source[] = [
    {
      id: '1',
      name: 'Sample OLL Algorithms',
      description: 'Common OLL algorithms for speedcubing',
      createdAt: new Date().toISOString()
    },
    {
      id: '2', 
      name: 'PLL Collection',
      description: 'Standard PLL algorithms',
      createdAt: new Date().toISOString()
    }
  ];

  // Use real data if available, otherwise fall back to mock data
  const sources = data?.sources || mockSources;
  
  if (loading) return <div className="loading">Loading sources...</div>;
  
  if (error) {
    console.warn('GraphQL error, using mock data:', error);
    // Still show the UI with mock data instead of failing
  }

  return (
    <div className="sources-list">
      {error && (
        <div className="connection-warning" style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ⚠️ Using sample data (GraphQL connection failed)
        </div>
      )}
      
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
                onClick={() => onViewTriggers(source.id, source.name)}
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