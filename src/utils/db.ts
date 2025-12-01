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

const DB_FUNCTION_URL = 'https://functions.poehali.dev/65ee9dfd-eea4-4cef-b86f-61fab47ca0ba';

export const fetchEmployees = async (restaurant: string): Promise<Employee[]> => {
  try {
    const response = await fetch(`${DB_FUNCTION_URL}?action=get_employees&restaurant=${restaurant}`);
    if (!response.ok) {
      console.error('Fetch error:', await response.text());
      return [];
    }
    const data = await response.json();
    return data.employees || [];
  } catch (error) {
    console.error('Failed to load employees:', error);
    return [];
  }
};

export const createEmployee = async (restaurant: string, name: string): Promise<Employee | null> => {
  try {
    const response = await fetch(DB_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'create_employee', restaurant, name }),
    });
    if (!response.ok) {
      console.error('Failed to add employee:', await response.text());
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Failed to add employee:', error);
    return null;
  }
};

export const updateEmployee = async (employeeId: number, uniform: Employee['uniform']): Promise<boolean> => {
  try {
    const response = await fetch(DB_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update_employee', employeeId, uniform }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to update employee:', error);
    return false;
  }
};

export const deleteEmployee = async (employeeId: number): Promise<boolean> => {
  try {
    const response = await fetch(DB_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete_employee', employeeId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete employee:', error);
    return false;
  }
};