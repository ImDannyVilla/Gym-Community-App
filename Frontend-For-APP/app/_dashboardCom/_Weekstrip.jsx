import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function WeekStrip() {
  const today = new Date();
  const dayNumber = today.getDay();

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
  <View style={styles.container}>
    {dayNames.map((day, index) => {
      const isToday = index === dayNumber;

      return (
        <View key={index} style={[styles.dayBox, isToday && styles.activeDay]}>
          <Text style={[styles.dayText, isToday && styles.activeText]}>
            {day}
          </Text>
        </View>
      );
    })}
  </View>
); 
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 60,
    marginHorizontal: 16,

    backgroundColor: "rgb(255, 255, 255)",

    //iOS shadow
    shadowColor: "rgb(0, 0, 0)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,

    //Android shadow
    elevation: 6,

    borderColor: "rgb(255, 255, 255)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dayBox: 
  {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "rgb(238, 238, 238)",
    height: 40,
    marginHorizontal: 3,

  },
    
  dayText:
  {
    fontWeight: "600",
  },
  
  activeDay:
  {
     backgroundColor: "blue",
  },

  activeText: 
  {
     color: "white",
  },
});