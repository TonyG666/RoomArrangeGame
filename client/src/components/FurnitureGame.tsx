import { useEffect, useRef, useState } from "react";
import { useFurnitureGame, type FurnitureItem } from "@/lib/stores/useFurnitureGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Button } from "@/components/ui/button";
import { RotateCw, Save, FolderOpen, RotateCcw, Volume2, VolumeX } from "lucide-react";

const ROOM_WIDTH = 600;
const ROOM_HEIGHT = 400;
const WALL_THICKNESS = 10;

export function FurnitureGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const {
    furniture,
    dragState,
    selectedItemId,
    updateFurniturePosition,
    rotateFurniture,
    startDrag,
    endDrag,
    setSelectedItem,
    resetFurniture,
    saveFurniture,
    loadFurniture,
  } = useFurnitureGame();
  
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

      ctx.save();
      
      if (isDragging) {
        ctx.globalAlpha = 0.7;
      }

      ctx.fillStyle = item.color;
      ctx.fillRect(item.x, item.y, item.width, item.height);

      ctx.strokeStyle = isSelected ? '#FFD700' : '#000000';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(item.x + 2, item.y + 2, item.width - 4, item.height - 4);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.type.toUpperCase(), item.x + item.width / 2, item.y + item.height / 2);

      ctx.restore();
    });
  }, [furniture, dragState, selectedItemId, mousePos]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-4">
      <div className="bg-slate-700 rounded-lg shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'monospace' }}>
            ROOM DESIGNER
          </h1>
          <Button
            onClick={toggleMute}
            variant="outline"
            size="icon"
            className="bg-slate-600 hover:bg-slate-500 border-slate-500"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
          </Button>
        </div>

        <div className="bg-slate-800 p-2 rounded">
          <canvas
            ref={canvasRef}
            width={ROOM_WIDTH}
            height={ROOM_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move border-4 border-slate-600 rounded"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleRotate}
            disabled={!selectedItemId}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
            style={{ fontFamily: 'monospace' }}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            ROTATE (R)
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
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3"
            style={{ fontFamily: 'monospace' }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            RESET
          </Button>
        </div>

        <div className="bg-slate-800 p-3 rounded text-sm text-gray-300" style={{ fontFamily: 'monospace' }}>
          <p>• Click and drag furniture to move</p>
          <p>• Press R or click ROTATE to rotate selected item</p>
          <p>• Furniture can't overlap or go outside walls</p>
          <p>{selectedItemId ? `Selected: ${selectedItemId.toUpperCase()}` : 'No item selected'}</p>
        </div>
      </div>
    </div>
  );
}
