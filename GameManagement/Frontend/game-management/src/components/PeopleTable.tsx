import React, { useState, useEffect } from 'react';
import { Person } from '../types';
import { api } from '../api';

interface PeopleTableProps {
  people: Person[];
  onPersonUpdated: (person: Person) => void;
}

export const PeopleTable: React.FC<PeopleTableProps> = ({ people: initialPeople, onPersonUpdated }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Person>>({});
  const [sortField, setSortField] = useState<keyof Person>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadPeople = async () => {
      setLoading(true);
      try {
        const response = await api.getPeople(currentPage, 100, sortField, sortDirection);
        console.log('People API response:', response.data);
        
        let peopleData = [];
        let totalCount = 0;
        
        if (response.data.people) {
          peopleData = response.data.people;
          totalCount = response.data.totalCount || peopleData.length;
        } else if (response.data.People) {
          peopleData = response.data.People;
          totalCount = response.data.TotalCount || peopleData.length;
        } else if (Array.isArray(response.data)) {
          peopleData = response.data;
          totalCount = peopleData.length;
        }
        
        setPeople(peopleData);
        setTotalPages(Math.ceil(totalCount / 100));
      } catch (error) {
        console.error('Error loading people:', error);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    };
    loadPeople();
  }, [currentPage, sortField, sortDirection]);

  const handleSort = (field: keyof Person) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    setCurrentPage(1);
  };

  const handleEdit = (person: Person) => {
    setEditingId(person.id);
    setEditData(person);
  };

  const handleSave = async () => {
    if (!editingId || !editData) return;
    
    try {
      const updatedPerson = {
        id: editingId,
        gameName: editData.gameName || '',
        phoneNumber: editData.phoneNumber || '',
        name: editData.name || '',
        password: editData.password || '',
        role: editData.role || 'user'
      };
      await api.updatePerson(editingId, updatedPerson);
      onPersonUpdated(updatedPerson);
      
      // Обновляем локальные данные
      setPeople(people.map(p => p.id === editingId ? updatedPerson : p));
      
      setEditingId(null);
      setEditData({});
      alert('Участник обновлен!');
    } catch (error) {
      console.error('Error updating person:', error);
      alert('Ошибка обновления участника');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const filteredPeople = people.filter(person =>
    person.gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.name && person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (person.phoneNumber && person.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedPeople = people; // Сортировка теперь на сервере

  const getSortIcon = (field: keyof Person) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

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
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Поиск по имени, игровому имени или телефону..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
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
              onClick={() => handleSort('gameName')}
            >
              Игровое имя {getSortIcon('gameName')}
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('name')}
            >
              Имя {getSortIcon('name')}
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('phoneNumber')}
            >
              Номер телефона/счет {getSortIcon('phoneNumber')}
            </th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>
              Пароль
            </th>
            <th 
              style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleSort('role')}
            >
              Роль {getSortIcon('role')}
            </th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedPeople.map((person, index) => (
            <tr key={person.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>{person.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editData.gameName || ''}
                    onChange={(e) => setEditData({...editData, gameName: e.target.value})}
                    style={{ width: '100%' }}
                  />
                ) : (
                  person.gameName
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    style={{ width: '100%' }}
                  />
                ) : (
                  person.name || '-'
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {editingId === person.id ? (
                  <input
                    type="text"
                    value={editData.phoneNumber || ''}
                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                    style={{ width: '100%' }}
                  />
                ) : (
                  person.phoneNumber || '-'
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {editingId === person.id ? (
                  <input
                    type="password"
                    value={editData.password || ''}
                    onChange={(e) => setEditData({...editData, password: e.target.value})}
                    placeholder="Новый пароль"
                    style={{ width: '100%' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px' }}>
                      {showPasswords.has(person.id) ? (person.password || '-') : (person.password ? '***' : '-')}
                    </span>
                    {person.password && (
                      <button
                        onClick={() => {
                          const newShowPasswords = new Set(showPasswords);
                          if (showPasswords.has(person.id)) {
                            newShowPasswords.delete(person.id);
                          } else {
                            newShowPasswords.add(person.id);
                          }
                          setShowPasswords(newShowPasswords);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {showPasswords.has(person.id) ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                {editingId === person.id ? (
                  <select
                    value={editData.role || 'user'}
                    onChange={(e) => setEditData({...editData, role: e.target.value})}
                    style={{ width: '100%' }}
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                ) : (
                  person.role === 'admin' ? 'Администратор' : 'Пользователь'
                )}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                {editingId === person.id ? (
                  <>
                    <button
                      onClick={handleSave}
                      style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', marginRight: '5px', borderRadius: '4px' }}
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(person)}
                    style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                  >
                    Редактировать
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};