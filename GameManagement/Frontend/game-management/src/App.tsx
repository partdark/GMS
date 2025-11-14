import React, { useState, useEffect } from 'react';
import './App.css';
import { PersonForm } from './components/PersonForm';
import { PeopleTable } from './components/PeopleTable';
import { SeasonForm } from './components/SeasonForm';
import { SeasonsTable } from './components/SeasonsTable';
import { EventForm } from './components/EventForm';
import { EventsTable } from './components/EventsTable';
import { SeasonReportComponent } from './components/SeasonReport';
import { PlayerReportComponent } from './components/PlayerReport';
import { api } from './api';
import { Person, Season, Event } from './types';

function App() {
  console.log('App component rendering...');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeTab, setActiveTab] = useState('events');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [eventsKey, setEventsKey] = useState(0);

  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const seasonsRes = await api.getSeasons(1, 1000);
      const seasonsData = seasonsRes.data.seasons || seasonsRes.data.Seasons || seasonsRes.data;
      setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  const handlePersonAdded = () => {};
  const handlePersonUpdated = () => {};
  const handleSeasonAdded = (season: Season) => {
    setSeasons([...seasons, season]);
  };
  const handleSeasonUpdated = (updatedSeason: Season) => {
    setSeasons(seasons.map(s => s.id === updatedSeason.id ? updatedSeason : s));
  };
  const handleEventAdded = () => {};
  const handleEventUpdated = () => {};
  const handleEventDeleted = () => {};

  return (
    <div className="App" style={{ position: 'relative', height: '100vh' }}>
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ☰
      </button>

      {sidebarOpen && (
        <nav style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '250px',
          height: '100vh',
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRight: '1px solid #ddd',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
        }}>
        <h2 style={{ marginBottom: '30px', color: '#333', marginTop: '40px' }}>Управление игровыми событиями</h2>
        <button 
          onClick={() => { setActiveTab('events'); setSidebarOpen(false); setEventsKey(Date.now()); }}
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'events' ? '#007bff' : 'transparent',
            color: activeTab === 'events' ? 'white' : '#333',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          События
        </button>
        <button 
          onClick={() => { setActiveTab('reports'); setSidebarOpen(false); }}
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'reports' ? '#007bff' : 'transparent',
            color: activeTab === 'reports' ? 'white' : '#333',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          Отчеты по сезонам
        </button>
        <button 
          onClick={() => { setActiveTab('playerReports'); setSidebarOpen(false); }}
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'playerReports' ? '#007bff' : 'transparent',
            color: activeTab === 'playerReports' ? 'white' : '#333',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          Отчеты по игрокам
        </button>
        <button 
          onClick={() => { setActiveTab('people'); setSidebarOpen(false); }}
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'people' ? '#007bff' : 'transparent',
            color: activeTab === 'people' ? 'white' : '#333',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          Участники
        </button>
        <button 
          onClick={() => { setActiveTab('seasons'); setSidebarOpen(false); }}
          style={{
            padding: '12px 16px',
            marginBottom: '8px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: activeTab === 'seasons' ? '#007bff' : 'transparent',
            color: activeTab === 'seasons' ? 'white' : '#333',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          Сезоны
        </button>
        </nav>
      )}

      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 999
          }}
        />
      )}

      <main style={{ padding: '20px', paddingTop: '70px', height: '100vh', overflow: 'auto' }}>

      {activeTab === 'people' && (
        <div>
          <PersonForm onPersonAdded={handlePersonAdded} />
          <h3>Список участников</h3>
          <PeopleTable key={activeTab} people={[]} onPersonUpdated={handlePersonUpdated} />
        </div>
      )}

      {activeTab === 'seasons' && (
        <div>
          <SeasonForm onSeasonAdded={handleSeasonAdded} />
          <h3>Сезоны</h3>
          <SeasonsTable key={activeTab} seasons={seasons} events={[]} onSeasonUpdated={handleSeasonUpdated} />
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          <EventForm onEventAdded={handleEventAdded} />
          <h3>События</h3>
          <EventsTable key={eventsKey} events={[]} seasons={seasons} onEventUpdated={handleEventUpdated} onEventDeleted={handleEventDeleted} />
        </div>
      )}

      {activeTab === 'reports' && (
        <SeasonReportComponent />
      )}

      {activeTab === 'playerReports' && (
        <PlayerReportComponent />
      )}
      </main>
    </div>
  );
}

export default App;
