/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Room, Booking, Guest, DashboardStats } from '../types';

// The URL of your deployed Google Apps Script Web App
// Instructions: 
// Hướng dẫn kết nối: 
// 1. Tạo Google Sheet với các tab: "Phòng", "Đặt phòng", "Khách hàng"
// 2. Tab "Phòng" các cột: id, số_phòng, loại, giá, trạng_thái, tầng
// 3. Tab "Đặt phòng" các cột: id, phòng_id, tên_khách, email, ngày_đến, ngày_đi, trạng_thái, tổng_tiền
// 4. Tab "Khách hàng" các cột: id, tên, email, điện_thoại, cccd, tổng_lượt_đặt
const APPS_SCRIPT_URL = ''; 

export const apiService = {
  async getRooms(): Promise<Room[]> {
    if (!APPS_SCRIPT_URL) return Promise.resolve([]); 
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getRooms`);
    return response.json();
  },

  async getBookings(): Promise<Booking[]> {
    if (!APPS_SCRIPT_URL) return Promise.resolve([]);
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getBookings`);
    return response.json();
  },

  async getGuests(): Promise<Guest[]> {
    if (!APPS_SCRIPT_URL) return Promise.resolve([]);
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getGuests`);
    return response.json();
  },

  async createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'createBooking', data: booking }),
    });
    return response.json();
  },

  async updateRoomStatus(roomId: string, status: string): Promise<void> {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateRoomStatus', data: { roomId, status } }),
    });
  }
};
