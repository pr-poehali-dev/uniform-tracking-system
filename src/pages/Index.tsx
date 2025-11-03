import { useState, useEffect } from 'react';
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

type UniformCondition = 'good' | 'bad' | 'needs_replacement';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '1' | '2' | '3' | 'needed' | 'not_needed';

interface MonthlyRecord {
  month: string;
  condition: UniformCondition;
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
  needs_replacement: 'Нужно новое',
};

const uniformLabels = {
  tshirt: 'Футболка',
  pants: 'Штаны',
  jacket: 'Китель',
  badge: 'Бейджик',
};

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });
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

  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

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

  const updateCondition = (empId: number, uniformType: keyof Employee['uniform'], condition: UniformCondition) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === empId) {
          const item = emp.uniform[uniformType];
          const existingRecordIndex = item.monthlyRecords.findIndex(r => r.month === selectedMonth);
          
          let newRecords;
          if (existingRecordIndex >= 0) {
            newRecords = [...item.monthlyRecords];
            newRecords[existingRecordIndex] = { month: selectedMonth, condition };
          } else {
            newRecords = [...item.monthlyRecords, { month: selectedMonth, condition }];
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
      })
    );
    toast.success('Состояние обновлено');
  };

  const updateEmployeeName = (empId: number, newName: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === empId ? { ...emp, name: newName } : emp))
    );
  };

  const addEmployee = () => {
    const newId = Math.max(...employees.map(e => e.id), 0) + 1;
    const newEmployee: Employee = {
      id: newId,
      name: `Сотрудник ${newId}`,
      uniform: {
        tshirt: { type: 'tshirt', size: 'M', monthlyRecords: [] },
        pants: { type: 'pants', size: '2', monthlyRecords: [] },
        jacket: { type: 'jacket', size: '2', monthlyRecords: [] },
        badge: { type: 'badge', size: 'needed', monthlyRecords: [] },
      },
    };
    setEmployees([...employees, newEmployee]);
    toast.success('Сотрудник добавлен');
  };

  const deleteEmployee = (empId: number) => {
    setEmployees((prev) => prev.filter(emp => emp.id !== empId));
    toast.success('Сотрудник удален');
  };

  const updateSize = (empId: number, uniformType: keyof Employee['uniform'], size: Size) => {
    setEmployees((prev) =>
      prev.map((emp) => {
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
      })
    );
  };

  const exportToExcel = () => {
    const data: any[] = [];
    
    employees.forEach((emp) => {
      const record = getConditionForMonth(emp.uniform.tshirt, selectedMonth);
      const row: any = {
        'Имя сотрудника': emp.name,
        'Месяц': selectedMonth,
      };

      (['tshirt', 'pants', 'jacket', 'badge'] as const).forEach((type) => {
        const item = emp.uniform[type];
        const condition = getConditionForMonth(item, selectedMonth);
        row[uniformLabels[type]] = condition ? conditionLabels[condition] : 'Не заполнено';
        row[`${uniformLabels[type]} - Размер`] = item.size;
      });

      data.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedMonth);
    XLSX.writeFile(wb, `Отчет_${selectedMonth}_${new Date().toLocaleDateString('ru-RU')}.xlsx`);
    toast.success('Отчет экспортирован в Excel');
  };

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#FEF7E0] to-[#F5F5DC]">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[#C41E3A] mb-2 flex items-center justify-center gap-3">
            <Icon name="ShieldCheck" size={40} />
            Учёт формы сотрудников
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="border-2 border-primary/20 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="Users" size={18} className="text-primary" />
                Всего сотрудников
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#FF8C00]/20 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="AlertCircle" size={18} className="text-[#FF8C00]" />
                Нужна замена ({selectedMonth})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FF8C00]">{stats.needsReplacement}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Icon name="ClipboardList" size={18} />
              Учёт формы
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <Icon name="ShoppingBag" size={18} />
              Заказать форму
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <Icon name="BarChart3" size={18} />
              Статистика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardTitle>Учёт состояния формы</CardTitle>
                    <CardDescription>Отслеживайте состояние формы каждого сотрудника</CardDescription>
                  </div>
                  <Button onClick={addEmployee} className="flex items-center gap-2">
                    <Icon name="UserPlus" size={18} />
                    Добавить сотрудника
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по имени сотрудника..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Выберите месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterCondition} onValueChange={setFilterCondition}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Фильтр по состоянию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все состояния</SelectItem>
                      <SelectItem value="good">Хорошее</SelectItem>
                      <SelectItem value="bad">Плохое</SelectItem>
                      <SelectItem value="needs_replacement">Нужно новое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Имя сотрудника</TableHead>
                        <TableHead className="font-bold">Футболка</TableHead>
                        <TableHead className="font-bold">Штаны</TableHead>
                        <TableHead className="font-bold">Китель</TableHead>
                        <TableHead className="font-bold">Бейджик</TableHead>
                        <TableHead className="font-bold w-[100px]">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-secondary/50 transition-colors">
                          <TableCell>
                            <Input
                              value={emp.name}
                              onChange={(e) => updateEmployeeName(emp.id, e.target.value)}
                              className="font-medium border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </TableCell>
                          {(['tshirt', 'pants', 'jacket', 'badge'] as const).map((type) => {
                            const condition = getConditionForMonth(emp.uniform[type], selectedMonth);
                            return (
                              <TableCell key={type}>
                                <Select
                                  value={condition || ''}
                                  onValueChange={(value) =>
                                    updateCondition(emp.id, type, value as UniformCondition)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Не выбрано">
                                      {condition === 'good' && (
                                        <span className="flex items-center gap-2">
                                          <Icon name="Check" size={16} className="text-[#2E8B57]" />
                                          Хорошее
                                        </span>
                                      )}
                                      {condition === 'bad' && (
                                        <span className="flex items-center gap-2">
                                          <Icon name="X" size={16} className="text-[#DC143C]" />
                                          Плохое
                                        </span>
                                      )}
                                      {condition === 'needs_replacement' && (
                                        <span className="flex items-center gap-2">
                                          <Icon name="AlertCircle" size={16} className="text-[#FF8C00]" />
                                          Нужно новое
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
                                    <SelectItem value="needs_replacement">
                                      <span className="flex items-center gap-2">
                                        <Icon name="AlertCircle" size={16} className="text-[#FF8C00]" />
                                        Нужно новое
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteEmployee(emp.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Icon name="Trash2" size={16} />
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
            <Card>
              <CardHeader>
                <CardTitle>Заказать форму</CardTitle>
                <CardDescription>Выберите сотрудника и укажите необходимые размеры</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Сотрудник</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="Shirt" size={16} className="text-primary" />
                        Футболка
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.tshirt.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'tshirt', value as Size)
                        }
                      >
                        <SelectTrigger>
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

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="User" size={16} className="text-primary" />
                        Штаны
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.pants.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'pants', value as Size)
                        }
                      >
                        <SelectTrigger>
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

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="Component" size={16} className="text-primary" />
                        Китель
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.jacket.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'jacket', value as Size)
                        }
                      >
                        <SelectTrigger>
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

                    <div>
                      <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                        <Icon name="BadgeCheck" size={16} className="text-primary" />
                        Бейджик
                      </label>
                      <Select
                        value={employees.find(e => e.id === parseInt(selectedEmployee))?.uniform.badge.size}
                        onValueChange={(value) =>
                          updateSize(parseInt(selectedEmployee), 'badge', value as Size)
                        }
                      >
                        <SelectTrigger>
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

          <TabsContent value="stats" className="animate-fade-in">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Месяц отчета:</label>
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
              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Icon name="FileDown" size={18} />
                Экспорт в Excel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Нужна замена по типам</CardTitle>
                  <CardDescription>Количество предметов формы требующих замены в {selectedMonth}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#FF8C00]" />
                          <span className="font-medium">{uniformLabels[type as keyof typeof uniformLabels]}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 bg-secondary rounded-full w-32 overflow-hidden">
                            <div
                              className="h-full bg-[#FF8C00] transition-all"
                              style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-2xl font-bold text-[#FF8C00] w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
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
                          className="p-3 rounded-lg border-2 border-[#FF8C00]/20 bg-[#FF8C00]/5 hover:bg-[#FF8C00]/10 transition-colors"
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

              <Card className="md:col-span-2">
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;