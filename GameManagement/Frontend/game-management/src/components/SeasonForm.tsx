import React, { useState } from 'react';
import { api } from '../api';
import { Season } from '../types';

interface SeasonFormProps {
  onSeasonAdded: (season: Season) => void;
}

export const SeasonForm: React.FC<SeasonFormProps> = ({ onSeasonAdded }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    try {
      const response = await api.createSeason({ startDate, isActive: true });
      onSeasonAdded(response.data);
      setStartDate(new Date().toISOString().split('T')[0]);
      
      // Перезагружаем страницу для обновления всех таблиц
      window.location.reload();
      
      alert('Сезон создан!');
    } catch (error) {
      console.error('Error creating season:', error);
      alert('Ошибка создания сезона');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>Создать сезон</h3>
      <div>
        <label>Дата начала: </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>
      <button type="submit">Создать сезон</button>
    </form>
  );
};