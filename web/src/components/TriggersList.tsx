import { useQuery } from '@apollo/client';
import { GET_TOP_TRIGGERS } from '../lib/queries';
import { FilterState } from './Dashboard';
import './TriggersList.css';

interface TriggersListProps {
  filters: FilterState;
}

interface NgramAggregate {
  id: string;
  totalOccurrences: number;
  algorithmCoverage: number;
  sourceCoverage: number;
  algType?: string;
  sourceId?: string;
  updatedAt: string;
  ngram: {
    id: string;
    moves: string;
    length: number;
  };
}

export function TriggersList({ filters }: TriggersListProps) {
  const { loading, error, data } = useQuery<{ topTriggers: NgramAggregate[] }>(GET_TOP_TRIGGERS, {
    variables: {
      filters: Object.keys(filters).length > 0 ? filters : null,
      limit: 50,
    },
  });

  if (loading) return <div className="loading">Loading triggers...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const triggers = data?.topTriggers || [];

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
      <div className="triggers-header">
        <div className="trigger-count">
          Found {triggers.length} triggers
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