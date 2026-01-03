import { useQuery } from '@apollo/client';
import { GET_TOP_TRIGGERS } from '../lib/queries';
import type { FilterState, NgramAggregate } from '../shared-types';
import './TriggersList.css';

interface TriggersListProps {
  filters: FilterState;
}

export function TriggersList({ filters }: TriggersListProps) {
  const { loading, error, data } = useQuery<{ topTriggers: NgramAggregate[] }>(GET_TOP_TRIGGERS, {
    variables: {
      filters: Object.keys(filters).length > 0 ? filters : null,
      limit: 50,
    },
  });

  // Fallback mock data
  const mockTriggers: NgramAggregate[] = [
    {
      id: '1',
      totalOccurrences: 15,
      algorithmCoverage: 8,
      sourceCoverage: 3,
      algType: 'F2L',
      updatedAt: new Date().toISOString(),
      ngram: {
        id: '1',
        moves: "R U R' U'",
        length: 4
      }
    },
    {
      id: '2', 
      totalOccurrences: 12,
      algorithmCoverage: 6,
      sourceCoverage: 2,
      algType: 'OLL',
      updatedAt: new Date().toISOString(),
      ngram: {
        id: '2',
        moves: "R U2 R' U'",
        length: 4
      }
    },
    {
      id: '3',
      totalOccurrences: 8,
      algorithmCoverage: 4,
      sourceCoverage: 2,
      algType: 'PLL',
      updatedAt: new Date().toISOString(),
      ngram: {
        id: '3',
        moves: "R' U' R U'",
        length: 4
      }
    }
  ];

  // Use real data if available, otherwise fall back to mock data
  const triggers = data?.topTriggers || mockTriggers;

  if (loading) return <div className="loading">Loading triggers...</div>;

  if (error) {
    console.warn('GraphQL error, using mock data:', error);
  }

  if (triggers.length === 0) {
    return (
      <div className="no-results">
        <p>No triggers found with the current filters.</p>
        <p>Try adjusting your filters or importing some algorithms first.</p>
      </div>
    );
  }

  return (
    <div className="triggers-list">
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

      <div className="triggers-header">
        <div className="trigger-count">
          Found {triggers.length} triggers
          {data?.topTriggers && (
            <span style={{ color: '#28a745', marginLeft: '10px' }}>
              ✓ Live data
            </span>
          )}
        </div>
      </div>

      <div className="triggers-table">
        <div className="table-header">
          <div className="col-rank">#</div>
          <div className="col-trigger">Trigger</div>
          <div className="col-occurrences">Occurrences</div>
          <div className="col-algorithms">Algorithms</div>
          <div className="col-sources">Sources</div>
          <div className="col-type">Type</div>
        </div>

        {triggers.map((trigger, index) => (
          <div key={trigger.id} className="table-row">
            <div className="col-rank">{index + 1}</div>
            <div className="col-trigger">
              <code className="trigger-moves">
                {trigger.ngram.moves}
              </code>
            </div>
            <div className="col-occurrences">
              <span className="occurrence-count">{trigger.totalOccurrences}</span>
            </div>
            <div className="col-algorithms">
              <span className="algorithm-count">{trigger.algorithmCoverage}</span>
            </div>
            <div className="col-sources">
              <span className="source-count">{trigger.sourceCoverage}</span>
            </div>
            <div className="col-type">
              <span className="alg-type">{trigger.algType || 'Mixed'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}