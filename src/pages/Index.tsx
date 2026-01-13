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
import { fetchEmployees, createEmployee, deleteEmployee, updateEmployee, saveToStorage, exportAllData, importAllData } from '@/utils/direct-db';

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
  needs_replacement: 'bg-[#FF8C00]',
};

const conditionLabels = {
  good: 'Хорошее',
  bad: 'Плохое',
  needs_replacement: 'Требуется',
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
    setLoading(true);
    const data = await fetchEmployees(restaurantName);
    if (restaurantName === 'port') setPortEmployees(data);
    else if (restaurantName === 'dickens') setDickensEmployees(data);
    else if (restaurantName === 'bar') setBarEmployees(data);
    else if (restaurantName === 'hookah') setHookahEmployees(data);
    else if (restaurantName === 'runners') setRunnersEmployees(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees(restaurant);
  }, [restaurant, loadEmployees]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadEmployees(restaurant);
    }, 2000);
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
      await updateEmployee(restaurant, empId, employee.uniform);
    }
    saveToStorage(restaurant, updatedEmployees);
    toast.success('Состояние обновлено');
  };

  const updateEmployeeNameHandler = async (empId: number, newName: string) => {
    const updatedEmployees = employees.map((emp) => (emp.id === empId ? { ...emp, name: newName } : emp));
    setEmployees(updatedEmployees);
    
    const employee = updatedEmployees.find(e => e.id === empId);
    if (employee) {
      await updateEmployee(restaurant, empId, employee.uniform);
    }
    saveToStorage(restaurant, updatedEmployees);
  };

  const addEmployee = async () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const result = await createEmployee(restaurant, `Сотрудник ${newId}`);
    if (result) {
      const updatedEmployees = [...employees, result];
      setEmployees(updatedEmployees);
      toast.success('Сотрудник добавлен');
    }
  };

  const deleteEmployeeHandler = async (empId: number) => {
    const success = await deleteEmployee(restaurant, empId);
    if (success) {
      const updatedEmployees = employees.filter(e => e.id !== empId);
      setEmployees(updatedEmployees);
      toast.success('Сотрудник удален');
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
      await updateEmployee(restaurant, empId, employee.uniform);
    }
    saveToStorage(restaurant, updatedEmployees);
  };

  const handleExportData = () => {
    exportAllData(restaurant);
    toast.success('Данные экспортированы в файл');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const success = importAllData(restaurant, event.target.result);
          if (success) {
            loadEmployees(restaurant);
            toast.success('Данные импортированы успешно!');
          } else {
            toast.error('Ошибка импорта данных');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const exportToExcel = () => {
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
      'not_needed': 'Не нужно'
    };
    
    const wb = XLSX.utils.book_new();
    
    MONTHS.forEach((month) => {
      const data: any[] = [];
      
      employees.forEach((emp) => {
        const row: any = {
          'Имя сотрудника': emp.name,
        };

        (['tshirt', 'pants', 'jacket', 'badge'] as const).forEach((type) => {
          const item = emp.uniform[type];
          const record = item.monthlyRecords.find(r => r.month === month);
          const condition = record?.condition;
          row[uniformLabels[type]] = condition ? conditionLabels[condition] : 'Не заполнено';
          row[`${uniformLabels[type]} - Размер`] = sizeLabels[item.size] || item.size;
          if (condition === 'needs_replacement' && record?.issueDate) {
            row[`${uniformLabels[type]} - Дата выдачи`] = record.issueDate;
          }
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

  const sizeStats = {
    tshirt: {} as Record<string, number>,
    pants: {} as Record<string, number>,
    jacket: {} as Record<string, number>,
    badge: {} as Record<string, number>,
  };

  employees.forEach(emp => {
    Object.entries(emp.uniform).forEach(([type, item]) => {
      const size = item.size;
      if (!sizeStats[type as keyof typeof sizeStats][size]) {
        sizeStats[type as keyof typeof sizeStats][size] = 0;
      }
      sizeStats[type as keyof typeof sizeStats][size]++;
    });
  });

  const stats = {
    total: employees.length,
    needsReplacement: employees.filter((emp) =>
      Object.values(emp.uniform).some((item) => getConditionForMonth(item, selectedMonth) === 'needs_replacement')
    ).length,
    byType: {
      tshirt: employees.filter((emp) => getConditionForMonth(emp.uniform.tshirt, selectedMonth) === 'needs_replacement').length,
      pants: employees.filter((emp) => getConditionForMonth(emp.uniform.pants, selectedMonth) === 'needs_replacement').length,
      jacket: employees.filter((emp) => getConditionForMonth(emp.uniform.jacket, selectedMonth) === 'needs_replacement').length,
      badge: employees.filter((emp) => getConditionForMonth(emp.uniform.badge, selectedMonth) === 'needs_replacement').length,
    },
    bySizes: sizeStats,
  };

  const isDickens = restaurant === 'dickens';
  const isBar = restaurant === 'bar';
  const isPort = restaurant === 'port';
  const isHookah = restaurant === 'hookah';
  const isRunners = restaurant === 'runners';
  
  return (
    <div className={`min-h-screen ${isDickens ? 'bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] to-[#1a365d]' : isHookah ? 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]' : isRunners ? 'bg-gradient-to-br from-[#4a3520] via-[#5d442f] to-[#4a3520]' : isBar ? 'bg-gradient-to-br from-[#f5f5f5] via-[#e8e8e8] to-[#d4d4d4]' : 'bg-gradient-to-br from-white via-[#FEF7E0] to-[#F5F5DC]'}`}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className={`text-2xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2 md:gap-3 ${isDickens || isHookah ? 'text-white' : isRunners ? 'text-[#F5F5DC]' : isBar ? 'text-[#0d5c3a]' : 'text-[#C41E3A]'}`}>
            <Icon name="ShieldCheck" size={32} className="md:w-10 md:h-10" />
            Учёт формы сотрудников
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="relative">
              <Button
                variant={(restaurant === 'port' || restaurant === 'bar') ? 'default' : 'outline'}
                onClick={() => setShowPortMenu(!showPortMenu)}
                className="flex items-center gap-2 text-sm md:text-base"
              >
                {restaurant === 'bar' ? <Icon name="Wine" size={18} /> : <Icon name="Store" size={18} />}
                {restaurant === 'bar' ? 'Бар' : 'Port'}
                <Icon name={showPortMenu ? "ChevronUp" : "ChevronDown"} size={16} />
              </Button>
              {showPortMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-md shadow-lg z-50 min-w-[120px]">
                  <button
                    onClick={() => {
                      setRestaurant('port');
                      setShowPortMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#C41E3A]"></div>
                    <Icon name="Store" size={16} />
                    Port
                  </button>
                  <button
                    onClick={() => {
                      setRestaurant('bar');
                      setShowPortMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#0d5c3a]"></div>
                    <Icon name="Wine" size={16} />
                    Бар
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                variant={(restaurant === 'dickens' || restaurant === 'hookah' || restaurant === 'runners') ? 'default' : 'outline'}
                onClick={() => setShowDickensMenu(!showDickensMenu)}
                className="flex items-center gap-2 text-sm md:text-base"
              >
                {restaurant === 'hookah' ? <Icon name="Flame" size={18} /> : restaurant === 'runners' ? <Icon name="Zap" size={18} /> : <Icon name="Utensils" size={18} />}
                {restaurant === 'hookah' ? 'Кальянные мастера' : restaurant === 'runners' ? 'Раннеры' : 'Диккенс'}
                <Icon name={showDickensMenu ? "ChevronUp" : "ChevronDown"} size={16} />
              </Button>
              {showDickensMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border rounded-md shadow-lg z-50 min-w-[180px]">
                  <button
                    onClick={() => {
                      setRestaurant('dickens');
                      setShowDickensMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#1e3a5f]"></div>
                    <Icon name="Utensils" size={16} />
                    Диккенс
                  </button>
                  <button
                    onClick={() => {
                      setRestaurant('hookah');
                      setShowDickensMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#0f172a]"></div>
                    <Icon name="Flame" size={16} />
                    Кальянные мастера
                  </button>
                  <button
                    onClick={() => {
                      setRestaurant('runners');
                      setShowDickensMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <div className="w-3 h-3 rounded-full bg-[#4a3520]"></div>
                    <Icon name="Zap" size={16} />
                    Раннеры
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
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

          <Card className={`border-2 hover:shadow-lg transition-all ${isDickens ? 'bg-white border-[#1e3a5f]/30' : isHookah ? 'bg-white border-[#0f172a]/30' : isRunners ? 'bg-white border-[#4a3520]/30' : isBar ? 'bg-white border-[#0d5c3a]/30' : 'border-[#FF8C00]/20'}`}>
            <CardHeader className="pb-2 md:pb-3 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1.5 md:gap-2">
                <Icon name="AlertCircle" size={16} className={`md:w-[18px] md:h-[18px] ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-[#FF8C00]'}`} />
                <span className="truncate">Нужна замена ({selectedMonth})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className={`text-2xl md:text-3xl font-bold ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-[#FF8C00]'}`}>{stats.needsReplacement}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          <Button onClick={handleExportData} variant="outline" className="flex items-center gap-2">
            <Icon name="Download" size={18} />
            Скачать данные
          </Button>
          <Button onClick={handleImportData} variant="outline" className="flex items-center gap-2">
            <Icon name="Upload" size={18} />
            Загрузить данные
          </Button>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className={`grid w-full grid-cols-2 md:grid-cols-4 mb-4 md:mb-6 h-auto ${isDickens || isHookah || isRunners ? 'bg-white/10' : isBar ? 'bg-white/20' : ''}`}>
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
            <TabsTrigger value="issue" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Icon name="Calendar" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Выдача формы</span>
              <span className="sm:hidden">Выдача</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-2.5">
              <Icon name="BarChart3" size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden sm:inline">Статистика</span>
              <span className="sm:hidden">Статистика</span>
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
                        <TableHead className="font-bold text-xs md:text-sm min-w-[120px] md:min-w-[150px]">Имя</TableHead>
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
                          <TableCell className="p-2 md:p-4 min-w-[120px] md:min-w-[150px]">
                            <Input
                              value={emp.name}
                              onChange={(e) => updateEmployeeNameHandler(emp.id, e.target.value)}
                              className="font-medium border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm md:text-base h-8 md:h-9 w-full"
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

          <TabsContent value="issue" className="animate-fade-in">
            <Card className={isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Выдача новой формы</CardTitle>
                <CardDescription className="text-xs md:text-sm">Укажите дату выдачи новой формы сотруднику</CardDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-3 md:mt-4">
                  <label className="text-xs md:text-sm font-medium">Месяц:</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full sm:w-[180px] md:w-[200px] h-9 md:h-10 text-sm md:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees
                        .filter((emp) =>
                          Object.values(emp.uniform).some(
                            (item) => getConditionForMonth(item, selectedMonth) === 'needs_replacement'
                          )
                        )
                        .map((emp) => (
                          <TableRow key={emp.id} className="hover:bg-secondary/50 transition-colors">
                            <TableCell className="font-medium text-xs md:text-sm p-2 md:p-4">{emp.name}</TableCell>
                            {(['tshirt', 'pants', 'jacket', 'badge'] as const)
                              .filter(type => !isRunners || (type !== 'pants' && type !== 'jacket'))
                              .map((type) => {
                              const condition = getConditionForMonth(emp.uniform[type], selectedMonth);
                              const record = emp.uniform[type].monthlyRecords.find(r => r.month === selectedMonth);
                              
                              if (condition !== 'needs_replacement') {
                                return <TableCell key={type} className="text-xs md:text-sm p-2 md:p-4">-</TableCell>;
                              }

                              return (
                                <TableCell key={type} className="p-2 md:p-4">
                                  <Input
                                    type="date"
                                    value={record?.issueDate || ''}
                                    onChange={(e) => {
                                      updateCondition(emp.id, type, 'needs_replacement', e.target.value);
                                    }}
                                    className="w-full max-w-[130px] md:max-w-[150px] h-8 md:h-9 text-xs md:text-sm"
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {employees.filter((emp) =>
                    Object.values(emp.uniform).some(
                      (item) => getConditionForMonth(item, selectedMonth) === 'needs_replacement'
                    )
                  ).length === 0 && (
                    <div className="text-center text-muted-foreground py-6 md:py-8 text-xs md:text-sm px-4">
                      Нет сотрудников, требующих выдачу новой формы в этом месяце
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <label className={`text-sm font-medium ${isDickens || isHookah ? 'text-white' : isRunners ? 'text-[#F5F5DC]' : isBar ? 'text-[#0d5c3a]' : ''}`}>Месяц отчета:</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={exportToExcel} className={`flex items-center gap-2 ${isDickens ? 'bg-[#1e3a5f] hover:bg-[#2c5282]' : isHookah ? 'bg-[#0f172a] hover:bg-[#020617]' : isRunners ? 'bg-[#4a3520] hover:bg-[#2d1f12]' : isBar ? 'bg-[#0d5c3a] hover:bg-[#094d2e]' : ''}`}>
                <Icon name="FileDown" size={18} />
                Экспорт в Excel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}>
                <CardHeader>
                  <CardTitle>Нужна замена по типам</CardTitle>
                  <CardDescription>Количество предметов формы требующих замены в {selectedMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-[#FF8C00]'}`} />
                          <span className="font-medium">{uniformLabels[type as keyof typeof uniformLabels]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 bg-secondary rounded-full w-32 overflow-hidden">
                            <div
                              className={`h-full transition-all ${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-[#FF8C00]'}`}
                              style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className={`text-2xl font-bold w-8 text-right ${isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#0f172a]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-[#FF8C00]'}`}>{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}>
                <CardHeader>
                  <CardTitle>Список сотрудников с заменой</CardTitle>
                  <CardDescription>Требуется обновление формы в {selectedMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {employees
                      .filter((emp) =>
                        Object.values(emp.uniform).some((item) => getConditionForMonth(item, selectedMonth) === 'needs_replacement')
                      )
                      .map((emp) => (
                        <div
                          key={emp.id}
                          className={`p-3 rounded-lg border-2 transition-colors ${isDickens ? 'border-[#1e3a5f]/20 bg-[#1e3a5f]/5 hover:bg-[#1e3a5f]/10' : isHookah ? 'border-[#0f172a]/20 bg-[#0f172a]/5 hover:bg-[#0f172a]/10' : isRunners ? 'border-[#4a3520]/20 bg-[#4a3520]/5 hover:bg-[#4a3520]/10' : isBar ? 'border-[#0d5c3a]/20 bg-[#0d5c3a]/5 hover:bg-[#0d5c3a]/10' : 'border-[#FF8C00]/20 bg-[#FF8C00]/5 hover:bg-[#FF8C00]/10'}`}
                        >
                          <div className="font-medium mb-2">{emp.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(emp.uniform)
                              .filter(([_, item]) => getConditionForMonth(item, selectedMonth) === 'needs_replacement')
                              .map(([type, _]) => (
                                <Badge key={type} variant="outline" className="bg-white">
                                  {uniformLabels[type as keyof typeof uniformLabels]}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      ))}
                    {employees.filter((emp) =>
                      Object.values(emp.uniform).some((item) => getConditionForMonth(item, selectedMonth) === 'needs_replacement')
                    ).length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        Нет сотрудников, требующих замену формы в этом месяце
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`md:col-span-2 ${isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}`}>
                <CardHeader>
                  <CardTitle>Общая статистика по состоянию формы</CardTitle>
                  <CardDescription>Распределение состояния всех предметов в {selectedMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['good', 'bad', 'needs_replacement'] as const).map((condition) => {
                      const count = employees.reduce(
                        (acc, emp) =>
                          acc +
                          Object.values(emp.uniform).filter((item) => getConditionForMonth(item, selectedMonth) === condition).length,
                        0
                      );
                      const total = employees.length * 4;
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <div
                          key={condition}
                          className="p-6 rounded-xl border-2 bg-gradient-to-br from-white to-secondary/30"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-4 h-4 rounded-full ${conditionColors[condition]}`} />
                            <h3 className="font-bold text-lg">{conditionLabels[condition]}</h3>
                          </div>
                          <div className="text-4xl font-bold mb-2">{count}</div>
                          <div className="text-sm text-muted-foreground">{percentage}% от всех предметов</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className={`md:col-span-2 ${isDickens || isHookah || isRunners ? 'bg-white' : isBar ? 'bg-white' : ''}`}>
                <CardHeader>
                  <CardTitle>Статистика по размерам всех сотрудников</CardTitle>
                  <CardDescription>Общее количество каждого размера униформы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Icon name="Shirt" size={18} className={isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#1a237e]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'} />
                        Футболки
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(stats.bySizes.tshirt)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([size, count]) => (
                            <div key={size} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                              <span className="font-medium">Размер {size}</span>
                              <Badge variant="secondary" className={`${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-primary'} text-white`}>
                                {count} шт
                              </Badge>
                            </div>
                          ))}
                        {Object.keys(stats.bySizes.tshirt).length === 0 && (
                          <div className="text-muted-foreground text-sm">Нет данных</div>
                        )}
                      </div>
                    </div>

                    {!isRunners && (
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Icon name="User" size={18} className={isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#1a237e]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'} />
                          Штаны
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(stats.bySizes.pants)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([size, count]) => (
                              <div key={size} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                <span className="font-medium">Размер {size}</span>
                                <Badge variant="secondary" className={`${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-primary'} text-white`}>
                                  {count} шт
                                </Badge>
                              </div>
                            ))}
                          {Object.keys(stats.bySizes.pants).length === 0 && (
                            <div className="text-muted-foreground text-sm">Нет данных</div>
                          )}
                        </div>
                      </div>
                    )}

                    {!isRunners && (
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Icon name="Component" size={18} className={isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#1a237e]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'} />
                          Кителя
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(stats.bySizes.jacket)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([size, count]) => (
                              <div key={size} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                <span className="font-medium">Размер {size}</span>
                                <Badge variant="secondary" className={`${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-primary'} text-white`}>
                                  {count} шт
                                </Badge>
                              </div>
                            ))}
                          {Object.keys(stats.bySizes.jacket).length === 0 && (
                            <div className="text-muted-foreground text-sm">Нет данных</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Icon name="BadgeCheck" size={18} className={isDickens ? 'text-[#1e3a5f]' : isHookah ? 'text-[#1a237e]' : isRunners ? 'text-[#4a3520]' : isBar ? 'text-[#0d5c3a]' : 'text-primary'} />
                        Бейджики
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(stats.bySizes.badge)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([size, count]) => (
                            <div key={size} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                              <span className="font-medium">{size === 'needed' ? 'Нужен' : size === 'not_needed' ? 'Не нужен' : size}</span>
                              <Badge variant="secondary" className={`${isDickens ? 'bg-[#1e3a5f]' : isHookah ? 'bg-[#0f172a]' : isRunners ? 'bg-[#4a3520]' : isBar ? 'bg-[#0d5c3a]' : 'bg-primary'} text-white`}>
                                {count} шт
                              </Badge>
                            </div>
                          ))}
                        {Object.keys(stats.bySizes.badge).length === 0 && (
                          <div className="text-muted-foreground text-sm">Нет данных</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;