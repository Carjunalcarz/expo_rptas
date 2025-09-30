import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { logout } from "@/lib/auth";
import { useGlobalContext } from "@/lib/global-provider";
import { useDebugContext } from "@/lib/debug-provider";

import icons from "@/constants/icons";
import { settings } from "@/constants/data";
import images from "@/constants/images";

interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

interface SettingsItemWithSwitchProp {
  icon: ImageSourcePropType;
  title: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  textStyle?: string;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemProp) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex flex-row items-center justify-between py-3"
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>

    {showArrow && <Image source={icons.rightArrow} className="size-5" />}
  </TouchableOpacity>
);

const SettingsItemWithSwitch = ({
  icon,
  title,
  value,
  onToggle,
  textStyle,
}: SettingsItemWithSwitchProp) => (
  <View className="flex flex-row items-center justify-between py-3">
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>

    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
      thumbColor={value ? '#ffffff' : '#f4f3f4'}
    />
  </View>
);

const Profile = () => {
  const { user, refetch } = useGlobalContext();
  const { isDebugVisible, toggleDebugVisibility } = useDebugContext();

  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      Alert.alert("Success", "Logged out successfully");
      refetch();
    } else {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleSettingsNavigation = (route: string, title: string) => {
    if (title === "Profile") {
      // Don't navigate if already on profile
      return;
    }
    try { const r = require('expo-router'); r?.router?.push(route as any); } catch (e) { console.warn('router.push failed', e); }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Profile</Text>
          <Image source={icons.bell} className="size-5" />
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={images.avatar}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity className="absolute bottom-11 right-2">
              <Image source={icons.edit} className="size-9" />
            </TouchableOpacity>

            <Text className="text-2xl font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        {/* <View className="flex flex-col mt-10">
          <SettingsItem icon={icons.calendar} title="My Bookings" />
          <SettingsItem icon={icons.wallet} title="Payments" />
        </View> */}

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {settings.slice(0).map((item, index) => (
            <SettingsItem
              key={index}
              icon={item.icon}
              title={item.title}
              onPress={() => handleSettingsNavigation(item.route, item.title)}
            />
          ))}
          
          {/* Debug Toggle */}
          <SettingsItemWithSwitch
            icon={icons.info}
            title="Show Debug Button"
            value={isDebugVisible}
            onToggle={toggleDebugVisibility}
          />
        </View>

        <View className="flex flex-col border-t mt-5 pt-5 border-primary-200">
          <SettingsItem
            icon={icons.logout}
            title="Logout"
            textStyle="text-danger"
            showArrow={false}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
