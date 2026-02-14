import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';
import './ParticipantAutocomplete.css';

interface ParticipantAutocompleteProps {
  people: Person[];
  selectedPersonId: number;
  onSelect: (personId: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ParticipantAutocomplete: React.FC<ParticipantAutocompleteProps> = ({
  people,
  selectedPersonId,
  onSelect,
  placeholder = "Выберите участника...",
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredPeople(people);
  }, [people]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = people.filter(person => 
        person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.gameName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPeople(filtered);
    } else {
      setFilteredPeople(people);
    }
  }, [searchTerm, people]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (selectedPersonId > 0) {
      const selectedPerson = people.find(p => p.id === selectedPersonId);
      if (selectedPerson) {
        return `${selectedPerson.name} (${selectedPerson.gameName})`;
      }
    }
    return placeholder;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePersonSelect = (person: Person) => {
    onSelect(person.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleClearSelection = () => {
    onSelect(0);
    setSearchTerm('');
  };

  return (
    <div className="participant-autocomplete" ref={dropdownRef}>
      <div 
        className="participant-autocomplete-control" 
        onClick={handleToggleDropdown} 
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleDropdown();
          }
        }}
      >
        <span className={`participant-autocomplete-value ${selectedPersonId === 0 ? 'placeholder' : ''}`}>
          {getDisplayValue()}
        </span>
        {selectedPersonId > 0 && (
          <button 
            type="button"
            className="participant-autocomplete-clear"
            onClick={(e) => {
              e.stopPropagation();
              handleClearSelection();
            }}
          >
            ×
          </button>
        )}
        <span className={`participant-autocomplete-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="participant-autocomplete-dropdown">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Поиск..."
            className="participant-autocomplete-search"
          />
          <div className="participant-autocomplete-options">
            {filteredPeople.length > 0 ? (
              filteredPeople.map(person => (
                <div
                  key={person.id}
                  onClick={() => handlePersonSelect(person)}
                  className={`participant-autocomplete-item ${selectedPersonId === person.id ? 'selected' : ''}`}
                  tabIndex={0}
                >
                  <div className="participant-autocomplete-name">{person.name}</div>
                  <div className="participant-autocomplete-gamename">({person.gameName})</div>
                </div>
              ))
            ) : (
              <div className="participant-autocomplete-no-results">
                Участники не найдены
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};