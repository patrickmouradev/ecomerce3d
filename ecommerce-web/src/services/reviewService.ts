import api from './api';

export interface ProductReviewItem {
  id: string;
  productId: string;
  productName: string;
  orderId: string;
  authorName: string;
  rating: number;
  comment: string;
  photosUrls: string[];
  adminReply?: string;
  adminRepliedAt?: string;
  visible: boolean;
  createdAt: string;
}

export interface ProductReviewsPage {
  enabled: boolean;
  minReviewsRequired: number;
  totalReviews: number;
  averageRating: number;
  reviews: ProductReviewItem[];
}

export const reviewService = {
  getProductReviews: async (productId: string): Promise<ProductReviewsPage> => {
    const res = await api.get(`/api/products/${productId}/reviews`);
    return res.data;
  },

  getReviewConfig: async (): Promise<{ enabled: boolean; minReviewsRequired: number }> => {
    const res = await api.get('/api/products/reviews/config');
    return res.data;
  },

  getMyReviews: async (): Promise<ProductReviewItem[]> => {
    const res = await api.get('/api/checkout/my-reviews');
    return res.data;
  },

  submitReview: async (
    productId: string,
    orderId: string,
    rating: number,
    comment: string,
    photos: File[]
  ): Promise<ProductReviewItem> => {
    const formData = new FormData();
    formData.append('orderId', orderId);
    formData.append('rating', String(rating));
    if (comment) formData.append('comment', comment);
    photos.forEach((file) => formData.append('photos', file));

    const res = await api.post(`/api/products/${productId}/reviews`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getAllAdminReviews: async (): Promise<ProductReviewItem[]> => {
    const res = await api.get('/api/admin/reviews');
    return res.data;
  },

  replyReviewAdmin: async (reviewId: string, reply: string): Promise<ProductReviewItem> => {
    const res = await api.patch(`/api/admin/reviews/${reviewId}/reply`, { reply });
    return res.data;
  },

  toggleVisibilityAdmin: async (reviewId: string, visible: boolean): Promise<ProductReviewItem> => {
    const res = await api.patch(`/api/admin/reviews/${reviewId}/visibility`, { visible });
    return res.data;
  },

  deleteReviewAdmin: async (reviewId: string): Promise<void> => {
    await api.delete(`/api/admin/reviews/${reviewId}`);
  }
};
