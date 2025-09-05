import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Button,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import icons from "@/constants/icons";
import images from "@/constants/images";
import Search from "@/components/Search";
import NoResults from "@/components/NoResults";
import { Card, FeaturedCard } from "@/components/Cards";

import { useAppwrite } from "@/lib/useAppwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { listAssessmentDocuments } from "@/lib/appwrite";
import { navigateToRemoteAssessment, navigateToRemoteAssessments } from "@/lib/navigation";
import seed from "@/lib/seed";

const Home = () => {
  const { user } = useGlobalContext();
  const [location, setLocation] = useState<string>("Getting location...");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { data: latestAssessments, loading: latestAssessmentsLoading } =
    useAppwrite({
      fn: listAssessmentDocuments,
    });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation("Location access denied");
        return;
      }

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Store coordinates for Google Maps
      setCoordinates({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address.length > 0) {
        const { city, region, country } = address[0];
        const locationString = [city, region, country]
          .filter(Boolean)
          .join(", ");
        setLocation(locationString || "Location found");
      } else {
        setLocation("Location found");
      }
    } catch (error) {
      console.log("Error getting location:", error);
      setLocation("Unable to get location");
    }
  };

  // No property grid; Home focuses on remote assessments sections

  const openGoogleMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`;
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      {/* |<Button  title="Seed" onPress={seed} /> */}
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={(item, index) => String(index)}
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row">
                <Image
                  // source={{ uri: user?.avatar }}
                  source={images.avatar}
                  className="size-12 rounded-full"
                />

                <View className="flex flex-col items-start ml-2 justify-center">
                  <TouchableOpacity
                    onPress={openGoogleMaps}
                    disabled={!coordinates}
                    className="flex flex-row items-center"
                  >
                    <Text className="text-xs font-rubik text-black-100">
                      {location}
                    </Text>
                    {coordinates && (
                      <Image
                        source={icons.location}
                        className="size-3 ml-1"
                        tintColor="#666"
                      />
                    )}
                  </TouchableOpacity>
                  <Text className="text-base font-rubik-medium text-black-300">
                    {user?.name}
                  </Text>
                </View>
              </View>
              <Image source={icons.bell} className="size-6" />
            </View>

            <Search />

            <View className="my-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Remote Assessments
                </Text>
                <TouchableOpacity onPress={navigateToRemoteAssessments}>
                  <Text className="text-base font-rubik-bold text-primary-300">
                    See all
                  </Text>
                </TouchableOpacity>
              </View>

              {latestAssessmentsLoading ? (
                <ActivityIndicator size="large" className="text-primary-300" />
              ) : !latestAssessments || latestAssessments.length === 0 ? (
                <NoResults />
              ) : (
                <FlatList
                  data={latestAssessments.slice(0, 10)}
                  renderItem={({ item }: { item: any }) => {
                    let loc: any = {};
                    let owner: any = {};
                    try {
                      loc = JSON.parse(item.building_location || '{}');
                    } catch { }
                    try {
                      owner = JSON.parse(item.owner_details || '{}');
                    } catch { }
                    const pickUri = (x: any): string | undefined => {
                      if (!x) return undefined;
                      if (typeof x === 'string') return x;
                      if (typeof x === 'object') return x.uri || x.url || x.image || x.src;
                      return undefined;
                    };
                    let img: string | undefined;
                    if (Array.isArray(loc?.buildingImages)) {
                      for (const it of loc.buildingImages) { const u = pickUri(it); if (u) { img = u; break; } }
                    }
                    if (!img && Array.isArray(loc?.images)) {
                      for (const it of loc.images) { const u = pickUri(it); if (u) { img = u; break; } }
                    }
                    if (!img) img = pickUri(loc?.image);
                    const address = [loc?.street, loc?.barangay, loc?.municipality, loc?.province].filter(Boolean).join(', ');
                    return (
                      <TouchableOpacity
                        onPress={() => navigateToRemoteAssessment(item.$id)}
                        className="w-64 mr-5"
                      >
                        <Image source={img ? { uri: img } : images.noResult} className="w-64 h-40 rounded-2xl" resizeMode="cover" />
                        <View className="mt-2">
                          <Text className="text-base font-rubik-medium text-gray-800" numberOfLines={1}>{owner?.owner || item.ownerName || item.$id}</Text>
                          {address ? (
                            <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>{address}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(it: any) => it.$id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex mt-5"
                />
              )}
            </View>

            {/* <Button title="seed" onPress={seed} /> */}

            <View className="mt-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Recent Activity
                </Text>
              </View>

              {latestAssessmentsLoading ? (
                <ActivityIndicator size="large" className="text-primary-300 mt-4" />
              ) : !latestAssessments || latestAssessments.length === 0 ? (
                <NoResults />
              ) : (
                <View className="mt-3">
                  {latestAssessments.slice(0, 5).map((item: any) => {
                    let loc: any = {};
                    let owner: any = {};
                    try { loc = JSON.parse(item.building_location || '{}'); } catch { }
                    try { owner = JSON.parse(item.owner_details || '{}'); } catch { }
                    const pickUri = (x: any): string | undefined => {
                      if (!x) return undefined; if (typeof x === 'string') return x; if (typeof x === 'object') return x.uri || x.url || x.image || x.src; return undefined;
                    };
                    let img: string | undefined;
                    if (Array.isArray(loc?.buildingImages)) {
                      for (const it of loc.buildingImages) { const u = pickUri(it); if (u) { img = u; break; } }
                    }
                    if (!img && Array.isArray(loc?.images)) {
                      for (const it of loc.images) { const u = pickUri(it); if (u) { img = u; break; } }
                    }
                    if (!img) img = pickUri(loc?.image);
                    const address = [loc?.street, loc?.barangay, loc?.municipality, loc?.province].filter(Boolean).join(', ');
                    return (
                      <TouchableOpacity
                        key={item.$id}
                        onPress={() => navigateToRemoteAssessment(item.$id)}
                        className="flex-row items-center py-3"
                      >
                        <Image source={img ? { uri: img } : images.noResult} className="w-12 h-12 rounded-lg mr-3" resizeMode="cover" />
                        <View className="flex-1">
                          <Text className="text-sm font-rubik-medium text-gray-800" numberOfLines={1}>{owner?.owner || item.ownerName || item.$id}</Text>
                          {address ? (
                            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>{address}</Text>
                          ) : null}
                          <Text className="text-[10px] text-gray-400 mt-0.5">{new Date(item.$createdAt).toLocaleString()}</Text>
                        </View>
                        <Image source={icons.rightArrow} className="w-4 h-4 opacity-60" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;
