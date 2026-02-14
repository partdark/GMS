import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Season, Event, Person } from '../types';
import { ParticipantAutocomplete } from './ParticipantAutocomplete';

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
    participants: [{ personId: 0, payment: '' }]
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
      
  
      if (seasonsData.length > 0) {
        const latestSeason = seasonsData[0]; 
        setFormData(prev => ({ ...prev, seasonId: latestSeason.id.toString() }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleParticipantChange = (index: number, personId: number) => {
    const newParticipants = [...formData.participants];
    newParticipants[index] = { 
      personId, 
      payment: personId > 0 ? formData.payment : '' 
    };
    
    // Добавляем новое поле только если выбрали участника в последнем поле и это поле не пустое
    if (personId > 0 && index === newParticipants.length - 1) {
      newParticipants.push({ personId: 0, payment: '' });
    }
    
    // Убираем лишние пустые поля в конце (оставляем только одно)
    while (newParticipants.length > 1 && 
           newParticipants[newParticipants.length - 1].personId === 0 && 
           newParticipants[newParticipants.length - 2].personId === 0) {
      newParticipants.pop();
    }
    
    setFormData({ ...formData, participants: newParticipants });
  };

  const handleParticipantPaymentChange = (index: number, payment: string) => {
    const newParticipants = [...formData.participants];
    newParticipants[index].payment = payment;
    setFormData({ ...formData, participants: newParticipants });
  };

  const removeParticipant = (index: number) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    if (newParticipants.length === 0) {
      newParticipants.push({ personId: 0, payment: '' });
    }
    setFormData({ ...formData, participants: newParticipants });
  };

  const getAvailablePeople = (currentIndex: number) => {
    if (!Array.isArray(people)) return [];
    const selectedIds = formData.participants.filter((p, index) => p.personId > 0 && index !== currentIndex).map(p => p.personId);
    return people.filter(person => !selectedIds.includes(person.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.seasonId || !formData.payment) {
      alert('Заполните все поля');
      return;
    }
    
    const selectedParticipants = formData.participants.filter(p => p.personId > 0);
    
    try {
      const response = await api.createEvent({
        name: formData.name,
        seasonId: Number(formData.seasonId),
        payment: Number(formData.payment),
        dateTime: formData.dateTime
      });
      
      for (const participant of selectedParticipants) {
        const payment = participant.payment ? Number(participant.payment) : Number(formData.payment);
        await api.addParticipant(response.data.id, participant.personId, payment);
      }
      
      onEventAdded(response.data);
      setFormData({ name: '', seasonId: '', payment: '', dateTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16), participants: [{ personId: 0, payment: '' }] });
      
 
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
        {formData.participants.map((participant, index) => (
          <div key={`${index}-${participant.personId}`} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px', minHeight: '40px' }}>
            <ParticipantAutocomplete
              people={getAvailablePeople(index)}
              selectedPersonId={participant.personId}
              onSelect={(personId) => handleParticipantChange(index, personId)}
              placeholder="Выберите участника..."
            />
            {participant.personId > 0 && (
              <input
                type="number"
                step="0.01"
                value={participant.payment}
                onChange={(e) => handleParticipantPaymentChange(index, e.target.value)}
                placeholder="Оплата"
                style={{ marginLeft: '10px', width: '100px', fontSize: '16px', height: '32px', padding: '4px 6px', boxSizing: 'border-box' }}
              />
            )}
            {formData.participants.length > 1 && participant.personId > 0 && (
              <button
                type="button"
                onClick={() => removeParticipant(index)}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', marginLeft: '10px', fontSize: '16px', height: '32px' }}
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