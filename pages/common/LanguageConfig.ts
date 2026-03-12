export type Language = 'ko' | 'en';

export const LABELS = {
  save:    { ko: '저장', en: 'Save' },
  confirm: { ko: '확인', en: 'Confirm' },
  cancel:  { ko: '취소', en: 'Cancel' },
  close:   { ko: '닫기', en: 'Close' },
} as const;

export function getLabel(key: keyof typeof LABELS, lang: Language): string {
  return LABELS[key][lang];
}