import React from 'react';

import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default class BottomPanel extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.staticText}>{this.props.children}</Text>
        </View>
        <TouchableOpacity onPress={this.props.onPress}>
          <Text style={styles.interactiveText}>Annuler</Text>
        </TouchableOpacity>
      </View>);
  }
};

const styles = {
  container: {
    padding: 10,
    flexDirection: 'row',
    backgroundColor: '#505050',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  staticText: {
    color: 'white',
    fontSize: 18,
  },
  interactiveText: {
    color: '#3299ff',
    fontSize: 18,
  },
}
