import React, { useState } from 'react';
import { api } from '../api';
import { Person } from '../types';

interface PersonFormProps {
  onPersonAdded: (person: Person) => void;
}

export const PersonForm: React.FC<PersonFormProps> = ({ onPersonAdded }) => {
  const [formData, setFormData] = useState({
    gameName: '',
    phoneNumber: '',
    name: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gameName) {
      alert('Игровое имя обязательно');
      return;
    }
    
    try {
      const response = await api.createPerson(formData);
      onPersonAdded(response.data);
      setFormData({ gameName: '', phoneNumber: '', name: '', password: '', role: 'user' });
      
      // Перезагружаем страницу для обновления всех таблиц
      window.location.reload();
      
      alert('Участник добавлен!');
    } catch (error) {
      console.error('Error creating person:', error);
      alert('Ошибка создания участника');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>Добавить участника</h3>
      <div>
        <label>Игровое имя*: </label>
        <input
          type="text"
          value={formData.gameName}
          onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
          required
        />
      </div>
      <div>
        <label>Номер телефона/счет: </label>
        <input
          type="text"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        />
      </div>
      <div>
        <label>Имя: </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label>Пароль: </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>
      <div>
        <label>Роль: </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="user">Пользователь</option>
          <option value="admin">Администратор</option>
        </select>
      </div>
      <button type="submit">Добавить</button>
    </form>
  );
};