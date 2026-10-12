import api from './api';

export interface Accessory {
  id: string;
  description: string;
  price: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getAccessories = async (search?: string): Promise<Accessory[]> => {
  const response = await api.get('/api/admin/accessories', {
    params: { search }
  });
  return response.data;
};

export const createAccessory = async (data: { description: string; price: number }): Promise<Accessory> => {
  const response = await api.post('/api/admin/accessories', data);
  return response.data;
};
