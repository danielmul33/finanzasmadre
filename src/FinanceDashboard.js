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
