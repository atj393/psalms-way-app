// commonStyles.js
import {StyleSheet} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export const getCommonStyles = (isDarkMode: any) => {
  const backgroundColor = isDarkMode ? Colors.black : Colors.white;
  const textColor = isDarkMode ? Colors.white : Colors.black;
  const oddVerseBackgroundColor = isDarkMode ? Colors.black : Colors.white;
  const evenVerseBackgroundColor = isDarkMode ? Colors.darker : Colors.lighter;
  //const evenVerseBackgroundColor = isDarkMode ? '#444' : '#ddd';

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: backgroundColor,
    },
    verse: {
      fontSize: 20,
      fontFamily: 'Roboto',
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: 30,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginVertical: 4,
      borderRadius: 5,
      color: textColor,
    },
    oddVerse: {
      backgroundColor: oddVerseBackgroundColor,
    },
    evenVerse: {
      backgroundColor: evenVerseBackgroundColor,
    },
  });
};
