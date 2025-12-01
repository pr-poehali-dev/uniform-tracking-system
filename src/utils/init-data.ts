import { Employee } from './storage';

export const INITIAL_DATA: Record<string, Employee[]> = {
  port: [
    {
      id: 1,
      name: 'Бирюков',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [{ month: 'Декабрь', condition: 'needs_replacement', issueDate: null as any }] },
        pants: { type: 'pants', size: '2', monthlyRecords: [{ month: 'Декабрь', condition: 'needs_replacement', issueDate: null as any }] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
        badge: { type: 'badge', size: 'not_needed', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
      },
    },
    {
      id: 6,
      name: 'Наумов',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
        pants: { type: 'pants', size: '2', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [{ month: 'Декабрь', condition: 'good', issueDate: null as any }] },
      },
    },
    {
      id: 7,
      name: 'Удалых',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 8,
      name: 'Башкиров',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 9,
      name: 'Узун',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 11,
      name: 'Живулина',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 13,
      name: 'Лосев',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 14,
      name: 'Коньшин',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
    {
      id: 15,
      name: 'Мегреладзе',
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    },
  ],
  dickens: [],
  bar: [],
  hookah: [],
  runners: [],
};
