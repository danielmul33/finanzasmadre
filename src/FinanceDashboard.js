// src/FinanceDashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Lock, Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Calendar, Filter, Trash2, Edit3, Save, Briefcase, FolderPlus } from 'lucide-react'; // Se añadió Briefcase, FolderPlus

// Importaciones de Firebase
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";

const FinanceDashboard = () => {
  // Estados de Login y Usuario
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  
  // Estado para transacciones
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedPocketId: '' // <-- Añadido selectedPocketId
  });
  
  // Estado para metas financieras
  const [goals, setGoals] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '' });
  const [amountToAdd, setAmountToAdd] = useState({});
  
  // --- NUEVOS ESTADOS PARA BOLSILLOS ---
  const [pockets, setPockets] = useState([]);
  const [newPocketName, setNewPocketName] = useState('');
  const [showAddPocketForm, setShowAddPocketForm] = useState(false);
  // --- FIN DE NUEVOS ESTADOS PARA BOLSILLOS ---

  // Estados para Filtros
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Cargar transacciones desde Firestore
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ ...doc.data(), id: doc.id });
      });
      setTransactions(transactionsData);
    });
    return () => unsubscribe();
  }, []);

  // Cargar metas desde Firestore
  useEffect(() => {
    const q = query(collection(db, "goals"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const goalsData = [];
      querySnapshot.forEach((doc) => {
        goalsData.push({ 
          ...doc.data(), 
          id: doc.id,
          targetAmount: parseFloat(doc.data().targetAmount) || 0,
          currentAmount: parseFloat(doc.data().currentAmount) || 0,
        });
      });
      setGoals(goalsData);
    });
    return () => unsubscribe();
  }, []);

  // --- NUEVO useEffect PARA CARGAR BOLSILLOS DESDE FIRESTORE ---
  useEffect(() => {
    // Por ahora cargamos sin orden específico, podrías añadir orderBy('name') o orderBy('createdAt')
    // Si añades orderBy, recuerda que podrías necesitar un índice en Firestore para la colección 'pockets'.
    const q = query(collection(db, "pockets"), orderBy("createdAt", "asc")); // Ordenar por fecha de creación
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pocketsData = [];
      querySnapshot.forEach((doc) => {
        pocketsData.push({ ...doc.data(), id: doc.id });
      });
      setPockets(pocketsData);
    });
    return () => unsubscribe(); // Limpieza al desmontar
  }, []);
  // --- FIN DE useEffect PARA BOLSILLOS ---

  const users = { 'Mul': 'Rilidama2' };
  const handleLogin = () => { /* ... (sin cambios) ... */ 
    if (users[username] && users[username] === password) {
      setIsLoggedIn(true);
      setCurrentUser(username);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };
  const handleLogout = () => { /* ... (sin cambios) ... */ 
    setIsLoggedIn(false);
    setCurrentUser('');
    setUsername('');
    setPassword('');
  };

  // MODIFICADO para incluir pocketId
  const addTransaction = () => {
    if (newTransaction.amount && newTransaction.category && newTransaction.selectedPocketId) { // Asegurarse que se seleccionó un bolsillo
      try {
        const transactionToSave = {
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date,
          pocketId: newTransaction.selectedPocketId, // Guardar el ID del bolsillo
          createdAt: Timestamp.fromDate(new Date()) // Opcional: para ordenar o trazar
        };
        addDoc(collection(db, "transactions"), transactionToSave);
        setNewTransaction({
          type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedPocketId: ''
        });
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("Hubo un error al guardar la transacción.");
      }
    } else {
      alert("Por favor, completa el monto, la categoría y selecciona un bolsillo.");
    }
  };
  const handleDeleteTransaction = async (transactionId) => { /* ... (sin cambios) ... */ 
    if (window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      try {
        const transactionDocRef = doc(db, "transactions", transactionId);
        await deleteDoc(transactionDocRef);
        console.log("Transacción eliminada con ID: ", transactionId); 
      } catch (e) {
        console.error("Error deleting document: ", e);
        alert("Hubo un error al eliminar la transacción.");
      }
    }
  };
  
  const handleAddGoal = async () => { /* ... (sin cambios) ... */ 
    if (newGoal.name && newGoal.targetAmount) {
      try {
        const goalToSave = {
          name: newGoal.name,
          targetAmount: parseFloat(newGoal.targetAmount),
          currentAmount: parseFloat(newGoal.currentAmount) || 0,
          createdAt: Timestamp.fromDate(new Date())
        };
        await addDoc(collection(db, "goals"), goalToSave);
        setNewGoal({ name: '', targetAmount: '', currentAmount: '' });
        setShowAddGoalForm(false);
      } catch (e) {
        console.error("Error adding goal: ", e);
        alert("Hubo un error al guardar la meta.");
      }
    } else {
      alert("Por favor, completa el nombre y el monto objetivo de la meta.");
    }
  };
  const handleUpdateGoalProgress = async (goalId, currentProgress, amountString) => { /* ... (sin cambios) ... */ 
    const additionalAmount = parseFloat(amountString);
    if (isNaN(additionalAmount) || additionalAmount <= 0) {
      alert("Por favor, ingresa un monto válido para añadir al progreso.");
      return;
    }
    try {
      const goalDocRef = doc(db, "goals", goalId);
      const newCurrentAmount = (parseFloat(currentProgress) || 0) + additionalAmount;
      await updateDoc(goalDocRef, {
        currentAmount: newCurrentAmount
      });
      setAmountToAdd(prev => ({ ...prev, [goalId]: '' })); 
      console.log("Progreso de meta actualizado.");
    } catch (e) {
      console.error("Error updating goal progress: ", e);
      alert("Hubo un error al actualizar el progreso de la meta.");
    }
  };
  const handleDeleteGoal = async (goalId) => { /* ... (sin cambios) ... */ 
    if (window.confirm("¿Estás seguro de que quieres eliminar esta meta?")) {
      try {
        const goalDocRef = doc(db, "goals", goalId);
        await deleteDoc(goalDocRef);
        console.log("Meta eliminada con ID: ", goalId);
      } catch (e) {
        console.error("Error deleting goal: ", e);
        alert("Hubo un error al eliminar la meta.");
      }
    }
  };

  // --- NUEVAS FUNCIONES PARA GESTIONAR BOLSILLOS ---
  const handleAddPocket = async () => {
    if (newPocketName.trim() === '') {
      alert("Por favor, ingresa un nombre para el bolsillo.");
      return;
    }
    try {
      const pocketToSave = {
        name: newPocketName.trim(),
        createdAt: Timestamp.fromDate(new Date()) // Para ordenar o trazar
      };
      await addDoc(collection(db, "pockets"), pocketToSave);
      setNewPocketName(''); // Limpiar input
      setShowAddPocketForm(false); // Opcional: ocultar formulario
    } catch (e) {
      console.error("Error adding pocket: ", e);
      alert("Hubo un error al guardar el bolsillo.");
    }
  };
  // (Podríamos añadir handleDeletePocket más adelante si es necesario)
  // --- FIN DE NUEVAS FUNCIONES PARA BOLSILLOS ---


  const filteredTransactions = transactions.filter(t => { /* ... (sin cambios) ... */ 
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === '30days' && new Date(t.date) >= new Date(Date.now() - 30*24*60*60*1000)) ||
      (dateFilter === '7days' && new Date(t.date) >= new Date(Date.now() - 7*24*60*60*1000));
    const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
    return dateMatch && categoryMatch;
  });
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const expensesByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => { /* ... */ 
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({ name: category, value: amount }));
  const monthlyData = transactions.reduce((acc, t) => { /* ... */ 
    if (!t.date || typeof t.date !== 'string') return acc; 
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expenses += t.amount;
    return acc;
  }, {});
  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
  const handleKeyPress = (e) => { /* ... (sin cambios) ... */ 
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (!isLoggedIn) { /* ... (JSX del Login sin cambios) ... */ 
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">FinanceTracker</h1>
            <p className="text-white/70">Gestiona tus finanzas personales</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-white/50" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Ingresa tu usuario"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-white/50" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/50 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b"> {/* ... (Header sin cambios) ... */} 
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Bienvenido, {currentUser}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... (Tarjetas de resumen, Filtros, Gráficos: sin cambios en su estructura JSX) ... */}
        {/* Copia y pega las secciones de Tarjetas de resumen, Filtros y Gráficos aquí desde tu versión anterior si no quieres que las repita todas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>
          <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${balance >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ${balance.toLocaleString()}
                </p>
              </div>
              <DollarSign className={balance >= 0 ? 'text-blue-500' : 'text-orange-500'} size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-purple-600">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-500" />
              <span className="text-gray-700 font-medium">Filtros:</span>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">Todas las fechas</option>
              <option value="7days">Últimos 7 días</option>
              <option value="30days">Últimos 30 días</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">Todas las categorías</option>
              <option value="Salario">Salario</option>
              <option value="Freelance">Freelance</option>
              <option value="Vivienda">Vivienda</option>
              <option value="Alimentación">Alimentación</option>
              <option value="Transporte">Transporte</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ingresos vs Gastos Mensuales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Ingresos" />
                <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gastos por Categoría</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* --- SECCIÓN DE METAS FINANCIERAS (ya estaba, sin cambios estructurales) --- */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* ... (JSX de Metas igual que en tu última versión que incluía el formulario y la lista de metas) ... */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Metas Financieras</h3>
            <button
              onClick={() => setShowAddGoalForm(!showAddGoalForm)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              {showAddGoalForm ? <Minus size={20} /> : <Plus size={20} />}
              <span>{showAddGoalForm ? 'Cancelar' : 'Nueva Meta'}</span>
            </button>
          </div>

          {showAddGoalForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Crear Nueva Meta</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <input
                  type="text"
                  placeholder="Nombre de la meta"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Monto Objetivo"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Ahorro Inicial (Opcional)"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                  onClick={handleAddGoal}
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Guardar Meta
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.length === 0 && !showAddGoalForm && (
              <p className="text-gray-500 col-span-full text-center">No has agregado ninguna meta todavía. ¡Anímate a crear una!</p>
            )}
            {goals.map(goal => { 
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              return (
                <div key={goal.id} className="border rounded-lg p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{goal.name}</h4>
                    <div className="flex items-center space-x-2">
                      <Target className="text-blue-500" size={20} />
                      <button onClick={() => handleDeleteGoal(goal.id)} className="text-red-400 hover:text-red-600" title="Eliminar meta">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${(goal.currentAmount || 0).toLocaleString()}</span>
                      <span>${(goal.targetAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-300 text-xs text-white flex items-center justify-center"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                       {progress > 10 && `${progress.toFixed(0)}%`} 
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Añadir progreso"
                      value={amountToAdd[goal.id] || ''}
                      onChange={(e) => setAmountToAdd(prev => ({...prev, [goal.id]: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm w-full"
                    />
                    <button 
                      onClick={() => handleUpdateGoalProgress(goal.id, goal.currentAmount, amountToAdd[goal.id] || '0')}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Sumar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- NUEVA SECCIÓN PARA GESTIONAR BOLSILLOS --- */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Mis Bolsillos</h3>
            <button
              onClick={() => setShowAddPocketForm(!showAddPocketForm)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              {showAddPocketForm ? <Minus size={20} /> : <FolderPlus size={20} />}
              <span>{showAddPocketForm ? 'Cancelar' : 'Nuevo Bolsillo'}</span>
            </button>
          </div>

          {showAddPocketForm && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Crear Nuevo Bolsillo</h4>
              <div className="flex items-end gap-4">
                <input
                  type="text"
                  placeholder="Nombre del bolsillo"
                  value={newPocketName}
                  onChange={(e) => setNewPocketName(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleAddPocket}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Guardar Bolsillo
                </button>
              </div>
            </div>
          )}

          {pockets.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">Bolsillos existentes:</h4>
              <ul className="list-disc list-inside pl-5">
                {pockets.map(pocket => (
                  <li key={pocket.id} className="text-gray-600">{pocket.name}</li>
                  // Aquí podríamos añadir botones para editar/eliminar bolsillos más adelante
                ))}
              </ul>
            </div>
          )}
           {pockets.length === 0 && !showAddPocketForm && (
              <p className="text-gray-500 text-center">Aún no has creado ningún bolsillo.</p>
            )}
        </div>
        {/* --- FIN DE SECCIÓN DE BOLSILLOS --- */}
        
        {/* Formulario "Agregar Nueva Transacción" MODIFICADO */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Agregar Nueva Transacción</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
            <input
              type="number"
              placeholder="Monto"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Categoría"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Descripción (Opcional)"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="date"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {/* --- NUEVO SELECT PARA BOLSILLOS --- */}
            <select
              value={newTransaction.selectedPocketId}
              onChange={(e) => setNewTransaction({...newTransaction, selectedPocketId: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Selecciona un Bolsillo</option>
              {pockets.map(pocket => (
                <option key={pocket.id} value={pocket.id}>{pocket.name}</option>
              ))}
            </select>
            {/* --- FIN DE NUEVO SELECT --- */}
            </div>
            <div className="mt-4"> {/* Contenedor para el botón, para que esté en nueva línea si es necesario */}
              <button
                onClick={addTransaction}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 w-full md:w-auto"
              >
                <Plus size={20} />
                <span>Agregar Transacción</span>
              </button>
            </div>
        </div>
        
        {/* Lista de Transacciones MODIFICADA para mostrar bolsillo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Transacciones Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bolsillo</th> {/* <-- Nueva columna */}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Descripción</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Monto</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(-10).reverse().map(transaction => {
                  const pocketName = pockets.find(p => p.id === transaction.pocketId)?.name || 'N/A';
                  return (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                      <td className="py-3 px-4 text-gray-600">{pocketName}</td> {/* <-- Mostrar nombre del bolsillo */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{transaction.category}</td>
                      <td className="py-3 px-4 text-gray-600">{transaction.description}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar transacción"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
