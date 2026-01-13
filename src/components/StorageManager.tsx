import React, { useState, useEffect } from 'react';
import { getStorageStats, deleteOldAttachments, formatBytes } from '../services/storage';
import type { StorageStats } from '../services/storage';
import '../styles/StorageManager.css';

interface Props {
  onClose: () => void;
}

const StorageManager: React.FC<Props> = ({ onClose }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ deleted: number; freedBytes: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOld = async () => {
    if (!confirm('Da li ste sigurni da želite obrisati sve priloge starije od 12 mjeseci?')) {
      return;
    }

    setDeleting(true);
    setResult(null);
    try {
      const deleteResult = await deleteOldAttachments(12);
      setResult(deleteResult);
      // Reload stats after deletion
      await loadStats();
    } catch (error) {
      console.error('Error deleting old attachments:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return '#dc2626'; // Red
    if (percent >= 70) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="storage-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upravljanje memorijom</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="storage-content">
          {loading ? (
            <div className="storage-loading">Učitavanje...</div>
          ) : stats ? (
            <>
              <div className="storage-stats">
                <div className="storage-bar-container">
                  <div
                    className="storage-bar-fill"
                    style={{
                      width: `${Math.min(stats.percentUsed, 100)}%`,
                      backgroundColor: getProgressColor(stats.percentUsed)
                    }}
                  />
                </div>
                <div className="storage-info">
                  <span className="storage-used">{formatBytes(stats.totalBytes)} / 1 GB</span>
                  <span className="storage-percent">{stats.percentUsed.toFixed(1)}% iskorišteno</span>
                </div>
                <div className="storage-files">
                  Ukupno fajlova: {stats.totalFiles}
                </div>
              </div>

              {stats.percentUsed >= 80 && (
                <div className="storage-warning">
                  ⚠️ Memorija je skoro puna! Preporučujemo brisanje starih priloga.
                </div>
              )}

              <div className="storage-actions">
                <button
                  className="delete-old-button"
                  onClick={handleDeleteOld}
                  disabled={deleting}
                >
                  {deleting ? 'Brisanje...' : '🗑️ Obriši priloge starije od 12 mjeseci'}
                </button>
              </div>

              {result && (
                <div className="delete-result">
                  ✅ Obrisano {result.deleted} fajlova ({formatBytes(result.freedBytes)} oslobođeno)
                </div>
              )}
            </>
          ) : (
            <div className="storage-error">Greška pri učitavanju statistike</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageManager;
