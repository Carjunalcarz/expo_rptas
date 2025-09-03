import React, { useState } from "react";
import { View, TouchableOpacity, Image, TextInput } from "react-native";
import { useDebouncedCallback } from "use-debounce";

import icons from "@/constants/icons";
import { usePathname, useSegments } from "expo-router";

const Search = () => {
  const path = usePathname();
  // useSegments is safer when router context may not be ready during initial render
  const segments = useSegments();
  const paramsQuery = (() => {
    try {
      const r = require('expo-router');
      const p = r?.useLocalSearchParams?.() || {};
      return p.query;
    } catch (e) {
      return undefined;
    }
  })();
  const [search, setSearch] = useState(paramsQuery);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    try {
      const r = require('expo-router');
      r?.router?.setParams?.({ query: text });
    } catch (e) {
      console.warn('router.setParams failed', e);
    }
  }, 500);

  const handleSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  return (
    <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
      <View className="flex-1 flex flex-row items-center justify-start z-50">
        <Image source={icons.search} className="size-5" />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search for anything"
          className="text-sm font-rubik text-black-300 ml-2 flex-1"
        />
      </View>

      <TouchableOpacity>
        <Image source={icons.filter} className="size-5" />
      </TouchableOpacity>
    </View>
  );
};

export default Search;
