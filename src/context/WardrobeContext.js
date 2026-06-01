import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WardrobeContext = createContext(null);

const SAMPLE_ITEMS = [
  {
    id: '1',
    name: 'Classic White Shirt',
    category: 'Shirts',
    color: '#F5F0E8',
    brand: 'Zara',
    season: 'All Year',
    style: 'Formal',
    image: null,
    wearCount: 12,
    lastWorn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Blue Denim Jeans',
    category: 'Pants',
    color: '#3A5F8A',
    brand: "Levi's",
    season: 'All Year',
    style: 'Casual',
    image: null,
    wearCount: 24,
    lastWorn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2023-12-01',
  },
  {
    id: '3',
    name: 'Black Evening Dress',
    category: 'Dresses',
    color: '#1A1A2E',
    brand: 'H&M',
    season: 'All Year',
    style: 'Evening',
    image: null,
    wearCount: 3,
    lastWorn: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2024-02-20',
  },
  {
    id: '4',
    name: 'White Sneakers',
    category: 'Shoes',
    color: '#F0EDE8',
    brand: 'Nike',
    season: 'Spring/Fall',
    style: 'Casual',
    image: null,
    wearCount: 30,
    lastWorn: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2023-08-10',
  },
  {
    id: '5',
    name: 'Black Leather Jacket',
    category: 'Jackets',
    color: '#141414',
    brand: 'MANGO',
    season: 'Spring/Fall',
    style: 'Casual',
    image: null,
    wearCount: 8,
    lastWorn: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2023-10-05',
  },
  {
    id: '6',
    name: 'Beige Scarf',
    category: 'Accessories',
    color: '#C9B89A',
    brand: 'Massimo Dutti',
    season: 'Winter',
    style: 'Casual',
    image: null,
    wearCount: 5,
    lastWorn: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: '2023-11-20',
  },
];

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, items: action.payload, loaded: true };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'INCREMENT_WEAR':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload
            ? { ...i, wearCount: (i.wearCount || 0) + 1, lastWorn: new Date().toISOString().split('T')[0] }
            : i
        ),
      };
    case 'TOGGLE_LAUNDRY':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload ? { ...i, inLaundry: !i.inLaundry } : i
        ),
      };
    case 'ADD_OUTFIT':
      return { ...state, outfits: [action.payload, ...state.outfits] };
    default:
      return state;
  }
}

export function WardrobeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: [], outfits: [], loaded: false });

  useEffect(() => {
    AsyncStorage.getItem('wardrobe_v2')
      .then(stored => {
        dispatch({ type: 'LOAD', payload: stored ? JSON.parse(stored) : SAMPLE_ITEMS });
      })
      .catch(() => dispatch({ type: 'LOAD', payload: SAMPLE_ITEMS }));
  }, []);

  useEffect(() => {
    if (state.loaded) {
      AsyncStorage.setItem('wardrobe_v2', JSON.stringify(state.items)).catch(() => {});
    }
  }, [state.items, state.loaded]);

  const addItem = (item) =>
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        id: Date.now().toString(),
        wearCount: 0,
        inLaundry: false,
        createdAt: new Date().toISOString().split('T')[0],
        lastWorn: null,
      },
    });

  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const incrementWear = (id) => dispatch({ type: 'INCREMENT_WEAR', payload: id });
  const toggleLaundry = (id) => dispatch({ type: 'TOGGLE_LAUNDRY', payload: id });
  const addOutfit = (outfit) =>
    dispatch({
      type: 'ADD_OUTFIT',
      payload: { ...outfit, id: Date.now().toString(), createdAt: new Date().toISOString() },
    });

  return (
    <WardrobeContext.Provider value={{ ...state, addItem, removeItem, incrementWear, toggleLaundry, addOutfit }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within WardrobeProvider');
  return ctx;
}
