import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import BottomNav from '../_components/BottomNav';

const { Navigator } = createMaterialTopTabNavigator();
export const SwipeableTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <SwipeableTabs 
        tabBarPosition="bottom"
        tabBar={(props) => <BottomNav {...props} />} 
        screenOptions={{ swipeEnabled: true }}
    >
      <SwipeableTabs.Screen name="community" />
      <SwipeableTabs.Screen name="workouts" />
      <SwipeableTabs.Screen name="profile" />
    </SwipeableTabs>
  );
}