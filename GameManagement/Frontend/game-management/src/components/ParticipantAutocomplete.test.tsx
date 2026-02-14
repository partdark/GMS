import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParticipantAutocomplete } from '../components/ParticipantAutocomplete';
import { Person } from '../types';

const mockPeople: Person[] = [
  { id: 1, gameName: 'Player1', name: 'Иван Иванов', role: 'player', isActive: true },
  { id: 2, gameName: 'Player2', name: 'Петр Петров', role: 'player', isActive: true },
  { id: 3, gameName: 'Player3', name: 'Сидор Сидоров', role: 'player', isActive: true }
];

describe('ParticipantAutocomplete', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders input field with placeholder', () => {
    render(
      <ParticipantAutocomplete
        people={mockPeople}
        selectedPersonId={0}
        onSelect={mockOnSelect}
        placeholder="Начните вводить имя..."
      />
    );

    const input = screen.getByPlaceholderText('Начните вводить имя...');
    expect(input).toBeInTheDocument();
  });

  test('shows filtered results when typing', () => {
    render(
      <ParticipantAutocomplete
        people={mockPeople}
        selectedPersonId={0}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('(Player1)')).toBeInTheDocument();
  });

  test('calls onSelect when participant is clicked', () => {
    render(
      <ParticipantAutocomplete
        people={mockPeople}
        selectedPersonId={0}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Иван' } });

    const participantOption = screen.getByText('Иван Иванов');
    fireEvent.click(participantOption);

    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  test('displays selected participant name', () => {
    render(
      <ParticipantAutocomplete
        people={mockPeople}
        selectedPersonId={1}
        onSelect={mockOnSelect}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Иван Иванов (Player1)');
  });
});