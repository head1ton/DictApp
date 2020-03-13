import React from 'react';

import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default class SidePanel extends React.Component {
  constructor(props) {
    super(props);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleToggleMenu = this.handleToggleMenu.bind(this);
    this.handleLayout = this.handleLayout.bind(this);
    this.state = {
      height: new Animated.Value(0),
      closeIcon: false,
      ready: false,
      maxHeight: 0,
      showMenu: false,
      txt: '',
    };
    this.menuIcon = require('./assets/menu.png');
    this.closeIcon = require('./assets/close.png');
  }

  handleTextChange(txt) {
    this.props.onChange(txt);
    this.setState({ txt });
  }

  handleToggleMenu() {
    const { showMenu, maxHeight } = this.state;
    const show = !showMenu;

    const frm = show ? 0 : maxHeight;

    this.state.height.setValue(frm);
    const newState = { ready: true, closeIcon: show};
    if (show) {
      newState.showMenu = true;
    }
    this.setState(newState);
    const toValue = show ? maxHeight : 0;
    Animated.timing(this.state.height, {
      toValue,
      duration: 200,
    }).start(() => {
      if (!show) {
        this.setState({ showMenu: show });
      }
    });
  }

  handleLayout(event) {
    if (this.state.maxHeight > 0) {
      return;
    }
    const {nativeEvent: { layout: { height }}} = event;
    this.setState({
      height: new Animated.Value(0),
      maxHeight: height,
      ready: true,
    });
  }

  render() {
    const { ready, showMenu } = this.state;
    var containerStyle;
    if (ready) {
      containerStyle = [styles.container, { height: this.state.height }];
    } else {
      containerStyle = styles.container;
    }
    const iconSrc = this.state.closeIcon ? this.closeIcon : this.menuIcon;
    return (
      <View>
        <View
          style={styles.listHeader}
          onLayout={this.handleLayoutMin}>
          <TouchableWithoutFeedback
            onPress={this.handleToggleMenu}>
            <Image
              source={iconSrc}
              style={styles.icon} />
          </TouchableWithoutFeedback>
          <TextInput
            style={styles.searchInput}
            onChangeText={this.handleTextChange}
            value={this.state.txt}
            placeholder='Rechercher'/>
        </View>
        <Animated.View onLayout={this.handleLayout} style={containerStyle}>
          {((showMenu && ready) || !ready) &&
            (<React.Fragment>
              <TouchableOpacity onLongPress={this.props.onLogout} onPress={this.props.onImport}>
                <View style={{ ...styles.menuItem, borderTopWidth: 1 }}>
                  <Image source={require('./assets/import.png')} style={styles.itemIcon} />
                  <Text style={styles.text}>Importer</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onLongPress={this.props.onLogout} onPress={this.props.onExport}>
                <View style={styles.menuItem}>
                  <Image source={require('./assets/export.png')} style={styles.itemIcon} />
                  <Text style={styles.text}>Exporter</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.props.onRemoveAll}>
                <View style={styles.menuItem}>
                  <Image source={require('./assets/thrash.png')} style={styles.itemIcon} />
                  <Text style={styles.text}>Tout supprimer</Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>)}
        </Animated.View>
      </View>);
  } 
}

const styles = {
  container: {
    justifyContent: 'flex-start',
  },
  listHeader: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: '#d9534f',
    alignItems: 'center',
    margin: 0,
    padding: 0,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    padding: 8,
    fontSize: 24,
    margin: 0,
    height: '100%',
  },
  icon: {
    width: 42,
    height: 42,
  },
  panel: {
    flex: 1,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'white',
    backgroundColor: '#d9534f',
  },
  text: {
    color: 'white',
    fontSize: 22,
  },
  itemIcon: {
    marginRight: 10,
    width: 24,
    height: 24,
  },
  bigIcon: {
    width: 32,
    height: 32,
  }
}