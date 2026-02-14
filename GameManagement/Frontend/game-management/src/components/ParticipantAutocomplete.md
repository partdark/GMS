# ParticipantAutocomplete Component

Компонент автодополнения для поиска и выбора участников игровых событий.

## Возможности

- **Поиск по имени и игровому имени** - начните вводить любую часть имени или игрового имени участника
- **Фильтрация в реальном времени** - список участников обновляется по мере ввода
- **Клавиатурная навигация** - используйте клавиши для навигации по списку
- **Автоматическое закрытие** - выпадающий список закрывается при клике вне компонента
- **Сброс после выбора** - поле автоматически очищается после выбора участника (в режиме добавления)

## Использование

```tsx
import { ParticipantAutocomplete } from './ParticipantAutocomplete';

<ParticipantAutocomplete
  people={availablePeople}
  selectedPersonId={selectedId}
  onSelect={(personId) => handlePersonSelect(personId)}
  placeholder="Начните вводить имя участника..."
/>
```

## Props

- `people: Person[]` - массив доступных участников для выбора
- `selectedPersonId: number` - ID выбранного участника (0 если никто не выбран)
- `onSelect: (personId: number) => void` - callback функция, вызываемая при выборе участника
- `placeholder?: string` - текст подсказки в поле ввода
- `disabled?: boolean` - отключает компонент

## Стилизация

Компонент использует CSS классы для стилизации:
- `.participant-autocomplete` - основной контейнер
- `.participant-autocomplete input` - поле ввода
- `.participant-autocomplete-dropdown` - выпадающий список
- `.participant-autocomplete-item` - элемент списка
- `.participant-autocomplete-name` - имя участника
- `.participant-autocomplete-gamename` - игровое имя участника

## Примеры использования

### В форме создания события
```tsx
<ParticipantAutocomplete
  people={getAvailablePeople(index)}
  selectedPersonId={participant.personId}
  onSelect={(personId) => handleParticipantChange(index, personId)}
  placeholder="Начните вводить имя участника..."
/>
```

### Для добавления участника к существующему событию
```tsx
<ParticipantAutocomplete
  people={availableParticipants}
  selectedPersonId={0}
  onSelect={(personId) => {
    if (personId > 0) {
      addParticipant(eventId, personId);
    }
  }}
  placeholder="Найти участника для добавления..."
/>
```