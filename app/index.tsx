
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';


const styles = StyleSheet.create({
  s_1: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#ffffff",
  width: "100%",
  height: "100%"
},

  s_2: {
  backgroundColor: "#f97316",
  padding: 12,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
},

  s_3: {
  fontWeight: "700",
  marginBottom: 16
},

  s_4: {
  fontSize: 18,
  color: "#6b7280",
  marginBottom: 16
},

  s_5: {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 16
},

  s_6: {
  backgroundColor: "#0f172a",
  paddingVertical: 12,
  width: "100%"
},

  s_7: {
  paddingVertical: 12,
  width: "100%",
  borderWidth: 1
},

  s_8: {
  color: "#6b7280"
},

  s_9: {
  fontSize: 14,
  color: "#6b7280"
}
});
export default function WelcomeScreen() {
  return (
    <View className="flex flex-col items-center justify-center bg-background w-full h-full p-5 ">
      
         <View style={styles.s_2}>
       <Feather name="shopping-bag" size={48} color="white" />
       
        </View>

      
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Text style={styles.s_3}>
          Shop Manager
        </Text>
        <Text style={styles.s_4}>
          Streamline your shop operations with ease
        </Text>
        
      </View>
      

      <View style={styles.s_5}>
        <Link href="/signin" asChild>
          <TouchableOpacity style={styles.s_6}>
            <Text style={{ 
              color: '#FFFFFF', 
              textAlign: 'center', 
              fontSize: 18, 
              fontWeight: '600' 
            }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/signup" asChild>
          <TouchableOpacity style={styles.s_7}>
            <Text style={styles.s_8} style={{ 
              
              textAlign: 'center', 
              fontSize: 18, 
              fontWeight: '600' 
            }}>
              Create Account
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
      
      <View >
        
        <Text style={styles.s_9}>
          Manage inventory, sales, and operations in one place.
        </Text>
      </View>
    </View>
  );
}
