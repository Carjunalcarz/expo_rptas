import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Text as SvgText,
  G,
  Defs,
  Pattern
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PRIMARY_COLOR } from '../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DrawingPath {
  id: string;
  type: 'path' | 'rectangle' | 'circle' | 'line' | 'dashed-line' | 'text' | 'door' | 'window';
  data: string;
  color: string;
  strokeWidth: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
}

interface FloorPlanDrawingProps {
  visible: boolean;
  onClose: () => void;
  onSave: (drawingData: string, imageBase64?: string) => void;
  initialDrawing?: string;
  floorPlanImages?: string[];
}

const FloorPlanDrawing: React.FC<FloorPlanDrawingProps> = ({
  visible,
  onClose,
  onSave,
  initialDrawing,
  floorPlanImages = []
}) => {
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'dashed-line' | 'text' | 'door' | 'window' | 'select'>('pen');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<DrawingPath | null>(null);
  const [selectedShape, setSelectedShape] = useState<DrawingPath | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [firstPoint, setFirstPoint] = useState<{x: number, y: number} | null>(null);
  const [isWaitingForSecondPoint, setIsWaitingForSecondPoint] = useState(false);

  const drawingRef = useRef<any>(null);
  const canvasWidth = screenWidth - 40;
  const canvasHeight = screenHeight * 0.7;

  // Snap to grid helper function
  const snapToGridPoint = (x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  // Helper function to check if a point is inside a shape
  const getShapeAtPoint = (x: number, y: number): DrawingPath | null => {
    for (let i = paths.length - 1; i >= 0; i--) {
      const path = paths[i];
      if (path.type !== 'path' && path.x !== undefined && path.y !== undefined && 
          path.width !== undefined && path.height !== undefined) {
        if (x >= path.x && x <= path.x + path.width && 
            y >= path.y && y <= path.y + path.height) {
          return path;
        }
      }
    }
    return null;
  };

  // Helper function to get resize handle at point
  const getResizeHandle = (x: number, y: number, shape: DrawingPath): 'tl' | 'tr' | 'bl' | 'br' | null => {
    if (!shape.x || !shape.y || !shape.width || !shape.height) return null;
    
    const handleSize = 10;
    const { x: sx, y: sy, width, height } = shape;
    
    // Top-left
    if (x >= sx - handleSize && x <= sx + handleSize && 
        y >= sy - handleSize && y <= sy + handleSize) return 'tl';
    
    // Top-right
    if (x >= sx + width - handleSize && x <= sx + width + handleSize && 
        y >= sy - handleSize && y <= sy + handleSize) return 'tr';
    
    // Bottom-left
    if (x >= sx - handleSize && x <= sx + handleSize && 
        y >= sy + height - handleSize && y <= sy + height + handleSize) return 'bl';
    
    // Bottom-right
    if (x >= sx + width - handleSize && x <= sx + width + handleSize && 
        y >= sy + height - handleSize && y <= sy + height + handleSize) return 'br';
    
    return null;
  };

  // Load initial drawing if provided
  React.useEffect(() => {
    if (initialDrawing && visible) {
      try {
        const parsedData = JSON.parse(initialDrawing);
        console.log('Parsed drawing data type:', typeof parsedData, 'isArray:', Array.isArray(parsedData));
        
        // Handle new format with drawings, images, metadata structure
        if (parsedData && typeof parsedData === 'object' && parsedData.drawings) {
          console.log('Loading new format with drawings property');
          if (Array.isArray(parsedData.drawings)) {
            setPaths(parsedData.drawings);
            console.log('Set', parsedData.drawings.length, 'valid paths from drawings property');
          } else {
            console.log('Drawings property is not an array, initializing empty paths');
            setPaths([]);
          }
        }
        // Handle legacy format (direct array of paths)
        else if (Array.isArray(parsedData)) {
          console.log('Loading legacy format (direct array)');
          setPaths(parsedData);
          console.log('Set', parsedData.length, 'paths from legacy format');
        }
        // Fallback for invalid data
        else {
          console.log('Invalid drawing data format, initializing empty paths');
          setPaths([]);
        }
      } catch (error) {
        console.log('Error loading initial drawing:', error);
        setPaths([]);
      }
    } else {
      // Reset paths when no initial drawing or not visible
      setPaths([]);
    }
  }, [initialDrawing, visible]);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#A52A2A'
  ];

  const strokeWidths = [1, 2, 4, 6, 8];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      if (selectedTool === 'text') {
        setTextPosition({ x: locationX, y: locationY });
        setShowTextInput(true);
        return;
      }

      // Handle two-point line drawing
      if ((selectedTool === 'line' || selectedTool === 'dashed-line') && !isWaitingForSecondPoint) {
        const snapped = snapToGridPoint(locationX, locationY);
        setFirstPoint(snapped);
        setIsWaitingForSecondPoint(true);
        return;
      }

      if ((selectedTool === 'line' || selectedTool === 'dashed-line') && isWaitingForSecondPoint && firstPoint) {
        const snapped = snapToGridPoint(locationX, locationY);
        
        // Create line from first point to second point
        const newLine: DrawingPath = {
          id: Date.now().toString(),
          type: selectedTool as 'line' | 'dashed-line',
          data: '',
          color: selectedColor,
          strokeWidth: strokeWidth,
          x: Math.min(firstPoint.x, snapped.x),
          y: Math.min(firstPoint.y, snapped.y),
          width: Math.abs(snapped.x - firstPoint.x),
          height: Math.abs(snapped.y - firstPoint.y)
        };
        
        setPaths(prev => [...prev, newLine]);
        setFirstPoint(null);
        setIsWaitingForSecondPoint(false);
        return;
      }

      if (selectedTool === 'select') {
        // Check if we're clicking on a resize handle
        if (selectedShape) {
          const handle = getResizeHandle(locationX, locationY, selectedShape);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setStartPoint({ x: locationX, y: locationY });
            return;
          }
        }

        // Check if we're selecting a shape
        const clickedShape = getShapeAtPoint(locationX, locationY);
        setSelectedShape(clickedShape);
        if (!clickedShape) {
          setIsDrawing(false);
          return;
        }

        // If we clicked on a shape, prepare for moving
        if (clickedShape) {
          setIsMoving(true);
          setMoveOffset({
            x: locationX - (clickedShape.x || 0),
            y: locationY - (clickedShape.y || 0)
          });
          setStartPoint({ x: locationX, y: locationY });
        }
      }

      setIsDrawing(true);
      setStartPoint({ x: locationX, y: locationY });
      
      if (selectedTool === 'pen' || selectedTool === 'eraser') {
        const newPath = `M${locationX},${locationY}`;
        setCurrentPath(newPath);
      } else if (['rectangle', 'circle', 'door', 'window'].includes(selectedTool)) {
        // Initialize shape
        const newShape: DrawingPath = {
          id: Date.now().toString(),
          type: selectedTool as any,
          data: '',
          color: selectedColor,
          strokeWidth: strokeWidth,
          x: locationX,
          y: locationY,
          width: 0,
          height: 0
        };
        setCurrentShape(newShape);
      }
    },

    onPanResponderMove: (evt) => {
      if (!isDrawing && !isResizing && !isMoving) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      
      if (isMoving && selectedShape) {
        // Handle shape moving with snap to grid
        const rawX = locationX - moveOffset.x;
        const rawY = locationY - moveOffset.y;
        const snapped = snapToGridPoint(rawX, rawY);
        
        const newX = Math.max(0, Math.min(canvasWidth - (selectedShape.width || 0), snapped.x));
        const newY = Math.max(0, Math.min(canvasHeight - (selectedShape.height || 0), snapped.y));
        
        setPaths(prev => prev.map(path => {
          if (path.id === selectedShape.id) {
            return {
              ...path,
              x: newX,
              y: newY
            };
          }
          return path;
        }));
        
        setSelectedShape(prev => prev ? {
          ...prev,
          x: newX,
          y: newY
        } : null);
        
      } else if (isResizing && selectedShape && resizeHandle) {
        // Handle shape resizing
        const deltaX = locationX - startPoint.x;
        const deltaY = locationY - startPoint.y;
        
        setPaths(prev => prev.map(path => {
          if (path.id === selectedShape.id) {
            const newShape = { ...path };
            
            switch (resizeHandle) {
              case 'tl':
                newShape.x = (path.x || 0) + deltaX;
                newShape.y = (path.y || 0) + deltaY;
                newShape.width = (path.width || 0) - deltaX;
                newShape.height = (path.height || 0) - deltaY;
                break;
              case 'tr':
                newShape.y = (path.y || 0) + deltaY;
                newShape.width = (path.width || 0) + deltaX;
                newShape.height = (path.height || 0) - deltaY;
                break;
              case 'bl':
                newShape.x = (path.x || 0) + deltaX;
                newShape.width = (path.width || 0) - deltaX;
                newShape.height = (path.height || 0) + deltaY;
                break;
              case 'br':
                newShape.width = (path.width || 0) + deltaX;
                newShape.height = (path.height || 0) + deltaY;
                break;
            }
            
            // Ensure minimum size
            newShape.width = Math.max(10, newShape.width || 0);
            newShape.height = Math.max(10, newShape.height || 0);
            
            return newShape;
          }
          return path;
        }));
        
        setSelectedShape(prev => prev ? {
          ...prev,
          ...paths.find(p => p.id === selectedShape.id)
        } : null);
        
      } else if (selectedTool === 'pen' || selectedTool === 'eraser') {
        setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
      } else if (currentShape && ['rectangle', 'circle', 'door', 'window'].includes(selectedTool)) {
        // Update shape dimensions with snap to grid
        const width = locationX - startPoint.x;
        const height = locationY - startPoint.y;
        const snapped = snapToGridPoint(locationX, locationY);
        
        setCurrentShape(prev => prev ? {
          ...prev,
          width: Math.abs(snapped.x - startPoint.x),
          height: Math.abs(snapped.y - startPoint.y),
          x: snapped.x < startPoint.x ? snapped.x : startPoint.x,
          y: snapped.y < startPoint.y ? snapped.y : startPoint.y
        } : null);
      }
    },

    onPanResponderRelease: (evt) => {
      if (!isDrawing) return;
      
      const { locationX, locationY } = evt.nativeEvent;
      setIsDrawing(false);

      if (selectedTool === 'pen' || selectedTool === 'eraser') {
        const newPathObj: DrawingPath = {
          id: Date.now().toString(),
          type: 'path',
          data: currentPath,
          color: selectedTool === 'eraser' ? '#FFFFFF' : selectedColor,
          strokeWidth: selectedTool === 'eraser' ? strokeWidth * 2 : strokeWidth
        };
        
        setPaths(prev => [...prev, newPathObj]);
        setCurrentPath('');
      } else if (currentShape && ['rectangle', 'circle', 'door', 'window'].includes(selectedTool)) {
        // Add completed shape
        if (currentShape.width && currentShape.height) {
          setPaths(prev => [...prev, currentShape]);
        }
        setCurrentShape(null);
      }
      
      // Reset resize and move state
      setIsResizing(false);
      setResizeHandle(null);
      setIsMoving(false);
    }
  });

  const addText = () => {
    if (textInput.trim()) {
      const newText: DrawingPath = {
        id: Date.now().toString(),
        type: 'text',
        data: '',
        color: selectedColor,
        strokeWidth: strokeWidth,
        x: textPosition.x,
        y: textPosition.y,
        text: textInput
      };
      
      setPaths(prev => [...prev, newText]);
      setTextInput('');
      setShowTextInput(false);
    }
  };

  const clearCanvas = () => {
    Alert.alert(
      'Clear Drawing',
      'Are you sure you want to clear the entire drawing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setPaths([]) }
      ]
    );
  };

  const undoLastAction = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const convertToPng = async (): Promise<string | null> => {
    try {
      // Skip conversion if no paths to draw
      if (!paths || !Array.isArray(paths) || paths.length === 0) {
        console.log('No paths to convert, skipping PNG generation');
        return null;
      }

      console.log(`Converting ${paths.length} paths to PNG`);
      
      // Use react-native-view-shot to capture the drawing area
      const { captureRef } = require('react-native-view-shot');
      
      if (drawingRef.current) {
        const uri = await captureRef(drawingRef.current, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile', // Save as temporary file, not base64
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: '#ffffff'
        });
        
        console.log('Successfully converted to PNG file:', uri);
        return uri;
      } else {
        console.error('Drawing ref not available');
        return null;
      }
      
    } catch (error) {
      console.error('Error converting drawing to PNG:', error);
      // Fallback: try to install react-native-view-shot if not available
      if (error instanceof Error && error.message && error.message.includes('Cannot find module')) {
        console.log('react-native-view-shot not found. Please install it with: npm install react-native-view-shot');
      }
      return null;
    }
  };

  const saveDrawing = async () => {
    const floorPlanData = {
      drawings: paths,
      images: floorPlanImages,
      metadata: {
        createdAt: new Date().toISOString(),
        canvasWidth,
        canvasHeight,
        gridSize,
        snapToGrid
      }
    };
    const combinedData = JSON.stringify(floorPlanData);
    
    // Convert drawing to PNG image
    const pngUri = await convertToPng();
    
    onSave(combinedData, pngUri ?? undefined);
    onClose();
  };

  const bringToFront = () => {
    if (selectedShape) {
      setPaths(prev => {
        const filtered = prev.filter(p => p.id !== selectedShape.id);
        return [...filtered, selectedShape];
      });
    }
  };

  const sendToBack = () => {
    if (selectedShape) {
      setPaths(prev => {
        const filtered = prev.filter(p => p.id !== selectedShape.id);
        return [selectedShape, ...filtered];
      });
    }
  };

  const deleteSelectedShape = () => {
    if (selectedShape) {
      setPaths(prev => prev.filter(p => p.id !== selectedShape.id));
      setSelectedShape(null);
    }
  };

  const updateShapeProperties = (updates: Partial<DrawingPath>) => {
    if (selectedShape) {
      setPaths(prev => prev.map(path => 
        path.id === selectedShape.id ? { ...path, ...updates } : path
      ));
      setSelectedShape(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const renderResizeHandles = (shape: DrawingPath) => {
    if (!shape.x || !shape.y || !shape.width || !shape.height) return null;
    
    const handleSize = 8;
    const { x, y, width, height } = shape;
    
    return (
      <G key={`handles-${shape.id}`}>
        {/* Top-left */}
        <Rect
          x={x - handleSize / 2}
          y={y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#007AFF"
          stroke="#FFF"
          strokeWidth={1}
        />
        {/* Top-right */}
        <Rect
          x={x + width - handleSize / 2}
          y={y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#007AFF"
          stroke="#FFF"
          strokeWidth={1}
        />
        {/* Bottom-left */}
        <Rect
          x={x - handleSize / 2}
          y={y + height - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#007AFF"
          stroke="#FFF"
          strokeWidth={1}
        />
        {/* Bottom-right */}
        <Rect
          x={x + width - handleSize / 2}
          y={y + height - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="#007AFF"
          stroke="#FFF"
          strokeWidth={1}
        />
      </G>
    );
  };

  const renderPath = (path: DrawingPath) => {
    switch (path.type) {
      case 'path':
        return (
          <Path
            key={path.id}
            d={path.data}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={path.id}
            x={path.x}
            y={path.y}
            width={path.width}
            height={path.height}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            fill="none"
          />
        );
      case 'circle':
        return (
          <Circle
            key={path.id}
            cx={(path.x || 0) + (path.width || 0) / 2}
            cy={(path.y || 0) + (path.height || 0) / 2}
            r={Math.min((path.width || 0), (path.height || 0)) / 2}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            fill="none"
          />
        );
      case 'line':
        return (
          <Line
            key={path.id}
            x1={path.x}
            y1={path.y}
            x2={(path.x || 0) + (path.width || 0)}
            y2={(path.y || 0) + (path.height || 0)}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
          />
        );
      case 'dashed-line':
        return (
          <Line
            key={path.id}
            x1={path.x}
            y1={path.y}
            x2={(path.x || 0) + (path.width || 0)}
            y2={(path.y || 0) + (path.height || 0)}
            stroke={path.color}
            strokeWidth={path.strokeWidth}
            strokeDasharray="5,5"
          />
        );
      case 'door':
        return (
          <G key={path.id}>
            {/* Door frame */}
            <Rect
              x={path.x}
              y={path.y}
              width={path.width}
              height={path.height}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              fill="none"
            />
            {/* Door swing arc */}
            <Path
              d={`M ${path.x} ${path.y} A ${path.width} ${path.width} 0 0 1 ${(path.x || 0) + (path.width || 0)} ${(path.y || 0) + (path.width || 0)}`}
              stroke={path.color}
              strokeWidth={path.strokeWidth / 2}
              fill="none"
              strokeDasharray="3,3"
            />
          </G>
        );
      case 'window':
        return (
          <G key={path.id}>
            {/* Window frame */}
            <Rect
              x={path.x}
              y={path.y}
              width={path.width}
              height={path.height}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              fill="none"
            />
            {/* Window cross */}
            <Line
              x1={(path.x || 0) + (path.width || 0) / 2}
              y1={path.y}
              x2={(path.x || 0) + (path.width || 0) / 2}
              y2={(path.y || 0) + (path.height || 0)}
              stroke={path.color}
              strokeWidth={path.strokeWidth / 2}
            />
            <Line
              x1={path.x}
              y1={(path.y || 0) + (path.height || 0) / 2}
              x2={(path.x || 0) + (path.width || 0)}
              y2={(path.y || 0) + (path.height || 0) / 2}
              stroke={path.color}
              strokeWidth={path.strokeWidth / 2}
            />
          </G>
        );
      case 'text':
        return (
          <SvgText
            key={path.id}
            x={path.x}
            y={path.y}
            fontSize={path.strokeWidth * 6}
            fill={path.color}
            fontFamily="Arial"
          >
            {path.text}
          </SvgText>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text className="text-lg font-rubik-medium">Floor Plan Drawing</Text>
          <TouchableOpacity onPress={saveDrawing}>
            <Icon name="save" size={24} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>

        {/* Tools - Split into two rows for better mobile visibility */}
        <View className="bg-gray-50 border-b border-gray-200">
          {/* First Row - Drawing Tools */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="p-2"
            contentContainerStyle={{ paddingHorizontal: 8 }}
          >
            <View className="flex-row items-center space-x-2">
              {/* Drawing Tools */}
              <TouchableOpacity
                onPress={() => setSelectedTool('select')}
                className={`p-3 rounded-lg ${selectedTool === 'select' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="near-me" size={18} color={selectedTool === 'select' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('pen')}
                className={`p-3 rounded-lg ${selectedTool === 'pen' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="edit" size={18} color={selectedTool === 'pen' ? 'white' : '#666'} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setSelectedTool('eraser')}
                className={`p-3 rounded-lg ${selectedTool === 'eraser' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="clear" size={18} color={selectedTool === 'eraser' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('text')}
                className={`p-3 rounded-lg ${selectedTool === 'text' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="text-fields" size={18} color={selectedTool === 'text' ? 'white' : '#666'} />
              </TouchableOpacity>

              {/* Shape Tools */}
              <TouchableOpacity
                onPress={() => setSelectedTool('rectangle')}
                className={`p-3 rounded-lg ${selectedTool === 'rectangle' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="crop-din" size={18} color={selectedTool === 'rectangle' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('circle')}
                className={`p-3 rounded-lg ${selectedTool === 'circle' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="radio-button-unchecked" size={18} color={selectedTool === 'circle' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('line')}
                className={`p-3 rounded-lg ${selectedTool === 'line' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="remove" size={18} color={selectedTool === 'line' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('dashed-line')}
                className={`p-3 rounded-lg ${selectedTool === 'dashed-line' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="more-horiz" size={18} color={selectedTool === 'dashed-line' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('door')}
                className={`p-3 rounded-lg ${selectedTool === 'door' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="meeting-room" size={18} color={selectedTool === 'door' ? 'white' : '#666'} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTool('window')}
                className={`p-3 rounded-lg ${selectedTool === 'window' ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Icon name="web-asset" size={18} color={selectedTool === 'window' ? 'white' : '#666'} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Second Row - Action Tools */}
          <View className="flex-row items-center justify-between px-4 pb-2">
            <View className="flex-row items-center space-x-3">
              {/* Color Picker */}
              <TouchableOpacity
                onPress={() => setShowColorPicker(!showColorPicker)}
                className="w-10 h-10 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: selectedColor }}
              />
            </View>

            <View className="flex-row items-center space-x-2">
              {/* Undo - Made more prominent */}
              <TouchableOpacity 
                onPress={undoLastAction} 
                className="p-3 bg-blue-100 rounded-lg border border-blue-200"
              >
                <Icon name="undo" size={22} color="#007AFF" />
              </TouchableOpacity>

              {/* Clear */}
              <TouchableOpacity 
                onPress={clearCanvas} 
                className="p-3 bg-red-100 rounded-lg border border-red-200"
              >
                <Icon name="delete" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Layer Controls - Show when shape is selected */}
        {selectedShape && selectedTool === 'select' && (
          <View className="flex-row items-center justify-center p-3 bg-blue-50 border-b border-blue-200">
            <Text className="text-sm font-rubik-medium text-blue-800 mr-4">Selected Shape:</Text>
            
            <TouchableOpacity 
              onPress={sendToBack} 
              className="p-2 mx-1 bg-blue-100 rounded"
            >
              <Icon name="flip-to-back" size={18} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={bringToFront} 
              className="p-2 mx-1 bg-blue-100 rounded"
            >
              <Icon name="flip-to-front" size={18} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={deleteSelectedShape} 
              className="p-2 mx-1 bg-red-100 rounded"
            >
              <Icon name="delete-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowPropertiesPanel(!showPropertiesPanel)} 
              className="p-2 mx-1 bg-green-100 rounded"
            >
              <Icon name="settings" size={18} color="#34C759" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setSelectedShape(null)} 
              className="p-2 mx-1 bg-gray-100 rounded"
            >
              <Icon name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Two-Point Line Status */}
        {isWaitingForSecondPoint && (
          <View className="p-3 bg-yellow-50 border-b border-yellow-200">
            <Text className="text-center text-yellow-800 font-rubik-medium">
              Click second point to complete the line
            </Text>
            <TouchableOpacity
              onPress={() => {
                setFirstPoint(null);
                setIsWaitingForSecondPoint(false);
              }}
              className="mt-2 self-center px-3 py-1 bg-yellow-100 rounded"
            >
              <Text className="text-yellow-700 text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid and Snap Controls */}
        <View className="flex-row items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={() => setSnapToGrid(!snapToGrid)}
              className={`flex-row items-center p-2 rounded ${snapToGrid ? 'bg-blue-100' : 'bg-gray-100'}`}
            >
              <Icon name="grid-on" size={16} color={snapToGrid ? '#007AFF' : '#666'} />
              <Text className={`ml-1 text-xs ${snapToGrid ? 'text-blue-600' : 'text-gray-600'}`}>Snap</Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-600 mr-2">Grid:</Text>
              <TouchableOpacity
                onPress={() => setGridSize(10)}
                className={`px-2 py-1 rounded ${gridSize === 10 ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs ${gridSize === 10 ? 'text-blue-600' : 'text-gray-600'}`}>10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGridSize(20)}
                className={`px-2 py-1 rounded mx-1 ${gridSize === 20 ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs ${gridSize === 20 ? 'text-blue-600' : 'text-gray-600'}`}>20</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGridSize(50)}
                className={`px-2 py-1 rounded ${gridSize === 50 ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text className={`text-xs ${gridSize === 50 ? 'text-blue-600' : 'text-gray-600'}`}>50</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Color Picker */}
        {showColorPicker && (
          <View className="flex-row items-center justify-center p-3 bg-gray-100 border-b border-gray-200">
            {colors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => {
                  setSelectedColor(color);
                  setShowColorPicker(false);
                }}
                className="w-8 h-8 rounded mx-1 border-2 border-gray-300"
                style={{ backgroundColor: color }}
              />
            ))}
          </View>
        )}

        {/* Stroke Width Selector */}
        <View className="flex-row items-center justify-center p-3 bg-gray-50 border-b border-gray-200">
          <Text className="text-sm font-rubik mr-3">Brush Size:</Text>
          {strokeWidths.map((width) => (
            <TouchableOpacity
              key={width}
              onPress={() => setStrokeWidth(width)}
              className={`mx-2 p-2 rounded ${strokeWidth === width ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <View
                className="rounded-full bg-black"
                style={{ width: width * 2 + 4, height: width * 2 + 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Drawing Canvas */}
        <View className="flex-1 items-center justify-center bg-gray-100">
          <View
            ref={drawingRef}
            className="bg-white border border-gray-300 rounded-lg"
            style={{ width: canvasWidth, height: canvasHeight }}
            {...panResponder.panHandlers}
          >
            <Svg width={canvasWidth} height={canvasHeight}>
              {/* Grid Background */}
              <G>
                {Array.from({ length: Math.floor(canvasWidth / 20) }).map((_, i) => (
                  <Line
                    key={`v-${i}`}
                    x1={i * 20}
                    y1={0}
                    x2={i * 20}
                    y2={canvasHeight}
                    stroke="#f0f0f0"
                    strokeWidth={0.5}
                  />
                ))}
                {Array.from({ length: Math.floor(canvasHeight / 20) }).map((_, i) => (
                  <Line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * 20}
                    x2={canvasWidth}
                    y2={i * 20}
                    stroke="#f0f0f0"
                    strokeWidth={0.5}
                  />
                ))}
              </G>

              {/* Saved Paths */}
              {paths && Array.isArray(paths) ? paths.map(renderPath) : null}

              {/* Current Path */}
              {currentPath && (
                <Path
                  d={currentPath}
                  stroke={selectedTool === 'eraser' ? '#FFFFFF' : selectedColor}
                  strokeWidth={selectedTool === 'eraser' ? strokeWidth * 2 : strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Current Shape Preview */}
              {currentShape && renderPath(currentShape)}

              {/* First Point Indicator for Two-Point Line Drawing */}
              {firstPoint && isWaitingForSecondPoint && (
                <Circle
                  cx={firstPoint.x}
                  cy={firstPoint.y}
                  r={4}
                  fill="#007AFF"
                  stroke="#FFF"
                  strokeWidth={2}
                />
              )}

              {/* Resize Handles for Selected Shape */}
              {selectedShape && selectedTool === 'select' && renderResizeHandles(selectedShape)}
            </Svg>
          </View>
        </View>

        {/* Properties Panel */}
        {showPropertiesPanel && selectedShape && (
          <View className="p-4 bg-white border-b border-gray-200">
            <Text className="text-lg font-rubik-medium mb-3">Shape Properties</Text>
            
            <View className="flex-row flex-wrap">
              {/* Position */}
              <View className="w-1/2 pr-2 mb-3">
                <Text className="text-sm font-rubik text-gray-600 mb-1">X Position</Text>
                <TextInput
                  value={String(Math.round(selectedShape.x || 0))}
                  onChangeText={(text) => {
                    const x = parseInt(text) || 0;
                    updateShapeProperties({ x });
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  keyboardType="numeric"
                />
              </View>
              
              <View className="w-1/2 pl-2 mb-3">
                <Text className="text-sm font-rubik text-gray-600 mb-1">Y Position</Text>
                <TextInput
                  value={String(Math.round(selectedShape.y || 0))}
                  onChangeText={(text) => {
                    const y = parseInt(text) || 0;
                    updateShapeProperties({ y });
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  keyboardType="numeric"
                />
              </View>
              
              {/* Dimensions */}
              {selectedShape.type !== 'text' && (
                <>
                  <View className="w-1/2 pr-2 mb-3">
                    <Text className="text-sm font-rubik text-gray-600 mb-1">Width</Text>
                    <TextInput
                      value={String(Math.round(selectedShape.width || 0))}
                      onChangeText={(text) => {
                        const width = parseInt(text) || 10;
                        updateShapeProperties({ width });
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View className="w-1/2 pl-2 mb-3">
                    <Text className="text-sm font-rubik text-gray-600 mb-1">Height</Text>
                    <TextInput
                      value={String(Math.round(selectedShape.height || 0))}
                      onChangeText={(text) => {
                        const height = parseInt(text) || 10;
                        updateShapeProperties({ height });
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      keyboardType="numeric"
                    />
                  </View>
                </>
              )}
              
              {/* Stroke Width */}
              <View className="w-1/2 pr-2 mb-3">
                <Text className="text-sm font-rubik text-gray-600 mb-1">Line Width</Text>
                <TextInput
                  value={String(selectedShape.strokeWidth || 2)}
                  onChangeText={(text) => {
                    const strokeWidth = parseInt(text) || 1;
                    updateShapeProperties({ strokeWidth });
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  keyboardType="numeric"
                />
              </View>
              
              {/* Color */}
              <View className="w-1/2 pl-2 mb-3">
                <Text className="text-sm font-rubik text-gray-600 mb-1">Color</Text>
                <View className="flex-row items-center">
                  <View 
                    className="w-8 h-8 rounded border border-gray-300 mr-2"
                    style={{ backgroundColor: selectedShape.color }}
                  />
                  <TextInput
                    value={selectedShape.color}
                    onChangeText={(text) => updateShapeProperties({ color: text })}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="#000000"
                  />
                </View>
              </View>
            </View>
            
            {/* Quick Actions */}
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => {
                  const snapped = snapToGridPoint(selectedShape.x || 0, selectedShape.y || 0);
                  updateShapeProperties(snapped);
                }}
                className="bg-blue-100 px-3 py-2 rounded"
              >
                <Text className="text-blue-600 text-sm font-rubik">Snap to Grid</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowPropertiesPanel(false)}
                className="bg-gray-100 px-3 py-2 rounded"
              >
                <Text className="text-gray-600 text-sm font-rubik">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Text Input Modal */}
        <Modal
          visible={showTextInput}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black bg-opacity-50 items-center justify-center">
            <View className="bg-white p-6 rounded-lg mx-4 w-80">
              <Text className="text-lg font-rubik-medium mb-4">Add Text</Text>
              <TextInput
                value={textInput}
                onChangeText={setTextInput}
                placeholder="Enter text..."
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
                multiline
                autoFocus
              />
              <View className="flex-row justify-end space-x-2">
                <TouchableOpacity
                  onPress={() => {
                    setShowTextInput(false);
                    setTextInput('');
                  }}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  <Text className="font-rubik">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addText}
                  className="px-4 py-2 rounded"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <Text className="font-rubik text-white">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Instructions */}
        <View className="p-3 bg-blue-50 border-t border-blue-200">
          <Text className="text-sm font-rubik text-blue-800 text-center">
            {selectedTool === 'pen' && 'Draw with your finger to create floor plan lines'}
            {selectedTool === 'eraser' && 'Tap and drag to erase parts of your drawing'}
            {selectedTool === 'text' && 'Tap anywhere to add text labels'}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default FloorPlanDrawing;
