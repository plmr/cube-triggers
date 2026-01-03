import { useState } from 'react';
import { SourcesList } from './SourcesList.tsx';
import { ImportForm } from './ImportForm.tsx';
import { TriggersList } from './TriggersList.tsx';
import { TriggerFilters } from './TriggerFilters.tsx';
import type { FilterState } from '../shared-types';
import './Dashboard.css';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'triggers' | 'import' | 'sources'>('triggers');
  const [filters, setFilters] = useState<FilterState>({});

  // Function to handle "View Triggers" from SourcesList
  const handleViewTriggersBySource = (sourceId: string, sourceName: string) => {
    // Switch to triggers tab
    setActiveTab('triggers');
    // Set filter to show only triggers from this source
    setFilters({ sourceId });
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'triggers' ? 'active' : ''}
          onClick={() => setActiveTab('triggers')}
        >
          🎯 Triggers
        </button>
        <button 
          className={activeTab === 'import' ? 'active' : ''}
          onClick={() => setActiveTab('import')}
        >
          📥 Import
        </button>
        <button 
          className={activeTab === 'sources' ? 'active' : ''}
          onClick={() => setActiveTab('sources')}
        >
          📚 Sources
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'triggers' && (
          <div className="triggers-view">
            <div className="filters-section">
              <h2>Filter Triggers</h2>
              <TriggerFilters filters={filters} onFiltersChange={setFilters} />
            </div>
            <div className="results-section">
              <h2>Top Triggers</h2>
              <TriggersList filters={filters} />
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-view">
            <h2>Import Algorithms</h2>
            <ImportForm />
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-view">
            <h2>Algorithm Sources</h2>
            <SourcesList onViewTriggers={handleViewTriggersBySource} />
          </div>
        )}
      </div>
    </div>
  );
}