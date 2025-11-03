import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type UniformCondition = 'good' | 'bad' | 'needs_replacement';
type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '1' | '2' | '3' | 'needed' | 'not_needed';

interface UniformItem {
  type: 'tshirt' | 'pants' | 'jacket' | 'badge';
  condition: UniformCondition;
  size: Size;
  isOrdered: boolean;
  orderDate?: string;
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

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: 'Иванов Иван',
    uniform: {
      tshirt: { type: 'tshirt', condition: 'good', size: 'M', isOrdered: false },
      pants: { type: 'pants', condition: 'bad', size: '2', isOrdered: false },
      jacket: { type: 'jacket', condition: 'needs_replacement', size: '2', isOrdered: false },
      badge: { type: 'badge', condition: 'good', size: 'needed', isOrdered: false },
    },
  },
  {
    id: 2,
    name: 'Петрова Анна',
    uniform: {
      tshirt: { type: 'tshirt', condition: 'needs_replacement', size: 'S', isOrdered: false },
      pants: { type: 'pants', condition: 'good', size: '1', isOrdered: false },
      jacket: { type: 'jacket', condition: 'good', size: '1', isOrdered: false },
      badge: { type: 'badge', condition: 'needs_replacement', size: 'needed', isOrdered: false },
    },
  },
  {
    id: 3,
    name: 'Сидоров Петр',
    uniform: {
      tshirt: { type: 'tshirt', condition: 'bad', size: 'L', isOrdered: false },
      pants: { type: 'pants', condition: 'needs_replacement', size: '3', isOrdered: false },
      jacket: { type: 'jacket', condition: 'good', size: '3', isOrdered: false },
      badge: { type: 'badge', condition: 'good', size: 'needed', isOrdered: false },
    },
  },
  {
    id: 4,
    name: 'Козлова Мария',
    uniform: {
      tshirt: { type: 'tshirt', condition: 'good', size: 'S', isOrdered: false },
      pants: { type: 'pants', condition: 'good', size: '1', isOrdered: false },
      jacket: { type: 'jacket', condition: 'bad', size: '1', isOrdered: false },
      badge: { type: 'badge', condition: 'good', size: 'needed', isOrdered: false },
    },
  },
  {
    id: 5,
    name: 'Смирнов Алексей',
    uniform: {
      tshirt: { type: 'tshirt', condition: 'needs_replacement', size: 'XL', isOrdered: false },
      pants: { type: 'pants', condition: 'bad', size: '3', isOrdered: false },
      jacket: { type: 'jacket', condition: 'needs_replacement', size: '3', isOrdered: false },
      badge: { type: 'badge', condition: 'bad', size: 'needed', isOrdered: false },
    },
  },
];

const conditionColors = {
  good: 'bg-[#2E8B57] hover:bg-[#2E8B57]/90',
  bad: 'bg-[#DC143C] hover:bg-[#DC143C]/90',
  needs_replacement: 'bg-[#FF8C00] hover:bg-[#FF8C00]/90',
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
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [orderForm, setOrderForm] = useState({
    tshirt: 'not_needed' as Size | 'not_needed',
    pants: 'not_needed' as Size | 'not_needed',
    jacket: 'not_needed' as Size | 'not_needed',
    badge: 'not_needed' as Size | 'not_needed',
  });

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterCondition === 'all') return true;

    const hasCondition = Object.values(emp.uniform).some(
      (item) => item.condition === filterCondition
    );
    return hasCondition;
  });

  const updateCondition = (empId: number, uniformType: keyof Employee['uniform'], condition: UniformCondition) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === empId
          ? {
              ...emp,
              uniform: {
                ...emp.uniform,
                [uniformType]: { ...emp.uniform[uniformType], condition },
              },
            }
          : emp
      )
    );
  };

  const handleOrder = () => {
    if (!selectedEmployee) {
      toast.error('Выберите сотрудника');
      return;
    }

    const hasItems = Object.values(orderForm).some((val) => val !== 'not_needed');
    if (!hasItems) {
      toast.error('Выберите хотя бы один предмет формы');
      return;
    }

    const empId = parseInt(selectedEmployee);
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === empId) {
          const updatedUniform = { ...emp.uniform };
          Object.entries(orderForm).forEach(([key, value]) => {
            if (value !== 'not_needed') {
              updatedUniform[key as keyof Employee['uniform']] = {
                ...updatedUniform[key as keyof Employee['uniform']],
                size: value as Size,
                isOrdered: true,
                orderDate: new Date().toLocaleDateString('ru-RU'),
              };
            }
          });
          return { ...emp, uniform: updatedUniform };
        }
        return emp;
      })
    );

    toast.success(`Заказ оформлен для ${employees.find((e) => e.id === empId)?.name}`);
    setOrderForm({
      tshirt: 'not_needed',
      pants: 'not_needed',
      jacket: 'not_needed',
      badge: 'not_needed',
    });
    setSelectedEmployee('');
  };

  const stats = {
    total: employees.length,
    needsReplacement: employees.filter((emp) =>
      Object.values(emp.uniform).some((item) => item.condition === 'needs_replacement')
    ).length,
    ordered: employees.filter((emp) => Object.values(emp.uniform).some((item) => item.isOrdered))
      .length,
    byType: {
      tshirt: employees.filter((emp) => emp.uniform.tshirt.condition === 'needs_replacement').length,
      pants: employees.filter((emp) => emp.uniform.pants.condition === 'needs_replacement').length,
      jacket: employees.filter((emp) => emp.uniform.jacket.condition === 'needs_replacement').length,
      badge: employees.filter((emp) => emp.uniform.badge.condition === 'needs_replacement').length,
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
          <p className="text-muted-foreground">Управление и заказ спецодежды</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                Нужна замена
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#FF8C00]">{stats.needsReplacement}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#2E8B57]/20 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="ShoppingCart" size={18} className="text-[#2E8B57]" />
                Оформлено заказов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#2E8B57]">{stats.ordered}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20 hover:shadow-lg transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon name="TrendingUp" size={18} className="text-primary" />
                Статус
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {Math.round((stats.ordered / stats.total) * 100)}%
              </div>
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
                <CardTitle>Учёт состояния формы</CardTitle>
                <CardDescription>Отслеживайте состояние формы каждого сотрудника</CardDescription>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по имени сотрудника..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-secondary/50 transition-colors">
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          {(['tshirt', 'pants', 'jacket', 'badge'] as const).map((type) => (
                            <TableCell key={type}>
                              <Select
                                value={emp.uniform[type].condition}
                                onValueChange={(value) =>
                                  updateCondition(emp.id, type, value as UniformCondition)
                                }
                              >
                                <SelectTrigger
                                  className={`w-full ${conditionColors[emp.uniform[type].condition]} text-white border-0`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="good">Хорошее</SelectItem>
                                  <SelectItem value="bad">Плохое</SelectItem>
                                  <SelectItem value="needs_replacement">Нужно новое</SelectItem>
                                </SelectContent>
                              </Select>
                              {emp.uniform[type].isOrdered && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <Icon name="Check" size={12} className="mr-1" />
                                  Заказано
                                </Badge>
                              )}
                            </TableCell>
                          ))}
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
                <CardTitle>Оформить заказ формы</CardTitle>
                <CardDescription>Выберите сотрудника и необходимые размеры</CardDescription>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Icon name="Shirt" size={16} className="text-primary" />
                      Футболка
                    </label>
                    <Select
                      value={orderForm.tshirt}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, tshirt: value as Size }))
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
                      value={orderForm.pants}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, pants: value as Size }))
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
                      value={orderForm.jacket}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, jacket: value as Size }))
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
                      value={orderForm.badge}
                      onValueChange={(value) =>
                        setOrderForm((prev) => ({ ...prev, badge: value as Size }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_needed">Не нужно</SelectItem>
                        <SelectItem value="needed">Нужен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleOrder} className="w-full" size="lg">
                  <Icon name="ShoppingCart" size={18} className="mr-2" />
                  Оформить заказ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Нужна замена по типам</CardTitle>
                  <CardDescription>Количество предметов формы требующих замены</CardDescription>
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
                              style={{ width: `${(count / stats.total) * 100}%` }}
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
                  <CardDescription>Требуется обновление формы</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {employees
                      .filter((emp) =>
                        Object.values(emp.uniform).some((item) => item.condition === 'needs_replacement')
                      )
                      .map((emp) => (
                        <div
                          key={emp.id}
                          className="p-3 rounded-lg border-2 border-[#FF8C00]/20 bg-[#FF8C00]/5 hover:bg-[#FF8C00]/10 transition-colors"
                        >
                          <div className="font-medium mb-2">{emp.name}</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(emp.uniform)
                              .filter(([_, item]) => item.condition === 'needs_replacement')
                              .map(([type, _]) => (
                                <Badge key={type} variant="outline" className="bg-white">
                                  {uniformLabels[type as keyof typeof uniformLabels]}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Общая статистика по состоянию формы</CardTitle>
                  <CardDescription>Распределение состояния всех предметов</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['good', 'bad', 'needs_replacement'] as const).map((condition) => {
                      const count = employees.reduce(
                        (acc, emp) =>
                          acc +
                          Object.values(emp.uniform).filter((item) => item.condition === condition).length,
                        0
                      );
                      const total = employees.length * 4;
                      const percentage = Math.round((count / total) * 100);

                      return (
                        <div
                          key={condition}
                          className="p-6 rounded-xl border-2 bg-gradient-to-br from-white to-secondary/30"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-4 h-4 rounded-full ${conditionColors[condition].replace('hover:bg-[#', 'bg-[#')}`} />
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
