const API_URL = 'https://functions.poehali.dev/a06a5a6e-09a4-48b8-836b-309f3f09ceba';

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

export const fetchEmployees = async (restaurant: string): Promise<Employee[]> => {
  const response = await fetch(`${API_URL}?restaurant=${restaurant}`);
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  const data = await response.json();
  return data.employees;
};

export const createEmployee = async (restaurant: string, name: string): Promise<Employee> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ restaurant, name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create employee');
  }
  return response.json();
};

export const updateEmployee = async (employeeId: number, uniform: Employee['uniform'], name?: string): Promise<void> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId, uniform, name }),
  });
  if (!response.ok) {
    throw new Error('Failed to update employee');
  }
};

export const deleteEmployee = async (employeeId: number, restaurant: string): Promise<void> => {
  const response = await fetch(API_URL, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId, restaurant }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
};