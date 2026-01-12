import React from 'react';
import '../styles/SearchBar.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Pretraži po dobavljaču..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="clear-button" onClick={() => onChange('')}>
          &times;
        </button>
      )}
    </div>
  );
};

export default SearchBar;
