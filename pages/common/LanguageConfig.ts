export type Language = 'ko' | 'en';

export const LABELS = {
  save:      { ko: '저장', en: 'Save' },
  edit:      { ko: '수정', en: 'Edit' },
  confirm:   { ko: '확인', en: 'Confirm' },
  cancel:    { ko: '취소', en: 'Cancel' },
  close:     { ko: '닫기', en: 'Close' },
  noticeAdd: { ko: 'Add Notice', en: 'Add Notice' },
  delete:    { ko: '삭제', en: 'Delete' },
  deleteConfirm: { ko: '삭제', en: 'Delete' },
  List:      { ko: '리스트', en: 'List' },
} as const;

export function getLabel(key: keyof typeof LABELS, lang: Language): string {
  return LABELS[key][lang];
}