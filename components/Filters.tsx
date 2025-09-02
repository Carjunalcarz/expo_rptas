import React, { useState } from "react";
import { useSegments } from "expo-router";
import { Text, ScrollView, TouchableOpacity } from "react-native";

import { categories } from "@/constants/data";

const Filters = () => {
  // Avoid calling navigation hooks directly at render; read params lazily
  const paramsFilter = (() => {
    try {
      const r = require('expo-router');
      const p = r?.useLocalSearchParams?.() || {};
      return p.filter || 'All';
    } catch (e) {
      return 'All';
    }
  })();

  const [selectedCategory, setSelectedCategory] = useState(
    paramsFilter
  );

  const handleCategoryPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      try { const r = require('expo-router'); r?.router?.setParams?.({ filter: "" }); } catch (e) { console.warn('router.setParams failed', e); }
      return;
    }

    setSelectedCategory(category);
    try { const r = require('expo-router'); r?.router?.setParams?.({ filter: category }); } catch (e) { console.warn('router.setParams failed', e); }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3 mb-2"
    >
      {categories.map((item, index) => (
        <TouchableOpacity
          onPress={() => handleCategoryPress(item.category)}
          key={index}
          className={`flex flex-col items-start mr-4 px-4 py-2 rounded-full ${selectedCategory === item.category
            ? "bg-primary-300"
            : "bg-primary-100 border border-primary-200"
            }`}
        >
          <Text
            className={`text-sm ${selectedCategory === item.category
              ? "text-white font-rubik-bold mt-0.5"
              : "text-black-300 font-rubik"
              }`}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default Filters;
