const API_URL = 'https://functions.poehali.dev/ef9b51ae-c718-4823-a435-343ee9f0252e';

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
  const data = await response.json();
  return data.employees || [];
};

export const createEmployee = async (restaurant: string, name: string): Promise<Employee | null> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurant, name })
  });
  if (!response.ok) return null;
  return response.json();
};

export const updateEmployee = async (employeeId: number, uniform: Employee['uniform']): Promise<boolean> => {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, uniform })
  });
  return response.ok;
};

export const deleteEmployee = async (employeeId: number): Promise<boolean> => {
  const response = await fetch(`${API_URL}?id=${employeeId}`, {
    method: 'DELETE'
  });
  return response.ok;
};

export const saveEmployees = (restaurant: string, employees: Employee[]): void => {
  // No-op for compatibility
};
