import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, Text, View } from "react-native";
import icons from "@/constants/icons";

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col items-center">
    <Image
      source={icon}
      tintColor={focused ? "#0061FF" : "#666876"}
      resizeMode="contain"
      className="size-6"
    />
    <Text
      className={`${focused
        ? "text-primary-300 font-rubik-medium"
        : "text-black-200 font-rubik"
        } text-xs w-full text-center mt-1`}
    >
      {title}
    </Text>
  </View>
);

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingBottom: 20,
          backgroundColor: "white",
          borderTopColor: "#0061FF1A",
          borderTopWidth: 1,
          minHeight: 70,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="remote"
        options={{
          title: "Remote",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.shield} title="Synced" />
          ),
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: "Assessment",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.area} title="Assessment" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />

      {/* no additional tab screens here — hidden screens live outside the tabs folder */}
    </Tabs>
  );
};

export default TabsLayout;