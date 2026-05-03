/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
}

export enum RoomType {
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  SUITE = 'SUITE',
  DELUXE = 'DELUXE',
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  pricePerNight: number;
  status: RoomStatus;
  floor: number;
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress?: string;
  checkIn: string; // ISO Date
  checkOut: string; // ISO Date
  status: BookingStatus;
  totalPrice: number;
  paidAmount: number;
  guestIdCards?: string[];
  guestsCount: number;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  identityCard: string;
  lastVisit?: string;
  totalBookings: number;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  expectedArrivals: number;
  expectedDepartures: number;
  dailyRevenue: number;
  monthlyRevenue: number;
}
