import { create } from "zustand";
import { getLocalStorage, setLocalStorage } from "../utils";

export interface FurnitureItem {
  id: string;
  type: 'bed' | 'desk' | 'chair' | 'box' | 'bookshelf' | 'lamp' | 'rug' | 'plant' | 'wardrobe';
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

export type RoomSize = 'small' | 'medium' | 'large';

export interface RoomDimensions {
  width: number;
  height: number;
}

export const ROOM_SIZES: Record<RoomSize, RoomDimensions> = {
  small: { width: 500, height: 350 },
  medium: { width: 600, height: 400 },
  large: { width: 700, height: 500 },
};

interface FurnitureGameState {
  furniture: FurnitureItem[];
  dragState: DragState;
  selectedItemId: string | null;
  nextItemId: number;
  roomSize: RoomSize;
  
  setFurniture: (furniture: FurnitureItem[]) => void;
  updateFurniturePosition: (id: string, x: number, y: number) => void;
  rotateFurniture: (id: string) => void;
  startDrag: (itemId: string, offsetX: number, offsetY: number) => void;
  endDrag: () => void;
  setSelectedItem: (itemId: string | null) => void;
  addFurniture: (type: FurnitureItem['type']) => void;
  removeFurniture: (id: string) => void;
  setRoomSize: (size: RoomSize) => void;
  resetFurniture: () => void;
  saveFurniture: () => void;
  loadFurniture: () => void;
}

const WALL_THICKNESS = 10;
const GRID_SIZE = 20;

const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

const getRoomDimensions = (size: RoomSize): RoomDimensions => {
  return ROOM_SIZES[size];
};

const FURNITURE_TEMPLATES: Record<FurnitureItem['type'], Omit<FurnitureItem, 'id' | 'x' | 'y'>> = {
  bed: { type: 'bed', width: 120, height: 80, originalWidth: 120, originalHeight: 80, rotation: 0, color: '#8B4513' },
  desk: { type: 'desk', width: 100, height: 60, originalWidth: 100, originalHeight: 60, rotation: 0, color: '#654321' },
  chair: { type: 'chair', width: 40, height: 40, originalWidth: 40, originalHeight: 40, rotation: 0, color: '#A0522D' },
  box: { type: 'box', width: 50, height: 50, originalWidth: 50, originalHeight: 50, rotation: 0, color: '#CD853F' },
  bookshelf: { type: 'bookshelf', width: 60, height: 100, originalWidth: 60, originalHeight: 100, rotation: 0, color: '#6B4423' },
  lamp: { type: 'lamp', width: 30, height: 30, originalWidth: 30, originalHeight: 30, rotation: 0, color: '#FFD700' },
  rug: { type: 'rug', width: 100, height: 80, originalWidth: 100, originalHeight: 80, rotation: 0, color: '#B22222' },
  plant: { type: 'plant', width: 35, height: 35, originalWidth: 35, originalHeight: 35, rotation: 0, color: '#228B22' },
  wardrobe: { type: 'wardrobe', width: 80, height: 100, originalWidth: 80, originalHeight: 100, rotation: 0, color: '#4A3728' },
};

const INITIAL_FURNITURE: FurnitureItem[] = [
  { id: 'bed', type: 'bed', x: 40, y: 40, width: 120, height: 80, originalWidth: 120, originalHeight: 80, rotation: 0, color: '#8B4513' },
  { id: 'desk', type: 'desk', x: 300, y: 100, width: 100, height: 60, originalWidth: 100, originalHeight: 60, rotation: 0, color: '#654321' },
  { id: 'chair', type: 'chair', x: 300, y: 180, width: 40, height: 40, originalWidth: 40, originalHeight: 40, rotation: 0, color: '#A0522D' },
  { id: 'box1', type: 'box', x: 460, y: 40, width: 50, height: 50, originalWidth: 50, originalHeight: 50, rotation: 0, color: '#CD853F' },
  { id: 'box2', type: 'box', x: 460, y: 120, width: 50, height: 50, originalWidth: 50, originalHeight: 50, rotation: 0, color: '#DEB887' },
];

const checkCollision = (item1: FurnitureItem, item2: FurnitureItem): boolean => {
  return !(
    item1.x + item1.width <= item2.x ||
    item1.x >= item2.x + item2.width ||
    item1.y + item1.height <= item2.y ||
    item1.y >= item2.y + item2.height
  );
};

const isWithinBounds = (item: FurnitureItem, roomDimensions: RoomDimensions): boolean => {
  return (
    item.x >= WALL_THICKNESS &&
    item.y >= WALL_THICKNESS &&
    item.x + item.width <= roomDimensions.width - WALL_THICKNESS &&
    item.y + item.height <= roomDimensions.height - WALL_THICKNESS
  );
};

const getDimensionsForRotation = (item: FurnitureItem, rotation: 0 | 90 | 180 | 270): { width: number; height: number } => {
  if (rotation === 90 || rotation === 270) {
    return { width: item.originalHeight, height: item.originalWidth };
  }
  return { width: item.originalWidth, height: item.originalHeight };
};

const validateLayout = (furniture: FurnitureItem[], roomDimensions: RoomDimensions): FurnitureItem[] => {
  return furniture.map(item => {
    const dims = getDimensionsForRotation(item, item.rotation);
    return { ...item, width: dims.width, height: dims.height };
  }).filter(item => {
    const withinBounds = isWithinBounds(item, roomDimensions);
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
  nextItemId: 1000,
  roomSize: 'medium',
  
  setFurniture: (furniture) => set({ furniture }),
  
  updateFurniturePosition: (id, x, y) => {
    set(state => ({
      furniture: state.furniture.map(item =>
        item.id === id ? { ...item, x, y } : item
      ),
    }));
  },
  
  rotateFurniture: (id) => {
    const { furniture, roomSize } = get();
    const roomDims = getRoomDimensions(roomSize);
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
    
    if (!isWithinBounds(rotatedItem, roomDims)) {
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
    const { furniture, dragState } = get();
    if (dragState.itemId) {
      const item = furniture.find(f => f.id === dragState.itemId);
      if (item) {
        const snappedX = snapToGrid(item.x);
        const snappedY = snapToGrid(item.y);
        
        set(state => ({
          furniture: state.furniture.map(f =>
            f.id === dragState.itemId ? { ...f, x: snappedX, y: snappedY } : f
          ),
          dragState: {
            isDragging: false,
            itemId: null,
            offsetX: 0,
            offsetY: 0,
          },
        }));
        return;
      }
    }
    
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
  
  addFurniture: (type) => {
    const { furniture, nextItemId, roomSize } = get();
    const template = FURNITURE_TEMPLATES[type];
    const roomDims = getRoomDimensions(roomSize);
    
    const centerX = snapToGrid((roomDims.width - template.width) / 2);
    const centerY = snapToGrid((roomDims.height - template.height) / 2);
    
    const newItem: FurnitureItem = {
      ...template,
      id: `${type}-${nextItemId}`,
      x: centerX,
      y: centerY,
    };
    
    if (!isWithinBounds(newItem, roomDims)) {
      console.warn('Cannot add furniture: would be out of bounds');
      return;
    }
    
    for (const existingItem of furniture) {
      if (checkCollision(newItem, existingItem)) {
        console.warn('Cannot add furniture: would collide with existing item');
        return;
      }
    }
    
    set(state => ({
      furniture: [...state.furniture, newItem],
      nextItemId: state.nextItemId + 1,
      selectedItemId: newItem.id,
    }));
  },
  
  removeFurniture: (id) => {
    set(state => ({
      furniture: state.furniture.filter(item => item.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
  },
  
  setRoomSize: (size) => {
    const { furniture } = get();
    const roomDims = getRoomDimensions(size);
    
    const validFurniture = furniture.filter(item => isWithinBounds(item, roomDims));
    
    set({ 
      roomSize: size,
      furniture: validFurniture,
      selectedItemId: null,
    });
  },
  
  resetFurniture: () => {
    set({ furniture: [...INITIAL_FURNITURE], selectedItemId: null, nextItemId: 1000 });
  },
  
  saveFurniture: () => {
    const { furniture } = get();
    setLocalStorage('furnitureLayout', furniture);
  },
  
  loadFurniture: () => {
    const saved = getLocalStorage('furnitureLayout');
    const { roomSize } = get();
    const roomDims = getRoomDimensions(roomSize);
    
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
        
        if (!isWithinBounds(item, roomDims)) {
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
