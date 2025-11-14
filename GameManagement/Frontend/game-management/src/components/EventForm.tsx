import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Season, Event, Person } from '../types';

interface EventFormProps {
  onEventAdded: (event: Event) => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onEventAdded }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    seasonId: '',
    payment: '',
    dateTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
    participantIds: [0] // Начинаем с одного пустого ComboBox
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [seasonsRes, peopleRes] = await Promise.all([
        api.getSeasons(1, 1000),
        api.getPeople(1, 1000)
      ]);
      const seasonsData = seasonsRes.data.seasons || seasonsRes.data.Seasons || seasonsRes.data;
      setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
      
      let peopleData = [];
      if (peopleRes.data.people) {
        peopleData = peopleRes.data.people;
      } else if (peopleRes.data.People) {
        peopleData = peopleRes.data.People;
      } else if (Array.isArray(peopleRes.data)) {
        peopleData = peopleRes.data;
      }
      setPeople(peopleData);
      
      // Выбираем самый актуальный сезон по умолчанию
      if (seasonsData.length > 0) {
        const latestSeason = seasonsData[0]; // Уже отсортированы по дате
        setFormData(prev => ({ ...prev, seasonId: latestSeason.id.toString() }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleParticipantChange = (index: number, personId: number) => {
    const newParticipantIds = [...formData.participantIds];
    newParticipantIds[index] = personId;
    
    // Если выбран участник и это последний ComboBox, добавляем новый пустой
    if (personId > 0 && index === newParticipantIds.length - 1) {
      newParticipantIds.push(0);
    }
    
    setFormData({ ...formData, participantIds: newParticipantIds });
  };

  const removeParticipant = (index: number) => {
    const newParticipantIds = formData.participantIds.filter((_, i) => i !== index);
    // Если удалили все, оставляем один пустой
    if (newParticipantIds.length === 0) {
      newParticipantIds.push(0);
    }
    setFormData({ ...formData, participantIds: newParticipantIds });
  };

  const getAvailablePeople = (currentIndex: number) => {
    if (!Array.isArray(people)) return [];
    const selectedIds = formData.participantIds.filter((id, index) => id > 0 && index !== currentIndex);
    return people.filter(person => !selectedIds.includes(person.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.seasonId || !formData.payment) {
      alert('Заполните все поля');
      return;
    }
    
    const selectedParticipants = formData.participantIds.filter(id => id > 0);
    
    try {
      const response = await api.createEvent({
        name: formData.name,
        seasonId: Number(formData.seasonId),
        payment: Number(formData.payment),
        dateTime: formData.dateTime
      });
      
      // Добавляем участников к событию
      for (const personId of selectedParticipants) {
        await api.addParticipant(response.data.id, personId);
      }
      
      onEventAdded(response.data);
      setFormData({ name: '', seasonId: '', payment: '', dateTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), participantIds: [0] });
      
      // Перезагружаем страницу для обновления всех таблиц
      window.location.reload();
      
      alert('Событие создано!');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Ошибка создания события');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>Создать событие</h3>
      <div>
        <label>Название: </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{ width: '200px' }}
        />
      </div>
      <div>
        <label>Сезон: </label>
        <select
          value={formData.seasonId}
          onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
          required
        >
          <option value="">Выберите сезон</option>
          {seasons
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
            .filter(season => season.isActive)
            .map(season => (
              <option key={season.id} value={season.id}>
                Сезон {season.id} ({new Date(season.startDate).toLocaleDateString()})
              </option>
            ))}
        </select>
      </div>
      <div>
        <label>Дата и время: </label>
        <input
          type="datetime-local"
          value={formData.dateTime}
          onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
          required
        />
      </div>
      <div>
        <label>Оплата: </label>
        <input
          type="number"
          step="0.01"
          value={formData.payment}
          onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
          required
        />
      </div>
      <div>
        <label>Участники:</label>
        {formData.participantIds.map((participantId, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <select
              value={participantId}
              onChange={(e) => handleParticipantChange(index, Number(e.target.value))}
              style={{ marginRight: '10px', width: '200px' }}
            >
              <option value={0}>Выберите участника</option>
              {getAvailablePeople(index).map(person => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.gameName})
                </option>
              ))}
            </select>
            {formData.participantIds.length > 1 && participantId > 0 && (
              <button
                type="button"
                onClick={() => removeParticipant(index)}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="submit">Создать событие</button>
    </form>
  );
};