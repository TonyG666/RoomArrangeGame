import { create } from "zustand";
import { getLocalStorage, setLocalStorage } from "../utils";

export interface FurnitureItem {
  id: string;
  type: 'bed' | 'desk' | 'chair' | 'box';
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: 0 | 90 | 180 | 270;
  color: string;
}

interface DragState {
  isDragging: boolean;
  itemId: string | null;
  offsetX: number;
  offsetY: number;
}

interface FurnitureGameState {
  furniture: FurnitureItem[];
  dragState: DragState;
  selectedItemId: string | null;
  
  setFurniture: (furniture: FurnitureItem[]) => void;
  updateFurniturePosition: (id: string, x: number, y: number) => void;
  rotateFurniture: (id: string) => void;
  startDrag: (itemId: string, offsetX: number, offsetY: number) => void;
  endDrag: () => void;
  setSelectedItem: (itemId: string | null) => void;
  resetFurniture: () => void;
  saveFurniture: () => void;
  loadFurniture: () => void;
}

const ROOM_WIDTH = 600;
const ROOM_HEIGHT = 400;
const WALL_THICKNESS = 10;

const INITIAL_FURNITURE: FurnitureItem[] = [
  { id: 'bed', type: 'bed', x: 50, y: 50, width: 120, height: 80, originalWidth: 120, originalHeight: 80, rotation: 0, color: '#8B4513' },
  { id: 'desk', type: 'desk', x: 300, y: 100, width: 100, height: 60, originalWidth: 100, originalHeight: 60, rotation: 0, color: '#654321' },
  { id: 'chair', type: 'chair', x: 300, y: 180, width: 40, height: 40, originalWidth: 40, originalHeight: 40, rotation: 0, color: '#A0522D' },
  { id: 'box1', type: 'box', x: 450, y: 50, width: 50, height: 50, originalWidth: 50, originalHeight: 50, rotation: 0, color: '#CD853F' },
  { id: 'box2', type: 'box', x: 450, y: 120, width: 50, height: 50, originalWidth: 50, originalHeight: 50, rotation: 0, color: '#DEB887' },
];

const checkCollision = (item1: FurnitureItem, item2: FurnitureItem): boolean => {
  return !(
    item1.x + item1.width <= item2.x ||
    item1.x >= item2.x + item2.width ||
    item1.y + item1.height <= item2.y ||
    item1.y >= item2.y + item2.height
  );
};

const isWithinBounds = (item: FurnitureItem): boolean => {
  return (
    item.x >= WALL_THICKNESS &&
    item.y >= WALL_THICKNESS &&
    item.x + item.width <= ROOM_WIDTH - WALL_THICKNESS &&
    item.y + item.height <= ROOM_HEIGHT - WALL_THICKNESS
  );
};

const getDimensionsForRotation = (item: FurnitureItem, rotation: 0 | 90 | 180 | 270): { width: number; height: number } => {
  if (rotation === 90 || rotation === 270) {
    return { width: item.originalHeight, height: item.originalWidth };
  }
  return { width: item.originalWidth, height: item.originalHeight };
};

const validateLayout = (furniture: FurnitureItem[]): FurnitureItem[] => {
  return furniture.map(item => {
    const dims = getDimensionsForRotation(item, item.rotation);
    return { ...item, width: dims.width, height: dims.height };
  }).filter(item => {
    const withinBounds = isWithinBounds(item);
    if (!withinBounds) {
      console.warn(`Item ${item.id} is out of bounds, resetting to initial position`);
      return false;
    }
    return true;
  });
};

export const useFurnitureGame = create<FurnitureGameState>((set, get) => ({
  furniture: [...INITIAL_FURNITURE],
  dragState: {
    isDragging: false,
    itemId: null,
    offsetX: 0,
    offsetY: 0,
  },
  selectedItemId: null,
  
  setFurniture: (furniture) => set({ furniture }),
  
  updateFurniturePosition: (id, x, y) => {
    set(state => ({
      furniture: state.furniture.map(item =>
        item.id === id ? { ...item, x, y } : item
      ),
    }));
  },
  
  rotateFurniture: (id) => {
    const { furniture } = get();
    const item = furniture.find(f => f.id === id);
    if (!item) return;
    
    const newRotation = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270;
    const newDims = getDimensionsForRotation(item, newRotation);
    
    const rotatedItem: FurnitureItem = {
      ...item,
      rotation: newRotation,
      width: newDims.width,
      height: newDims.height,
    };
    
    if (!isWithinBounds(rotatedItem)) {
      console.log('Rotation would place item out of bounds');
      return;
    }
    
    for (const otherItem of furniture) {
      if (otherItem.id !== item.id && checkCollision(rotatedItem, otherItem)) {
        console.log('Rotation would cause collision');
        return;
      }
    }
    
    set(state => ({
      furniture: state.furniture.map(f =>
        f.id === id ? rotatedItem : f
      ),
    }));
  },
  
  startDrag: (itemId, offsetX, offsetY) => {
    set({
      dragState: {
        isDragging: true,
        itemId,
        offsetX,
        offsetY,
      },
      selectedItemId: itemId,
    });
  },
  
  endDrag: () => {
    set({
      dragState: {
        isDragging: false,
        itemId: null,
        offsetX: 0,
        offsetY: 0,
      },
    });
  },
  
  setSelectedItem: (itemId) => {
    set({ selectedItemId: itemId });
  },
  
  resetFurniture: () => {
    set({ furniture: [...INITIAL_FURNITURE], selectedItemId: null });
  },
  
  saveFurniture: () => {
    const { furniture } = get();
    setLocalStorage('furnitureLayout', furniture);
  },
  
  loadFurniture: () => {
    const saved = getLocalStorage('furnitureLayout');
    if (saved && Array.isArray(saved)) {
      const validatedFurniture: FurnitureItem[] = INITIAL_FURNITURE.map(initial => ({ ...initial }));
      
      for (const savedItem of saved) {
        const furnitureIndex = validatedFurniture.findIndex(f => f.id === savedItem.id);
        if (furnitureIndex === -1) {
          console.warn(`Unknown furniture id ${savedItem.id}, skipping`);
          continue;
        }
        
        const initialItem = INITIAL_FURNITURE[furnitureIndex];
        let item = { ...savedItem };
        
        if (!item.originalWidth || !item.originalHeight) {
          item.originalWidth = initialItem.originalWidth;
          item.originalHeight = initialItem.originalHeight;
        }
        
        const dims = getDimensionsForRotation(item, item.rotation || 0);
        item.width = dims.width;
        item.height = dims.height;
        
        if (!isWithinBounds(item)) {
          console.warn(`Item ${item.id} is out of bounds, keeping initial position`);
          continue;
        }
        
        let hasCollision = false;
        for (let i = 0; i < validatedFurniture.length; i++) {
          if (i !== furnitureIndex && checkCollision(item, validatedFurniture[i])) {
            console.warn(`Item ${item.id} collides with ${validatedFurniture[i].id}, keeping initial position`);
            hasCollision = true;
            break;
          }
        }
        
        if (!hasCollision) {
          validatedFurniture[furnitureIndex] = item;
        }
      }
      
      set({ furniture: validatedFurniture });
    }
  },
}));
