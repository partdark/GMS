import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Season, SeasonReport } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const SeasonReportComponent: React.FC = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [report, setReport] = useState<SeasonReport[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSum, setTotalSum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof SeasonReport | 'gameName'>('person');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadSeasons();
  }, []);



  const loadSeasons = async () => {
    try {
      const response = await api.getSeasons(1, 1000);
      const seasonsData = response.data.seasons || response.data.Seasons || response.data;
      const seasons = Array.isArray(seasonsData) ? seasonsData : [];
      setSeasons(seasons);
      
  
      if (seasons.length > 0) {
        const sortedSeasons = [...seasons].sort((a, b) => b.id - a.id);
        setSelectedSeason(sortedSeasons[0].id);
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  const loadReport = async (page: number = 1) => {
    if (!selectedSeason) return;
    setLoading(true);
    try {
      const response = await api.getSeasonReport(selectedSeason, false, page, 50);
      console.log('Season report API response:', response.data);
      const reportData = response.data.participants || response.data.Participants || response.data;
      setReport(Array.isArray(reportData) ? reportData : []);
      setTotalPages(response.data.totalPages || response.data.TotalPages || 1);
      setTotalSum(response.data.totalSum || response.data.TotalSum || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof SeasonReport | 'gameName') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof SeasonReport | 'gameName') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const downloadPDF = async () => {
    if (!selectedSeason) return;
    
    try {
      // Загружаем все данные для PDF
      const response = await api.getSeasonReport(selectedSeason, false, 1, 10000);
      const allData = response.data.participants || response.data.Participants || [];
      
      const doc = new jsPDF();
      
      // Заголовок
      doc.setFontSize(16);
      const selectedSeasonData = Array.isArray(seasons) ? seasons.find(s => s.id === selectedSeason) : null;
      const title = `Season Report ${selectedSeason} (${selectedSeasonData ? new Date(selectedSeasonData.startDate).toLocaleDateString() : ''})`;
      doc.text(title, 20, 20);
      
      // Общая сумма
      doc.setFontSize(12);
      doc.text(`Total Amount: ${totalSum.toFixed(2)}`, 20, 35);
      
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
      
      // Таблица с транслитерацией
      const tableData = allData.map((item: any, index: number) => [
        (index + 1).toString(),
        transliterate(item.person.name || '-'),
        transliterate(item.person.gameName),
        item.person.phoneNumber || '-',
        item.eventsCount.toString(),
        item.totalPayment.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [['#', 'Name', 'Game Name', 'Phone', 'Events', 'Amount']],
        body: tableData,
        startY: 50,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      doc.save(`season-report-${selectedSeason}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка генерации PDF');
    }
  };

  const downloadPDFWithoutPhone = async () => {
    if (!selectedSeason) return;
    
    try {
      // Загружаем все данные для PDF
      const response = await api.getSeasonReport(selectedSeason, false, 1, 10000);
      const allData = response.data.participants || response.data.Participants || [];
      
      const doc = new jsPDF();
      
      // Заголовок
      doc.setFontSize(16);
      const selectedSeasonData = Array.isArray(seasons) ? seasons.find(s => s.id === selectedSeason) : null;
      const title = `Season Report ${selectedSeason} (${selectedSeasonData ? new Date(selectedSeasonData.startDate).toLocaleDateString() : ''})`;
      doc.text(title, 20, 20);
      
      // Общая сумма
      doc.setFontSize(12);
      doc.text(`Total Amount: ${totalSum.toFixed(2)}`, 20, 35);
      
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
      
      // Таблица без телефонов
      const tableData = allData.map((item: any, index: number) => [
        (index + 1).toString(),
        transliterate(item.person.name || '-'),
        transliterate(item.person.gameName),
        item.eventsCount.toString(),
        item.totalPayment.toFixed(2)
      ]);
      
      autoTable(doc, {
        head: [['#', 'Name', 'Game Name', 'Events', 'Amount']],
        body: tableData,
        startY: 50,
        styles: { font: 'helvetica', fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      doc.save(`season-report-no-phone-${selectedSeason}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ошибка генерации PDF');
    }
  };

  const downloadExcel = async () => {
    if (!selectedSeason) return;
    
    try {
      const response = await api.getSeasonReport(selectedSeason, false, 1, 10000);
      const allData = response.data.participants || response.data.Participants || [];
      
      const excelData = allData.map((item: any, index: number) => ({
        '№': index + 1,
        'Имя': item.person.name || '-',
        'Игровое имя': item.person.gameName,
        'Телефон': item.person.phoneNumber || '-',
        'Событий': item.eventsCount,
        'Общая сумма': item.totalPayment.toFixed(2)
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Season Report');
      
      const selectedSeasonData = Array.isArray(seasons) ? seasons.find(s => s.id === selectedSeason) : null;
      const filename = `season-report-${selectedSeason}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Ошибка генерации Excel');
    }
  };

  const downloadExcelWithoutPhone = async () => {
    if (!selectedSeason) return;
    
    try {
      const response = await api.getSeasonReport(selectedSeason, false, 1, 10000);
      const allData = response.data.participants || response.data.Participants || [];
      
      const excelData = allData.map((item: any, index: number) => ({
        '№': index + 1,
        'Имя': item.person.name || '-',
        'Игровое имя': item.person.gameName,
        'Событий': item.eventsCount,
        'Общая сумма': item.totalPayment.toFixed(2)
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Season Report');
      
      const filename = `season-report-no-phone-${selectedSeason}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Ошибка генерации Excel');
    }
  };

  const sortedReport = [...report].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortField === 'person') {
      aValue = a.person.name || a.person.gameName;
      bValue = b.person.name || b.person.gameName;
    } else if (sortField === 'gameName') {
      aValue = a.person.gameName;
      bValue = b.person.gameName;
    } else {
      aValue = a[sortField];
      bValue = b[sortField];
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div>
      <h3>Отчет по сезону</h3>
      <div style={{ marginBottom: '20px' }}>
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
        <button 
          onClick={() => loadReport(1)} 
          disabled={!selectedSeason}
          style={{ 
            backgroundColor: selectedSeason ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: selectedSeason ? 'pointer' : 'not-allowed'
          }}
        >
          Загрузить отчет
        </button>
      </div>


      
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка...</div>}
      
      {report.length > 0 && (
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
            backgroundColor: '#e9ecef', 
            padding: '15px', 
            borderRadius: '4px', 
            marginBottom: '15px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            Общая сумма по сезону: {totalSum.toFixed(2)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0 }}>Результаты отчета:</h4>
            <div>
              <button
                onClick={downloadPDF}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Скачать PDF
              </button>
              <button
                onClick={downloadPDFWithoutPhone}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                PDF без телефонов
              </button>
              <button
                onClick={downloadExcel}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Скачать Excel
              </button>
              <button
                onClick={downloadExcelWithoutPhone}
                style={{
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Excel без телефонов
              </button>
            </div>
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
                  onClick={() => handleSort('person')}
                >
                  Имя {getSortIcon('person')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left', cursor: 'pointer' }}
                  onClick={() => handleSort('gameName')}
                >
                  Игровое имя {getSortIcon('gameName')}
                </th>
                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Телефон</th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('eventsCount')}
                >
                  Событий {getSortIcon('eventsCount')}
                </th>
                <th 
                  style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => handleSort('totalPayment')}
                >
                  Общая сумма {getSortIcon('totalPayment')}
                </th>

              </tr>
            </thead>
            <tbody>
              {sortedReport.map((item, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.person.name || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.person.gameName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.person.phoneNumber || '-'}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{item.eventsCount}</td>
                  <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{item.totalPayment.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Всего участников: {report.length}
          </div>
        </div>
      )}
      
      {selectedSeason && report.length === 0 && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          Нет данных для выбранного сезона
        </div>
      )}
    </div>
  );
};