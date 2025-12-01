import { INITIAL_DATA } from './init-data';

export interface UniformItem {
  type: 'tshirt' | 'pants' | 'jacket' | 'badge';
  size: string;
  monthlyRecords: Array<{
    month: string;
    condition: 'good' | 'bad' | 'needs_replacement';
    issueDate?: string;
  }>;
}

export interface Employee {
  id: number;
  name: string;
  uniform: {
    tshirt: UniformItem;
    pants: UniformItem;
    jacket: UniformItem;
    badge: UniformItem;
  };
}

const DB_URL = 'https://functions.poehali.dev/65ee9dfd-eea4-4cef-b86f-61fab47ca0ba';
const STORAGE_KEY = 'uniform_tracking_employees';
const LAST_SYNC_KEY = 'uniform_tracking_last_sync';

const syncWithBackend = async (restaurant: string, employees: Employee[]): Promise<void> => {
  try {
    for (const emp of employees) {
      await fetch(DB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_employee',
          employeeId: emp.id,
          uniform: emp.uniform
        })
      });
    }
  } catch (error) {
    console.log('Sync skipped:', error);
  }
};

export const fetchEmployees = async (restaurant: string): Promise<Employee[]> => {
  try {
    const response = await fetch(`${DB_URL}?action=get_employees&restaurant=${restaurant}`);
    if (response.ok) {
      const data = await response.json();
      if (data.employees && data.employees.length > 0) {
        const key = `${STORAGE_KEY}_${restaurant}`;
        localStorage.setItem(key, JSON.stringify(data.employees));
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        return data.employees;
      }
    }
  } catch (error) {
    console.log('Backend unavailable, using local data');
  }
  
  const key = `${STORAGE_KEY}_${restaurant}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_DATA[restaurant] || [];
    }
  }
  
  const initialData = INITIAL_DATA[restaurant] || [];
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
};

export const saveEmployees = (restaurant: string, employees: Employee[]): void => {
  const key = `${STORAGE_KEY}_${restaurant}`;
  localStorage.setItem(key, JSON.stringify(employees));
  syncWithBackend(restaurant, employees);
};

export const createEmployee = async (restaurant: string, name: string): Promise<Employee | null> => {
  const employees = await fetchEmployees(restaurant);
  const newId = Math.max(...employees.map(e => e.id), 0) + 1;
  
  const newEmployee: Employee = {
    id: newId,
    name,
    uniform: {
      tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
      pants: { type: 'pants', size: '2', monthlyRecords: [] },
      jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
      badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
    },
  };
  
  try {
    const response = await fetch(DB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_employee',
        restaurant,
        name
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      newEmployee.id = data.id;
    }
  } catch (error) {
    console.log('Backend unavailable, using local ID');
  }
  
  employees.push(newEmployee);
  saveEmployees(restaurant, employees);
  
  return newEmployee;
};

export const deleteEmployee = async (restaurant: string, employeeId: number): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const filtered = employees.filter(e => e.id !== employeeId);
  
  if (filtered.length === employees.length) return false;
  
  try {
    await fetch(DB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_employee',
        employeeId
      })
    });
  } catch (error) {
    console.log('Backend unavailable');
  }
  
  saveEmployees(restaurant, filtered);
  return true;
};
