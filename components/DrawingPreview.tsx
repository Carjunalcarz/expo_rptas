import React from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Text as SvgText,
  G
} from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

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

interface DrawingPreviewProps {
  drawingData: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  style?: any;
}

const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  drawingData,
  width = 120,
  height = 120,
  onPress,
  style
}) => {
  const [paths, setPaths] = React.useState<DrawingPath[]>([]);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
    
    if (!drawingData || typeof drawingData !== 'string') {
      console.log('Invalid drawing data provided:', typeof drawingData);
      setPaths([]);
      return;
    }

    try {
      const parsedData = JSON.parse(drawingData);
      console.log('Parsed drawing data type:', typeof parsedData, 'isArray:', Array.isArray(parsedData));
      
      // Handle both old format (array of paths) and new format (object with drawings and images)
      if (Array.isArray(parsedData)) {
        // Validate that all items in array are valid path objects
        const validPaths = parsedData.filter((item: any) => 
          item && typeof item === 'object' && item.id && item.type
        );
        setPaths(validPaths);
        console.log(`Set ${validPaths.length} valid paths from array format`);
      } else if (parsedData && typeof parsedData === 'object') {
        if (parsedData.drawings && Array.isArray(parsedData.drawings)) {
          const validPaths = parsedData.drawings.filter((item: any) => 
            item && typeof item === 'object' && item.id && item.type
          );
          setPaths(validPaths);
          console.log(`Set ${validPaths.length} valid paths from drawings property`);
        } else if (parsedData.paths && Array.isArray(parsedData.paths)) {
          // Handle legacy format with paths property
          const validPaths = parsedData.paths.filter((item: any) => 
            item && typeof item === 'object' && item.id && item.type
          );
          setPaths(validPaths);
          console.log(`Set ${validPaths.length} valid paths from legacy paths property`);
        } else {
          console.log('No valid paths array found in object:', Object.keys(parsedData));
          setPaths([]);
        }
      } else {
        console.log('Parsed data is not array or object:', parsedData);
        setPaths([]);
      }
    } catch (error) {
      console.error('Error parsing drawing data:', error);
      setHasError(true);
      setPaths([]);
    }
  }, [drawingData]);

  const renderPath = (path: DrawingPath, scale: number = 1) => {
    const scaledStrokeWidth = Math.max(0.5, path.strokeWidth * scale);
    
    switch (path.type) {
      case 'path':
        return (
          <Path
            key={path.id}
            d={path.data}
            stroke={path.color}
            strokeWidth={scaledStrokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      case 'rectangle':
        return (
          <Rect
            key={path.id}
            x={(path.x || 0) * scale}
            y={(path.y || 0) * scale}
            width={(path.width || 0) * scale}
            height={(path.height || 0) * scale}
            stroke={path.color}
            strokeWidth={scaledStrokeWidth}
            fill="none"
          />
        );
      case 'circle':
        return (
          <Circle
            key={path.id}
            cx={((path.x || 0) + (path.width || 0) / 2) * scale}
            cy={((path.y || 0) + (path.height || 0) / 2) * scale}
            r={(Math.min((path.width || 0), (path.height || 0)) / 2) * scale}
            stroke={path.color}
            strokeWidth={scaledStrokeWidth}
            fill="none"
          />
        );
      case 'line':
        return (
          <Line
            key={path.id}
            x1={(path.x || 0) * scale}
            y1={(path.y || 0) * scale}
            x2={((path.x || 0) + (path.width || 0)) * scale}
            y2={((path.y || 0) + (path.height || 0)) * scale}
            stroke={path.color}
            strokeWidth={scaledStrokeWidth}
          />
        );
      case 'dashed-line':
        return (
          <Line
            key={path.id}
            x1={(path.x || 0) * scale}
            y1={(path.y || 0) * scale}
            x2={((path.x || 0) + (path.width || 0)) * scale}
            y2={((path.y || 0) + (path.height || 0)) * scale}
            stroke={path.color}
            strokeWidth={scaledStrokeWidth}
            strokeDasharray="3,3"
          />
        );
      case 'door':
        return (
          <G key={path.id}>
            {/* Door frame */}
            <Rect
              x={(path.x || 0) * scale}
              y={(path.y || 0) * scale}
              width={(path.width || 0) * scale}
              height={(path.height || 0) * scale}
              stroke={path.color}
              strokeWidth={scaledStrokeWidth}
              fill="none"
            />
            {/* Door swing arc */}
            <Path
              d={`M ${(path.x || 0) * scale} ${(path.y || 0) * scale} A ${(path.width || 0) * scale} ${(path.width || 0) * scale} 0 0 1 ${((path.x || 0) + (path.width || 0)) * scale} ${((path.y || 0) + (path.width || 0)) * scale}`}
              stroke={path.color}
              strokeWidth={scaledStrokeWidth / 2}
              fill="none"
              strokeDasharray="2,2"
            />
          </G>
        );
      case 'window':
        return (
          <G key={path.id}>
            {/* Window frame */}
            <Rect
              x={(path.x || 0) * scale}
              y={(path.y || 0) * scale}
              width={(path.width || 0) * scale}
              height={(path.height || 0) * scale}
              stroke={path.color}
              strokeWidth={scaledStrokeWidth}
              fill="none"
            />
            {/* Window cross */}
            <Line
              x1={((path.x || 0) + (path.width || 0) / 2) * scale}
              y1={(path.y || 0) * scale}
              x2={((path.x || 0) + (path.width || 0) / 2) * scale}
              y2={((path.y || 0) + (path.height || 0)) * scale}
              stroke={path.color}
              strokeWidth={scaledStrokeWidth / 2}
            />
            <Line
              x1={(path.x || 0) * scale}
              y1={((path.y || 0) + (path.height || 0) / 2) * scale}
              x2={((path.x || 0) + (path.width || 0)) * scale}
              y2={((path.y || 0) + (path.height || 0) / 2) * scale}
              stroke={path.color}
              strokeWidth={scaledStrokeWidth / 2}
            />
          </G>
        );
      case 'text':
        return (
          <SvgText
            key={path.id}
            x={(path.x || 0) * scale}
            y={(path.y || 0) * scale}
            fontSize={Math.max(8, (path.strokeWidth * 6) * scale)}
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

  // Calculate scale to fit the preview
  const originalWidth = screenWidth - 40; // Original canvas width
  const originalHeight = screenWidth * 0.7; // Original canvas height
  const scaleX = width / originalWidth;
  const scaleY = height / originalHeight;
  const scale = Math.min(scaleX, scaleY);

  const content = (
    <View style={[{ width, height, backgroundColor: 'white', borderRadius: 8 }, style]}>
      <Svg width={width} height={height} viewBox={`0 0 ${originalWidth} ${originalHeight}`}>
        {/* Grid Background (scaled down) */}
        <G opacity={0.3}>
          {Array.from({ length: Math.floor(originalWidth / 40) }).map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={i * 40}
              y1={0}
              x2={i * 40}
              y2={originalHeight}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: Math.floor(originalHeight / 40) }).map((_, i) => (
            <Line
              key={`h-${i}`}
              x1={0}
              y1={i * 40}
              x2={originalWidth}
              y2={i * 40}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}
        </G>

        {/* Drawing Paths */}
        <G>
          {Array.isArray(paths) && paths.length > 0 ? 
            paths.map((path, index) => {
              try {
                return renderPath(path, scale);
              } catch (error) {
                console.error(`Error rendering path ${index}:`, error);
                return null;
              }
            }).filter(Boolean) : null}
        </G>
      </Svg>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default DrawingPreview;
