import {View, Text} from "react-native"
import {Tabs} from "react-native-collapsible-tab-view"

export default function Workouts()
{
    return (
        <Tabs.ScrollView>
            {Array.from({length: 50}).map((_, i) => (
                <View key={i}>
                    <Text>User Post #{i + 1}</Text>
                </View>
            ))}
        </Tabs.ScrollView>
    );
}
