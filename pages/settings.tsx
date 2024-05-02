import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const SettingsModal = () => (
  <ScrollView>
    <View>
      <Text>Notifications</Text>
      <TouchableOpacity>
        <Text>Morning</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({});

export default SettingsModal;
