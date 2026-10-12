import api from './api';

export interface Accessory {
  id: string;
  description: string;
  price: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getAccessories = async (search?: string, sortBy?: string, direction?: string): Promise<Accessory[]> => {
  const response = await api.get('/api/admin/accessories', {
    params: { search, sortBy, direction }
  });
  return response.data;
};

export const createAccessory = async (data: { description: string; price: number }): Promise<Accessory> => {
  const response = await api.post('/api/admin/accessories', data);
  return response.data;
};

export const updateAccessory = async (id: string, data: { description: string; price: number; active?: boolean }): Promise<Accessory> => {
  const response = await api.put(`/api/admin/accessories/${id}`, data);
  return response.data;
};

export const deleteAccessory = async (id: string): Promise<void> => {
  await api.delete(`/api/admin/accessories/${id}`);
};

