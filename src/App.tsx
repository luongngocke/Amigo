/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Bed, 
  Calendar, 
  Users, 
  LogOut, 
  Plus, 
  Minus,
  Search, 
  Settings, 
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  Edit,
  Trash2,
  LayoutGrid,
  Lock,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
  ShoppingCart,
  FileText,
  Package,
  RotateCcw,
  Wallet,
  Box,
  Database,
  CheckSquare,
  ArrowDownCircle,
  ChevronDown,
  UserRoundPen,
  Menu,
  UserCog,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, RoomStatus, Booking, Guest, User, Branch, DashboardStats, BookingStatus, RoomType, UserRole, Transaction, TransactionType, RoomService } from './types';
import { MOCK_ROOMS, MOCK_BOOKINGS, MOCK_GUESTS, MOCK_BRANCHES } from './mockData';

type Tab = 'dashboard' | 'rooms' | 'bookings' | 'guests' | 'settings' | 'roomManagement' | 'ledger';

export default function App() {
  const SESSION_DURATION = 4 * 60 * 60 * 1000;
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hotel_logged_in_user');
    if (saved) return JSON.parse(saved) as User;
    return null;
  });
  const [currentUser, setCurrentUser] = useState<UserRole>(() => {
    const saved = localStorage.getItem('hotel_logged_in_user');
    if (saved) {
      const user = JSON.parse(saved) as User;
      return user.role;
    }
    return UserRole.ADMIN;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const auth = localStorage.getItem('hotel_is_authenticated');
    const timestamp = localStorage.getItem('hotel_login_timestamp');
    if (auth === 'true' && timestamp) {
      const elapsed = Date.now() - parseInt(timestamp, 10);
      if (elapsed < SESSION_DURATION) {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        const timestamp = localStorage.getItem('hotel_login_timestamp');
        if (timestamp) {
          const elapsed = Date.now() - parseInt(timestamp, 10);
          if (elapsed >= SESSION_DURATION) {
            handleLogout();
            alert('Phiên làm việc đã hết hạn (4 tiếng). Vui lòng đăng nhập lại.');
          }
        }
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('hotel_branches');
    if (saved) return JSON.parse(saved);
    return MOCK_BRANCHES;
  });
  
  useEffect(() => {
    localStorage.setItem('hotel_branches', JSON.stringify(branches));
  }, [branches]);
  
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null); // null means All Branches
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    
    if (user) {
      setCurrentUser(user.role);
      setLoggedInUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('hotel_is_authenticated', 'true');
      localStorage.setItem('hotel_login_timestamp', Date.now().toString());
      localStorage.setItem('hotel_logged_in_user', JSON.stringify(user));
      setActiveTab(user.role === UserRole.ADMIN ? 'dashboard' : 'rooms');
      setAccountData(prev => ({
        ...prev,
        displayName: user.name
      }));
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser(null);
    localStorage.removeItem('hotel_is_authenticated');
    localStorage.removeItem('hotel_login_timestamp');
    localStorage.removeItem('hotel_logged_in_user');
    setLoginForm({ username: '', password: '' });
  };
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [guests, setGuests] = useState<Guest[]>(MOCK_GUESTS);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState<string | null>(null);
  const [bookingDateState, setBookingDateState] = useState<string>(selectedDate);
  const [isGuestArrived, setIsGuestArrived] = useState<boolean>(true);
  const [bookingCheckIn, setBookingCheckIn] = useState<string>(selectedDate);
  const [bookingCheckOut, setBookingCheckOut] = useState<string>('');
  const [guestSearch, setGuestSearch] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestAddress, setGuestAddress] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [guestIdCards, setGuestIdCards] = useState<string[]>([]);
  const [currentIdCard, setCurrentIdCard] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCheckInConfirmModalOpen, setIsCheckInConfirmModalOpen] = useState(false);
  const [checkInBooking, setCheckInBooking] = useState<Booking | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({
    number: '',
    type: RoomType.SINGLE,
    pricePerNight: 0,
    floor: 1,
    status: RoomStatus.AVAILABLE,
    branchId: MOCK_BRANCHES[0].id
  });
  const [apiUrl, setApiUrl] = useState<string>(localStorage.getItem('hotel_api_url') || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [accountData, setAccountData] = useState({
    displayName: 'Quản trị viên',
    email: 'admin@hotel.com',
    currentPassword: '',
    newPassword: ''
  });

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('hotel_users');
    if (savedUsers) return JSON.parse(savedUsers);
    return [
      { id: 'u1', name: 'Admin', role: UserRole.ADMIN, username: 'admin', password: 'admin' },
      { id: 'u2', name: 'Nhân viên 1', role: UserRole.STAFF, username: 'staff', password: 'staff' },
      { id: 'u3', name: 'Peajastr', role: UserRole.ADMIN, username: 'peajastr', password: 'nhiethuyet' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('hotel_users', JSON.stringify(users));
  }, [users]);

  const [isAccountManagementModalOpen, setIsAccountManagementModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserFormData, setNewUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.STAFF
  });
  
  const [isBranchManagementModalOpen, setIsBranchManagementModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranchFormData, setNewBranchFormData] = useState({
    name: '',
    address: ''
  });

  const handleSaveSettings = () => {
    setSaveStatus('idle');
    try {
      localStorage.setItem('hotel_api_url', apiUrl);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const stats: DashboardStats = {
    totalRooms: rooms.filter(r => !selectedBranchId || r.branchId === selectedBranchId).length,
    occupiedRooms: rooms.filter(r => (!selectedBranchId || r.branchId === selectedBranchId) && r.status === RoomStatus.OCCUPIED).length,
    availableRooms: rooms.filter(r => (!selectedBranchId || r.branchId === selectedBranchId) && r.status === RoomStatus.AVAILABLE).length,
    bookedNotReceived: bookings.filter(b => (!selectedBranchId || b.branchId === selectedBranchId) && b.status === BookingStatus.CONFIRMED).length,
    expectedArrivals: bookings.filter(b => (!selectedBranchId || b.branchId === selectedBranchId) && b.status === BookingStatus.CONFIRMED).length,
    expectedDepartures: bookings.filter(b => (!selectedBranchId || b.branchId === selectedBranchId) && b.status === BookingStatus.CHECKED_IN).length,
    dailyRevenue: bookings.filter(b => !selectedBranchId || b.branchId === selectedBranchId).reduce((acc, b) => acc + (b.totalPrice || 0), 0) / 30,
    monthlyRevenue: bookings.filter(b => !selectedBranchId || b.branchId === selectedBranchId).reduce((acc, b) => acc + (b.totalPrice || 0), 0)
  };

  useEffect(() => {
    if (isBookingModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isBookingModalOpen]);

  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isGuestDetailModalOpen, setIsGuestDetailModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<{name: string, price: number, quantity: number} | null>(null);
  const [availableServices] = useState([
    { name: 'Nước suối', price: 15000 },
    { name: 'Mì tôm', price: 20000 },
    { name: 'Giặt là', price: 50000 },
    { name: 'Coca Cola', price: 25000 },
    { name: 'Bia Larue', price: 30000 },
  ]);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [newGuestData, setNewGuestData] = useState<Partial<Guest>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    identityCard: '',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 't1', type: TransactionType.INCOME, amount: 2500000, category: 'Phòng', description: 'Thanh toán phòng 201', date: '2024-05-01', paymentMethod: 'Tiền mặt' },
    { id: 't2', type: TransactionType.EXPENSE, amount: 500000, category: 'Điện nước', description: 'Tiền điện tháng 4', date: '2024-05-02', paymentMethod: 'Chuyển khoản' },
    { id: 't3', type: TransactionType.INCOME, amount: 1200000, category: 'Dịch vụ', description: 'Giặt là & Ăn sáng p305', date: '2024-05-03', paymentMethod: 'Thẻ' },
  ]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransactionData, setNewTransactionData] = useState<Partial<Transaction>>({
    type: TransactionType.INCOME,
    amount: 0,
    category: 'Phòng',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Tiền mặt'
  });

  const openGuestModal = (guest?: Guest) => {
    if (guest) {
      setEditingGuest(guest);
      setNewGuestData(guest);
    } else {
      setEditingGuest(null);
      setNewGuestData({
        name: '',
        email: '',
        phone: '',
        address: '',
        identityCard: '',
      });
    }
    setIsGuestModalOpen(true);
  };

  const handleGuestAction = () => {
    if (!newGuestData.name || !newGuestData.phone) {
      alert('Vui lòng nhập tên và số điện thoại!');
      return;
    }

    if (editingGuest) {
      setGuests(guests.map(g => g.id === editingGuest.id ? { ...editingGuest, ...newGuestData } as Guest : g));
    } else {
      const newGuest: Guest = {
        ...newGuestData,
        id: `g${Date.now()}`,
        totalBookings: 0,
        lastVisit: 'Chưa có'
      } as Guest;
      setGuests([newGuest, ...guests]);
    }
    setIsGuestModalOpen(false);
    setEditingGuest(null);
  };

  const deleteGuest = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      setGuests(guests.filter(g => g.id !== id));
      if (selectedGuest?.id === id) setIsGuestDetailModalOpen(false);
    }
  };

  const addServiceToBooking = (serviceName: string, price: number, quantity: number) => {
    if (!selectedBookingDetails) return;
    
    // Check if service already exists
    const existingIndex = selectedBookingDetails.services?.findIndex(s => s.name === serviceName);
    
    let newServiceAmount = 0;
    
    const updatedBookings = bookings.map(b => {
      if (b.id === selectedBookingDetails.id) {
        let newServices = b.services ? [...b.services] : [];
        if (existingIndex !== undefined && existingIndex >= 0) {
          newServices[existingIndex] = {
            ...newServices[existingIndex],
            quantity: newServices[existingIndex].quantity + quantity,
            price: price
          };
          // Just simplistic: price * quantity difference might be complex if price changes
          // Here we just calculate the added value based on current addition
          newServiceAmount = price * quantity;
        } else {
          const newService: RoomService = {
            id: `s${Date.now()}`,
            name: serviceName,
            price: price,
            quantity: quantity,
            createdAt: new Date().toISOString().split('T')[0]
          };
          newServices.push(newService);
          newServiceAmount = price * quantity;
        }

        const updatedBooking = { 
          ...b, 
          services: newServices,
          totalPrice: (b.totalPrice || 0) + newServiceAmount
        };
        setSelectedBookingDetails(updatedBooking);
        return updatedBooking;
      }
      return b;
    });

    setBookings(updatedBookings);
  };

  const handleSaveUser = () => {
    if (!newUserFormData.name || !newUserFormData.username) {
      alert('Vui lòng điền đầy đủ tên và tên đăng nhập');
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { 
        ...u, 
        name: newUserFormData.name, 
        username: newUserFormData.username, 
        role: newUserFormData.role,
        password: newUserFormData.password || u.password
      } : u));
    } else {
      if (!newUserFormData.password) {
        alert('Vui lòng nhập mật khẩu cho tài khoản mới');
        return;
      }
      const newUser: User = {
        id: `u${Date.now()}`,
        name: newUserFormData.name,
        username: newUserFormData.username,
        role: newUserFormData.role,
        password: newUserFormData.password
      };
      setUsers([...users, newUser]);
    }
    setIsAccountManagementModalOpen(false);
    setEditingUser(null);
    setNewUserFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSaveBranch = () => {
    if (!newBranchFormData.name || !newBranchFormData.address) {
      alert('Vui lòng điền đầy đủ tên và địa chỉ cơ sở');
      return;
    }

    if (editingBranch) {
      setBranches(branches.map(b => b.id === editingBranch.id ? { 
        ...b, 
        name: newBranchFormData.name, 
        address: newBranchFormData.address
      } : b));
    } else {
      const newBranch: Branch = {
        id: `br${Date.now()}`,
        name: newBranchFormData.name,
        address: newBranchFormData.address
      };
      setBranches([...branches, newBranch]);
    }
    setIsBranchManagementModalOpen(false);
    setEditingBranch(null);
    setNewBranchFormData({ name: '', address: '' });
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa cơ sở này? Sẽ ẩn đi các dữ liệu liên quan.')) {
      setBranches(branches.filter(b => b.id !== id));
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: BookingStatus) => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    if (selectedBookingDetails && selectedBookingDetails.id === bookingId) {
      setSelectedBookingDetails({ ...selectedBookingDetails, status: newStatus });
    }
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && newStatus === BookingStatus.CHECKED_OUT) {
      setRooms(rooms.map(r => r.id === booking.roomId ? { ...r, status: RoomStatus.CLEANING } : r));
    } else if (booking && newStatus === BookingStatus.CHECKED_IN) {
      setRooms(rooms.map(r => r.id === booking.roomId ? { ...r, status: RoomStatus.OCCUPIED } : r));
    }
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setEditingBookingId(null);
    setGuestSearch('');
    setGuestEmail('');
    setGuestPhone('');
    setGuestAddress('');
    setPaidAmount(0);
    setGuestIdCards([]);
    setCurrentIdCard('');
    setPreSelectedRoomId(null);
    setBookingCheckIn(selectedDate);
    setBookingCheckOut('');
    setBookingDateState(selectedDate);
    setIsGuestArrived(true);
  };

  const handleSaveBooking = () => {
    if (!guestSearch || !guestPhone || !preSelectedRoomId) {
      alert('Vui lòng điền đầy đủ tên, số điện thoại và chọn phòng!');
      return;
    }

    // 1. Check/Add Guest
    const existingGuest = guests.find(g => g.phone === guestPhone);
    let currentGuestId = existingGuest?.id;

    if (!existingGuest) {
      const newGuest: Guest = {
        id: `g${Date.now()}`,
        name: guestSearch,
        email: guestEmail,
        phone: guestPhone,
        address: guestAddress,
        identityCard: '',
        totalBookings: 1,
        lastVisit: bookingCheckIn
      };
      setGuests([...guests, newGuest]);
      currentGuestId = newGuest.id;
    } else if (!editingBookingId) {
      setGuests(guests.map(g => g.id === existingGuest.id ? { ...g, totalBookings: g.totalBookings + 1, lastVisit: bookingCheckIn } : g));
    }

    // 2. Create or Update Booking
    const selectedRoom = rooms.find(r => r.id === preSelectedRoomId);
    let nights = Math.ceil((new Date(bookingCheckOut || bookingCheckIn).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 3600 * 24));
    if (nights < 1) nights = 1;
    
    if (editingBookingId) {
      const existingBooking = bookings.find(b => b.id === editingBookingId);
      if (existingBooking) {
        const newStatus = isGuestArrived ? BookingStatus.CHECKED_IN : BookingStatus.CONFIRMED;
        const updatedBooking: Booking = {
          ...existingBooking,
          roomId: preSelectedRoomId,
          branchId: selectedRoom?.branchId || existingBooking.branchId,
          guestName: guestSearch,
          guestEmail: guestEmail,
          guestPhone: guestPhone,
          guestAddress: guestAddress,
          checkIn: bookingCheckIn,
          checkOut: bookingCheckOut || existingBooking.checkOut,
          bookingDate: bookingDateState,
          status: newStatus,
          totalPrice: existingBooking.totalPrice, // User can manually edit total price through another UI if needed
          paidAmount: paidAmount,
          guestIdCards: guestIdCards,
          guestsCount: guestIdCards.length > 0 ? guestIdCards.length : 1
        };
        setBookings(bookings.map(b => b.id === editingBookingId ? updatedBooking : b));
        
        // Update room status
        if (newStatus === BookingStatus.CHECKED_IN) {
          setRooms(rooms.map(r => r.id === preSelectedRoomId ? { ...r, status: RoomStatus.OCCUPIED } : r));
        }

        if (selectedBookingDetails?.id === editingBookingId) {
          setSelectedBookingDetails(updatedBooking);
        }
      }
    } else {
      const newStatus = isGuestArrived ? BookingStatus.CHECKED_IN : BookingStatus.CONFIRMED;
      const newBooking: Booking = {
        id: `b${Date.now()}`,
        roomId: preSelectedRoomId,
        branchId: selectedRoom?.branchId || '',
        guestName: guestSearch,
        guestEmail: guestEmail,
        guestPhone: guestPhone,
        guestAddress: guestAddress,
        checkIn: bookingCheckIn,
        checkOut: bookingCheckOut || bookingCheckIn,
        bookingDate: bookingDateState,
        status: newStatus,
        totalPrice: (selectedRoom?.pricePerNight || 0) * nights,
        paidAmount: paidAmount,
        guestIdCards: guestIdCards,
        guestsCount: guestIdCards.length > 0 ? guestIdCards.length : 1
      };

      setBookings([newBooking, ...bookings]);
      // 3. Update Room status
      if (newStatus === BookingStatus.CHECKED_IN) {
        setRooms(rooms.map(r => r.id === preSelectedRoomId ? { ...r, status: RoomStatus.OCCUPIED } : r));
      }
    }

    // Reset and Close
    closeBookingModal();
  };
  
  const handleRoomAction = () => {
    if (editingRoom) {
      // Update
      const updatedRooms = rooms.map(r => 
        r.id === editingRoom.id ? { ...editingRoom, ...newRoomData } as Room : r
      );
      setRooms(updatedRooms);
    } else {
      // Create
      const newRoom: Room = {
        ...newRoomData,
        id: `room-${Date.now()}`,
      } as Room;
      setRooms([newRoom, ...rooms]);
    }
    closeRoomModal();
  };

  const deleteRoom = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  const openTransactionModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setNewTransactionData(transaction);
    } else {
      setEditingTransaction(null);
      setNewTransactionData({
        type: TransactionType.INCOME,
        amount: 0,
        category: 'Phòng',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Tiền mặt'
      });
    }
    setIsTransactionModalOpen(true);
  };

  const handleTransactionAction = () => {
    if (newTransactionData.amount === undefined || newTransactionData.amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ!');
      return;
    }

    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? { ...editingTransaction, ...newTransactionData } as Transaction : t));
    } else {
      const newTransaction: Transaction = {
        ...newTransactionData,
        id: `t${Date.now()}`,
      } as Transaction;
      setTransactions([newTransaction, ...transactions]);
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const openRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setNewRoomData(room);
    } else {
      setEditingRoom(null);
      setNewRoomData({
        number: '',
        type: RoomType.SINGLE,
        pricePerNight: 0,
        floor: Math.max(...rooms.map(r => r.floor), 1),
        status: RoomStatus.AVAILABLE
      });
    }
    setIsRoomModalOpen(true);
  };

  const closeRoomModal = () => {
    setIsRoomModalOpen(false);
    setEditingRoom(null);
  };

  const renderRoomManagement = () => {
    const filteredRooms = rooms.filter(r => !selectedBranchId || r.branchId === selectedBranchId);
    
    return (
      <div className="space-y-6 pb-20">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight uppercase">Quản lý danh sách phòng</h1>
            <p className="text-sm text-slate-500 font-medium">Thêm, sửa, xóa và cập nhật thông tin phòng</p>
          </div>
          <button 
            onClick={() => openRoomModal()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Thêm phòng mới
          </button>
        </header>

        <div className="bg-white md:bg-transparent rounded-3xl md:rounded-none border-none md:border md:border-border-light overflow-hidden shadow-none md:shadow-sm">
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-text-main">Phòng {room.number}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{room.type} • Tầng {room.floor}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">
                      {branches.find(b => b.id === room.branchId)?.name.split('-')[1]?.trim()}
                    </p>
                  </div>
                  <span className={`status-badge-modern ${
                    room.status === RoomStatus.AVAILABLE ? 'badge-available' : 
                    room.status === RoomStatus.OCCUPIED ? 'badge-occupied' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {translateStatus(room.status)}
                  </span>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Giá mỗi đêm</p>
                    <span className="text-base font-black text-primary">{formatCurrency(room.pricePerNight)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openRoomModal(room)}
                      className="p-3 text-slate-600 bg-slate-50 rounded-2xl border border-slate-100 active:scale-95 transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => deleteRoom(room.id)}
                      className="p-3 text-rose-500 bg-rose-50 rounded-2xl border border-rose-100 active:scale-95 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-3xl border border-border-light">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cơ sở</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số phòng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại phòng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tầng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá / Đêm</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {branches.find(b => b.id === room.branchId)?.name.split('-')[1]?.trim()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-text-main">Phòng {room.number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{room.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500">Tầng {room.floor}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{formatCurrency(room.pricePerNight)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge-modern ${
                        room.status === RoomStatus.AVAILABLE ? 'badge-available' : 
                        room.status === RoomStatus.OCCUPIED ? 'badge-occupied' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {translateStatus(room.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openRoomModal(room)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteRoom(room.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const translateRoomType = (type: RoomType) => {
    switch (type) {
      case RoomType.SINGLE: return 'Phòng Đơn';
      case RoomType.DOUBLE: return 'Phòng Đôi';
      case RoomType.SUITE: return 'Phòng Suite';
      case RoomType.DELUXE: return 'Phòng Deluxe';
      default: return type;
    }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'badge-available';
      case RoomStatus.OCCUPIED: return 'badge-occupied';
      case RoomStatus.CLEANING: return 'badge-cleaning';
      case RoomStatus.MAINTENANCE: return 'badge-maintenance';
      default: return '';
    }
  };

  const translateStatus = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'Sẵn sàng';
      case RoomStatus.OCCUPIED: return 'Khách đặt';
      case RoomStatus.CLEANING: return 'Đang dọn';
      case RoomStatus.MAINTENANCE: return 'Bảo trì';
      default: return status;
    }
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return <CheckCircle2 className="w-4 h-4" />;
      case RoomStatus.OCCUPIED: return <Clock className="w-4 h-4" />;
      case RoomStatus.CLEANING: return <AlertCircle className="w-4 h-4" />;
      case RoomStatus.MAINTENANCE: return <Wrench className="w-4 h-4" />;
    }
  };

  const renderDashboard = () => {
    const filteredBookings = bookings.filter(b => !selectedBranchId || b.branchId === selectedBranchId);
    const filteredRooms = rooms.filter(r => !selectedBranchId || r.branchId === selectedBranchId);
    const recentBookings = filteredBookings.slice(-4).reverse();

    return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="border-b border-border-light pb-6 -mt-2">
        <h1 className="text-2xl font-bold text-text-main">Tổng quan</h1>
        <p className="text-slate-500 text-sm">Chào mừng trở lại. Đây là tình hình hôm nay.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Phòng trống', value: stats.availableRooms.toString(), icon: <CheckCircle2 />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Đang có khách', value: stats.occupiedRooms.toString(), icon: <Bed />, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Đặt chưa nhận', value: stats.bookedNotReceived.toString(), icon: <Clock />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Doanh thu tháng', value: formatCurrency(stats.monthlyRevenue), icon: <TrendingUp />, color: 'text-primary', bg: 'bg-primary/5' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-[28px] border border-border-light shadow-sm flex items-start justify-between bg-white`}
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-text-main">{stat.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 22, className: 'stroke-[2.5]' })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border-light rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Hoạt động gần đây</h3>
            <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                onClick={() => {
                  setSelectedBookingDetails(booking);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {booking.guestName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-main">{booking.guestName}</h4>
                    <p className="text-xs text-slate-500">Phòng {rooms.find(r => r.id === booking.roomId)?.number} • {booking.checkIn}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                      {booking.paidAmount >= booking.totalPrice ? 'Đã thu đủ' : 'Còn nợ'}
                    </p>
                    <p className="text-sm font-bold text-text-main">{formatCurrency(booking.totalPrice)}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border-light rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Trạng thái phòng</h3>
          <div className="space-y-4">
            {[
              { label: 'Sẵn sàng', count: filteredRooms.filter(r => r.status === RoomStatus.AVAILABLE).length, color: 'bg-available' },
              { label: 'Khách đặt', count: filteredRooms.filter(r => r.status === RoomStatus.OCCUPIED).length, color: 'bg-occupied' },
              { label: 'Đang dọn', count: filteredRooms.filter(r => r.status === RoomStatus.CLEANING).length, color: 'bg-primary' },
              { label: 'Bảo trì', count: filteredRooms.filter(r => r.status === RoomStatus.MAINTENANCE).length, color: 'bg-maintenance' },
            ].map((status, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span className="text-sm text-slate-600 font-medium">{status.label}</span>
                </div>
                <span className="text-sm font-bold text-text-main">{status.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-border-light">
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiến độ lấp đầy</span>
               <span className="text-xs font-bold text-primary">{(stats.occupiedRooms / stats.totalRooms * 100).toFixed(0)}%</span>
             </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${(stats.occupiedRooms / stats.totalRooms * 100)}%` }}
                 className="h-full bg-primary" 
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  ); };

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const renderBookings = () => {
    const filteredBookings = bookings.filter(b => !selectedBranchId || b.branchId === selectedBranchId);
    
    return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex items-center justify-between border-b border-border-light pb-6 -mt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Danh sách đặt phòng</h1>
          <p className="text-slate-500 text-sm">Quản lý lịch trình khách đến và đi.</p>
        </div>
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus size={16} /> Đặt mới
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white border border-border-light rounded-2xl p-6 shadow-sm hover:border-primary transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                  {booking.guestName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{booking.guestName}</h4>
                  <p className="text-[11px] text-slate-400">{booking.guestEmail}</p>
                </div>
              </div>
              <span className={`status-badge-modern ${
                booking.status === BookingStatus.CHECKED_IN ? 'badge-occupied' : 'badge-available'
              }`}>
                {booking.status === BookingStatus.CHECKED_IN ? 'Đã nhận phòng' : 'Đã đặt phòng'}
              </span>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Số phòng:</span>
                <span className="font-bold text-primary">Phòng {rooms.find(r => r.id === booking.roomId)?.number}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Khách hàng:</span>
                <span className="font-bold text-text-main">{booking.guestPhone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Lịch trình:</span>
                <div className="text-right">
                  <div className="font-bold text-text-main flex items-center justify-end gap-1">
                    {booking.checkIn} <ArrowRight size={10} className="text-slate-300" /> {booking.checkOut}
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase">
                    Ở {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24))} đêm
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Tổng thanh toán</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-text-main">{formatCurrency(booking.totalPrice)}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${booking.paidAmount >= booking.totalPrice ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {booking.paidAmount >= booking.totalPrice ? 'Đã thu đủ' : `Còn lại ${formatCurrency(booking.totalPrice - booking.paidAmount)}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {booking.status === BookingStatus.CONFIRMED && (
                  <button 
                    onClick={() => {
                      setCheckInBooking(booking);
                      setIsCheckInConfirmModalOpen(true);
                    }}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <CheckSquare size={12} />
                    Nhận phòng
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedBookingDetails(booking);
                    setIsDetailModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  Chi tiết <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ); };

  const renderGuests = () => (
    <div className="space-y-8 pb-32 lg:pb-0">
      <header className="flex items-center justify-between border-b border-border-light pb-6 -mt-2">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-tight">Quản lý khách hàng</h1>
          <p className="text-slate-500 text-sm">Danh sách khách hàng đã từng lưu trú.</p>
        </div>
        <button 
          onClick={() => openGuestModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={18} /> Thêm khách hàng
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guests.map((guest) => (
          <div key={guest.id} className="bg-white border border-border-light rounded-[32px] p-6 shadow-sm hover:border-primary transition-all group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black text-2xl border border-slate-100">
                {guest.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-text-main truncate text-lg leading-tight">{guest.name}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{guest.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Lượt đặt</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-text-main">{guest.totalBookings}</span>
                  <span className="text-[10px] font-bold text-slate-400 lowercase">lần</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Lần cuối</p>
                <p className="text-xs font-bold text-text-main truncate">{guest.lastVisit}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedGuest(guest);
                  setIsGuestDetailModalOpen(true);
                }}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                Chi tiết
              </button>
              <button 
                onClick={() => openGuestModal(guest)}
                className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 hover:text-primary hover:border-primary transition-all active:scale-95"
              >
                <Edit size={16} />
              </button>
              <button 
                onClick={() => deleteGuest(guest.id)}
                className="p-3 bg-white text-slate-400 rounded-2xl border border-slate-200 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLedger = () => {
    const filteredTransactions = transactions.filter(t => !selectedBranchId || t.branchId === selectedBranchId);
    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
      <div className="space-y-8 pb-32 lg:pb-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6 -mt-2">
          <div>
            <h1 className="text-2xl font-bold text-text-main uppercase tracking-tight">Sổ quỹ chi tiêu</h1>
            <p className="text-slate-500 text-sm">Theo dõi các khoản thu và chi của khách sạn.</p>
          </div>
          <button 
            onClick={() => openTransactionModal()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Thêm thu chi
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-border-light rounded-[32px] p-6 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng thu</p>
            <h3 className="text-2xl font-black text-emerald-600">{formatCurrency(totalIncome)}</h3>
          </div>
          <div className="bg-white border border-border-light rounded-[32px] p-6 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng chi</p>
            <h3 className="text-2xl font-black text-rose-600">{formatCurrency(totalExpense)}</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tồn quỹ</p>
            <h3 className="text-2xl font-black text-white">{formatCurrency(balance)}</h3>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="bg-white border border-border-light rounded-[32px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date}</span>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${
                  t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {t.type === TransactionType.INCOME ? 'Thu' : 'Chi'}
                </span>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-black text-text-main mb-1">{t.category}</h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">{t.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className={`text-lg font-black ${
                  t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openTransactionModal(t)}
                    className="p-3 text-slate-400 hover:text-primary transition-colors border border-slate-100 rounded-xl"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="p-3 text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="bg-white border border-border-light rounded-[32px] p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
              Chưa có giao dịch nào
            </div>
          )}
        </div>

        <div className="hidden md:block bg-white border border-border-light rounded-[32px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hạng mục</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diễn giải</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá trị</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{t.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${
                        t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {t.type === TransactionType.INCOME ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-text-main">{t.category}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{t.description}</td>
                    <td className={`px-6 py-4 text-sm font-black ${
                      t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openTransactionModal(t)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="bg-[#f2f4f7] min-h-screen pb-24 -mt-6 -mx-4 lg:-mx-6 lg:-mt-10 lg:pb-10">
      {/* Header Bar */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 mb-2 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
            <Bed size={24} className="stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">HotelKiot</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
            <RefreshCw size={22} className="stroke-[2.5]" />
          </button>
          <button className="bg-[#eaf4ff] text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/10">
            Nhiều hơn
          </button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white px-4 py-6 mb-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20 uppercase">
            {loggedInUser?.name.charAt(0) || accountData.displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{loggedInUser?.name || accountData.displayName}</h2>
            <p className="text-sm font-medium text-slate-400 capitalize">@{loggedInUser?.username || currentUser.toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full border border-slate-100 transition-colors">
            <UserRoundPen size={20} />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* Shop Info Row */}
      <button className="w-full bg-white px-4 py-5 mb-2 flex items-center justify-between border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
        <span className="text-lg font-bold">Thông tin cửa hàng</span>
        <ChevronRight size={20} className="text-slate-300" />
      </button>

      {/* Transaction Section */}
      <div className="bg-white px-5 py-6 mb-2 border-b border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Giao dịch & Quản lý</h3>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <button 
            onClick={() => setActiveTab('ledger')}
            className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <Wallet size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-700">Sổ quỹ</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tight">Thu / Chi</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('roomManagement')}
            className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <LayoutGrid size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Quản lý phòng</span>
          </button>
        </div>
      </div>

      {/* Account & Personnel Section */}
      <div className="bg-white px-5 py-6 mb-2 border-b border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Nhân sự & Tài khoản</h3>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4">
          <button 
            onClick={() => setIsAccountManagementModalOpen(true)}
            className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <UserCog size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Quản lý tài khoản</span>
          </button>
          <button className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Chấm công</span>
          </button>
          <button className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Nhân viên</span>
          </button>
          <button className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
              <Receipt size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Bảng lương</span>
          </button>
        </div>
      </div>

      {/* System Section */}
      <div className="bg-white px-5 py-6 mb-2 border-b border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Hệ thống</h3>
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 mb-6">
          <button 
            onClick={() => setIsBranchManagementModalOpen(true)}
            className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left"
          >
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
              <Database size={24} />
            </div>
            <span className="text-base font-bold text-slate-700">Quản lý cơ sở</span>
          </button>
        </div>
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-slate-600">Cấu hình API</span>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="Link Google Sheet..."
              />
              <button 
                onClick={handleSaveSettings}
                className="px-6 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                Lưu
              </button>
            </div>
            {saveStatus === 'success' && <p className="text-[10px] text-emerald-600 font-bold mt-2 ml-2">Đồng bộ thành công!</p>}
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-8 py-4 bg-rose-50 text-rose-500 rounded-full font-black text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );

  const renderRooms = () => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const filteredRooms = rooms.filter(r => !selectedBranchId || r.branchId === selectedBranchId);

    return (
      <div className="space-y-8 pb-20 lg:pb-0">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-light pb-6 -mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Sơ đồ phòng</h1>
            <p className="text-slate-500 text-sm">Quản lý và xem trạng thái phòng theo ngày.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { label: 'Hôm nay', offset: 0 },
                { label: 'Ngày mai', offset: 1 },
                { label: 'Ngày mốt', offset: 2 },
                { label: 'Ngày kia', offset: 3 }
              ].map((d) => {
                const date = new Date();
                date.setDate(date.getDate() + d.offset);
                const dateStr = date.toISOString().split('T')[0];
                const isActive = selectedDate === dateStr;
                
                return (
                  <button
                    key={d.offset}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                      isActive ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="relative flex items-center bg-white border border-border-light rounded-lg px-3 py-2 gap-2 shadow-sm">
              <Calendar size={16} className="text-primary" />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-bold text-text-main outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {rooms.map((room, i) => {
            // Logic tính toán trạng thái dựa trên ngày chọn
            let displayStatus = room.status;
            let currentBooking: Booking | undefined = undefined;
            
            currentBooking = bookings.find(b => 
              b.roomId === room.id && 
              selectedDate >= b.checkIn && 
              selectedDate <= b.checkOut &&
              (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.CHECKED_IN)
            );
            
            if (currentBooking) {
              displayStatus = RoomStatus.OCCUPIED;
            } else if (!isToday) {
              if (room.status === RoomStatus.MAINTENANCE) {
                displayStatus = RoomStatus.MAINTENANCE;
              } else {
                displayStatus = RoomStatus.AVAILABLE;
              }
            }

            return (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`room-card-modern ${displayStatus === RoomStatus.OCCUPIED ? 'border-l-4 border-l-occupied hover:border-l-primary hover:shadow-md cursor-pointer active:scale-95' : ''} ${displayStatus === RoomStatus.AVAILABLE ? 'hover:border-primary cursor-pointer active:scale-95' : 'cursor-default opacity-80'}`}
                onClick={() => {
                  if (displayStatus === RoomStatus.AVAILABLE) {
                    setPreSelectedRoomId(room.id);
                    setBookingCheckIn(selectedDate);
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setBookingCheckOut(nextDay.toISOString().split('T')[0]);
                    setIsBookingModalOpen(true);
                  } else if (displayStatus === RoomStatus.OCCUPIED && currentBooking) {
                    setSelectedBookingDetails(currentBooking);
                    setIsDetailModalOpen(true);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-text-main leading-tight">{room.number}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">{translateRoomType(room.type)}</p>
                  </div>
                  <div className={`status-badge-modern ${getStatusColor(displayStatus)}`}>
                    {displayStatus === RoomStatus.OCCUPIED && currentBooking 
                      ? (currentBooking.status === BookingStatus.CONFIRMED ? 'Khách đặt' : 'Đã nhận phòng') 
                      : translateStatus(displayStatus)}
                  </div>
                </div>

                {displayStatus === RoomStatus.OCCUPIED && currentBooking && (
                  <div className="mt-2 space-y-2">
                    <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                      <div className="font-bold text-text-main truncate mb-0.5">{currentBooking.guestName}</div>
                      <div className="text-primary font-black flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                        Tới: {currentBooking.checkOut}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-slate-50 flex flex-col gap-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Giá</p>
                      <span className="text-sm font-bold text-text-main">{formatCurrency(room.pricePerNight)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">Tầng {room.floor}</span>
                  </div>

                  {displayStatus === RoomStatus.AVAILABLE && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreSelectedRoomId(room.id);
                        setBookingCheckIn(selectedDate);
                        const nextDay = new Date(selectedDate);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setBookingCheckOut(nextDay.toISOString().split('T')[0]);
                        setIsGuestArrived(true);
                        setIsBookingModalOpen(true);
                      }}
                      className="w-full mt-1 py-2 bg-slate-100 text-primary hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      Nhận Khách
                    </button>
                  )}

                  {displayStatus === RoomStatus.OCCUPIED && currentBooking?.status === BookingStatus.CONFIRMED && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckInBooking(currentBooking);
                        setIsCheckInConfirmModalOpen(true);
                      }}
                      className="w-full mt-1 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckSquare size={12} /> Nhận phòng
                    </button>
                  )}

                  {displayStatus === RoomStatus.OCCUPIED && (!currentBooking || currentBooking.status === BookingStatus.CHECKED_IN) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentBooking) {
                          setSelectedBookingDetails(currentBooking);
                          setIsDetailModalOpen(true);
                        } else {
                          const nextDay = new Date(selectedDate);
                          nextDay.setDate(nextDay.getDate() + 1);
                          const dummyBooking: Booking = {
                            id: `b${Date.now()}`,
                            roomId: room.id,
                            branchId: room.branchId,
                            guestName: '',
                            guestEmail: '',
                            guestPhone: '',
                            checkIn: selectedDate,
                            checkOut: nextDay.toISOString().split('T')[0],
                            status: BookingStatus.CONFIRMED,
                            totalPrice: room.pricePerNight,
                            paidAmount: 0,
                            guestsCount: 1,
                          };
                          setCheckInBooking(dummyBooking);
                          setIsCheckInConfirmModalOpen(true);
                        }
                      }}
                      className={`w-full mt-1 py-2 ${currentBooking ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'} text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5`}
                    >
                      {currentBooking ? 'Xem & Trả phòng' : <><CheckSquare size={12} /> Nhận phòng</>}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl shadow-primary/5 border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
            <Bed size={40} className="stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase mb-2">Hệ thống quản lý</h1>
          <p className="text-slate-400 font-medium tracking-wide">Đăng nhập để tiếp tục công việc</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tên đăng nhập</label>
              <div className="relative">
                <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-border-light rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  placeholder="admin hoặc staff"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Mật khẩu</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-border-light rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>
          </div>

          {loginError && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-bold text-rose-500 flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {loginError}
            </motion.div>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all transform"
          >
            Đăng nhập hệ thống
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hotel Management System v2.0</p>
        </div>
      </motion.div>
    </div>
  );

  if (!isAuthenticated) return renderLogin();

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm hidden md:block"
              onClick={closeBookingModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full h-full lg:h-auto md:max-h-[90vh] md:max-w-xl bg-white md:rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar md:border border-border-light"
            >
              <div className="p-6 md:p-8 space-y-6">
                <header className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 md:py-0">
                  <div>
                    <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{editingBookingId ? 'Cập nhật đặt phòng' : 'Tạo đặt phòng mới'}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Ghi chú thông tin khách hàng và lịch trình</p>
                  </div>
                  <button 
                    onClick={closeBookingModal}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </header>

                <div className="space-y-6">
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tìm hoặc nhập tên khách</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all mt-1.5" 
                      placeholder="Tên khách hàng"
                      value={guestSearch}
                      onChange={(e) => {
                        setGuestSearch(e.target.value);
                        setShowSearchResults(true);
                      }}
                    />
                    {showSearchResults && guestSearch.length > 0 && (
                      <div className="absolute z-[110] w-full mt-2 bg-white border border-border-light rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {guests.filter(g => 
                          g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                          g.phone?.includes(guestSearch)
                        ).map(g => (
                          <div 
                            key={g.id}
                            className="px-5 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none group"
                            onClick={() => {
                              setGuestSearch(g.name);
                              setGuestEmail(g.email);
                              setGuestPhone(g.phone || '');
                              setGuestAddress(g.address || '');
                              setShowSearchResults(false);
                            }}
                          >
                            <div className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{g.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{g.phone} • {g.email}</div>
                          </div>
                        ))}
                        <div 
                          className="px-5 py-3 text-xs text-primary font-black uppercase tracking-widest hover:bg-primary/5 cursor-pointer"
                          onClick={() => setShowSearchResults(false)}
                        >
                          + Sử dụng tên: "{guestSearch}"
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                        placeholder="09xx xxx xxx" 
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                        placeholder="khach@email.com" 
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                    <input 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                      placeholder="Số nhà, đường, tỉnh thành..." 
                      value={guestAddress}
                      onChange={(e) => setGuestAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giấy tờ tùy thân (CCCD / Passport)</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                        placeholder="Nhập số giấy tờ" 
                        value={currentIdCard}
                        onChange={(e) => setCurrentIdCard(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentIdCard.trim()) {
                            e.preventDefault();
                            if (!guestIdCards.includes(currentIdCard.trim())) {
                              setGuestIdCards([...guestIdCards, currentIdCard.trim()]);
                            }
                            setCurrentIdCard('');
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (currentIdCard.trim() && !guestIdCards.includes(currentIdCard.trim())) {
                            setGuestIdCards([...guestIdCards, currentIdCard.trim()]);
                          }
                          setCurrentIdCard('');
                        }}
                        className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                      >
                        Thêm
                      </button>
                    </div>
                    {guestIdCards.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {guestIdCards.map((card, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-black">
                            {card}
                            <button 
                              type="button"
                              onClick={() => setGuestIdCards(guestIdCards.filter((_, i) => i !== idx))}
                              className="text-rose-500 hover:scale-110 transition-transform"
                            >
                              <Plus size={14} className="rotate-45" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chọn phòng</label>
                    <div className="relative">
                      <select 
                        value={preSelectedRoomId || ''}
                        onChange={(e) => setPreSelectedRoomId(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                      >
                        <option value="" disabled>Chọn phòng trống...</option>
                        {rooms.filter(r => r.status === RoomStatus.AVAILABLE || r.id === preSelectedRoomId).map(room => (
                          <option key={room.id} value={room.id}>
                            Phòng {room.number} — {translateRoomType(room.type)} ({formatCurrency(room.pricePerNight)})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Package size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày đặt</label>
                      <input 
                        type="date" 
                        value={bookingDateState}
                        onChange={(e) => setBookingDateState(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày nhận phòng</label>
                      <input 
                        type="date" 
                        value={bookingCheckIn}
                        onChange={(e) => setBookingCheckIn(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày trả phòng</label>
                      <input 
                        type="date" 
                        value={bookingCheckOut}
                        onChange={(e) => setBookingCheckOut(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer" onClick={() => setIsGuestArrived(!isGuestArrived)}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isGuestArrived ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                      <CheckSquare size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-main">Khách đã đến nhận phòng</p>
                      <p className="text-[10px] font-bold text-slate-400">Nếu bỏ chọn, đặt phòng sẽ lưu ở trạng thái "Đã đặt"</p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 rounded-[32px] space-y-4 shadow-xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Tổng tiền dự kiến</span>
                      <span className="text-white text-base">
                        {(() => {
                          const room = rooms.find(r => r.id === preSelectedRoomId);
                          let nights = Math.ceil((new Date(bookingCheckOut || bookingCheckIn).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 3600 * 24));
                          if (nights < 1) nights = 1;
                          return formatCurrency((room?.pricePerNight || 0) * nights);
                        })()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1">Số tiền đặt cọc trước (VND)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(Number(e.target.value))}
                          className="w-full px-5 py-4 bg-white/10 border border-white/10 rounded-2xl text-lg font-black text-primary outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-600"
                          placeholder="0"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 tracking-widest">VND</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-6 md:-mx-8 px-6 md:px-8 pb-4 flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={closeBookingModal}
                    className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleSaveBooking}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                  >
                    {editingBookingId ? 'Cập nhật' : 'Xác nhận đặt phòng'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedBookingDetails && (
          <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm hidden md:block"
              onClick={() => setIsDetailModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full h-full lg:h-auto md:max-h-[90vh] md:max-w-lg bg-white md:rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar md:border border-border-light"
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 md:py-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-text-main">Chi tiết đặt phòng</h3>
                      <button 
                        onClick={() => {
                          setEditingBookingId(selectedBookingDetails.id);
                          setGuestSearch(selectedBookingDetails.guestName);
                          setGuestPhone(selectedBookingDetails.guestPhone);
                          setGuestEmail(selectedBookingDetails.guestEmail);
                          setGuestAddress(selectedBookingDetails.guestAddress || '');
                          setPreSelectedRoomId(selectedBookingDetails.roomId);
                          setBookingCheckIn(selectedBookingDetails.checkIn);
                          setBookingCheckOut(selectedBookingDetails.checkOut);
                          setBookingDateState(selectedBookingDetails.bookingDate || new Date().toISOString().split('T')[0]);
                          setIsGuestArrived(selectedBookingDetails.status === BookingStatus.CHECKED_IN);
                          setPaidAmount(selectedBookingDetails.paidAmount);
                          setGuestIdCards(selectedBookingDetails.guestIdCards || []);
                          setIsDetailModalOpen(false);
                          setIsBookingModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold"
                        title="Sửa đặt phòng"
                      >
                        <Edit size={14} /> Sửa thông tin
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã đặt phòng #{selectedBookingDetails.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                      Phòng {rooms.find(r => r.id === selectedBookingDetails.roomId)?.number}
                    </div>
                    <button 
                      onClick={() => setIsDetailModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                    >
                      <Plus size={24} className="rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
                      {selectedBookingDetails.guestName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main text-lg">{selectedBookingDetails.guestName}</h4>
                      <p className="text-sm text-slate-500 font-bold tracking-tight">{selectedBookingDetails.guestPhone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-3xl bg-white shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Ngày đến</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.checkIn}</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-3xl bg-white shadow-sm">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Ngày đi</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.checkOut}</p>
                    </div>
                  </div>

                  {selectedBookingDetails.guestAddress && (
                    <div className="p-4 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Địa chỉ</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.guestAddress}</p>
                    </div>
                  )}

                  {selectedBookingDetails.guestIdCards && selectedBookingDetails.guestIdCards.length > 0 && (
                    <div className="p-4 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Danh sách CCCD / Passport</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedBookingDetails.guestIdCards.map((card, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200">
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-6 bg-slate-900 rounded-[32px] space-y-4 shadow-xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Tổng thanh toán</span>
                      <span className="text-white text-sm">{formatCurrency(selectedBookingDetails.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Đã đặt cọc</span>
                      <span className="text-emerald-400 text-sm">{formatCurrency(selectedBookingDetails.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Còn lại</span>
                      <span className="text-2xl font-black text-primary">
                        {formatCurrency(selectedBookingDetails.totalPrice - selectedBookingDetails.paidAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 py-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Trạng thái</span>
                    <div className="flex items-center gap-2">
                      <span className={`status-badge-modern ${selectedBookingDetails.status === BookingStatus.CHECKED_IN ? 'badge-occupied' : 'bg-slate-200 text-slate-600'}`}>
                        {selectedBookingDetails.status === BookingStatus.CHECKED_IN ? 'Đã nhận phòng' : 'Đã đặt phòng'}
                      </span>
                      {selectedBookingDetails.status === BookingStatus.CONFIRMED && (
                        <button 
                          onClick={() => {
                            setCheckInBooking(selectedBookingDetails);
                            setIsCheckInConfirmModalOpen(true);
                          }}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                          <CheckSquare size={12} />
                          Nhận phòng
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedBookingDetails.status === BookingStatus.CHECKED_IN && (
                    <div className="p-6 border border-primary/20 bg-primary/5 rounded-[32px] space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <Package size={14} /> Dịch vụ phát sinh
                        </h4>
                        <button 
                          onClick={() => setIsServiceModalOpen(true)}
                          className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          + Thêm dịch vụ
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedBookingDetails.services && selectedBookingDetails.services.length > 0 ? (
                          selectedBookingDetails.services.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                              <div>
                                <p className="text-xs font-black text-text-main">{s.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatCurrency(s.price)} × {s.quantity}</p>
                              </div>
                              <span className="text-xs font-black text-text-main">{formatCurrency(s.price * s.quantity)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chưa có dịch vụ nào được ghi nhận</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md -mx-6 md:-mx-8 px-6 md:px-8 pb-4">
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckInConfirmModalOpen && checkInBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsCheckInConfirmModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden p-8 border border-border-light"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare size={32} />
                </div>
                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Xác nhận nhận phòng</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vui lòng kiểm tra lại thông tin khách hàng</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">Tên khách</label>
                    <input 
                      type="text" 
                      value={checkInBooking.guestName}
                      onChange={(e) => setCheckInBooking({ ...checkInBooking, guestName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">Số điện thoại</label>
                    <input 
                      type="text" 
                      value={checkInBooking.guestPhone}
                      onChange={(e) => setCheckInBooking({ ...checkInBooking, guestPhone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block text-right">Phòng</label>
                    <div className="text-right mt-2 text-lg font-black text-primary">#{rooms.find(r => r.id === checkInBooking.roomId)?.number}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">Ngày vào</label>
                    <input 
                      type="date" 
                      value={checkInBooking.checkIn}
                      onChange={(e) => setCheckInBooking({ ...checkInBooking, checkIn: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-primary"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 block">Ngày ra</label>
                    <input 
                      type="date" 
                      value={checkInBooking.checkOut}
                      onChange={(e) => setCheckInBooking({ ...checkInBooking, checkOut: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-text-main outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Số tiền:</span>
                  <div className="flex items-center gap-1">
                    <input 
                      type="number" 
                      value={checkInBooking.totalPrice}
                      onChange={(e) => setCheckInBooking({ ...checkInBooking, totalPrice: Number(e.target.value) })}
                      className="w-32 bg-white border border-primary/20 rounded-xl px-3 py-2 text-lg font-black text-primary outline-none focus:border-primary text-right"
                    />
                    <span className="text-lg font-black text-primary">₫</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCheckInConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    const finalBooking = { ...checkInBooking, status: BookingStatus.CHECKED_IN };
                    if (bookings.some(b => b.id === checkInBooking.id)) {
                      setBookings(bookings.map(b => b.id === checkInBooking.id ? finalBooking : b));
                    } else {
                      setBookings([...bookings, finalBooking]);
                    }
                    setRooms(rooms.map(r => r.id === checkInBooking.roomId ? { ...r, status: RoomStatus.OCCUPIED } : r));
                    if (selectedBookingDetails && selectedBookingDetails.id === checkInBooking.id) {
                      setSelectedBookingDetails(finalBooking);
                    }
                    setIsCheckInConfirmModalOpen(false);
                    setIsDetailModalOpen(false);
                  }}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                >
                  Xác nhận nhận phòng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGuestModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsGuestModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <header>
                  <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">
                    {editingGuest ? 'Cập nhật thông tin khách' : 'Thêm khách hàng mới'}
                  </h2>
                  <p className="text-slate-500 text-sm font-bold">Điền đầy đủ thông tin bên dưới</p>
                </header>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                    <input 
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      placeholder="Nguyễn Văn A"
                      value={newGuestData.name}
                      onChange={(e) => setNewGuestData({...newGuestData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                      <input 
                        type="tel"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        placeholder="09xxx"
                        value={newGuestData.phone ?? ''}
                        onChange={(e) => setNewGuestData({...newGuestData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CCCD / Passport</label>
                      <input 
                        type="text"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        placeholder="Số định danh"
                        value={newGuestData.identityCard}
                        onChange={(e) => setNewGuestData({...newGuestData, identityCard: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input 
                      type="email"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      placeholder="email@address.com"
                      value={newGuestData.email}
                      onChange={(e) => setNewGuestData({...newGuestData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[100px]"
                      placeholder="Địa chỉ thường trú"
                      value={newGuestData.address}
                      onChange={(e) => setNewGuestData({...newGuestData, address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsGuestModalOpen(false)}
                    className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleGuestAction}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {editingGuest ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGuestDetailModalOpen && selectedGuest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsGuestDetailModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <header className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-black">
                      {selectedGuest.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-text-main">{selectedGuest.name}</h2>
                      <p className="text-sm font-bold text-slate-400">Khách hàng #{selectedGuest.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsGuestDetailModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </header>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                    <p className="font-bold text-text-main">{selectedGuest.phone}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lượt đặt phòng</p>
                    <p className="font-bold text-text-main">{selectedGuest.totalBookings} lần</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CCCD / ID Card</p>
                    <p className="font-bold text-text-main">{selectedGuest.identityCard || 'Chưa có'}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lần cuối ghé thăm</p>
                    <p className="font-bold text-text-main">{selectedGuest.lastVisit}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="font-bold text-text-main">{selectedGuest.email || 'Chưa có'}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Địa chỉ</p>
                    <p className="font-bold text-text-main">{selectedGuest.address || 'Chưa có'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} /> Lịch sử đặt phòng
                  </h3>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {bookings.filter(b => b.guestPhone === selectedGuest.phone).map((b, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-bold text-text-main">Phòng {rooms.find(r => r.id === b.roomId)?.number}</p>
                            <p className="text-[10px] font-medium text-slate-400">{b.checkIn} - {b.checkOut}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-primary">{formatCurrency(b.totalPrice)}</p>
                            <span className="text-[9px] font-black uppercase text-emerald-500">Thành công</span>
                         </div>
                      </div>
                    ))}
                    {bookings.filter(b => b.guestPhone === selectedGuest.phone).length === 0 && (
                      <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">Chưa có lịch sử đặt phòng</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                   <button 
                    onClick={() => {
                        setIsGuestDetailModalOpen(false);
                        openGuestModal(selectedGuest);
                    }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                   >
                     Chỉnh sửa hồ sơ
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-[240px] bg-white border-r border-border-light flex-col sticky top-0 h-screen">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg">H</div>
            <span className="text-lg font-black text-primary tracking-tighter uppercase leading-none">DIGITEL</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {(['dashboard', 'rooms', 'roomManagement', 'bookings', 'guests', 'ledger', 'settings'] as const).filter(tab => {
            if (currentUser === UserRole.STAFF && (tab === 'dashboard' || tab === 'settings' || tab === 'roomManagement' || tab === 'ledger')) return false;
            return true;
          }).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`nav-link w-full ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'dashboard' && <BarChart3 size={18} />}
              {tab === 'rooms' && <Bed size={18} />}
              {tab === 'roomManagement' && <LayoutGrid size={18} />}
              {tab === 'bookings' && <Calendar size={18} />}
              {tab === 'guests' && <Users size={18} />}
              {tab === 'ledger' && <Wallet size={18} />}
              {tab === 'settings' && <Settings size={18} />}
              <span className="capitalize">
                {tab === 'dashboard' ? 'Tổng quan' : 
                 tab === 'rooms' ? 'Sơ đồ phòng' :
                 tab === 'roomManagement' ? 'Quản lý phòng' :
                 tab === 'bookings' ? 'Đặt phòng' :
                 tab === 'guests' ? 'Khách hàng' : 
                 tab === 'ledger' ? 'Sổ quỹ' : 'Cài đặt'}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-border-light">
          <div className="hidden lg:flex flex-col gap-4 mb-6">
            <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
              <button 
                onClick={() => {
                  setCurrentUser(UserRole.ADMIN);
                  setActiveTab('dashboard');
                }}
                className={`flex-1 py-1 px-2 rounded-full text-[10px] font-black transition-all ${currentUser === UserRole.ADMIN ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                ADMIN
              </button>
              <button 
                onClick={() => {
                  setCurrentUser(UserRole.STAFF);
                  setActiveTab('rooms');
                }}
                className={`flex-1 py-1 px-2 rounded-full text-[10px] font-black transition-all ${currentUser === UserRole.STAFF ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                STAFF
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                {loggedInUser?.name.charAt(0) || (currentUser === UserRole.ADMIN ? 'AD' : 'ST')}
              </div>
              <div>
                <p className="text-xs font-bold text-text-main">{loggedInUser?.name || (currentUser === UserRole.ADMIN ? 'Quản trị viên' : 'Nhân viên')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-available"></div>
                  <p className="text-[10px] text-available font-bold uppercase tracking-widest">Đang trực</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-medium border border-transparent hover:border-rose-100/50 hover:bg-rose-50 rounded-2xl"
          >
            <LogOut size={18} />
            <span className="hidden lg:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-slate-100 p-1 flex items-center justify-around z-50 shadow-[0_-2px_15px_rgba(0,0,0,0.06)] h-[72px]">
        {(['dashboard', 'rooms', 'bookings', 'guests', 'settings'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all rounded-2xl ${
                isActive ? 'text-primary bg-primary/5' : 'text-slate-400'
              }`}
            >
              {tab === 'dashboard' && <BarChart3 size={24} className={isActive ? 'stroke-[2.5]' : ''} />}
              {tab === 'rooms' && <Bed size={24} className={isActive ? 'stroke-[2.5]' : ''} />}
              {tab === 'bookings' && <Calendar size={24} className={isActive ? 'stroke-[2.5]' : ''} />}
              {tab === 'guests' && <Users size={24} className={isActive ? 'stroke-[2.5]' : ''} />}
              {tab === 'settings' && <Menu size={24} className={isActive ? 'stroke-[2.5]' : ''} />}
              <span className={`text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                {tab === 'dashboard' ? 'Tổng quan' : 
                 tab === 'rooms' ? 'Sơ đồ' :
                 tab === 'bookings' ? 'Đặt phòng' :
                 tab === 'guests' ? 'Khách hàng' : 'Nhiều hơn'}
              </span>
            </button>
          );
        })}
      </nav>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full max-w-full">
        {/* Branch Selector Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 pt-2">
          <div>
             <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase">
               {activeTab === 'dashboard' ? 'Báo cáo tổng quan' : 
                activeTab === 'rooms' ? 'Sơ đồ phòng thực tế' :
                activeTab === 'roomManagement' ? 'Quản lý danh mục phòng' :
                activeTab === 'bookings' ? 'Danh sách đặt phòng' :
                activeTab === 'guests' ? 'Hồ sơ khách hàng' : 
                activeTab === 'ledger' ? 'Sổ thu chi' : 'Cài đặt hệ thống'}
             </h1>
             <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">
               {selectedBranchId 
                 ? branches.find(b => b.id === selectedBranchId)?.name 
                 : 'Tất cả các cơ sở trong hệ thống'}
             </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm">
            <button 
              onClick={() => setSelectedBranchId(null)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedBranchId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Tổng thể
            </button>
            {branches.map(branch => (
              <button 
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranchId === branch.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {branch.name.split('-')[1]?.trim() || branch.name}
              </button>
            ))}
          </div>
        </div>

        <header className="flex justify-between items-center mb-8 gap-4">
          <div className="lg:hidden flex items-center bg-slate-100 rounded-full p-1 border border-slate-200">
            <button 
              onClick={() => {
                setCurrentUser(UserRole.ADMIN);
                setActiveTab('dashboard');
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${currentUser === UserRole.ADMIN ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
            >
              ADMIN
            </button>
            <button 
              onClick={() => {
                setCurrentUser(UserRole.STAFF);
                setActiveTab('rooms');
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${currentUser === UserRole.STAFF ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
            >
              STAFF
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="lg:hidden p-2 text-rose-500 hover:bg-rose-50 rounded-full border border-border-light"
          >
            <LogOut size={18} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'rooms' && renderRooms()}
            {activeTab === 'roomManagement' && renderRoomManagement()}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'guests' && renderGuests()}
            {activeTab === 'ledger' && renderLedger()}
            {activeTab === 'settings' && renderSettings()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Room Modal (Add/Edit) */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeRoomModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">
                    {editingRoom ? 'Cập nhật phòng' : 'Thêm phòng mới'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {editingRoom ? `Đang chỉnh sửa phòng ${editingRoom.number}` : 'Nhập thông tin cho phòng mới'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Số phòng</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                        placeholder="VD: 101" 
                        value={newRoomData.number}
                        onChange={(e) => setNewRoomData({...newRoomData, number: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tầng</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                        placeholder="1" 
                        value={newRoomData.floor}
                        onChange={(e) => setNewRoomData({...newRoomData, floor: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Loại phòng</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
                      value={newRoomData.type}
                      onChange={(e) => setNewRoomData({...newRoomData, type: e.target.value as RoomType})}
                    >
                      {Object.values(RoomType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Giá mỗi đêm (VND)</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-primary" 
                      placeholder="0" 
                      value={newRoomData.pricePerNight}
                      onChange={(e) => setNewRoomData({...newRoomData, pricePerNight: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cơ sở vận hành</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
                      value={newRoomData.branchId}
                      onChange={(e) => setNewRoomData({...newRoomData, branchId: e.target.value})}
                    >
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Trạng thái ban đầu</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none transition-all"
                      value={newRoomData.status}
                      onChange={(e) => setNewRoomData({...newRoomData, status: e.target.value as RoomStatus})}
                    >
                      {Object.values(RoomStatus).map(status => (
                        <option key={status} value={status}>{translateStatus(status)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={closeRoomModal}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleRoomAction}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                  >
                    {editingRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <header>
                  <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">
                    {editingTransaction ? 'Cập nhật thu chi' : 'Thêm thu chi mới'}
                  </h2>
                  <p className="text-slate-500 text-sm font-bold">Ghi nhận thông tin giao dịch tài chính</p>
                </header>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setNewTransactionData({...newTransactionData, type: TransactionType.INCOME})}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        newTransactionData.type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                      }`}
                    >
                      Khoản Thu
                    </button>
                    <button 
                      onClick={() => setNewTransactionData({...newTransactionData, type: TransactionType.EXPENSE})}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        newTransactionData.type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      Khoản Chi
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số tiền (VND)</label>
                    <input 
                      type="number"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      placeholder="0"
                      value={newTransactionData.amount}
                      onChange={(e) => setNewTransactionData({...newTransactionData, amount: Number(e.target.value)})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hạng mục</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                        value={newTransactionData.category}
                        onChange={(e) => setNewTransactionData({...newTransactionData, category: e.target.value})}
                      >
                        <option value="Phòng">Tiền phòng</option>
                        <option value="Dịch vụ">Dịch vụ khách hàng</option>
                        <option value="Điện nước">Điện & Nước</option>
                        <option value="Lương">Lương nhân viên</option>
                        <option value="Vật tư">Mua sắm vật tư</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngày giao dịch</label>
                      <input 
                        type="date"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        value={newTransactionData.date}
                        onChange={(e) => setNewTransactionData({...newTransactionData, date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phương thức thanh toán</label>
                    <select 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none"
                        value={newTransactionData.paymentMethod}
                        onChange={(e) => setNewTransactionData({...newTransactionData, paymentMethod: e.target.value})}
                      >
                        <option value="Tiền mặt">Tiền mặt</option>
                        <option value="Chuyển khoản">Chuyển khoản</option>
                        <option value="Thẻ">Quẹt thẻ</option>
                      </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diễn giải</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all min-h-[80px]"
                      placeholder="Chi tiết về khoản thu chi này..."
                      value={newTransactionData.description}
                      onChange={(e) => setNewTransactionData({...newTransactionData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsTransactionModalOpen(false)}
                    className="flex-1 py-4 bg-white text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleTransactionAction}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {editingTransaction ? 'Lưu thay đổi' : 'Ghi nhận'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBranchManagementModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-stretch md:items-center justify-center md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm hidden md:block"
              onClick={() => {
                setIsBranchManagementModalOpen(false);
                setEditingBranch(null);
                setNewBranchFormData({ name: '', address: '' });
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="relative w-full h-full lg:h-auto md:max-h-[90vh] md:max-w-2xl bg-white md:rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar md:border border-border-light flex flex-col"
            >
              <div className="p-6 md:p-8 space-y-6 flex-1">
                <header className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 md:py-0">
                  <div>
                    <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Quản lý cơ sở</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hệ thống khách sạn & chi nhánh</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsBranchManagementModalOpen(false);
                      setEditingBranch(null);
                      setNewBranchFormData({ name: '', address: '' });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </header>

                <div className="space-y-8">
                  {/* List Branches */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách cơ sở ({branches.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {branches.map((branch) => (
                        <div key={branch.id} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-primary transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm bg-sky-500`}>
                              {branch.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-text-main line-clamp-1">{branch.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight line-clamp-1">{branch.address}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingBranch(branch);
                                setNewBranchFormData({
                                  name: branch.name,
                                  address: branch.address
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors hover:bg-white rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add/Edit Form */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                       {editingBranch ? 'Chỉnh sửa cơ sở' : '+ Thêm cơ sở mới'}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên cơ sở</label>
                        <input 
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                          placeholder="Digitel Cơ sở 1..." 
                          value={newBranchFormData.name}
                          onChange={(e) => setNewBranchFormData({...newBranchFormData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                        <input 
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                          placeholder="123 Đường ABC..." 
                          value={newBranchFormData.address}
                          onChange={(e) => setNewBranchFormData({...newBranchFormData, address: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                      {editingBranch && (
                        <button 
                          onClick={() => {
                            setEditingBranch(null);
                            setNewBranchFormData({ name: '', address: '' });
                          }}
                          className="flex-1 py-3.5 bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                        >
                          Hủy sửa
                        </button>
                      )}
                      <button 
                        onClick={handleSaveBranch}
                        className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                      >
                        {editingBranch ? 'Lưu thay đổi' : 'Tạo mới'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    setIsBranchManagementModalOpen(false);
                    setEditingBranch(null);
                    setNewBranchFormData({ name: '', address: '' });
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAccountManagementModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-stretch md:items-center justify-center md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm hidden md:block"
              onClick={() => {
                setIsAccountManagementModalOpen(false);
                setEditingUser(null);
                setNewUserFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="relative w-full h-full lg:h-auto md:max-h-[90vh] md:max-w-2xl bg-white md:rounded-[40px] shadow-2xl overflow-y-auto custom-scrollbar md:border border-border-light flex flex-col"
            >
              <div className="p-6 md:p-8 space-y-6 flex-1">
                <header className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-2 md:py-0">
                  <div>
                    <h3 className="text-xl font-black text-text-main uppercase tracking-tight">Quản lý tài khoản</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Danh sách nhân sự & quyền hạn</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAccountManagementModalOpen(false);
                      setEditingUser(null);
                      setNewUserFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden"
                  >
                    <Plus size={24} className="rotate-45" />
                  </button>
                </header>

                <div className="space-y-8">
                  {/* List Users */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh sách tài khoản ({users.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {users.map((user) => (
                        <div key={user.id} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:border-primary transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${user.role === UserRole.ADMIN ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black text-text-main">{user.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">@{user.username} • {user.role === UserRole.ADMIN ? 'Quản trị' : 'Nhân viên'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setNewUserFormData({
                                  name: user.name,
                                  username: user.username,
                                  password: '',
                                  role: user.role
                                });
                              }}
                              className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-white rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 transition-colors hover:bg-white rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add/Edit Form */}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                       {editingUser ? 'Chỉnh sửa tài khoản' : '+ Thêm tài khoản mới'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên hiển thị</label>
                        <input 
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                          placeholder="Nguyễn Văn A" 
                          value={newUserFormData.name}
                          onChange={(e) => setNewUserFormData({...newUserFormData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập</label>
                        <input 
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                          placeholder="username" 
                          value={newUserFormData.username}
                          onChange={(e) => setNewUserFormData({...newUserFormData, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</label>
                        <input 
                          type="password"
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                          placeholder="••••••••" 
                          value={newUserFormData.password}
                          onChange={(e) => setNewUserFormData({...newUserFormData, password: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quyền hạn</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none" 
                          value={newUserFormData.role}
                          onChange={(e) => setNewUserFormData({...newUserFormData, role: e.target.value as UserRole})}
                        >
                          <option value={UserRole.ADMIN}>Quản trị viên (Full Access)</option>
                          <option value={UserRole.STAFF}>Nhân viên (Limited Access)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                      {editingUser && (
                        <button 
                          onClick={() => {
                            setEditingUser(null);
                            setNewUserFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
                          }}
                          className="flex-1 py-3.5 bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                        >
                          Hủy sửa
                        </button>
                      )}
                      <button 
                        onClick={handleSaveUser}
                        className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                      >
                        {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    setIsAccountManagementModalOpen(false);
                    setEditingUser(null);
                    setNewUserFormData({ name: '', username: '', password: '', role: UserRole.STAFF });
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                >
                  Đóng quản lý tài khoản
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsServiceModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <header>
                  <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Chọn dịch vụ</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sử dụng cho phòng {rooms.find(r => r.id === selectedBookingDetails?.roomId)?.number}</p>
                </header>

                {serviceForm ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên dịch vụ</label>
                      <input 
                        className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-500 outline-none" 
                        value={serviceForm.name}
                        readOnly
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số lượng</label>
                      <div className="flex items-center gap-4">
                        <button 
                          className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                          onClick={() => setServiceForm({...serviceForm, quantity: Math.max(1, serviceForm.quantity - 1)})}
                        >
                          <Minus size={20} />
                        </button>
                        <span className="text-xl font-black text-text-main flex-1 text-center">{serviceForm.quantity}</span>
                        <button 
                          className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                          onClick={() => setServiceForm({...serviceForm, quantity: serviceForm.quantity + 1})}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá (VND)</label>
                      <input 
                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all" 
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({...serviceForm, price: Number(e.target.value)})}
                      />
                    </div>
                    
                    <div className="pt-2 flex gap-3">
                      <button 
                        onClick={() => setServiceForm(null)}
                        className="flex-1 py-3.5 bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                      >
                        Quay lại
                      </button>
                      <button 
                        onClick={() => {
                          addServiceToBooking(serviceForm.name, serviceForm.price, serviceForm.quantity);
                          setServiceForm(null);
                          setIsServiceModalOpen(false);
                        }}
                        className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                      >
                        Thêm ({formatCurrency(serviceForm.price * serviceForm.quantity)})
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {availableServices.map((service, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            setServiceForm({ name: service.name, price: service.price, quantity: 1 });
                          }}
                          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <div className="text-left">
                            <p className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{service.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{formatCurrency(service.price)} / đơn vị</p>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Plus size={16} />
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={() => setIsServiceModalOpen(false)}
                        className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}
