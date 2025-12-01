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

const STORAGE_KEY = 'uniform_tracking_employees';
const INIT_KEY = 'uniform_tracking_initialized';

export const fetchEmployees = async (restaurant: string): Promise<Employee[]> => {
  const isInitialized = localStorage.getItem(INIT_KEY);
  
  if (!isInitialized) {
    Object.entries(INITIAL_DATA).forEach(([rest, data]) => {
      const key = `${STORAGE_KEY}_${rest}`;
      localStorage.setItem(key, JSON.stringify(data));
    });
    localStorage.setItem(INIT_KEY, 'true');
  }
  
  const key = `${STORAGE_KEY}_${restaurant}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  
  return [];
};

export const saveEmployees = (restaurant: string, employees: Employee[]): void => {
  const key = `${STORAGE_KEY}_${restaurant}`;
  localStorage.setItem(key, JSON.stringify(employees));
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
  
  employees.push(newEmployee);
  saveEmployees(restaurant, employees);
  
  return newEmployee;
};

export const updateEmployee = async (restaurant: string, employeeId: number, uniform: Employee['uniform']): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const index = employees.findIndex(e => e.id === employeeId);
  
  if (index === -1) return false;
  
  employees[index].uniform = uniform;
  saveEmployees(restaurant, employees);
  
  return true;
};

export const updateEmployeeName = async (restaurant: string, employeeId: number, name: string): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const index = employees.findIndex(e => e.id === employeeId);
  
  if (index === -1) return false;
  
  employees[index].name = name;
  saveEmployees(restaurant, employees);
  
  return true;
};

export const deleteEmployee = async (restaurant: string, employeeId: number): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const filtered = employees.filter(e => e.id !== employeeId);
  
  if (filtered.length === employees.length) return false;
  
  saveEmployees(restaurant, filtered);
  return true;
};