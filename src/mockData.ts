/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, RoomStatus, RoomType, Booking, BookingStatus, Guest } from './types';

export const MOCK_ROOMS: Room[] = [
  { id: '1', number: '101', type: RoomType.SINGLE, pricePerNight: 550000, status: RoomStatus.AVAILABLE, floor: 1 },
  { id: '2', number: '102', type: RoomType.SINGLE, pricePerNight: 550000, status: RoomStatus.OCCUPIED, floor: 1 },
  { id: '3', number: '103', type: RoomType.DOUBLE, pricePerNight: 850000, status: RoomStatus.CLEANING, floor: 1 },
  { id: '4', number: '104', type: RoomType.DOUBLE, pricePerNight: 850000, status: RoomStatus.AVAILABLE, floor: 1 },
  { id: '5', number: '105', type: RoomType.DELUXE, pricePerNight: 1200000, status: RoomStatus.AVAILABLE, floor: 1 },
  { id: '6', number: '201', type: RoomType.SINGLE, pricePerNight: 600000, status: RoomStatus.AVAILABLE, floor: 2 },
  { id: '7', number: '202', type: RoomType.DOUBLE, pricePerNight: 900000, status: RoomStatus.OCCUPIED, floor: 2 },
  { id: '8', number: '203', type: RoomType.SUITE, pricePerNight: 2500000, status: RoomStatus.AVAILABLE, floor: 2 },
  { id: '9', number: '204', type: RoomType.SUITE, pricePerNight: 2500000, status: RoomStatus.MAINTENANCE, floor: 2 },
  { id: '10', number: '205', type: RoomType.DELUXE, pricePerNight: 1350000, status: RoomStatus.AVAILABLE, floor: 2 },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    roomId: '2',
    guestName: 'Nguyễn Văn An',
    guestEmail: 'an@example.com',
    guestPhone: '0901234567',
    checkIn: '2026-05-01',
    checkOut: '2026-05-04',
    status: BookingStatus.CHECKED_IN,
    totalPrice: 1650000,
    paidAmount: 1650000,
    guestsCount: 1,
  },
  {
    id: 'b2',
    roomId: '7',
    guestName: 'Lê Thị Bình',
    guestEmail: 'binh@example.com',
    guestPhone: '0907654321',
    checkIn: '2026-05-02',
    checkOut: '2026-05-05',
    status: BookingStatus.CHECKED_IN,
    totalPrice: 2700000,
    paidAmount: 1000000,
    guestsCount: 2,
  },
];

export const MOCK_GUESTS: Guest[] = [
  { id: 'g1', name: 'Nguyễn Văn An', email: 'an@example.com', phone: '0901234567', address: 'Hà Nội', identityCard: '123456789', lastVisit: '2026-05-01', totalBookings: 3 },
  { id: 'g2', name: 'Lê Thị Bình', email: 'binh@example.com', phone: '0907654321', address: 'TP.HCM', identityCard: '987654321', lastVisit: '2026-05-02', totalBookings: 1 },
];
