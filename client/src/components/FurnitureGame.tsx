import { useEffect, useRef, useState } from "react";
import { useFurnitureGame, type FurnitureItem, ROOM_SIZES, type RoomSize } from "@/lib/stores/useFurnitureGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { RotateCw, Save, FolderOpen, RotateCcw, Volume2, VolumeX, Plus, Trash2 } from "lucide-react";

const WALL_THICKNESS = 10;

const FURNITURE_TYPES: Array<{ type: FurnitureItem['type']; label: string }> = [
  { type: 'bed', label: 'Bed' },
  { type: 'desk', label: 'Desk' },
  { type: 'chair', label: 'Chair' },
  { type: 'box', label: 'Box' },
  { type: 'bookshelf', label: 'Bookshelf' },
  { type: 'lamp', label: 'Lamp' },
  { type: 'rug', label: 'Rug' },
  { type: 'plant', label: 'Plant' },
  { type: 'wardrobe', label: 'Wardrobe' },
];

export function FurnitureGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  
  const {
    furniture,
    dragState,
    selectedItemId,
    roomSize,
    updateFurniturePosition,
    rotateFurniture,
    startDrag,
    endDrag,
    setSelectedItem,
    addFurniture,
    removeFurniture,
    setRoomSize,
    resetFurniture,
    saveFurniture,
    loadFurniture,
  } = useFurnitureGame();
  
  const roomDimensions = ROOM_SIZES[roomSize];
  const ROOM_WIDTH = roomDimensions.width;
  const ROOM_HEIGHT = roomDimensions.height;
  
  const { playHit, isMuted, toggleMute, setHitSound } = useAudio();

  useEffect(() => {
    const audio = new Audio("/sounds/hit.mp3");
    audio.volume = 0.2;
    setHitSound(audio);
  }, [setHitSound]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (selectedItemId) {
          rotateFurniture(selectedItemId);
          playHit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedItemId, rotateFurniture, playHit]);

  const checkCollision = (item1: FurnitureItem, item2: FurnitureItem): boolean => {
    return !(
      item1.x + item1.width <= item2.x ||
      item1.x >= item2.x + item2.width ||
      item1.y + item1.height <= item2.y ||
      item1.y >= item2.y + item2.height
    );
  };

  const isValidPosition = (item: FurnitureItem, newX: number, newY: number): boolean => {
    if (newX < WALL_THICKNESS || newY < WALL_THICKNESS) return false;
    if (newX + item.width > ROOM_WIDTH - WALL_THICKNESS) return false;
    if (newY + item.height > ROOM_HEIGHT - WALL_THICKNESS) return false;

    const testItem = { ...item, x: newX, y: newY };
    for (const otherItem of furniture) {
      if (otherItem.id !== item.id && checkCollision(testItem, otherItem)) {
        return false;
      }
    }

    return true;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      if (
        x >= item.x &&
        x <= item.x + item.width &&
        y >= item.y &&
        y <= item.y + item.height
      ) {
        startDrag(item.id, x - item.x, y - item.y);
        playHit();
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (!dragState.isDragging) {
      let foundHovered = false;
      for (let i = furniture.length - 1; i >= 0; i--) {
        const item = furniture[i];
        if (
          x >= item.x &&
          x <= item.x + item.width &&
          y >= item.y &&
          y <= item.y + item.height
        ) {
          setHoveredItemId(item.id);
          foundHovered = true;
          break;
        }
      }
      if (!foundHovered) {
        setHoveredItemId(null);
      }
    }

    if (dragState.isDragging && dragState.itemId) {
      const item = furniture.find(f => f.id === dragState.itemId);
      if (item) {
        const newX = x - dragState.offsetX;
        const newY = y - dragState.offsetY;
        
        if (isValidPosition(item, newX, newY)) {
          updateFurniturePosition(dragState.itemId, newX, newY);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      playHit();
      endDrag();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    
    ctx.clearRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, ROOM_WIDTH, WALL_THICKNESS);
    ctx.fillRect(0, 0, WALL_THICKNESS, ROOM_HEIGHT);
    ctx.fillRect(ROOM_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, ROOM_HEIGHT);
    ctx.fillRect(0, ROOM_HEIGHT - WALL_THICKNESS, ROOM_WIDTH, WALL_THICKNESS);

    for (let x = WALL_THICKNESS; x < ROOM_WIDTH - WALL_THICKNESS; x += 20) {
      for (let y = WALL_THICKNESS; y < ROOM_HEIGHT - WALL_THICKNESS; y += 20) {
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.1)';
        ctx.strokeRect(x, y, 20, 20);
      }
    }

    furniture.forEach(item => {
      const isDragging = dragState.isDragging && dragState.itemId === item.id;
      const isSelected = selectedItemId === item.id;
      const isHovered = hoveredItemId === item.id;

      ctx.save();
      
      if (!isDragging) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }
      
      if (isDragging) {
        ctx.globalAlpha = 0.7;
      }

      ctx.fillStyle = item.color;
      ctx.fillRect(item.x, item.y, item.width, item.height);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      if (isHovered && !isDragging) {
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
      }

      ctx.strokeStyle = isSelected ? '#FFD700' : '#000000';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lines = item.type.toUpperCase().match(/.{1,8}/g) || [item.type.toUpperCase()];
      lines.forEach((line, i) => {
        ctx.fillText(line, item.x + item.width / 2, item.y + item.height / 2 - (lines.length - 1) * 6 + i * 12);
      });

      ctx.restore();
    });
  }, [furniture, dragState, selectedItemId, hoveredItemId, mousePos]);

  const handleRotate = () => {
    if (selectedItemId) {
      rotateFurniture(selectedItemId);
      playHit();
    }
  };

  const handleSave = () => {
    saveFurniture();
    playHit();
  };

  const handleLoad = () => {
    loadFurniture();
    playHit();
  };

  const handleReset = () => {
    resetFurniture();
    playHit();
  };

  const handleAddFurniture = (type: FurnitureItem['type']) => {
    addFurniture(type);
    playHit();
  };

  const handleRemoveFurniture = () => {
    if (selectedItemId) {
      removeFurniture(selectedItemId);
      playHit();
    }
  };

  const handleSetRoomSize = (size: RoomSize) => {
    setRoomSize(size);
    playHit();
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-white p-4 gap-4">
      <div className="bg-white rounded-lg shadow-2xl p-4 space-y-3 w-64 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 text-center" style={{ fontFamily: 'monospace' }}>
          ROOM SIZE
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as RoomSize[]).map((size) => (
            <Button
              key={size}
              onClick={() => handleSetRoomSize(size)}
              className={`font-bold py-2 text-xs ${
                roomSize === size
                  ? 'bg-cyan-600 hover:bg-cyan-700'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
              }`}
              style={{ fontFamily: 'monospace' }}
            >
              {size.toUpperCase()}
            </Button>
          ))}
        </div>

        <h2 className="text-xl font-bold text-gray-800 text-center mt-4" style={{ fontFamily: 'monospace' }}>
          ADD FURNITURE
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {FURNITURE_TYPES.map(({ type, label }) => (
            <Button
              key={type}
              onClick={() => handleAddFurniture(type)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs"
              style={{ fontFamily: 'monospace' }}
            >
              <Plus className="mr-1 h-3 w-3" />
              {label.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-2xl p-6 space-y-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'monospace' }}>
            ROOM DESIGNER
          </h1>
          <Button
            onClick={toggleMute}
            variant="outline"
            size="icon"
            className="bg-gray-200 hover:bg-gray-300 border-gray-300"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-gray-700" /> : <Volume2 className="h-4 w-4 text-gray-700" />}
          </Button>
        </div>

        <div className="bg-gray-100 p-2 rounded">
          <canvas
            ref={canvasRef}
            width={ROOM_WIDTH}
            height={ROOM_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move border-4 border-gray-300 rounded"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={handleRotate}
            disabled={!selectedItemId}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 disabled:opacity-50"
            style={{ fontFamily: 'monospace' }}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            ROTATE (R)
          </Button>
          
          <Button
            onClick={handleRemoveFurniture}
            disabled={!selectedItemId}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 disabled:opacity-50"
            style={{ fontFamily: 'monospace' }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            DELETE
          </Button>
          
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            style={{ fontFamily: 'monospace' }}
          >
            <Save className="mr-2 h-4 w-4" />
            SAVE
          </Button>
          
          <Button
            onClick={handleLoad}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3"
            style={{ fontFamily: 'monospace' }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            LOAD
          </Button>
          
          <Button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 col-span-2"
            style={{ fontFamily: 'monospace' }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            RESET
          </Button>
        </div>

        <div className="bg-gray-100 p-3 rounded text-sm text-gray-700" style={{ fontFamily: 'monospace' }}>
          <p>• Click and drag furniture to move (snaps to grid)</p>
          <p>• Press R or click ROTATE to rotate selected item</p>
          <p>• Hover over furniture for orange highlight</p>
          <p>• Add furniture from the left panel</p>
          <p>{selectedItemId ? `Selected: ${selectedItemId.toUpperCase()}` : 'No item selected'}</p>
        </div>
      </div>
    </div>
  );
}
