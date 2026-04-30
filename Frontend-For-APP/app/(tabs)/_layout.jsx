import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();
export const SwipeableTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <SwipeableTabs 
        tabBarPosition="bottom"
        tabBar={() => null}
        screenOptions={{ 
          swipeEnabled: true,
          animation: 'none'
        }}
    >
      <SwipeableTabs.Screen name="workouts" />
      <SwipeableTabs.Screen name="community" />
      <SwipeableTabs.Screen name="profile" />
    </SwipeableTabs>
  );
}