import React, { useState, useEffect } from 'react';
import { Season, Event } from '../types';
import { api } from '../api';

interface SeasonsTableProps {
  seasons: Season[];
  events: Event[];
  onSeasonUpdated: (season: Season) => void;
}

export const SeasonsTable: React.FC<SeasonsTableProps> = ({ seasons: initialSeasons, events, onSeasonUpdated }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsWithCounts, setSeasonsWithCounts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Season>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSeasons();
  }, [currentPage]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const response = await api.getSeasons(currentPage, 50);
      console.log('Seasons API response:', response.data);
      
      let seasonsData = [];
      if (response.data.seasons) {
        seasonsData = response.data.seasons;
        setTotalPages(response.data.totalPages || 1);
      } else if (response.data.Seasons) {
        seasonsData = response.data.Seasons;
        setTotalPages(response.data.TotalPages || 1);
      } else if (Array.isArray(response.data)) {
        seasonsData = response.data;
        setTotalPages(1);
      }
      
      setSeasons(seasonsData);
      
      // Загружаем количество событий для каждого сезона
      const seasonsWithEventCounts = await Promise.all(
        seasonsData.map(async (season: any) => {
          try {
            const eventsResponse = await api.getEvents(1, 1000, season.id);
            const eventsData = eventsResponse.data.events || eventsResponse.data.Events || eventsResponse.data;
            const eventCount = Array.isArray(eventsData) ? eventsData.length : (eventsResponse.data.totalCount || 0);
            return { ...season, eventCount };
          } catch (error) {
            return { ...season, eventCount: 0 };
          }
        })
      );
      setSeasonsWithCounts(seasonsWithEventCounts);
    } catch (error) {
      console.error('Error loading seasons:', error);
      setSeasons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Season) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Season) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const toggleActive = async (season: Season) => {
    try {
      const updatedSeason = { 
        id: season.id,
        startDate: season.startDate, 
        isActive: !season.isActive 
      };
      await api.updateSeason(season.id, updatedSeason);
      onSeasonUpdated(updatedSeason);
    } catch (error) {
      console.error('Error updating season:', error);
      alert('Ошибка обновления сезона');
    }
  };

  const sortedSeasons = [...seasonsWithCounts].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });



  return (
    <div>
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
            ID {getSortIcon('id')}
          </th>
          <th 
            style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
            onClick={() => handleSort('startDate')}
          >
            Дата начала {getSortIcon('startDate')}
          </th>
          <th 
            style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => handleSort('isActive')}
          >
            Активный {getSortIcon('isActive')}
          </th>
          <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
            Количество событий
          </th>
          <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedSeasons.map((season, index) => {
          return (
            <tr key={season.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{season.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {new Date(season.startDate).toLocaleDateString()}
              </td>
              <td style={{ 
                border: '1px solid #ddd', 
                padding: '12px', 
                textAlign: 'center',
                color: season.isActive ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {season.isActive ? 'Да' : 'Нет'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                {season.eventCount || 0}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => toggleActive(season)}
                  style={{
                    backgroundColor: season.isActive ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {season.isActive ? 'Деактивировать' : 'Активировать'}
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
};