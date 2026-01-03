import { useSubscription } from '@apollo/client';
import { useMemo } from 'react';
import {
  IMPORT_PROGRESS_SUBSCRIPTION,
  IMPORT_COMPLETED_SUBSCRIPTION,
  IMPORT_FAILED_SUBSCRIPTION,
} from '../lib/queries';
import './ImportProgress.css';

interface ImportProgressData {
  importRunId: string;
  totalAlgorithms: number;
  processedAlgorithms: number;
  currentAlgorithm?: string;
  status: string;
  percentage: number;
  timestamp: string;
}

interface ImportCompletedData {
  importRunId: string;
  totalAlgorithms: number;
  processedAlgorithms: number;
  newTriggersCount: number;
  duration: number;
  timestamp: string;
}

interface ImportFailedData {
  importRunId: string;
  message: string;
  processedAlgorithms: number;
  totalAlgorithms: number;
  timestamp: string;
}

interface ImportProgressProps {
  importRunId?: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function ImportProgress({ importRunId, onComplete, onError }: ImportProgressProps) {
  // Subscribe to progress updates
  const { data: progressData } = useSubscription<{ importProgress: ImportProgressData }>(
    IMPORT_PROGRESS_SUBSCRIPTION
  );

  // Subscribe to completion events
  const { data: completedData } = useSubscription<{ importCompleted: ImportCompletedData }>(
    IMPORT_COMPLETED_SUBSCRIPTION
  );

  // Subscribe to failure events
  const { data: failedData } = useSubscription<{ importFailed: ImportFailedData }>(
    IMPORT_FAILED_SUBSCRIPTION
  );

  // Compute current state from subscription data
  const currentState = useMemo(() => {
    // Check for completion first
    if (completedData?.importCompleted) {
      const completion = completedData.importCompleted;
      if (!importRunId || completion.importRunId === importRunId) {
        // Trigger callback
        setTimeout(() => onComplete?.(), 0);
        return { type: 'completed' as const, data: completion };
      }
    }

    // Check for failure
    if (failedData?.importFailed) {
      const failure = failedData.importFailed;
      if (!importRunId || failure.importRunId === importRunId) {
        // Trigger callback
        setTimeout(() => onError?.(failure.message), 0);
        return { type: 'failed' as const, data: failure };
      }
    }

    // Check for progress
    if (progressData?.importProgress) {
      const progress = progressData.importProgress;
      if (!importRunId || progress.importRunId === importRunId) {
        return { type: 'progress' as const, data: progress };
      }
    }

    return { type: 'none' as const };
  }, [progressData, completedData, failedData, importRunId, onComplete, onError]);

  // Don't render if no relevant data
  if (currentState.type === 'none') {
    return null;
  }

  return (
    <div className="import-progress">
      {currentState.type === 'failed' && (
        <div className="progress-error">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <div className="error-title">Import Failed</div>
            <div className="error-message">{currentState.data.message}</div>
          </div>
        </div>
      )}

      {currentState.type === 'completed' && (
        <div className="progress-completed">
          <div className="success-icon">✅</div>
          <div className="success-content">
            <div className="success-title">Import Completed</div>
            <div className="success-message">
              All algorithms have been processed successfully!
            </div>
          </div>
        </div>
      )}

      {currentState.type === 'progress' && (
        <div className="progress-active">
          <div className="progress-header">
            <div className="progress-title">Importing Algorithms</div>
            <div className="progress-percentage">{currentState.data.percentage}%</div>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${currentState.data.percentage}%` }}
            />
          </div>
          
          <div className="progress-details">
            <div className="progress-status">{currentState.data.status}</div>
            <div className="progress-count">
              {currentState.data.processedAlgorithms} / {currentState.data.totalAlgorithms} algorithms
            </div>
          </div>
          
          {currentState.data.currentAlgorithm && (
            <div className="current-algorithm">
              <span className="algorithm-label">Current:</span>
              <code className="algorithm-moves">{currentState.data.currentAlgorithm}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}