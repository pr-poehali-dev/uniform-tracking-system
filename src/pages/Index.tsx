import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { fetchEmployees, updateEmployee, createEmployee, deleteEmployee } from '@/utils/api';

type UniformCondition = 'good' | 'bad';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '1' | '2' | '3' | 'needed' | 'not_needed';

interface MonthlyRecord {
  month: string;
  condition: UniformCondition;
  issueDate?: string;
}

interface UniformItem {
  type: 'tshirt' | 'pants' | 'jacket' | 'badge';
  size: Size;
  monthlyRecords: MonthlyRecord[];
}

interface Employee {
  id: number;
  name: string;
  uniform: {
    tshirt: UniformItem;
    pants: UniformItem;
    jacket: UniformItem;
    badge: UniformItem;
  };
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const getCurrentMonth = () => {
  const date = new Date();
  return MONTHS[date.getMonth()];
};

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Сотрудник 1',
    uniform: {
      tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
      pants: { type: 'pants', size: '2', monthlyRecords: [] },
      jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
      badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
    },
  },
  {
    id: 2,
    name: 'Сотрудник 2',
    uniform: {
      tshirt: { type: 'tshirt', size: 'S', monthlyRecords: [] },
      pants: { type: 'pants', size: '1', monthlyRecords: [] },
      jacket: { type: 'jacket', size: '1', monthlyRecords: [] },
      badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
    },
  },
  {
    id: 3,
    name: 'Сотрудник 3',
    uniform: {
      tshirt: { type: 'tshirt', size: 'L', monthlyRecords: [] },
      pants: { type: 'pants', size: '3', monthlyRecords: [] },
      jacket: { type: 'jacket', size: '3', monthlyRecords: [] },
      badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
    },
  },
];

const conditionColors = {
  good: 'bg-[#2E8B57]',
  bad: 'bg-[#DC143C]',
};

const conditionLabels = {
  good: 'Хорошее',
  bad: 'Плохое',
};

const uniformLabels = {
  tshirt: 'Футболка',
  pants: 'Штаны',
  jacket: 'Китель',
  badge: 'Бейджик',
};

const Index = () => {
  const [restaurant, setRestaurant] = useState<'port' | 'dickens' | 'bar' | 'hookah' | 'runners'>('port');
  const [showPortMenu, setShowPortMenu] = useState(false);
  const [showDickensMenu, setShowDickensMenu] = useState(false);
  const [portEmployees, setPortEmployees] = useState<Employee[]>([]);
  const [dickensEmployees, setDickensEmployees] = useState<Employee[]>([]);
  const [barEmployees, setBarEmployees] = useState<Employee[]>([]);
  const [hookahEmployees, setHookahEmployees] = useState<Employee[]>([]);
  const [runnersEmployees, setRunnersEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const employees = restaurant === 'port' ? portEmployees : restaurant === 'dickens' ? dickensEmployees : restaurant === 'bar' ? barEmployees : restaurant === 'hookah' ? hookahEmployees : runnersEmployees;
  const setEmployees = restaurant === 'port' ? setPortEmployees : restaurant === 'dickens' ? setDickensEmployees : restaurant === 'bar' ? setBarEmployees : restaurant === 'hookah' ? setHookahEmployees : setRunnersEmployees;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [orderForm, setOrderForm] = useState({
    tshirt: 'not_needed' as Size | 'not_needed',
    pants: 'not_needed' as Size | 'not_needed',
    jacket: 'not_needed' as Size | 'not_needed',
    badge: 'not_needed' as Size | 'not_needed',
  });

  const loadEmployees = useCallback(async (restaurantName: string) => {
    try {
      setLoading(true);
      const data = await fetchEmployees(restaurantName);
      if (restaurantName === 'port') setPortEmployees(data);
      else if (restaurantName === 'dickens') setDickensEmployees(data);
      else if (restaurantName === 'bar') setBarEmployees(data);
      else if (restaurantName === 'hookah') setHookahEmployees(data);
      else if (restaurantName === 'runners') setRunnersEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees(restaurant);
  }, [restaurant, loadEmployees]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadEmployees(restaurant);
    }, 5000);
    return () => clearInterval(interval);
  }, [restaurant, loadEmployees]);

  const getConditionForMonth = (item: UniformItem, month: string): UniformCondition | null => {
    const record = item.monthlyRecords.find(r => r.month === month);
    return record ? record.condition : null;
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterCondition === 'all') return true;

    const hasCondition = Object.values(emp.uniform).some((item) => {
      const condition = getConditionForMonth(item, selectedMonth);
      return condition === filterCondition;
    });
    return hasCondition;
  });

  const updateCondition = async (empId: number, uniformType: keyof Employee['uniform'], condition: UniformCondition, issueDate?: string) => {
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === empId) {
        const item = emp.uniform[uniformType];
        const existingRecordIndex = item.monthlyRecords.findIndex(r => r.month === selectedMonth);
        
        let newRecords;
        if (existingRecordIndex >= 0) {
          newRecords = [...item.monthlyRecords];
          newRecords[existingRecordIndex] = { month: selectedMonth, condition, issueDate: issueDate || newRecords[existingRecordIndex].issueDate };
        } else {
          newRecords = [...item.monthlyRecords, { month: selectedMonth, condition, issueDate }];
        }

        return {
          ...emp,
          uniform: {
            ...emp.uniform,
            [uniformType]: { ...item, monthlyRecords: newRecords },
          },
        };
      }
      return emp;
    });
    
    setEmployees(updatedEmployees);
    
    const employee = updatedEmployees.find(e => e.id === empId);
    if (employee) {
      try {
        await updateEmployee(empId, employee.uniform);
        toast.success('Состояние обновлено');
      } catch (error) {
        console.error('Failed to update employee:', error);
        toast.error('Не удалось сохранить изменения');
        await loadEmployees(restaurant);
      }
    }
  };

  const updateEmployeeNameLocal = (empId: number, newName: string) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === empId ? { ...emp, name: newName } : emp)));
  };

  const saveEmployeeName = async (empId: number) => {
    const employee = employees.find(e => e.id === empId);
    if (employee) {
      try {
        await updateEmployee(empId, employee.uniform, employee.name);
        toast.success('Имя сохранено');
      } catch (error) {
        console.error('Failed to update employee name:', error);
        toast.error('Не удалось сохранить имя');
        await loadEmployees(restaurant);
      }
    }
  };

  const addEmployee = async () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    try {
      await createEmployee(restaurant, `Сотрудник ${newId}`);
      await loadEmployees(restaurant);
      toast.success('Сотрудник добавлен');
    } catch (error) {
      console.error('Failed to add employee:', error);
      toast.error('Не удалось добавить сотрудника');
    }
  };

  const deleteEmployeeHandler = async (empId: number) => {
    try {
      await deleteEmployee(empId, restaurant);
      await loadEmployees(restaurant);
      toast.success('Сотрудник удален');
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error('Не удалось удалить сотрудника');
    }
  };

  const updateSize = async (empId: number, uniformType: keyof Employee['uniform'], size: Size) => {
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === empId) {
        return {
          ...emp,
          uniform: {
            ...emp.uniform,
            [uniformType]: { ...emp.uniform[uniformType], size },
          },
        };
      }
      return emp;
    });
    
    setEmployees(updatedEmployees);
    
    const employee = updatedEmployees.find(e => e.id === empId);
    if (employee) {
      try {
        await updateEmployee(empId, employee.uniform);
      } catch (error) {
        console.error('Failed to update size:', error);
        await loadEmployees(restaurant);
      }
    }
  };

  const sizeLabels: Record<Size, string> = {
    'XS': 'XS',
    'S': 'S',
    'M': 'M',
    'L': 'L',
    'XL': 'XL',
    '1': 'Размер 1',
    '2': 'Размер 2',
    '3': 'Размер 3',
    'needed': 'Нужен',
    'not_needed': 'Не нужен'
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    MONTHS.forEach((month) => {
      const data: any[] = [];
      
      employees.forEach((emp) => {
        const row: any = {
          'Имя': emp.name,
        };

        (['tshirt', 'pants', 'jacket', 'badge'] as const).forEach((type) => {
          const item = emp.uniform[type];
          const record = item.monthlyRecords.find(r => r.month === month);
          const condition = record?.condition;
          row[uniformLabels[type]] = condition ? conditionLabels[condition] : 'Не заполнено';
          row[`${uniformLabels[type]} - Размер`] = sizeLabels[item.size] || item.size;
        });

        data.push(row);
      });

      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, month);
    });
    
    const restaurantNames = {
      'port': 'Порт',
      'dickens': 'Диккенс',
      'bar': 'Бар',
      'hookah': 'Кальянная',
      'runners': 'Раннерс'
    };
    
    XLSX.writeFile(wb, `Отчет_${restaurantNames[restaurant]}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`);
    toast.success('Отчет за все месяцы экспортирован в Excel');
  };

  const stats = {
    total: employees.length,
  };

  const isDickens = restaurant === 'dickens';
  const isBar = restaurant === 'bar';
  const isPort = restaurant === 'port';
  const isHookah = restaurant === 'hookah';
  const isRunners = restaurant === 'runners';
  
  return (
    <div className={`min-h-screen ${isDickens ? 'bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#1a365d]' : isHookah ? 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]' : isRunners ? 'bg-gradient-to-br from-[#4a3520] via-[#5d442f] to-[#4a3520]' : isBar ? 'bg-gradient-to-br from-[#f5f5f5] via-[#e8e8e8] to-[#d4d4d4]' : 'bg-gradient-to-br from-white via-[#FEF7E0] to-[#F5F5DC]'}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className={`text-3xl md:text-4xl font-bold ${isDickens || isHookah ? 'text-white' : isRunners ? 'text-[#F5F5DC]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`}>
            Учёт формы сотрудников
          </h1>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Button 
                onClick={() => {
                  setRestaurant('port');
                  setShowPortMenu(!showPortMenu);
                  setShowDickensMenu(false);
                }} 
                className={`${restaurant === 'port' ? 'bg-primary hover:bg-primary/90' : 'bg-white hover:bg-gray-100 text-gray-700'} flex items-center gap-2`}
              >
                <Icon name="Ship" size={18} />
                <span className="hidden sm:inline">Порт</span>
              </Button>
            </div>
            <div className="relative">
              <Button 
                onClick={() => {
                  setRestaurant('dickens');
                  setShowDickensMenu(!showDickensMenu);
                  setShowPortMenu(false);
                }} 
                className={`${restaurant === 'dickens' ? 'bg-[#1e3a5f] hover:bg-[#2c5282]' : 'bg-white hover:bg-gray-100 text-gray-700'} flex items-center gap-2`}
              >
                <Icon name="BookOpen" size={18} />
                <span className="hidden sm:inline">Диккенс</span>
              </Button>
            </div>
            <Button 
              onClick={() => setRestaurant('bar')} 
              className={`${restaurant === 'bar' ? 'bg-[#0d5c3a] hover:bg-[#094d2e]' : 'bg-white hover:bg-gray-100 text-gray-700'} flex items-center gap-2`}
            >
              <Icon name="Beer" size={18} />
              <span className="hidden sm:inline">Бар</span>
            </Button>
            <Button 
              onClick={() => setRestaurant('hookah')} 
              className={`${restaurant === 'hookah' ? 'bg-[#0f172a] hover:bg-[#020617]' : 'bg-white hover:bg-gray-100 text-gray-700'} flex items-center gap-2`}
            >
              <Icon name="Cloudy" size={18} />
              <span className="hidden sm:inline">Кальянная</span>
            </Button>
            <Button 
              onClick={() => setRestaurant('runners')} 
              className={`${restaurant === 'runners' ? 'bg-[#4a3520] hover:bg-[#2d1f12]' : 'bg-white hover:bg-gray-100 text-gray-700'} flex items-center gap-2`}
            >
              <Icon name="Users" size={18} />
              <span className="hidden sm:inline">Раннерс</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className={`border-2 hover:shadow-lg transition-all ${isDickens ? 'bg-white border-[#1e3a5f]/30' : isHookah ? 'bg-white border-[#0f172a]/30' : isRunners ? 'bg-white border-[#4a3520]/30' : isBar ? 'bg-white border-[#0d5c3a]/30' : 'border-primary/20'}`}>
            <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1.5 md:gap-2">
                <Icon name="Users" size={16} className={`md:w-[18px] md:h-[18px] ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`} />
                Всего сотрудников
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className={`text-2xl md:text-3xl font-bold ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`}>{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className={`grid w-full grid-cols-2 mb-4 md:mb-6 h-auto ${isDickens || isHookah || isRunners ? 'bg-white/10' : isBar ? 'bg-white/20' : ''}`}>
            <TabsTrigger value="inventory" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Icon name="ClipboardList" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Учёт формы</span>
              <span className="sm:hidden">Учёт</span>
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Icon name="ShoppingBag" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Заказать форму</span>
              <span className="sm:hidden">Заказ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="animate-fade-in">
            <Card className={isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}>
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 mb-3 md:mb-4">
                  <div>
                    <CardTitle className="text-base md:text-lg">Учёт состояния формы</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {loading ? 'Загрузка данных...' : 'Отслеживайте состояние формы каждого сотрудника'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={exportToExcel} variant="outline" className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-1 sm:flex-initial ${isDickens || isHookah ? 'border-white/20 text-gray-700 hover:bg-gray-100' : isRunners ? 'border-[#4a3520]/20 text-gray-700 hover:bg-gray-100' : isBar ? 'border-[#0d5c3a]/20 text-gray-700 hover:bg-gray-100' : ''}`} size="sm" disabled={loading}>
                      <Icon name="Download" size={16} className="md:w-[18px] md:h-[18px]" />
                      <span className="hidden sm:inline">Скачать Excel</span>
                      <span className="sm:hidden">Excel</span>
                    </Button>
                    <Button onClick={addEmployee} className={`flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-1 sm:flex-initial ${isDickens ? 'bg-[#1e3a5f] hover:bg-[#2c5282]' : isHookah ? 'bg-[#0f172a] hover:bg-[#020617]' : isRunners ? 'bg-[#4a3520] hover:bg-[#2d1f12]' : isBar ? 'bg-[#0d5c3a] hover:bg-[#094d2e]' : ''}`} size="sm" disabled={loading}>
                      <Icon name="UserPlus" size={16} className="md:w-[18px] md:h-[18px]" />
                      <span className="hidden sm:inline">Добавить сотрудника</span>
                      <span className="sm:hidden">Добавить</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-3 md:mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по имени..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full h-9 md:h-10 text-sm md:text-base"
                    />
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full md:w-[180px] h-9 md:h-10 text-sm md:text-base">
                      <SelectValue placeholder="Выберите месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCondition} onValueChange={setFilterCondition}>
                    <SelectTrigger className="w-full md:w-[180px] h-9 md:h-10 text-sm md:text-base">
                      <SelectValue placeholder="Фильтр" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все состояния</SelectItem>
                      <SelectItem value="good">Хорошее</SelectItem>
                      <SelectItem value="bad">Плохое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold text-xs md:text-sm whitespace-nowrap">Имя</TableHead>
                        <TableHead className="font-bold text-xs md:text-sm whitespace-nowrap">Футболка</TableHead>
                        {!isRunners && <TableHead className="font-bold text-xs md:text-sm whitespace-nowrap">Штаны</TableHead>}
                        {!isRunners && <TableHead className="font-bold text-xs md:text-sm whitespace-nowrap">Китель</TableHead>}
                        <TableHead className="font-bold text-xs md:text-sm whitespace-nowrap">Бейджик</TableHead>
                        <TableHead className="font-bold text-xs md:text-sm w-[60px] md:w-[100px]">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-secondary/50 transition-colors">
                          <TableCell className="p-2 md:p-4 min-w-0">
                            <Input
                              value={emp.name}
                              onChange={(e) => updateEmployeeNameLocal(emp.id, e.target.value)}
                              onBlur={() => saveEmployeeName(emp.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="font-medium border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-xs md:text-sm h-8 md:h-9 w-full min-w-0"
                            />
                          </TableCell>
                          {(['tshirt', 'pants', 'jacket', 'badge'] as const)
                            .filter(type => !isRunners || (type !== 'pants' && type !== 'jacket'))
                            .map((type) => {
                            const condition = getConditionForMonth(emp.uniform[type], selectedMonth);
                            return (
                              <TableCell key={type} className="p-2 md:p-4">
                                <Select
                                  value={condition || ''}
                                  onValueChange={(value) =>
                                    updateCondition(emp.id, type, value as UniformCondition)
                                  }
                                >
                                  <SelectTrigger className="w-full h-8 md:h-9 text-xs md:text-sm">
                                    <SelectValue placeholder="Не выбрано">
                                      {condition === 'good' && (
                                        <span className="flex items-center gap-1 md:gap-2">
                                          <Icon name="Check" size={14} className="text-[#2E8B57] md:w-4 md:h-4" />
                                          <span className="hidden sm:inline">Хорошее</span>
                                          <span className="sm:hidden">Хор.</span>
                                        </span>
                                      )}
                                      {condition === 'bad' && (
                                        <span className="flex items-center gap-1 md:gap-2">
                                          <Icon name="X" size={14} className="text-[#DC143C] md:w-4 md:h-4" />
                                          <span className="hidden sm:inline">Плохое</span>
                                          <span className="sm:hidden">Плох.</span>
                                        </span>
                                      )}

                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="good">
                                      <span className="flex items-center gap-2">
                                        <Icon name="Check" size={16} className="text-[#2E8B57]" />
                                        Хорошее
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="bad">
                                      <span className="flex items-center gap-2">
                                        <Icon name="X" size={16} className="text-[#DC143C]" />
                                        Плохое
                                      </span>
                                    </SelectItem>

                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          })}
                          <TableCell className="p-2 md:p-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteEmployeeHandler(emp.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Icon name="Trash2" size={14} className="md:w-4 md:h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="order" className="animate-fade-in">
            <Card className={isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Заказать форму</CardTitle>
                <CardDescription className="text-xs md:text-sm">Выберите сотрудника и укажите необходимые размеры</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
                <div>
                  <label className="text-xs md:text-sm font-medium mb-2 block">Сотрудник</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                      <SelectValue placeholder="Выберите сотрудника" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEmployee && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-1.5 md:gap-2">
                        <Icon name="Shirt" size={14} className={`md:w-4 md:h-4 ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`} />
                        Футболка
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.tshirt.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'tshirt', value as Size)
                        }
                      >
                        <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_needed">Не нужно</SelectItem>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!isRunners && (
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-1.5 md:gap-2">
                          <Icon name="User" size={14} className={`md:w-4 md:h-4 ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`} />
                          Штаны
                        </label>
                        <Select
                          value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.pants.size}
                          onValueChange={(value) =>
                            updateSize(parseInt(selectedEmployee), 'pants', value as Size)
                          }
                        >
                          <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_needed">Не нужно</SelectItem>
                            <SelectItem value="1">Размер 1</SelectItem>
                            <SelectItem value="2">Размер 2</SelectItem>
                            <SelectItem value="3">Размер 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!isRunners && (
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-1.5 md:gap-2">
                          <Icon name="Component" size={14} className={`md:w-4 md:h-4 ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`} />
                          Китель
                        </label>
                        <Select
                          value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.jacket.size}
                          onValueChange={(value) =>
                            updateSize(parseInt(selectedEmployee), 'jacket', value as Size)
                          }
                        >
                          <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_needed">Не нужно</SelectItem>
                            <SelectItem value="1">Размер 1</SelectItem>
                            <SelectItem value="2">Размер 2</SelectItem>
                            <SelectItem value="3">Размер 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-1.5 md:gap-2">
                        <Icon name="BadgeCheck" size={14} className={`md:w-4 md:h-4 ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'}`} />
                        Бейджик
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.badge.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'badge', value as Size)
                        }
                      >
                        <SelectTrigger className="h-9 md:h-10 text-sm md:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="needed">Нужен</SelectItem>
                          <SelectItem value="not_needed">Не нужен</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
