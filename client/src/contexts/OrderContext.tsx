'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

// Order interface
interface Order {
  id?: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  size: string;
  price: number;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  customerInfo: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  createdAt: string;
}

// Order context interface
interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
  getUserOrders: (userId: string) => Promise<Order[]>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  loading: boolean;
}

// Create context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Buyurtma berish
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<boolean> => {
    setLoading(true);
    try {
      // Mahsulot sonini tekshirish va kamaytirish
      const productRef = doc(db, "products", orderData.productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        toast.error('Mahsulot topilmadi');
        return false;
      }

      const productData = productDoc.data();
      const sizes = productData.sizes || [];
      
      // Tanlangan o'lcham uchun stock tekshirish
      const selectedSizeIndex = sizes.findIndex((s: any) => s.size === orderData.size);
      if (selectedSizeIndex === -1) {
        toast.error('Tanlangan o\'lcham topilmadi');
        return false;
      }

      const selectedSize = sizes[selectedSizeIndex];
      const currentStock = parseInt(selectedSize.stock) || 0;
      
      if (currentStock < orderData.quantity) {
        toast.error(`Yetarli mahsulot yo'q. Mavjud: ${currentStock} dona`);
        return false;
      }

      // Buyurtmani saqlash
      const newOrder: Omit<Order, 'id'> = {
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "orders"), newOrder);
      
      // Mahsulot sonini kamaytirish
      const updatedSizes = [...sizes];
      updatedSizes[selectedSizeIndex] = {
        ...selectedSize,
        stock: (currentStock - orderData.quantity).toString()
      };

      // Umumiy stock ni ham yangilash
      const totalStock = updatedSizes.reduce((sum: number, size: any) => {
        return sum + (parseInt(size.stock) || 0);
      }, 0);

      await updateDoc(productRef, {
        sizes: updatedSizes,
        stock: totalStock,
        status: totalStock > 0 ? 'mavjud' : 'mavjud emas'
      });

      const createdOrder = { id: docRef.id, ...newOrder };
      setOrders(prev => [createdOrder, ...prev]);
      
      console.log('✅ Buyurtma yaratildi:', createdOrder);
      toast.success('Buyurtma muvaffaqiyatli berildi!');
      return true;
      
    } catch (error) {
      console.error('❌ Buyurtma berishda xatolik:', error);
      toast.error('Buyurtma berishda xatolik yuz berdi');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Foydalanuvchi buyurtmalarini olish
  const getUserOrders = async (userId: string): Promise<Order[]> => {
    try {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(q);
      const userOrders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        userOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      // Sanaga ko'ra tartiblash (yangi birinchi)
      userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return userOrders;
    } catch (error) {
      console.error('❌ Buyurtmalarni olishda xatolik:', error);
      return [];
    }
  };

  // Buyurtma statusini yangilash
  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<boolean> => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status });
      
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      toast.success('Buyurtma holati yangilandi');
      return true;
    } catch (error) {
      console.error('❌ Buyurtma holatini yangilashda xatolik:', error);
      toast.error('Buyurtma holatini yangilashda xatolik');
      return false;
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      createOrder,
      getUserOrders,
      updateOrderStatus,
      loading
    }}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook to use the order context
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext; 