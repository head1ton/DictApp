import React, { Component } from 'react';
import {
  Animated,
  Image,
  Easing,
  PanResponder,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default class ListItem extends Component {
  constructor(props) {
    super(props);
    this.viewWidth = 0;
    this.start = 0;
    this.state = {
      left: new Animated.Value(0),
      right: new Animated.Value(0),
      showLeft: false,
    };
  }

  componentWillMount() {
    const reset = () => {
      this.state.left.setValue(0);
      this.state.right.setValue(0);
    }
    const shouldCapture = (e, gs) => {
      const { dx, dy } = gs;
      const capture = dx > 2 || dx < -2 || dy > 2 || dy < -2;
      return capture && (Math.abs(dx) > (Math.abs(dy * 2)));
    }
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture:  () => false,
      onMoveShouldSetPanResponder: shouldCapture,
      onPanResponderGrant: (e, gestureState) => {
        this.state.left.setValue(0);
        this.state.right.setValue(0);
      },
      onPanResponderMove: (e, gs) => {
        Animated.event([null, { dx: this.state.left }])(e, gs);
        const nGS = Object.assign({}, gs);
        nGS.dx = -nGS.dx;
        Animated.event([null, { dx: this.state.right }])(e, nGS);
        const { showLeft } = this.state;
        const shouldShowLeft = nGS.dx < 0;
        if (showLeft != shouldShowLeft) {
          this.setState({ showLeft: shouldShowLeft });
        }
      },
      onPanResponderTerminate: reset,
      onPanResponderRelease: (e, gestureState) => {
        const { dx } = gestureState;
        if (Math.abs(dx) < this.viewWidth / 3) {
          const opt = {
            toValue: 0,
            duration: 1000,
            easing: Easing.in(Easing.bounce),
          };
          Animated.parallel([
            Animated.timing(this.state.left, opt),
            Animated.timing(this.state.right, opt),
          ]).start(reset);
        } else {
          var fun;
          var c = 1;
          if (dx < 0) {
            fun = this.props.onSwipeLeft;
            c = -1;
          } else {
            fun = this.props.onSwipeRight;
          }
          const animOpt = {
            toValue: this.viewWidth * c,
            duration: 200,
            easing: Easing.out(Easing.circle),
          }
          const animOpt2 = Object.assign({}, animOpt);
          animOpt2.toValue = -this.viewWidth * c;

          Animated.parallel([
            Animated.timing(this.state.left, animOpt),
            Animated.timing(this.state.right, animOpt2),
          ]).start(() => {
            fun();
            reset();
          });
        }
      },
    });
  }

  render() {
    const {
      left,
      right,
      showLeft,
      opacity,
    } = this.state;
    const deleteZI = showLeft ? 0 : 1;
    const editZI = 1 - deleteZI;
    return (
      <View
        onLayout={(event) => {
          this.viewWidth = event.nativeEvent.layout.width;
        }}
        style={{...styles.item}}>
        <Animated.View
          {...this.panResponder.panHandlers}
          style={{
            ...styles.titleView,
            left,
            right}}>
            <TouchableOpacity onPress={() => this.props.onPress()}>
              <Text style={styles.title}>
                {this.props.title}
              </Text>
            </TouchableOpacity>
        </Animated.View>
        <View style={{...styles.editView, zIndex: editZI}}>
          <Image style={styles.logo} source={require('./assets/pen.png')} />
          <Text style={styles.backText}>Modifier</Text>
        </View>
        <View style={{...styles.deleteView, zIndex: deleteZI}}>
          <Text style={{...styles.backText, textAlign: 'right'}}>Supprimer</Text>
          <Image style={styles.logo} source={require('./assets/thrash.png')} />
        </View>
        <View style={styles.sizeComponent}>
          <Text style={styles.title}>{this.props.title}</Text>
        </View>
      </View>
      );
  }
}

const styles = {
  item: {
    flex: 1,
    backgroundColor: 'pink',
    paddingVertical: 10,
    paddingHorizontal: 5,
    margin: 0,
  },
  titleView: {
    position: 'absolute',
    justifyContent: 'center',
    backgroundColor: 'white',
    flex: 1,
    left: 0,
    zIndex: 2,
    top: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 5,
  },
  deleteView: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    margin: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  editView: {
    flexDirection: 'row',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'orange',
    margin: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  title: {
    fontSize: 24,
  },
  backText: {
    color: 'white',
    fontSize: 24,
    flex: 1,
  },
  sizeComponent: {
    flex: 1,
    zIndex: -1,
    margin: 0,
  },
  logo: {
    width: 32,
    height: 32,
  }
}
