import { FilterState } from './Dashboard';
import './TriggerFilters.css';

interface TriggerFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const ALG_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'F2L', label: 'F2L' },
  { value: 'OLL', label: 'OLL' },
  { value: 'PLL', label: 'PLL' },
  { value: 'CMLL', label: 'CMLL' },
  { value: 'COLL', label: 'COLL' },
  { value: 'ZBLL', label: 'ZBLL' },
  { value: 'LSE', label: 'LSE' },
  { value: 'OTHER', label: 'Other' },
];

const LENGTHS = [
  { value: '', label: 'All Lengths' },
  { value: '2', label: '2 moves' },
  { value: '3', label: '3 moves' },
  { value: '4', label: '4 moves' },
  { value: '5', label: '5 moves' },
  { value: '6', label: '6 moves' },
];

export function TriggerFilters({ filters, onFiltersChange }: TriggerFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="trigger-filters">
      <div className="filter-group">
        <label htmlFor="algType">Algorithm Type</label>
        <select
          id="algType"
          value={filters.algType || ''}
          onChange={(e) => updateFilter('algType', e.target.value)}
        >
          {ALG_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="length">N-gram Length</label>
        <select
          id="length"
          value={filters.length || ''}
          onChange={(e) => updateFilter('length', e.target.value ? parseInt(e.target.value) : undefined)}
        >
          {LENGTHS.map((length) => (
            <option key={length.value} value={length.value}>
              {length.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="minOccurrences">Min Occurrences</label>
        <input
          id="minOccurrences"
          type="number"
          min="1"
          placeholder="e.g. 5"
          value={filters.minOccurrences || ''}
          onChange={(e) => updateFilter('minOccurrences', e.target.value ? parseInt(e.target.value) : undefined)}
        />
      </div>

      <div className="filter-actions">
        <button
          onClick={() => onFiltersChange({})}
          className="clear-filters"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}