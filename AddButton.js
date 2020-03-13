import React, { Component, useState, useEffect } from 'react';

import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default class AddButton extends Component {
	constructor(props) {
    super(props);
		this.state = {
			scale: new Animated.Value(1),
		};
	}

	fadeIn() {
		Animated.timing(
			this.state.scale,
		{
			toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
		}).start();
	}

	fadeOut() {
		Animated.timing(
			this.state.scale,
		{
			toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.circle),
		}).start();
	}

	render() {
		return (
			<TouchableOpacity style={styles.addButtonContainer} onPress={this.props.onPress}>
    		<Animated.Image
    			style={{...styles.addButton, transform: [{ scale: this.state.scale }]}}
    			source={require('./assets/add.png')} />
    	</TouchableOpacity>);
	}
}

const styles = {
  addButtonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 32,
    right: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 64,
    height: 64,
  }
};