// src/FinanceDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Lock, Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Calendar, Filter, Trash2, Edit3, Save, Briefcase, FolderPlus, Settings } from 'lucide-react'; // Se añadió Settings

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
    type: 'expense', 
    amount: '', 
    category: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0], 
    selectedPocketId: '',
    currency: 'COP' // <-- Moneda por defecto para nuevas transacciones
  });
  
  // Estado para metas financieras
  const [goals, setGoals] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '' });
  const [amountToAdd, setAmountToAdd] = useState({});
  
  // Estados para Bolsillos
  const [pockets, setPockets] = useState([]);
  const [newPocketName, setNewPocketName] = useState('');
  const [showAddPocketForm, setShowAddPocketForm] = useState(false);

  // --- NUEVO ESTADO PARA TASA DE CAMBIO ---
  const [exchangeRateUSDToCOP, setExchangeRateUSDToCOP] = useState(4000); // Tasa por defecto, el usuario podrá cambiarla
  const [tempExchangeRate, setTempExchangeRate] = useState(exchangeRateUSDToCOP.toString());
  // --- FIN NUEVO ESTADO ---

  // Estados para Filtros
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- Carga de Datos (useEffect) ---
  useEffect(() => { // Transacciones
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc")); // Ordenar por createdAt para consistencia
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ 
            ...doc.data(), 
            id: doc.id,
            // Asegurar que amount (COP) y originalAmount sean números
            amount: parseFloat(doc.data().amount) || 0,
            originalAmount: parseFloat(doc.data().originalAmount) || 0,
        });
      });
      setTransactions(transactionsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { // Metas
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

  useEffect(() => { // Bolsillos
    const q = query(collection(db, "pockets"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pocketsData = [];
      querySnapshot.forEach((doc) => {
        pocketsData.push({ ...doc.data(), id: doc.id });
      });
      setPockets(pocketsData);
    });
    return () => unsubscribe(); 
  }, []);
  // --- Fin Carga de Datos ---

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

  // --- MODIFICADO para incluir moneda y conversión ---
  const addTransaction = () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.selectedPocketId || !newTransaction.currency) {
      alert("Por favor, completa monto, categoría, bolsillo y moneda.");
      return;
    }
    
    try {
      const originalAmount = parseFloat(newTransaction.amount);
      if (isNaN(originalAmount) || originalAmount <= 0) {
        alert("Por favor, ingresa un monto válido.");
        return;
      }

      let amountInCOP = originalAmount;
      if (newTransaction.currency === 'USD') {
        amountInCOP = originalAmount * exchangeRateUSDToCOP;
      }

      const transactionToSave = {
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description,
        date: newTransaction.date,
        pocketId: newTransaction.selectedPocketId,
        originalAmount: originalAmount,
        originalCurrency: newTransaction.currency,
        amount: amountInCOP, // Siempre se guarda el monto base en COP
        createdAt: Timestamp.fromDate(new Date())
      };

      addDoc(collection(db, "transactions"), transactionToSave);
      setNewTransaction({
        type: 'expense', amount: '', category: '', description: '', 
        date: new Date().toISOString().split('T')[0], selectedPocketId: '', currency: 'COP'
      });
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Hubo un error al guardar la transacción.");
    }
  };
  // --- FIN MODIFICACIÓN addTransaction ---

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

  const handleAddPocket = async () => { /* ... (sin cambios) ... */ 
    if (newPocketName.trim() === '') {
      alert("Por favor, ingresa un nombre para el bolsillo.");
      return;
    }
    try {
      const pocketToSave = {
        name: newPocketName.trim(),
        createdAt: Timestamp.fromDate(new Date())
      };
      await addDoc(collection(db, "pockets"), pocketToSave);
      setNewPocketName('');
      setShowAddPocketForm(false);
    } catch (e) {
      console.error("Error adding pocket: ", e);
      alert("Hubo un error al guardar el bolsillo.");
    }
  };
  
  // --- NUEVA FUNCIÓN PARA ACTUALIZAR TASA DE CAMBIO ---
  const handleSetExchangeRate = () => {
    const newRate = parseFloat(tempExchangeRate);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRateUSDToCOP(newRate);
      // Aquí podrías guardar la tasa en localStorage o Firestore si quieres que persista
      // Por ahora, solo se actualiza en el estado del componente
      alert(`Tasa de cambio actualizada a: 1 USD = ${newRate} COP`);
    } else {
      alert("Por favor, ingresa una tasa de cambio válida.");
      setTempExchangeRate(exchangeRateUSDToCOP.toString()); // Revertir al valor anterior
    }
  };
  // --- FIN NUEVA FUNCIÓN ---

  // --- Lógica de filtros y cálculos estadísticos ---
  // Todos los cálculos usarán transaction.amount, que ahora siempre está en COP
  const filteredTransactions = transactions.filter(t => { /* ... (sin cambios) ... */ 
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === '30days' && new Date(t.date) >= new Date(Date.now() - 30*24*60*60*1000)) ||
      (dateFilter === '7days' && new Date(t.date) >= new Date(Date.now() - 7*24*60*60*1000));
    const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
    return dateMatch && categoryMatch;
  });
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  const expensesByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => { /* ... */ 
      acc[t.category] = (acc[t.category] || 0) + (t.amount || 0);
      return acc;
    }, {});
  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({ name: category, value: amount }));
  const monthlyData = transactions.reduce((acc, t) => { /* ... */ 
    if (!t.date || typeof t.date !== 'string') return acc; 
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    const transactionAmountCOP = t.amount || 0; // Ya debería ser COP
    if (t.type === 'income') acc[month].income += transactionAmountCOP;
    else acc[month].expenses += transactionAmountCOP;
    return acc;
  }, {});
  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  
  const pocketBalances = useMemo(() => { /* ... (sin cambios, ya usa t.amount que es COP) ... */ 
    if (!pockets.length) {
      return []; 
    }
    return pockets.map(pocket => {
      const relevantTransactions = transactions.filter(t => t.pocketId === pocket.id);
      const income = relevantTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const expenses = relevantTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        id: pocket.id, name: pocket.name, income, expenses, balance: income - expenses,
      };
    });
  }, [pockets, transactions]);
  // --- Fin Lógica ---

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
  const handleKeyPress = (e) => { /* ... (sin cambios) ... */ 
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // --- Formato de Moneda ---
  const formatCurrency = (value, currencyCode = 'COP') => {
    const options = { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 };
    if (currencyCode === 'USD') {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }
    const locale = currencyCode === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value || 0);
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
        {/* Tarjetas de resumen (ahora indican COP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Totales (COP)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome, 'COP')}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gastos Totales (COP)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses, 'COP')}</p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>
          <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${balance >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Balance (COP)</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(balance, 'COP')}
                </p>
              </div>
              <DollarSign className={balance >= 0 ? 'text-blue-500' : 'text-orange-500'} size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transacciones (Filtradas)</p>
                <p className="text-2xl font-bold text-purple-600">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="text-purple-500" size={32} />
            </div>
          </div>
        </div>

        {/* --- NUEVA SECCIÓN PARA CONFIGURAR TASA DE CAMBIO --- */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Settings size={24} className="mr-2 text-gray-600" /> Configuración de Moneda
          </h3>
          <div className="flex items-end gap-4">
            <div className="flex-grow">
              <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700 mb-1">
                Tasa de Cambio (1 USD = X COP):
              </label>
              <input
                type="number"
                id="exchangeRate"
                value={tempExchangeRate}
                onChange={(e) => setTempExchangeRate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                placeholder="Ej: 4000"
              />
            </div>
            <button
              onClick={handleSetExchangeRate}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Actualizar Tasa
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tasa actual en uso: 1 USD = {exchangeRateUSDToCOP} COP</p>
        </div>
        {/* --- FIN SECCIÓN TASA DE CAMBIO --- */}
        
        {/* Saldos por Bolsillo (ahora en COP) */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Saldos por Bolsillo (COP)</h3>
          {pockets.length === 0 && pocketBalances.length === 0 ? (
            <p className="text-gray-500 text-center">No has creado bolsillos todavía para ver sus saldos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pocketBalances.map(pb => (
                <div key={pb.id} className={`border rounded-lg p-4 shadow-md ${pb.balance >= 0 ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-purple-700 truncate" title={pb.name}>{pb.name}</h4>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${pb.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(pb.balance, 'COP')}
                  </p>
                  <div className="text-xs mt-2 pt-2 border-t border-gray-300">
                    <p className="text-green-600">Ingresos: {formatCurrency(pb.income, 'COP')}</p>
                    <p className="text-red-600">Gastos: {formatCurrency(pb.expenses, 'COP')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8"> {/* Filtros */}
          {/* ... (JSX de Filtros sin cambios) ... */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> {/* Gráficos (ahora en COP) */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ingresos vs Gastos Mensuales (COP)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value, 'COP')} />
                <Tooltip formatter={(value) => formatCurrency(value, 'COP')} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Ingresos" />
                <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={3} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gastos por Categoría (Filtrados, COP)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => `${name} ${(percent * 100).toFixed(0)}% (${formatCurrency(value,'COP')})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value, 'COP')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8"> {/* Metas */}
          {/* ... (JSX de Metas sin cambios estructurales, pero montos se interpretan como COP) ... */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Metas Financieras (en COP)</h3>
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
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Crear Nueva Meta (en COP)</h4>
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
                  placeholder="Monto Objetivo (COP)"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Ahorro Inicial (COP, Opcional)"
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
                      <span>{formatCurrency(goal.currentAmount, 'COP')}</span>
                      <span>{formatCurrency(goal.targetAmount, 'COP')}</span>
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
                      placeholder="Añadir progreso (COP)"
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

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8"> {/* Gestión de Bolsillos */}
          {/* ... (JSX de Gestión de Bolsillos sin cambios estructurales) ... */}
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
                ))}
              </ul>
            </div>
          )}
           {pockets.length === 0 && !showAddPocketForm && (
              <p className="text-gray-500 text-center">Aún no has creado ningún bolsillo.</p>
            )}
        </div>
        
        {/* Formulario "Agregar Nueva Transacción" MODIFICADO para monedas */}
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
            {/* --- NUEVO SELECTOR DE MONEDA --- */}
            <select
              value={newTransaction.currency}
              onChange={(e) => setNewTransaction({...newTransaction, currency: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
            {/* --- FIN SELECTOR DE MONEDA --- */}
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
            </div>
            <div className="mt-4">
              <button
                onClick={addTransaction}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 w-full md:w-auto"
              >
                <Plus size={20} />
                <span>Agregar Transacción</span>
              </button>
            </div>
        </div>
        
        {/* Lista de Transacciones MODIFICADA para mostrar moneda original */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Transacciones Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bolsillo</th>
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
                  let amountDisplay = formatCurrency(transaction.amount, 'COP'); // Por defecto muestra el monto en COP
                  if (transaction.originalCurrency === 'USD' && transaction.originalAmount) {
                    amountDisplay = `${formatCurrency(transaction.originalAmount, 'USD')} (${formatCurrency(transaction.amount, 'COP')})`;
                  } else if (transaction.originalCurrency === 'COP' && transaction.originalAmount) {
                     amountDisplay = formatCurrency(transaction.originalAmount, 'COP'); // Muestra el original si es COP
                  }
                  // Para transacciones antiguas sin originalCurrency, transaction.amount ya es COP
                  
                  return (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                      <td className="py-3 px-4 text-gray-600">{pocketName}</td>
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
                        {transaction.type === 'income' ? '+' : '-'}{amountDisplay}
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
