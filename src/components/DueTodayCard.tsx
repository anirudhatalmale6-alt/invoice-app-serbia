import React from 'react';
import '../styles/DueTodayCard.css';

interface Props {
  count: number;
}

const DueTodayCard: React.FC<Props> = ({ count }) => {
  return (
    <div className={`due-today-card ${count > 0 ? 'has-due' : ''}`}>
      <span className="stat-number">{count}</span>
      <span className="stat-label">Dospeva danas</span>
      {count > 0 && <span className="alert-icon">⚠️</span>}
    </div>
  );
};

export default DueTodayCard;
