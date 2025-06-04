// src/FinanceDashboard.js
import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Lock, Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Calendar, Filter, Trash2 } from 'lucide-react'; // <--- Se añadió Trash2

// Importaciones de Firebase
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, orderBy, doc, deleteDoc } from "firebase/firestore"; // <--- Se añadió doc y deleteDoc

const FinanceDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [goals, setGoals] = useState([]);

  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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

  const users = {
    'Mul': 'Rilidama2'
  };

  const handleLogin = () => {
    if (users[username] && users[username] === password) {
      setIsLoggedIn(true);
      setCurrentUser(username);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setUsername('');
    setPassword('');
  };

  const addTransaction = () => {
    if (newTransaction.amount && newTransaction.category) {
      try {
        const transactionToSave = {
          ...newTransaction,
          amount: parseFloat(newTransaction.amount),
        };
        addDoc(collection(db, "transactions"), transactionToSave);
        setNewTransaction({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      } catch (e) {
        console.error("Error adding document: ", e);
        alert("Hubo un error al guardar la transacción.");
      }
    }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR TRANSACCIONES ---
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
      try {
        const transactionDocRef = doc(db, "transactions", transactionId);
        await deleteDoc(transactionDocRef);
        // onSnapshot se encargará de actualizar la lista automáticamente
        console.log("Transacción eliminada con ID: ", transactionId);
      } catch (e) {
        console.error("Error deleting document: ", e);
        alert("Hubo un error al eliminar la transacción.");
      }
    }
  };
  // --- FIN DE NUEVA FUNCIÓN ---

  const filteredTransactions = transactions.filter(t => {
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === '30days' && new Date(t.date) >= new Date(Date.now() - 30*24*60*60*1000)) ||
      (dateFilter === '7days' && new Date(t.date) >= new Date(Date.now() - 7*24*60*60*1000));
    const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
    return dateMatch && categoryMatch;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const monthlyData = transactions.reduce((acc, t) => {
    if (!t.date || typeof t.date !== 'string') return acc; 
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'income') acc[month].income += t.amount;
    else acc[month].expenses += t.amount;
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (!isLoggedIn) {
    return (
      // ... (El JSX del Login no cambia, se mantiene igual)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... (El Header no cambia) ... */}
      <header className="bg-white shadow-sm border-b">
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
        {/* ... (Tarjetas de resumen, Filtros, Gráficos, Metas, Nueva Transacción no cambian en su JSX) ... */}
        {/* Tarjetas de resumen */}
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
            <div className
