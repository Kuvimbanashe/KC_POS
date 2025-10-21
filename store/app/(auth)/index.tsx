
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
export default function WelcomeScreen() {
  return (
    <View className="flex flex-col items-center justify-center bg-white w-full h-full p-5 ">
      
         <View className="bg-orange-400 w-fit h-fit p-3 rounded flex items-center justify-center mb-8">
       <Feather name="shopping-bag" size={48} color="white" />
       
        </View>

      
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <Text className="text-primary text-3xl font-bold mb-4 text-center">
          Shop Manager
        </Text>
        <Text className="text-lg text-muted-foreground mb-4 text-center">
          Streamline your shop operations with ease
        </Text>
        
      </View>
      

      <View className="w-full flex flex-col gap-4 mb-10">
        <Link href="/signin" asChild>
          <TouchableOpacity className="rounded-md bg-primary py-3 px-6 w-full">
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
          <TouchableOpacity className="rounded-md bg-white py-3 px-6 w-full border border-muted-foreground">
            <Text className="text-muted-foreground" style={{ 
              
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
        
        <Text className="text-sm text-muted-foreground text-center">
          Manage inventory, sales, and operations in one place.
        </Text>
      </View>
    </View>
  );
}
