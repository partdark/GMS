import React, { useState, useEffect } from 'react';
import { Event, Person, Season, EventParticipant } from '../types';
import { api } from '../api';

interface EventsTableProps {
  events: Event[];
  seasons: Season[];
  onEventUpdated: (event: Event) => void;
  onEventDeleted: (eventId: number) => void;
}

interface EventWithParticipants extends Event {
  participants?: EventParticipant[];
  participantCount?: number;
}

export const EventsTable: React.FC<EventsTableProps> = ({ events, seasons, onEventUpdated, onEventDeleted }) => {
  const [forceReload, setForceReload] = useState(0);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [eventsWithParticipants, setEventsWithParticipants] = useState<EventWithParticipants[]>([]);
  const [sortField, setSortField] = useState<keyof Event>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', payment: '', dateTime: '', seasonId: 0 });
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await api.getEvents(currentPage, 50, selectedSeasonId || undefined, sortField, sortDirection);
      console.log('Events API response:', response.data);
      
      let eventsData = [];
      if (response.data.events) {
        eventsData = response.data.events;
        setTotalPages(response.data.totalPages || 1);
      } else if (response.data.Events) {
        eventsData = response.data.Events;
        setTotalPages(response.data.TotalPages || 1);
      } else if (Array.isArray(response.data)) {
        eventsData = response.data;
        setTotalPages(1);
      }
      
      setEventsWithParticipants(eventsData.map((event: any) => ({ 
        ...event, 
        participants: [], 
        participantCount: event.participantCount || 0 
      })));
    } catch (error) {
      console.error('Error loading events:', error);
      setEventsWithParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    loadEvents();
    

  }, [currentPage, selectedSeasonId, seasons, forceReload, sortField, sortDirection]);

  // Отдельный useEffect для автовыбора сезона
  useEffect(() => {
    if (seasons.length > 0 && selectedSeasonId === null) {
 const sortedSeasons = [...seasons].sort((a, b) => b.id - a.id);
 setSelectedSeasonId(sortedSeasons[0].id);
      // Принудительно перезагружаем события после выбора сезона
 setTimeout(() => setForceReload(prev => prev + 1), 100);
    }
  }, [seasons]);

  // Перезагрузка при монтировании
  useEffect(() => {


    setForceReload(prev => prev + 1);
  }, []);

  const loadPeople = async () => {
    try {
      const response = await api.getPeople(1, 1000);
      console.log('People response for EventsTable:', response.data);
      const peopleData = response.data.people || response.data.People || response.data;
      const newPeople = Array.isArray(peopleData) ? peopleData : [];
      setPeople(newPeople);
      
      // Обновляем данные участников в событиях
      const updatedEvents = eventsWithParticipants.map(event => ({
        ...event,
        participants: event.participants?.map(participant => 
          newPeople.find(p => p.id === participant.id) || participant
        )
      }));
      setEventsWithParticipants(updatedEvents);
    } catch (error) {
      console.error('Error loading people:', error);
      setPeople([]);
    }
  };

  useEffect(() => {
    loadPeople();
    // Принудительная перезагрузка событий при монтировании
    setCurrentPage(1);
    // Автовыбор последнего сезона если не выбран
    if (seasons.length > 0 && selectedSeasonId === null) {
      const sortedSeasons = [...seasons].sort((a, b) => b.id - a.id);
      setSelectedSeasonId(sortedSeasons[0].id);
    }
  }, []);

  // Перезагружаем people каждые 30 секунд для синхронизации
  useEffect(() => {
    const interval = setInterval(loadPeople, 30000);
    return () => clearInterval(interval);
  }, [eventsWithParticipants]);

  const handleSort = (field: keyof Event) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1); // Сбрасываем на первую страницу при сортировке
  };

  const getSortIcon = (field: keyof Event) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const toggleExpand = async (eventId: number) => {
    const newExpanded = new Set(expandedEvents);
    
    if (expandedEvents.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
      // Загружаем участников если еще не загружены
      const eventIndex = eventsWithParticipants.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        try {
          const response = await api.getEventParticipants(eventId);
          const updatedEvents = [...eventsWithParticipants];
          updatedEvents[eventIndex].participants = Array.isArray(response.data) ? response.data : [];
          setEventsWithParticipants(updatedEvents);
        } catch (error) {
          console.error('Error loading participants:', error);
          const updatedEvents = [...eventsWithParticipants];
          updatedEvents[eventIndex].participants = [];
          setEventsWithParticipants(updatedEvents);
        }
      }
    }
    
    setExpandedEvents(newExpanded);
  };

  const startEdit = (event: Event) => {
    setEditingEvent(event.id);
    setEditForm({
      name: event.name,
      payment: event.payment.toString(),
      dateTime: event.dateTime ? event.dateTime.slice(0, 16) : '',
      seasonId: event.seasonId
    });
  };

  const saveEdit = async (event: Event) => {
    try {
      const updatedEvent = {
        id: event.id,
        name: editForm.name,
        seasonId: editForm.seasonId,
        payment: Number(editForm.payment),
        dateTime: editForm.dateTime || event.dateTime
      };
      await api.updateEvent(event.id, updatedEvent);
      // Обновляем локальное состояние
      const eventIndex = eventsWithParticipants.findIndex(e => e.id === event.id);
      if (eventIndex !== -1) {
        const updatedEvents = [...eventsWithParticipants];
        updatedEvents[eventIndex] = { ...updatedEvents[eventIndex], ...updatedEvent };
        setEventsWithParticipants(updatedEvents);
      }
      onEventUpdated(updatedEvent as Event);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Ошибка обновления события');
    }
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setEditForm({ name: '', payment: '', dateTime: '', seasonId: 0 });
  };

  const removeParticipant = async (eventId: number, personId: number) => {
    try {
      await api.removeParticipant(eventId, personId);
      const eventIndex = eventsWithParticipants.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        const updatedEvents = [...eventsWithParticipants];
        updatedEvents[eventIndex].participants = updatedEvents[eventIndex].participants?.filter(p => p.id !== personId) || [];
        updatedEvents[eventIndex].participantCount = updatedEvents[eventIndex].participants?.length || 0;
        setEventsWithParticipants(updatedEvents);
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Ошибка удаления участника');
    }
  };

  const updateParticipantPayment = async (eventId: number, personId: number, payment: number) => {
    try {
      await api.updateParticipantPayment(eventId, personId, payment);
      const eventIndex = eventsWithParticipants.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        const updatedEvents = [...eventsWithParticipants];
        const participantIndex = updatedEvents[eventIndex].participants?.findIndex(p => p.id === personId);
        if (participantIndex !== undefined && participantIndex !== -1 && updatedEvents[eventIndex].participants) {
          updatedEvents[eventIndex].participants![participantIndex].payment = payment;
          setEventsWithParticipants(updatedEvents);
        }
      }
    } catch (error) {
      console.error('Error updating participant payment:', error);
      alert('Ошибка обновления оплаты');
    }
  };

  const addParticipant = async (eventId: number, personId: number) => {
    try {
      const event = eventsWithParticipants.find(e => e.id === eventId);
      const basePayment = event?.payment || 0;
      await api.addParticipant(eventId, personId, basePayment);
      const eventIndex = eventsWithParticipants.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        const person = people.find(p => p.id === personId);
        if (person) {
          const updatedEvents = [...eventsWithParticipants];
          const newParticipant: EventParticipant = {
            id: person.id,
            name: person.name,
            gameName: person.gameName,
            phoneNumber: person.phoneNumber,
            payment: basePayment
          };
          updatedEvents[eventIndex].participants = [...(updatedEvents[eventIndex].participants || []), newParticipant];
          updatedEvents[eventIndex].participantCount = updatedEvents[eventIndex].participants?.length || 0;
          setEventsWithParticipants(updatedEvents);
        }
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert('Ошибка добавления участника');
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить это событие?')) return;
    
    try {
      await api.deleteEvent(eventId);
      // Удаляем событие из локального состояния
      setEventsWithParticipants(eventsWithParticipants.filter(e => e.id !== eventId));
      onEventDeleted(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Ошибка удаления события');
    }
  };

  // Сортировка теперь происходит на сервере
  const sortedEvents = eventsWithParticipants;

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <label>Фильтр по сезону: </label>
        <select
          value={selectedSeasonId || ''}
          onChange={(e) => setSelectedSeasonId(e.target.value ? Number(e.target.value) : null)}
          style={{ padding: '8px', marginLeft: '10px' }}
        >
          <option value="">Все сезоны</option>
          {seasons
            .sort((a, b) => b.id - a.id)
            .map(season => (
              <option key={season.id} value={season.id}>
                Сезон {season.id} ({new Date(season.startDate).toLocaleDateString()})
              </option>
            ))}
        </select>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}
      
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
          style={{ marginRight: '10px', padding: '5px 10px' }}
        >
          Предыдущая
        </button>
        <span>Страница {currentPage} из {totalPages}</span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          Следующая
        </button>
      </div>

      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        marginTop: '10px',
        border: '1px solid #ddd'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('id')}
            >
              Событие {getSortIcon('id')}
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('name')}
            >
              Название {getSortIcon('name')}
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('seasonId')}
            >
              Сезон {getSortIcon('seasonId')}
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('dateTime')}
            >
              Дата/время {getSortIcon('dateTime')}
            </th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('payment')}
            >
              Базовая оплата {getSortIcon('payment')}
            </th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Кол-во участников</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Участники</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedEvents.map((event, index) => (
            <React.Fragment key={event.id}>
              <tr style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{event.id}</td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  {editingEvent === event.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      style={{ width: '100%' }}
                    />
                  ) : event.name}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  {editingEvent === event.id ? (
                    <select
                      value={editForm.seasonId}
                      onChange={(e) => setEditForm({ ...editForm, seasonId: Number(e.target.value) })}
                      style={{ padding: '5px' }}
                    >
                      {seasons.map(season => (
                        <option key={season.id} value={season.id}>
                          Сезон {season.id}
                        </option>
                      ))}
                    </select>
                  ) : event.seasonId}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  {editingEvent === event.id ? (
                    <input
                      type="datetime-local"
                      value={editForm.dateTime}
                      onChange={(e) => setEditForm({...editForm, dateTime: e.target.value})}
                    />
                  ) : (event.dateTime ? event.dateTime.replace('T', ' ') : '-')}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                  {editingEvent === event.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.payment}
                      onChange={(e) => setEditForm({...editForm, payment: e.target.value})}
                      style={{ width: '80px' }}
                    />
                  ) : event.payment}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                  {event.participantCount || (event.participants ? event.participants.length : 0)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => toggleExpand(event.id)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '5px'
                    }}
                  >
                    {expandedEvents.has(event.id) ? 'Скрыть и сохранить' : 'Показать'}
                  </button>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                  {editingEvent === event.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(event)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(event)}
                        style={{
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </td>
              </tr>
              {expandedEvents.has(event.id) && (
                <tr>
                  <td colSpan={8} style={{ border: '1px solid #ddd', padding: '12px', backgroundColor: '#f0f8ff' }}>
                    <strong>Участники события:</strong>
                    {Array.isArray(event.participants) && event.participants.length > 0 ? (
                      <div style={{ margin: '10px 0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#e9ecef' }}>
                              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Имя</th>
                              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Оплата</th>
                              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {event.participants.map(participant => (
                              <tr key={participant.id}>
                                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                                  {participant.name || participant.gameName} ({participant.id})
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={participant.payment}
                                    onChange={(e) => updateParticipantPayment(event.id, participant.id, Number(e.target.value))}
                                    style={{ width: '80px', textAlign: 'center' }}
                                  />
                                </td>
                                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => removeParticipant(event.id, participant.id)}
                                    style={{
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Удалить
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ margin: '10px 0', fontStyle: 'italic', color: '#666' }}>
                        Участники не найдены
                      </p>
                    )}
                    <div style={{ marginTop: '10px' }}>
                      <strong>Добавить участника:</strong>
                      <select
                        onChange={(e) => {
                          const personId = Number(e.target.value);
                          if (personId > 0) {
                            addParticipant(event.id, personId);
                            e.target.value = '0';
                          }
                        }}
                        style={{ marginLeft: '10px', padding: '5px' }}
                      >
                        <option value="0">Выберите участника</option>
                        {Array.isArray(people) && people
                          .filter(person => !Array.isArray(event.participants) || !event.participants.some(p => p.id === person.id))
                          .map(person => (
                            <option key={person.id} value={person.id}>
                              {person.name || person.gameName} ({person.id})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};