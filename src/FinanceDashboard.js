// src/FinanceDashboard.js
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Lock, Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Calendar, Filter, Trash2, FolderPlus, Settings } from 'lucide-react';

// Importaciones de Firebase
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";

// URL de tu logo desde GitHub
const logoUrl = "https://raw.githubusercontent.com/danielmul33/logocognito/69d10a48524821d1f9116403a5d7cdf389496b36/D18E0756-E128-496F-9A0C-A5EC6DF9CAB7.PNG";

const FinanceDashboard = () => {
  // --- Estados ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedPocketId: '', currency: 'COP'
  });
  
  const [goals, setGoals] = useState([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', currentAmount: '' });
  const [amountToAdd, setAmountToAdd] = useState({});
  
  const [pockets, setPockets] = useState([]);
  const [newPocketName, setNewPocketName] = useState('');
  const [showAddPocketForm, setShowAddPocketForm] = useState(false);

  const [exchangeRateUSDToCOP, setExchangeRateUSDToCOP] = useState(4000);
  const [tempExchangeRate, setTempExchangeRate] = useState(exchangeRateUSDToCOP.toString());

  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // --- useEffects para cargar datos ---
  useEffect(() => { // Transacciones
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData = [];
      querySnapshot.forEach((doc) => {
        transactionsData.push({ 
            ...doc.data(), 
            id: doc.id,
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

  // --- Funciones Handler ---
  const users = { 'Mul': 'Rilidama2' };
  const handleLogin = () => { /* ... (igual que antes) ... */ 
    if (users[username] && users[username] === password) {
      setIsLoggedIn(true);
      setCurrentUser(username);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };
  const handleLogout = () => { /* ... (igual que antes) ... */ 
    setIsLoggedIn(false);
    setCurrentUser('');
    setUsername('');
    setPassword('');
  };
  const addTransaction = () => { /* ... (igual que antes) ... */ 
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.selectedPocketId || !newTransaction.currency) {
      alert("Por favor, completa monto, categoría, bolsillo y moneda."); return;
    }
    try {
      const originalAmount = parseFloat(newTransaction.amount);
      if (isNaN(originalAmount) || originalAmount <= 0) { alert("Por favor, ingresa un monto válido."); return; }
      let amountInCOP = originalAmount;
      if (newTransaction.currency === 'USD') { amountInCOP = originalAmount * exchangeRateUSDToCOP; }
      const transactionToSave = {
        type: newTransaction.type, category: newTransaction.category, description: newTransaction.description,
        date: newTransaction.date, pocketId: newTransaction.selectedPocketId,
        originalAmount: originalAmount, originalCurrency: newTransaction.currency,
        amount: amountInCOP, createdAt: Timestamp.fromDate(new Date())
      };
      addDoc(collection(db, "transactions"), transactionToSave);
      setNewTransaction({
        type: 'expense', amount: '', category: '', description: '', 
        date: new Date().toISOString().split('T')[0], selectedPocketId: '', currency: 'COP'
      });
    } catch (e) { console.error("Error adding document: ", e); alert("Hubo un error al guardar la transacción."); }
  };
  const handleDeleteTransaction = async (transactionId) => { /* ... (igual que antes) ... */ 
    if (window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      try {
        await deleteDoc(doc(db, "transactions", transactionId));
        console.log("Transacción eliminada con ID: ", transactionId); 
      } catch (e) { console.error("Error deleting document: ", e); alert("Hubo un error al eliminar la transacción."); }
    }
  };
  const handleAddGoal = async () => { /* ... (igual que antes) ... */ 
    if (newGoal.name && newGoal.targetAmount) {
      try {
        const goalToSave = {
          name: newGoal.name, targetAmount: parseFloat(newGoal.targetAmount),
          currentAmount: parseFloat(newGoal.currentAmount) || 0, createdAt: Timestamp.fromDate(new Date())
        };
        await addDoc(collection(db, "goals"), goalToSave);
        setNewGoal({ name: '', targetAmount: '', currentAmount: '' }); setShowAddGoalForm(false);
      } catch (e) { console.error("Error adding goal: ", e); alert("Hubo un error al guardar la meta."); }
    } else { alert("Por favor, completa el nombre y el monto objetivo de la meta."); }
  };
  const handleUpdateGoalProgress = async (goalId, currentProgress, amountString) => { /* ... (igual que antes) ... */ 
    const additionalAmount = parseFloat(amountString);
    if (isNaN(additionalAmount) || additionalAmount <= 0) {
      alert("Por favor, ingresa un monto válido para añadir al progreso."); return;
    }
    try {
      const goalDocRef = doc(db, "goals", goalId);
      const newCurrentAmount = (parseFloat(currentProgress) || 0) + additionalAmount;
      await updateDoc(goalDocRef, { currentAmount: newCurrentAmount });
      setAmountToAdd(prev => ({ ...prev, [goalId]: '' })); 
      console.log("Progreso de meta actualizado.");
    } catch (e) { console.error("Error updating goal progress: ", e); alert("Hubo un error al actualizar el progreso de la meta.");}
  };
  const handleDeleteGoal = async (goalId) => { /* ... (igual que antes) ... */ 
    if (window.confirm("¿Estás seguro de que quieres eliminar esta meta?")) {
      try {
        await deleteDoc(doc(db, "goals", goalId));
        console.log("Meta eliminada con ID: ", goalId);
      } catch (e) { console.error("Error deleting goal: ", e); alert("Hubo un error al eliminar la meta.");}
    }
  };
  const handleAddPocket = async () => { /* ... (igual que antes) ... */ 
    if (newPocketName.trim() === '') {
      alert("Por favor, ingresa un nombre para el bolsillo."); return;
    }
    try {
      const pocketToSave = { name: newPocketName.trim(), createdAt: Timestamp.fromDate(new Date()) };
      await addDoc(collection(db, "pockets"), pocketToSave);
      setNewPocketName(''); setShowAddPocketForm(false);
    } catch (e) { console.error("Error adding pocket: ", e); alert("Hubo un error al guardar el bolsillo.");}
  };
  const handleSetExchangeRate = () => { /* ... (igual que antes) ... */ 
    const newRate = parseFloat(tempExchangeRate);
    if (!isNaN(newRate) && newRate > 0) {
      setExchangeRateUSDToCOP(newRate);
      alert(`Tasa de cambio actualizada a: 1 USD = ${newRate} COP`);
    } else {
      alert("Por favor, ingresa una tasa de cambio válida.");
      setTempExchangeRate(exchangeRateUSDToCOP.toString());
    }
  };
  
  // --- Cálculos (sin cambios funcionales, usan .amount que es COP) ---
  const filteredTransactions = transactions.filter(t => { /* ... */ 
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
      acc[t.category] = (acc[t.category] || 0) + (t.amount || 0); return acc;
    }, {});
  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({ name: category, value: amount }));
  const monthlyData = transactions.reduce((acc, t) => { /* ... */ 
    if (!t.date || typeof t.date !== 'string') return acc; 
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    const transactionAmountCOP = t.amount || 0;
    if (t.type === 'income') acc[month].income += transactionAmountCOP; else acc[month].expenses += transactionAmountCOP;
    return acc;
  }, {});
  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  const pocketBalances = useMemo(() => { /* ... (igual que antes) ... */ 
    if (!pockets.length) { return []; }
    return pockets.map(pocket => {
      const relevantTransactions = transactions.filter(t => t.pocketId === pocket.id);
      const income = relevantTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const expenses = relevantTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
      return { id: pocket.id, name: pocket.name, income, expenses, balance: income - expenses, };
    });
  }, [pockets, transactions]);

  // --- Colores y Formato (NUEVA PALETA DE COLORES PARA GRÁFICO) ---
  const chartTextAndStrokeColor = "#9ca3af"; // Tailwind gray-400
  const chartGridColor = "#374151";      // Tailwind gray-700
  const PIE_CHART_COLORS = ['#facc15', '#fb923c', '#f87171', '#a78bfa', '#60a5fa', '#34d399']; // yellow-500, orange-400, red-400, violet-400, blue-400, emerald-400

  const formatCurrency = (value, currencyCode = 'COP') => { /* ... (igual que antes) ... */ 
    const options = { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 };
    if (currencyCode === 'USD') { options.minimumFractionDigits = 2; options.maximumFractionDigits = 2; }
    const locale = currencyCode === 'COP' ? 'es-CO' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(value || 0);
  };
  const handleKeyPress = (e) => { /* ... (igual que antes) ... */ 
    if (e.key === 'Enter') { handleLogin(); }
  };

  // --- PANTALLA DE LOGIN (ESTILO OSCURO/DORADO) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/70 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-yellow-500/30 shadow-2xl shadow-yellow-500/20">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center ring-2 ring-yellow-300/70">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover" /> : <DollarSign className="text-slate-900 text-3xl" />}
            </div>
            {/* TÍTULO CAMBIADO Y ESTILIZADO */}
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 mb-2">
              Estamos Benditos
            </h1>
            <p className="text-slate-300/90">Gestiona tus finanzas personales</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-yellow-400 text-sm font-medium mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-yellow-400/80" size={20} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu usuario" />
              </div>
            </div>
            <div>
              <label className="block text-yellow-400 text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-yellow-400/80" size={20} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress}
                  className="w-full pl-12 pr-12 py-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu contraseña" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-yellow-400/80 hover:text-yellow-300">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button onClick={handleLogin}
              className="w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-slate-900 py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 transform hover:scale-[1.03] shadow-lg shadow-yellow-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-yellow-400">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL (ESTILO OSCURO/DORADO) ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      {/* Encabezado */}
      <header className="bg-slate-800 shadow-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8"> {/* Cambiado a max-w-full para que ocupe todo el ancho */}
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logoUrl} alt="Logo Estamos Benditos" className="h-10 w-10 rounded-md object-contain" /> 
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500">
                Dashboard Financiero
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 text-sm">Bienvenido, <span className="font-semibold text-yellow-400">{currentUser}</span></span>
              <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium shadow-md hover:shadow-lg">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal del Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Tarjeta Ingresos */}
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 border-l-4 border-green-500 hover:shadow-green-500/20 transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Ingresos Totales (COP)</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome, 'COP')}</p>
              </div>
              <TrendingUp className="text-green-500" size={36} />
            </div>
          </div>
          {/* Tarjeta Gastos */}
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 border-l-4 border-red-500 hover:shadow-red-500/20 transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Gastos Totales (COP)</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses, 'COP')}</p>
              </div>
              <TrendingDown className="text-red-500" size={36} />
            </div>
          </div>
          {/* Tarjeta Balance */}
          <div className={`bg-slate-800 rounded-xl shadow-xl p-6 border-l-4 ${balance >= 0 ? 'border-yellow-500 hover:shadow-yellow-500/20' : 'border-orange-500 hover:shadow-orange-500/20'} transition-shadow duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Balance (COP)</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-yellow-400' : 'text-orange-400'}`}>
                  {formatCurrency(balance, 'COP')}
                </p>
              </div>
              <DollarSign className={balance >= 0 ? 'text-yellow-500' : 'text-orange-500'} size={36} />
            </div>
          </div>
          {/* Tarjeta Transacciones */}
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 border-l-4 border-purple-500 hover:shadow-purple-500/20 transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Transacciones (Filtradas)</p>
                <p className="text-2xl font-bold text-purple-400">{filteredTransactions.length}</p>
              </div>
              <CreditCard className="text-purple-500" size={36} />
            </div>
          </div>
        </div>
        
        {/* Configuración de Moneda */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
            <Settings size={24} className="mr-3 text-yellow-500" /> Configuración de Moneda
          </h3>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-grow w-full sm:w-auto">
              <label htmlFor="exchangeRate" className="block text-sm font-medium text-slate-300 mb-1">
                Tasa de Cambio (1 USD = X COP):
              </label>
              <input type="number" id="exchangeRate" value={tempExchangeRate} onChange={(e) => setTempExchangeRate(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 w-full placeholder-slate-400"
                placeholder="Ej: 4000" />
            </div>
            <button onClick={handleSetExchangeRate} className="bg-yellow-500 text-slate-900 px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold w-full sm:w-auto shadow-md hover:shadow-lg">
              Actualizar Tasa
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Tasa actual: 1 USD = {exchangeRateUSDToCOP} COP</p>
        </div>
        
        {/* Saldos por Bolsillo */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-6">Saldos por Bolsillo (COP)</h3>
          {pockets.length === 0 && pocketBalances.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No has creado bolsillos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {pocketBalances.map(pb => (
                <div key={pb.id} className={`rounded-lg p-4 shadow-lg ${pb.balance >= 0 ? 'bg-slate-700/50 border-l-4 border-sky-500' : 'bg-slate-700/50 border-l-4 border-orange-500'} hover:shadow-yellow-500/10 transition-all`}>
                  <h4 className="text-lg font-semibold text-yellow-400 truncate" title={pb.name}>{pb.name}</h4>
                  <p className={`text-2xl font-bold mt-1 mb-2 ${pb.balance >= 0 ? 'text-sky-300' : 'text-orange-300'}`}>
                    {formatCurrency(pb.balance, 'COP')}
                  </p>
                  <div className="text-xs pt-2 border-t border-slate-600 space-y-1">
                    <p className="text-green-400">Ingresos: {formatCurrency(pb.income, 'COP')}</p>
                    <p className="text-red-400">Gastos: {formatCurrency(pb.expenses, 'COP')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
        <div className="flex flex-wrap gap-x-6 gap-y-4 items-center">
            <div className="flex items-center space-x-2 text-slate-300">
              <Filter size={20} className="text-yellow-400" />
              <span className="font-medium">Filtros:</span>
            </div>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100">
              <option value="all">Todas las fechas</option> <option value="7days">Últimos 7 días</option> <option value="30days">Últimos 30 días</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100">
              <option value="all">Todas las categorías</option> <option value="Salario">Salario</option> <option value="Freelance">Freelance</option>
              <option value="Vivienda">Vivienda</option> <option value="Alimentación">Alimentación</option> <option value="Transporte">Transporte</option>
            </select>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Ingresos vs Gastos Mensuales (COP)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={chartTextAndStrokeColor} tick={{ fill: chartTextAndStrokeColor, fontSize: 12 }} />
                <YAxis stroke={chartTextAndStrokeColor} tickFormatter={(value) => formatCurrency(value, 'COP').replace('COP','').trim()} tick={{ fill: chartTextAndStrokeColor, fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: `1px solid ${chartGridColor}`, borderRadius: '0.5rem' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#f1c40f', fontWeight: 'bold' }} formatter={(value) => formatCurrency(value, 'COP')} />
                <Legend wrapperStyle={{ color: chartTextAndStrokeColor, fontSize: 12 }} />
                <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={3} name="Ingresos" dot={{ r: 4, fill: "#34d399" }} activeDot={{ r: 7, stroke: '#fde047', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={3} name="Gastos" dot={{ r: 4, fill: "#f87171" }} activeDot={{ r: 7, stroke: '#fde047', strokeWidth: 2 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">Gastos por Categoría (Filtrados, COP)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" labelLine={false} outerRadius={110} fill="#8884d8" dataKey="value"
                  label={({ name, percent, value }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  stroke={chartGridColor}
                >
                  {pieData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} /> ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: `1px solid ${chartGridColor}`, borderRadius: '0.5rem' }} itemStyle={{ color: '#e2e8f0' }} labelStyle={{ color: '#f1c40f', fontWeight: 'bold' }} formatter={(value) => formatCurrency(value, 'COP')} />
                <Legend wrapperStyle={{ color: chartTextAndStrokeColor, paddingTop: '15px', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Metas Financieras */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-yellow-400">Metas Financieras (en COP)</h3>
            <button onClick={() => setShowAddGoalForm(!showAddGoalForm)} className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg">
              {showAddGoalForm ? <Minus size={20} /> : <Plus size={20} />} <span>{showAddGoalForm ? 'Cancelar' : 'Nueva Meta'}</span>
            </button>
          </div>
          {showAddGoalForm && (
            <div className="mb-6 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3">Crear Nueva Meta (en COP)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <input type="text" placeholder="Nombre de la meta" value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400" />
                <input type="number" placeholder="Monto Objetivo (COP)" value={newGoal.targetAmount} onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400" />
                <input type="number" placeholder="Ahorro Inicial (COP, Opcional)" value={newGoal.currentAmount} onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400" />
              </div>
              <button onClick={handleAddGoal} className="mt-4 bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-400 transition-colors font-semibold shadow-md hover:shadow-lg">Guardar Meta</button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.length === 0 && !showAddGoalForm && (<p className="text-slate-400 col-span-full text-center py-4">No has agregado ninguna meta todavía.</p>)}
            {goals.map(goal => { 
                const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                return (
                  <div key={goal.id} className="border border-slate-700 rounded-lg p-4 shadow-lg bg-slate-800/50 hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-yellow-400">{goal.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Target className="text-sky-400" size={20} />
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-red-500 hover:text-red-400" title="Eliminar meta"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm text-slate-300">
                        <span>{formatCurrency(goal.currentAmount, 'COP')}</span>
                        <span>{formatCurrency(goal.targetAmount, 'COP')}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-4">
                        <div className="bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 h-4 rounded-full text-xs text-white flex items-center justify-center"
                          style={{ width: `${Math.min(progress, 100)}%` }}>
                         {progress > 15 && `${progress.toFixed(0)}%`} 
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input type="number" placeholder="Añadir progreso (COP)" value={amountToAdd[goal.id] || ''} onChange={(e) => setAmountToAdd(prev => ({...prev, [goal.id]: e.target.value }))}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-100 text-sm w-full placeholder-slate-400"/>
                      <button onClick={() => handleUpdateGoalProgress(goal.id, goal.currentAmount, amountToAdd[goal.id] || '0')}
                        className="bg-sky-500 text-white px-3 py-1 rounded-lg hover:bg-sky-400 text-sm font-semibold shadow-md hover:shadow-lg">Sumar</button>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>

        {/* Gestión de Bolsillos */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-yellow-400">Mis Bolsillos</h3>
            <button onClick={() => setShowAddPocketForm(!showAddPocketForm)} className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center space-x-2 font-semibold shadow-md hover:shadow-lg">
              {showAddPocketForm ? <Minus size={20} /> : <FolderPlus size={20} />} <span>{showAddPocketForm ? 'Cancelar' : 'Nuevo Bolsillo'}</span>
            </button>
          </div>
          {showAddPocketForm && (
            <div className="mb-4 p-4 border border-slate-700 rounded-lg bg-slate-800/50">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3">Crear Nuevo Bolsillo</h4>
              <div className="flex items-end gap-4">
                <input type="text" placeholder="Nombre del bolsillo" value={newPocketName} onChange={(e) => setNewPocketName(e.target.value)}
                  className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400"/>
                <button onClick={handleAddPocket} className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-400 transition-colors font-semibold shadow-md hover:shadow-lg">Guardar Bolsillo</button>
              </div>
            </div>
          )}
          {pockets.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-slate-300 mb-2 mt-4">Bolsillos existentes:</h4>
              <ul className="space-y-2">
                {pockets.map(pocket => ( <li key={pocket.id} className="text-slate-200 pl-4 p-2 bg-slate-700/40 rounded-md border border-slate-600 hover:border-yellow-500/50 transition-colors">{pocket.name}</li> ))}
              </ul>
            </div>
          )}
          {pockets.length === 0 && !showAddPocketForm && (<p className="text-slate-400 text-center py-4">Aún no has creado ningún bolsillo.</p>)}
        </div>
        
        {/* Formulario Nueva Transacción */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 mb-8 border border-slate-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Agregar Nueva Transacción</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            {/* ... (inputs adaptados al tema oscuro) ... */}
            <select value={newTransaction.type} onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100">
              <option value="expense">Gasto</option><option value="income">Ingreso</option>
            </select>
            <select value={newTransaction.currency} onChange={(e) => setNewTransaction({...newTransaction, currency: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100">
              <option value="COP">COP</option><option value="USD">USD</option>
            </select>
            <input type="number" placeholder="Monto" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400"/>
            <input type="text" placeholder="Categoría" value={newTransaction.category} onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400"/>
            <input type="text" placeholder="Descripción (Opcional)" value={newTransaction.description} onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100 placeholder-slate-400"/>
            <input type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100"/>
            <select value={newTransaction.selectedPocketId} onChange={(e) => setNewTransaction({...newTransaction, selectedPocketId: e.target.value})}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-slate-100">
              <option value="">Selecciona un Bolsillo</option>
              {pockets.map(pocket => (<option key={pocket.id} value={pocket.id}>{pocket.name}</option>))}
            </select>
          </div>
          <div className="mt-4">
            <button onClick={addTransaction} className="bg-yellow-500 text-slate-900 px-4 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 w-full md:w-auto font-bold shadow-md hover:shadow-lg">
              <Plus size={20} /> <span>Agregar Transacción</span>
            </button>
          </div>
        </div>

        {/* Lista de Transacciones Recientes */}
        <div className="bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Transacciones Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold">Bolsillo</th>
                  <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold">Descripción</th>
                  <th className="text-right py-3 px-4 font-semibold">Monto</th>
                  <th className="text-center py-3 px-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(-10).reverse().map(transaction => { /* ... (lógica de amountDisplay igual) ... */ 
                    const pocketName = pockets.find(p => p.id === transaction.pocketId)?.name || 'N/A';
                    let amountDisplay = formatCurrency(transaction.amount, 'COP');
                    if (transaction.originalCurrency === 'USD' && typeof transaction.originalAmount === 'number') {
                      amountDisplay = `${formatCurrency(transaction.originalAmount, 'USD')} (${formatCurrency(transaction.amount, 'COP')})`;
                    } else if (transaction.originalCurrency === 'COP' && typeof transaction.originalAmount === 'number') {
                       amountDisplay = formatCurrency(transaction.originalAmount, 'COP');
                    }
                    return (
                      <tr key={transaction.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4">{transaction.date}</td>
                        <td className="py-3 px-4">{pocketName}</td>
                        <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${ transaction.type === 'income' ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-red-900 text-red-300 border border-red-700' }`}>{transaction.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                        <td className="py-3 px-4">{transaction.category}</td>
                        <td className="py-3 px-4 truncate max-w-xs" title={transaction.description}>{transaction.description}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${ transaction.type === 'income' ? 'text-green-400' : 'text-red-400' }`}>{transaction.type === 'income' ? '+' : ''}{amountDisplay}</td> {/* Quitado el - para gastos, ya está en el color */}
                        <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-500 hover:text-red-400 transition-colors" title="Eliminar transacción"><Trash2 size={18} /></button></td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <footer className="text-center py-8 text-sm text-slate-500 border-t border-slate-700">
        <p>&copy; {new Date().getFullYear()} Estamos Benditos App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default FinanceDashboard;
