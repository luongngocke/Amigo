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
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, RoomStatus, Booking, Guest, DashboardStats, BookingStatus, RoomType, UserRole } from './types';
import { MOCK_ROOMS, MOCK_BOOKINGS, MOCK_GUESTS } from './mockData';

type Tab = 'dashboard' | 'rooms' | 'bookings' | 'guests' | 'settings' | 'roomManagement';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserRole>(UserRole.ADMIN);
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [guests, setGuests] = useState<Guest[]>(MOCK_GUESTS);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState<string | null>(null);
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
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({
    number: '',
    type: RoomType.SINGLE,
    pricePerNight: 0,
    floor: 1,
    status: RoomStatus.AVAILABLE
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: MOCK_ROOMS.length,
    occupiedRooms: MOCK_ROOMS.filter(r => r.status === RoomStatus.OCCUPIED).length,
    expectedArrivals: 3,
    expectedDepartures: 1,
    dailyRevenue: 4550000,
    monthlyRevenue: 125400000
  });

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

  const handleCreateBooking = () => {
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
    } else {
      setGuests(guests.map(g => g.id === existingGuest.id ? { ...g, totalBookings: g.totalBookings + 1, lastVisit: bookingCheckIn } : g));
    }

    // 2. Create Booking
    const selectedRoom = rooms.find(r => r.id === preSelectedRoomId);
    const nights = Math.ceil((new Date(bookingCheckOut).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 3600 * 24)) || 1;
    
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      roomId: preSelectedRoomId,
      guestName: guestSearch,
      guestEmail: guestEmail,
      guestPhone: guestPhone,
      guestAddress: guestAddress,
      checkIn: bookingCheckIn,
      checkOut: bookingCheckOut,
      status: BookingStatus.CONFIRMED,
      totalPrice: (selectedRoom?.pricePerNight || 0) * nights,
      paidAmount: paidAmount,
      guestIdCards: guestIdCards,
      guestsCount: guestIdCards.length > 0 ? guestIdCards.length : 1
    };

    setBookings([newBooking, ...bookings]);
    
    // 3. Update Room status
    setRooms(rooms.map(r => r.id === preSelectedRoomId ? { ...r, status: RoomStatus.OCCUPIED } : r));

    // Reset and Close
    setIsBookingModalOpen(false);
    setGuestSearch('');
    setGuestEmail('');
    setGuestPhone('');
    setGuestAddress('');
    setPaidAmount(0);
    setGuestIdCards([]);
    setCurrentIdCard('');
    setPreSelectedRoomId(null);
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
            {rooms.map((room) => (
              <div key={room.id} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-text-main">Phòng {room.number}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{room.type} • Tầng {room.floor}</p>
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số phòng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại phòng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tầng</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá / Đêm</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50 transition-colors">
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
      case RoomStatus.OCCUPIED: return 'Có khách';
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

  const renderDashboard = () => (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="border-b border-border-light pb-6 -mt-2">
        <h1 className="text-2xl font-bold text-text-main">Tổng quan</h1>
        <p className="text-slate-500 text-sm">Chào mừng trở lại. Đây là tình hình hôm nay.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tỉ lệ lấp đầy', value: `${(stats.occupiedRooms / stats.totalRooms * 100).toFixed(0)}%`, icon: <Bed />, color: 'text-primary' },
          { label: 'Doanh thu ngày', value: formatCurrency(stats.dailyRevenue), icon: <TrendingUp />, color: 'text-emerald-600' },
          { label: 'Dự kiến đến', value: stats.expectedArrivals.toString(), icon: <UserCheck />, color: 'text-amber-600' },
          { label: 'Doanh thu tháng', value: formatCurrency(stats.monthlyRevenue), icon: <CreditCard />, color: 'text-slate-600' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-box flex items-start justify-between"
          >
            <div>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
            <div className={`${stat.color} opacity-80`}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 20 })}
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
            {bookings.map((booking, i) => (
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
              { label: 'Sẵn sàng', count: rooms.filter(r => r.status === RoomStatus.AVAILABLE).length, color: 'bg-available' },
              { label: 'Có khách', count: rooms.filter(r => r.status === RoomStatus.OCCUPIED).length, color: 'bg-occupied' },
              { label: 'Đang dọn', count: rooms.filter(r => r.status === RoomStatus.CLEANING).length, color: 'bg-primary' },
              { label: 'Bảo trì', count: rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length, color: 'bg-maintenance' },
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
  );

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const renderBookings = () => (
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
                {booking.status === BookingStatus.CHECKED_IN ? 'Đã nhận' : 'Chờ nhận'}
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
        ))}
      </div>
    </div>
  );

  const renderGuests = () => (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="border-b border-border-light pb-6 -mt-2">
        <h1 className="text-2xl font-bold text-text-main">Khách hàng</h1>
        <p className="text-slate-500 text-sm">Danh sách khách hàng đã từng lưu trú.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {guests.map((guest) => (
          <div key={guest.id} className="bg-white border border-border-light rounded-2xl p-6 flex items-center justify-between group shadow-sm hover:border-primary transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary font-bold text-lg">
                {guest.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-text-main">{guest.name}</h4>
                <p className="text-xs text-slate-500">{guest.phone} • {guest.address}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-main">{guest.totalBookings} lượt đ.</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{guest.lastVisit}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 max-w-2xl pb-20 lg:pb-0">
      <header className="border-b border-border-light pb-6 -mt-2">
        <h1 className="text-2xl font-bold text-text-main">Cài đặt hệ thống</h1>
        <p className="text-slate-500 text-sm">Kết nối dữ liệu và cấu hình khách sạn.</p>
      </header>

      <div className="bg-white border border-border-light rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="space-y-3">
          <label className="stat-label">Google Apps Script API URL</label>
          <input 
            type="text" 
            placeholder="Dán link script tại đây..."
            className="w-full px-4 py-3 bg-slate-50 border border-border-light rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 space-y-4">
          <h4 className="font-bold text-white flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400" /> Hướng dẫn kết nối Google Sheets
          </h4>
          <ol className="text-xs space-y-3 list-decimal pl-4 opacity-90 leading-relaxed font-medium">
            <li>Tạo một Google Sheet với 3 tab: <b>"Phòng"</b>, <b>"Đặt phòng"</b>, <b>"Khách hàng"</b>.</li>
            <li>Trong tab Phòng: Tiêu đề cột (Dòng 1): <code>id, số_phòng, loại, giá, trạng_thái, tầng</code></li>
            <li>Trong tab Đặt phòng: Tiêu đề cột: <code>id, phòng_id, tên_khách, email, điện_thoại, địa_chỉ, ngày_đến, ngày_đi, trạng_thái, tổng_tiền</code></li>
            <li>Trong tab Khách hàng: Tiêu đề cột: <code>id, tên, email, điện_thoại, địa_chỉ, cccd, tổng_lượt_đặt</code></li>
            <li>Vào menu <b>Tiện ích mở rộng &gt; Apps Script</b> và dán mã xử lý.</li>
            <li>Chọn <b>Triển khai &gt; Bản triển khai mới &gt; Ứng dụng web</b> (Quyền truy cập: "Bất kỳ ai").</li>
            <li>Dán URL nhận được vào ô phía trên.</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const renderRooms = () => {
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

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
                { label: 'Ngày mốt', offset: 2 }
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
            
            if (!isToday) {
              currentBooking = bookings.find(b => 
                b.roomId === room.id && 
                selectedDate >= b.checkIn && 
                selectedDate < b.checkOut
              );
              
              if (currentBooking) {
                displayStatus = RoomStatus.OCCUPIED;
              } else if (room.status === RoomStatus.MAINTENANCE) {
                displayStatus = RoomStatus.MAINTENANCE;
              } else {
                displayStatus = RoomStatus.AVAILABLE;
              }
            } else if (displayStatus === RoomStatus.OCCUPIED) {
              currentBooking = bookings.find(b => 
                b.roomId === room.id && 
                selectedDate >= b.checkIn && 
                selectedDate < b.checkOut
              );
            }

            return (
              <motion.div 
                key={room.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`room-card-modern ${displayStatus === RoomStatus.OCCUPIED ? 'border-l-4 border-l-occupied' : ''} ${displayStatus === RoomStatus.AVAILABLE ? 'hover:border-primary active:scale-95' : 'cursor-default opacity-80'}`}
                onClick={() => {
                  if (displayStatus === RoomStatus.AVAILABLE) {
                    setPreSelectedRoomId(room.id);
                    setBookingCheckIn(selectedDate);
                    const nextDay = new Date(selectedDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setBookingCheckOut(nextDay.toISOString().split('T')[0]);
                    setIsBookingModalOpen(true);
                  } else if (displayStatus === RoomStatus.OCCUPIED) {
                    const booking = bookings.find(b => 
                      b.roomId === room.id && 
                      selectedDate >= b.checkIn && 
                      selectedDate < b.checkOut
                    );
                    if (booking) {
                      setSelectedBookingDetails(booking);
                      setIsDetailModalOpen(true);
                    }
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-text-main leading-tight">{room.number}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">{translateRoomType(room.type)}</p>
                  </div>
                  <div className={`status-badge-modern ${getStatusColor(displayStatus)}`}>
                    {translateStatus(displayStatus)}
                  </div>
                </div>

                {displayStatus === RoomStatus.OCCUPIED && currentBooking && (
                  <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                    <div className="font-bold text-text-main truncate mb-0.5">{currentBooking.guestName}</div>
                    <div className="text-primary font-black flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                      Tới: {currentBooking.checkOut}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Giá</p>
                    <span className="text-sm font-bold text-text-main">{formatCurrency(room.pricePerNight)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300">Tầng {room.floor}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-bg font-sans">
      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsBookingModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-border-light flex flex-col max-h-[90vh]"
            >
              <div className="overflow-y-auto p-8 space-y-6">
                <h3 className="text-xl font-bold text-text-main">Tạo đặt phòng mới</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="stat-label">Tìm hoặc nhập tên khách</label>
                    <input 
                      className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="Tên khách hàng"
                      value={guestSearch}
                      onChange={(e) => {
                        setGuestSearch(e.target.value);
                        setShowSearchResults(true);
                      }}
                    />
                    {showSearchResults && guestSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border-light rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {guests.filter(g => 
                          g.name.toLowerCase().includes(guestSearch.toLowerCase()) || 
                          g.phone?.includes(guestSearch)
                        ).map(g => (
                          <div 
                            key={g.id}
                            className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none"
                            onClick={() => {
                              setGuestSearch(g.name);
                              setGuestEmail(g.email);
                              setGuestPhone(g.phone || '');
                              setGuestAddress(g.address || '');
                              setShowSearchResults(false);
                            }}
                          >
                            <div className="text-sm font-bold text-text-main">{g.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{g.phone} • {g.email}</div>
                          </div>
                        ))}
                        <div 
                          className="px-4 py-2 text-xs text-primary font-bold hover:bg-blue-50 cursor-pointer"
                          onClick={() => setShowSearchResults(false)}
                        >
                          + Thêm khách mới: "{guestSearch}"
                        </div>
                      </div>
                    )}
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="stat-label">Số điện thoại</label>
                    <input 
                      className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="Số điện thoại" 
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="stat-label">Email</label>
                    <input 
                      className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="địa chỉ email" 
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="stat-label">Địa chỉ</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                    placeholder="Địa chỉ thường trú" 
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="stat-label">Số căn cước công dân (CCCD)</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                      placeholder="Nhập số CCCD" 
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
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200"
                    >
                      Thêm
                    </button>
                  </div>
                  {guestIdCards.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {guestIdCards.map((card, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary border border-blue-100 rounded-full text-xs font-bold">
                          {card}
                          <button 
                            type="button"
                            onClick={() => setGuestIdCards(guestIdCards.filter((_, i) => i !== idx))}
                            className="hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="stat-label">Chọn phòng</label>
                  <select 
                    value={preSelectedRoomId || ''}
                    onChange={(e) => setPreSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none cursor-pointer focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>Chọn phòng...</option>
                    {rooms.filter(r => r.status === RoomStatus.AVAILABLE || r.id === preSelectedRoomId).map(room => (
                      <option key={room.id} value={room.id}>Phòng {room.number} - {translateRoomType(room.type)} ({formatCurrency(room.pricePerNight)})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="stat-label">Ngày đến</label>
                    <input 
                      type="date" 
                      value={bookingCheckIn}
                      onChange={(e) => setBookingCheckIn(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="stat-label">Ngày đi</label>
                    <input 
                      type="date" 
                      value={bookingCheckOut}
                      onChange={(e) => setBookingCheckOut(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng tiền dự kiến</label>
                    <span className="font-bold text-text-main">
                      {(() => {
                        const room = rooms.find(r => r.id === preSelectedRoomId);
                        const nights = Math.ceil((new Date(bookingCheckOut).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 3600 * 24)) || 1;
                        return formatCurrency((room?.pricePerNight || 0) * nights);
                      })()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền khách trả trước</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="w-full pl-4 pr-12 py-2 bg-white border border-border-light rounded-lg text-sm font-bold outline-none focus:ring-1 focus:ring-primary"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">VND</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Còn lại</label>
                    <span className="font-black text-primary">
                      {(() => {
                        const room = rooms.find(r => r.id === preSelectedRoomId);
                        const nights = Math.ceil((new Date(bookingCheckOut).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 3600 * 24)) || 1;
                        const total = (room?.pricePerNight || 0) * nights;
                        return formatCurrency(total - paidAmount);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
                <div className="flex gap-3 pt-6 sticky bottom-0 bg-white">
                  <button 
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-3 border border-border-light rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleCreateBooking}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                  >
                    Xác nhận đặt phòng
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedBookingDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsDetailModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-border-light"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-black text-text-main">Chi tiết đặt phòng</h3>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                    Phòng {rooms.find(r => r.id === selectedBookingDetails.roomId)?.number}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                      {selectedBookingDetails.guestName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main text-lg">{selectedBookingDetails.guestName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{selectedBookingDetails.guestPhone}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Ngày đến</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.checkIn}</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Ngày đi</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.checkOut}</p>
                    </div>
                  </div>

                  {selectedBookingDetails.guestAddress && (
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Địa chỉ</p>
                      <p className="font-bold text-text-main text-sm">{selectedBookingDetails.guestAddress}</p>
                    </div>
                  )}

                  {selectedBookingDetails.guestIdCards && selectedBookingDetails.guestIdCards.length > 0 && (
                    <div className="p-4 border border-slate-100 rounded-2xl">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Danh sách CCCD</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedBookingDetails.guestIdCards.map((card, idx) => (
                          <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Tổng thanh toán</span>
                      <span className="text-text-main text-sm">{formatCurrency(selectedBookingDetails.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Đã thanh toán</span>
                      <span className="text-emerald-600 text-sm">{formatCurrency(selectedBookingDetails.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Còn lại</span>
                      <span className="text-lg font-black text-primary">
                        {formatCurrency(selectedBookingDetails.totalPrice - selectedBookingDetails.paidAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Trạng thái đặt phòng</span>
                    <span className={`status-badge-modern ${selectedBookingDetails.status === BookingStatus.CHECKED_IN ? 'badge-occupied' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedBookingDetails.status === BookingStatus.CHECKED_IN ? 'Đang ở' : 'Đã xác nhận'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Đóng
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
            <span className="text-lg font-black text-primary tracking-tighter uppercase leading-none">HARMONY</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {(['dashboard', 'rooms', 'roomManagement', 'bookings', 'guests', 'settings'] as const).filter(tab => {
            if (currentUser === UserRole.STAFF && (tab === 'dashboard' || tab === 'settings' || tab === 'roomManagement')) return false;
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
              {tab === 'settings' && <Settings size={18} />}
              <span className="capitalize">
                {tab === 'dashboard' ? 'Tổng quan' : 
                 tab === 'rooms' ? 'Sơ đồ phòng' :
                 tab === 'roomManagement' ? 'Quản lý phòng' :
                 tab === 'bookings' ? 'Đặt phòng' :
                 tab === 'guests' ? 'Khách hàng' : 'Cài đặt'}
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
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                {currentUser === UserRole.ADMIN ? 'AD' : 'ST'}
              </div>
              <div>
                <p className="text-xs font-bold text-text-main">{currentUser === UserRole.ADMIN ? 'Quản trị viên' : 'Nhân viên'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-available"></div>
                  <p className="text-[10px] text-available font-bold uppercase tracking-widest">Đang trực</p>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-rose-600 transition-colors text-sm font-medium">
            <LogOut size={18} />
            <span className="hidden lg:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border-light p-2 flex items-center justify-around z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {(['dashboard', 'rooms', 'roomManagement', 'bookings', 'guests'] as const).filter(tab => {
          if (currentUser === UserRole.STAFF && (tab === 'dashboard' || tab === 'roomManagement')) return false;
          return true;
        }).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              activeTab === tab ? 'text-primary' : 'text-slate-400'
            }`}
          >
            {tab === 'dashboard' && <BarChart3 size={20} />}
            {tab === 'rooms' && <Bed size={20} />}
            {tab === 'roomManagement' && <LayoutGrid size={20} />}
            {tab === 'bookings' && <Calendar size={20} />}
            {tab === 'guests' && <Users size={20} />}
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {tab === 'dashboard' ? 'Tổng quan' : 
               tab === 'rooms' ? 'P.Đồ' :
               tab === 'roomManagement' ? 'Q.Lý' :
               tab === 'bookings' ? 'Đặt phòng' : 'Khách'}
            </span>
          </button>
        ))}
      </nav>

      <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full max-w-full">
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
          <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full border border-border-light">
            <Bell size={18} />
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
    </div>
  );

}
