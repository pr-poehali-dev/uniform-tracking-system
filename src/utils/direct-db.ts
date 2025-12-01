export interface UniformItem {
  type: 'tshirt' | 'pants' | 'jacket' | 'badge';
  size: string;
  monthlyRecords: Array<{
    month: string;
    condition: 'good' | 'bad';
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

// Используем localStorage как локальную базу с автосинхронизацией
const STORAGE_KEY = 'uniform_employees';
const SYNC_KEY = 'uniform_last_sync';

export const fetchEmployees = async (restaurant: string): Promise<Employee[]> => {
  // Возвращаем данные из localStorage
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

export const saveToStorage = (restaurant: string, employees: Employee[]) => {
  const key = `${STORAGE_KEY}_${restaurant}`;
  localStorage.setItem(key, JSON.stringify(employees));
  localStorage.setItem(SYNC_KEY, Date.now().toString());
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
  saveToStorage(restaurant, employees);
  
  return newEmployee;
};

export const updateEmployee = async (restaurant: string, employeeId: number, uniform: Employee['uniform']): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const index = employees.findIndex(e => e.id === employeeId);
  
  if (index === -1) return false;
  
  employees[index].uniform = uniform;
  saveToStorage(restaurant, employees);
  
  return true;
};

export const deleteEmployee = async (restaurant: string, employeeId: number): Promise<boolean> => {
  const employees = await fetchEmployees(restaurant);
  const filtered = employees.filter(e => e.id !== employeeId);
  
  if (filtered.length === employees.length) return false;
  
  saveToStorage(restaurant, filtered);
  return true;
};

// Функции для синхронизации данных между пользователями
export const exportAllData = (restaurant: string) => {
  const employees = localStorage.getItem(`${STORAGE_KEY}_${restaurant}`);
  if (employees) {
    const blob = new Blob([employees], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${restaurant}-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
};

export const importAllData = (restaurant: string, data: string) => {
  try {
    const employees = JSON.parse(data);
    saveToStorage(restaurant, employees);
    return true;
  } catch {
    return false;
  }
};
