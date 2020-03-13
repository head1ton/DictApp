import React from 'react';

import {
  Animated,
  Easing,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default class Checkbox extends React.Component {
  constructor(props) {
    super(props);
    const checked = this.props.checked;
    const opacity = checked ? 1 : 0;
    this.state = {
      opacity: new Animated.Value(opacity),
      checked,
    };
  }

  componentDidUpdate() {
    if (this.props.checked != this.state.checked) {
      const { checked } = this.props;
      const toValue = checked ? 1 : 0;
      Animated.timing(this.state.opacity, {
        toValue,
        duration: 200,
      }).start(() => {
        this.setState({ checked });
      }); 
    }
  }

  render() {
    const { opacity } = this.state;
    return (
      <View
        style={{...this.props.style, ...styles.container}}
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => this.props.onChange(!this.props.checked)}>
          <View style={styles.box}>
            <Animated.View
              style={{
                ...styles.boxContent,
                opacity: opacity,
              }}>
              </Animated.View>
          </View>
          <Text style={styles.label}>{this.props.label}</Text>
      </View>
    );
  } 
}

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'black',
    margin: 4,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxContent: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#428bca',
  },
  label: {
    fontSize: 20,
  }
}