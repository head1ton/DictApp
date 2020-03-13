import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import WordListScreen from './WordListScreen';
import WordDetailScreen from './WordDetailScreen';
import WordEditScreen from './WordEditScreen';

const AppNavigator = createStackNavigator({
    WordList: WordListScreen,
    WordDetail: WordDetailScreen,
    WordEdit: WordEditScreen,
  },
  {
    initialRouteName: 'WordList',
  });

export default createAppContainer(AppNavigator);