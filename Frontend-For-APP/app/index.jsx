import React, { useState} from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Image, } from 'react-native'
{/*
  SO this is the login screen for the app, it will be the first screen that the user sees when they open the app.
  It will have a logo at the top, followed by input fields for the username/email and password, and a login button. There will also be a link to the sign up screen for users who don't have an account.
  The styles are defined at the bottom of the file, and the component is exported as the default export of the file.
  */}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style = {styles.safe}>
      <View style={styles.container}>
        <Image  source={{
          uri: 'https://reactnative.dev/img/tiny_logo.png',
        }}
         style={styles.logo} />

        {/* Email Input && Username Input */}

        <Text style={styles.label} >Username / Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username or email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        {/* Password Input section IG */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button for rn until Mar does his Job */}
        <Pressable style={styles.button} onPress={() => console.log('Login Pressed')}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        {/* Sign Up Link */}
        <Pressable onPress={() => console.log('Navigate to Sign Up')}>
          <Text style={styles.signUpText}>Don't have an account? Sign Up</Text>
        </Pressable>
      </View>
        
    </View>
  );
};
const styles = StyleSheet.create({

safe: {
  flex: 1,
  backgroundColor: 'orange',
  alignItems: 'center',
  justifyContent: 'center',
},

container: {
  flex: 1,
  backgroundColor: 'red',
  width: '80%',
  alignItems: 'center',
  justifyContent: 'center',
},

logo: {
  width: 130,
  height: 130,
  borderRadius: 65,
  marginBottom: 24,
},

label: {
  alignSelf: 'flex-start',
  fontsize: 16,
  fontWeight: "bold",
  marginBottom: 6,
},

input: {
  width: '100%',
  height: 40,
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 5,
  paddingHorizontal: 10,
  marginBottom: 15,
},

button: {
  width: '100%',
  height: 40,
  backgroundColor: '#007BFF',
  borderRadius: 5,
  alignItems: 'center',
  justifyContent: 'center',
},

buttonText: {
  color: '#fff',
  fontsize: 16,
  fontWeight:"700"
},

signUpText: {
  marginTop: 15,
  color: '#007BFF',

}
});