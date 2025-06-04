// src/FinanceDashboard.js
import React, { useState, useEffect, useMemo } from 'react'; // <--- Se añadió useMemo
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Lock, Eye, EyeOff, Plus, Minus, TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Calendar, Filter, Trash2, Edit3, Save, Briefcase, FolderPlus } from 'lucide-react';

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
    type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().split('T')[0], selectedPocketId: ''
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

  // Cargar bolsillos desde Firestore
  useEffect(() => {
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
  const addTransaction = () => { /* ... (sin cambios) ... */ 
    if (newTransaction.amount && newTransaction.category && newTransaction.selectedPocketId) {
      try {
        const transactionToSave = {
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date,
          pocketId: newTransaction.selectedPocketId,
          createdAt: Timestamp.fromDate(new Date())
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

  const filteredTransactions = transactions.filter(t => { /* ... (sin cambios) ... */ 
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === '30days' && new Date(t.date) >= new Date(Date.now() - 30*24*60*60*1000)) ||
      (dateFilter === '7days' && new Date(t.date) >= new Date(Date.now() - 7*24*60*60*1000));
    const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
    return dateMatch && categoryMatch;
  });
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const balance = totalIncome - totalExpenses;
  const expensesByCategory = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => { /* ... */ 
      acc[t.category] = (acc[t.category] || 0) + (parseFloat(t.amount) || 0);
      return acc;
    }, {});
  const pieData = Object.entries(expensesByCategory).map(([category, amount]) => ({ name: category, value: amount }));
  const monthlyData = transactions.reduce((acc, t) => { /* ... */ 
    if (!t.date || typeof t.date !== 'string') return acc; 
    const month = t.date.substring(0, 7);
    if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
    if (t.type === 'income') acc[month].income += (parseFloat(t.amount) || 0);
    else acc[month].expenses += (parseFloat(t.amount) || 0);
    return acc;
  }, {});
  const chartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  
  // --- NUEVA LÓGICA PARA CALCULAR SALDOS POR BOLSILLO ---
  const pocketBalances = useMemo(() => {
    if (!pockets.length) {
      return []; 
    }
    return pockets.map(pocket => {
      const relevantTransactions = transactions.filter(t => t.pocketId === pocket.id);
      const income = relevantTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const expenses = relevantTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      return {
        id: pocket.id,
        name: pocket.name,
        income,
        expenses,
        balance: income - expenses,
      };
    });
  }, [pockets, transactions]);
  // --- FIN DE LÓGICA DE SALDOS POR BOLSILLO ---

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
            <p className="text-white/70">
      
