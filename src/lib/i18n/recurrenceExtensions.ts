// NIC-1998: new recurrence action strings not yet in the published @nicoflow/shared package.
// Merged into i18n after init so the frontend doesn't wait for a shared-pkg release.
// Once these keys ship in @nicoflow/shared they should be removed from here.
export const recurrenceExtensionsEn = {
  toast: {
    skipped: 'Occurrence skipped.',
    seriesEnded: 'Series ended. Past occurrences kept.',
  },
  skip: {
    title: 'Skip this occurrence?',
    description:
      "This occurrence won't be created and its reminder is cancelled. The series keeps running — the next occurrence is unaffected.",
    confirmLabel: 'Skip',
    cancelLabel: 'Cancel',
  },
  endSeries: {
    title: 'End this recurring series?',
    description: "Future occurrences won't be created. Past completed tasks are kept. This can't be undone.",
    confirmLabel: 'End series',
    cancelLabel: 'Cancel',
  },
  actions: {
    skipOccurrence: 'Skip this occurrence',
    endSeries: 'End series…',
  },
  editScope: {
    title: 'Apply changes to…',
    description: 'This task repeats. Choose how far your changes should reach.',
    occurrenceLabel: 'This occurrence only',
    occurrenceDescription: 'Just this one date. The series keeps its original template.',
    seriesLabel: 'This and all future occurrences',
    seriesDescription: "Updates the recurring template from this date onward. Past occurrences aren't changed.",
    cancelLabel: 'Cancel',
  },
};

export const recurrenceExtensionsHe = {
  toast: {
    skipped: 'המופע דולג.',
    seriesEnded: 'הסדרה הסתיימה. המופעים הקודמים נשמרו.',
  },
  skip: {
    title: 'לדלג על מופע זה?',
    description: 'מופע זה לא ייווצר והתזכורת שלו תבוטל. הסדרה ממשיכה לפעול — המופע הבא אינו מושפע.',
    confirmLabel: 'דלג',
    cancelLabel: 'ביטול',
  },
  endSeries: {
    title: 'לסיים את הסדרה החוזרת?',
    description: 'מופעים עתידיים לא ייווצרו. משימות שהושלמו בעבר נשמרות. לא ניתן לבטל פעולה זו.',
    confirmLabel: 'סיים סדרה',
    cancelLabel: 'ביטול',
  },
  actions: {
    skipOccurrence: 'דלג על מופע זה',
    endSeries: 'סיים סדרה…',
  },
  editScope: {
    title: 'החל שינויים על…',
    description: 'משימה זו חוזרת. בחר עד כמה השינויים שלך אמורים להגיע.',
    occurrenceLabel: 'מופע זה בלבד',
    occurrenceDescription: 'רק תאריך זה. הסדרה שומרת על התבנית המקורית שלה.',
    seriesLabel: 'זה וכל המופעים העתידיים',
    seriesDescription: 'מעדכן את תבנית החזרה מתאריך זה ואילך. מופעים קודמים אינם משתנים.',
    cancelLabel: 'ביטול',
  },
};

export const recurrenceExtensionsRu = {
  toast: {
    skipped: 'Повтор пропущен.',
    seriesEnded: 'Серия завершена. Прошлые повторы сохранены.',
  },
  skip: {
    title: 'Пропустить этот повтор?',
    description:
      'Этот повтор не будет создан, а напоминание отменено. Серия продолжит работу — следующий повтор не затронут.',
    confirmLabel: 'Пропустить',
    cancelLabel: 'Отмена',
  },
  endSeries: {
    title: 'Завершить эту серию повторов?',
    description: 'Будущие повторы создаваться не будут. Выполненные задачи сохранятся. Это действие нельзя отменить.',
    confirmLabel: 'Завершить серию',
    cancelLabel: 'Отмена',
  },
  actions: {
    skipOccurrence: 'Пропустить этот повтор',
    endSeries: 'Завершить серию…',
  },
  editScope: {
    title: 'Применить изменения к…',
    description: 'Эта задача повторяется. Выберите, насколько далеко должны распространяться изменения.',
    occurrenceLabel: 'Только этот повтор',
    occurrenceDescription: 'Только эта дата. Серия сохраняет свой исходный шаблон.',
    seriesLabel: 'Этот и все будущие повторы',
    seriesDescription: 'Обновляет шаблон повторов с этой даты. Прошлые повторы не меняются.',
    cancelLabel: 'Отмена',
  },
};
