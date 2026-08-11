import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is SISI Booking System?",
      answer: "SISI Booking System is a comprehensive Mobile-based Meeting Room and Transportation Reservation Information System developed for PT Sinergi Informatika Semen Indonesia (SISI). It offers flexible booking methods, data management, and enhanced user accessibility for facility reservations."
    },
    {
      question: "What booking methods are available?",
      answer: "We offer three booking methods:\n\n1. Regular Booking: Standard reservations through mobile app or website\n2. Pre-Scheduled Booking: For long-term planning needs\n3. Quick Booking: Fast reservations based on booking history"
    },
    {
      question: "How does the notification system work?",
      answer: "The system provides real-time notifications through:\n\n- Firebase Cloud Messaging for instant updates\n- Email notifications\n- Google Calendar integration for schedule reminders\n\nBoth users and admins receive transparent updates about booking statuses."
    },
    {
      question: "What features are available for administrators?",
      answer: "Administrators have access to:\n\n- Analytics dashboard\n- Booking status filtration\n- Flexible data export to Excel\n- Real-time monitoring capabilities\n- Comprehensive reporting tools"
    },
    {
      question: "How is the system integrated with third-party services?",
      answer: "The system integrates with Google Calendar for schedule synchronization and reminders. This integration enables real-time monitoring and seamless schedule management across platforms."
    },
    {
      question: "What technologies are used in the system?",
      answer: "The system is built using:\n\n- React Native for mobile application\n- Laravel and Tailwind CSS for admin website\n- MySQL for database management\n- Firebase Cloud Messaging for notifications"
    }
  ];

  const FAQItem = ({ question, answer, index, isExpanded, onPress }) => (
    <TouchableOpacity 
      onPress={onPress}
      className={`mb-4 overflow-hidden rounded-xl border-l-4 ${isExpanded ? 'border-orange-400 bg-white' : 'border-sky-300 bg-white'}`}
      style={{ 
        shadowColor: "#cbd5e1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2
      }}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-center">
          <Text className={`text-base font-medium flex-1 mr-2 ${isExpanded ? 'text-orange-500' : 'text-sky-600'}`}>
            {question}
          </Text>
          <View className={`w-6 h-6 rounded-full items-center justify-center ${isExpanded ? 'bg-orange-100' : 'bg-sky-100'}`}>
            <Ionicons 
              name={isExpanded ? "remove" : "add"} 
              size={16} 
              color={isExpanded ? "#f97316" : "#0ea5e9"} 
            />
          </View>
        </View>
        {isExpanded && (
          <Text className="text-gray-600 mt-3 leading-6 pl-1">
            {answer}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-sky-50">
      {/* Header */}
      <View className="px-6 pt-6 pb-6 mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3 p-2 -ml-2"
          >
            <View className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm">
              <Ionicons name="chevron-back" size={16} color="#0ea5e9" />
            </View>
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-sky-700">FAQ</Text>
          <View className="flex-1" />
          <View className="w-2 h-2 rounded-full bg-orange-400 mx-0.5" />
          <View className="w-2 h-2 rounded-full bg-sky-400 mx-0.5" />
          <View className="w-2 h-2 rounded-full bg-orange-400 mx-0.5" />
        </View>
      </View>

      {/* Title */}
      <View className="px-6 mb-6">
        <Text className="text-2xl font-bold text-sky-800">Frequently Asked Questions</Text>
        <Text className="text-sky-500 mt-1">Find answers about SISI Booking System</Text>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-6 pt-2">
        <View className="pb-6">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
              isExpanded={expandedIndex === index}
              onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FAQ;