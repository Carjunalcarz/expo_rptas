import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Models } from 'react-native-appwrite';
import { navigateToRemoteAssessment } from '@/lib/navigation';
import images from '@/constants/images';

interface AssessmentCardProps {
  item: Models.Document;
  type: 'featured' | 'list';
}

// Helper to safely parse JSON and extract image
const getAssessmentImage = (item: Models.Document) => {
  try {
    const appraisal = JSON.parse(item.property_appraisal || '{}');
    if (appraisal.gallery && appraisal.gallery.length > 0) {
      const firstImage = appraisal.gallery[0]?.image;
      if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
        return firstImage;
      }
    }
  } catch {}
  return null;
};

const AssessmentCard = ({ item, type }: AssessmentCardProps) => {
  const imageUrl = getAssessmentImage(item);
  const ownerName = item.ownerName || 'Unnamed Owner';
  const address = `${item.barangay || ''}, ${item.municipality || ''}`.trim();

  if (type === 'featured') {
    return (
      <TouchableOpacity
        onPress={() => navigateToRemoteAssessment(item.$id)}
        className="w-64 mr-5"
      >
        <Image
          source={imageUrl ? { uri: imageUrl } : images.cardGradient}
          className="w-64 h-40 rounded-2xl bg-gray-200"
          resizeMode="cover"
        />
        <View className="mt-2">
          <Text className="text-base font-rubik-medium text-gray-800" numberOfLines={1}>
            {ownerName}
          </Text>
          {address !== ',' && (
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
              {address}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => navigateToRemoteAssessment(item.$id)}
      className="flex-row items-center py-3"
    >
      <Image
        source={imageUrl ? { uri: imageUrl } : images.cardGradient}
        className="w-12 h-12 rounded-lg mr-3 bg-gray-200"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="text-sm font-rubik-medium text-gray-800" numberOfLines={1}>
          {ownerName}
        </Text>
        {address !== ',' && (
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {address}
          </Text>
        )}
        <Text className="text-[10px] text-gray-400 mt-0.5">
          {new Date(item.$createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default AssessmentCard;
