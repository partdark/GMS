import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Season, Person, Event } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PlayerReportComponent: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSum, setTotalSum] = useState(0);
  const [totalEventsCount, setTotalEventsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof Event>('dateTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
      
      // Выбираем последний сезон по умолчанию
      if (seasonsRes.data.length > 0) {
        const sortedSeasons = [...seasonsRes.data].sort((a, b) => b.id - a.id);
        setSelectedSeason(sortedSeasons[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadReport = async (page: number = 1) => {
    if (!selectedPerson || !selectedSeason) return;
    setLoading(true);
    try {
      const response = await api.getPersonReport(selectedPerson, selectedSeason, page, 50, sortField, sortDirection);
      console.log('Player report API response:', response.data);
      const eventsData = response.data.events || response.data.Events || response.data;
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTotalPages(response.data.totalPages || response.data.TotalPages || 1);
      setTotalSum(response.data.totalSum || response.data.TotalSum || 0);
      setTotalEventsCount(response.data.totalEventsCount || response.data.TotalEventsCount || response.data.totalCount || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading player report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Event) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1);
  };

  // Перезагружаем отчет при изменении сортировки
  useEffect(() => {
    if (selectedPerson && selectedSeason) {
      loadReport(currentPage);
    }
  }, [sortField, sortDirection]);

  const getSortIcon = (field: keyof Event) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const downloadPlayerPDF = async () => {
    if (!selectedPersonData || !selectedSeason || !selectedPerson) return;
    
    // Функция транслитерации
    const transliterate = (text: string) => {
      const map: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
      };
      return text.split('').map(char => map[char] || char).join('');
    };
    
    try {
      // Загружаем все данные для PDF
      const response = await api.getPersonReport(selectedPerson, selectedSeason, 1, 10000, sortField, sortDirection);
      const allEvents = response.data.events || response.data.Events || [];
      
      const doc = new jsPDF();
      
      // Заголовок
      doc.setFontSize(16);
      const title = `Player Report: ${transliterate(selectedPersonData.gameName)}`;
      doc.text(title, 20, 20);
      
      // Информация об игроке
      doc.setFontSize(12);
      doc.text(`Name: ${transliterate(selectedPersonData.name || '-')}`, 20, 35);
      doc.text(`Phone: ${selectedPersonData.phoneNumber || '-'}`, 20, 45);
      doc.text(`Season: ${selectedSeason}`, 20, 55);
      doc.text(`Total Events: ${totalEventsCount}`, 20, 65);
      doc.text(`Total Payment: ${totalSum.toFixed(2)}`, 20, 75);
      
      // Таблица событий (транслитерация)
      const tableData = allEvents.map((event: any, index: number) => [
        (index + 1).toString(),
        transliterate(event.name),
        event.dateTime ? event.dateTime.replace('T', ' ') : '-',
        event.payment.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [['#', 'Event Name', 'Date/Time', 'Payment']],
        body: tableData,
        startY: 90,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      doc.save(`player-report-${selectedPersonData.gameName}-season-${selectedSeason}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка генерации PDF');
    }
  };

  const sortedEvents = events; // Сортировка теперь на сервере


  const selectedPersonData = Array.isArray(people) ? people.find(p => p.id === selectedPerson) : null;

  return (
    <div>
      <h3>Отчет по игроку</h3>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Игрок: </label>
          <select 
            value={selectedPerson || ''} 
            onChange={(e) => setSelectedPerson(Number(e.target.value))}
            style={{ marginRight: '10px', width: '200px' }}
          >
            <option value="">Выберите игрока</option>
            {Array.isArray(people) && people.map(person => (
              <option key={person.id} value={person.id}>
                {person.name || person.gameName} ({person.id})
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>Сезон: </label>
          <select 
            value={selectedSeason || ''} 
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            style={{ marginRight: '10px' }}
          >
            <option value="">Выберите сезон</option>
            {Array.isArray(seasons) && seasons
              .sort((a, b) => b.id - a.id)
              .map(season => (
                <option key={season.id} value={season.id}>
                  Сезон {season.id} ({new Date(season.startDate).toLocaleDateString()})
                </option>
              ))}
          </select>
        </div>
        
        <button 
          onClick={() => loadReport(1)} 
          disabled={!selectedPerson || !selectedSeason}
          style={{ 
            backgroundColor: (selectedPerson && selectedSeason) ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: (selectedPerson && selectedSeason) ? 'pointer' : 'not-allowed'
          }}
        >
          Загрузить отчет
        </button>
      </div>
      
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}
      
      {events.length > 0 && selectedPersonData && (
        <div>
          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            <button 
              onClick={() => loadReport(Math.max(1, currentPage - 1))} 
              disabled={currentPage === 1}
              style={{ marginRight: '10px', padding: '5px 10px' }}
            >
              Предыдущая
            </button>
            <span>Страница {currentPage} из {totalPages}</span>
            <button 
              onClick={() => loadReport(Math.min(totalPages, currentPage + 1))} 
              disabled={currentPage === totalPages}
              style={{ marginLeft: '10px', padding: '5px 10px' }}
            >
              Следующая
            </button>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            border: '1px solid #ddd'
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Информация об игроке:</h4>
            <p><strong>Игровое имя:</strong> {selectedPersonData.gameName}</p>
            {selectedPersonData.name && <p><strong>Имя:</strong> {selectedPersonData.name}</p>}
            {selectedPersonData.phoneNumber && <p><strong>Телефон/счет:</strong> {selectedPersonData.phoneNumber}</p>}
            <p><strong>Всего событий:</strong> {totalEventsCount}</p>
            <p><strong>Общая оплата:</strong> {totalSum.toFixed(2)}</p>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0 }}>События игрока:</h4>
            <button
              onClick={downloadPlayerPDF}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Скачать PDF
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
                  onClick={() => handleSort('name')}
                >
                  Название {getSortIcon('name')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => handleSort('dateTime')}
                >
                  Дата/время {getSortIcon('dateTime')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('payment')}
                >
                  Оплата {getSortIcon('payment')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event, index) => (
                <tr key={event.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{event.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{event.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                    {event.dateTime ? event.dateTime.replace('T', ' ') : '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                    {event.payment.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedPerson && selectedSeason && events.length === 0 && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          Игрок не участвовал в событиях выбранного сезона
        </div>
      )}
    </div>
  );
};