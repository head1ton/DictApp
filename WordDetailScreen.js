import * as React from 'react';
import {
  Alert,
  AsyncStorage,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as Types from './utils';

export default class WordDetailScreen extends React.Component {
  static navigationOptions =({ navigation }) => {
    return {
      title: navigation.getParam('title', "?"),
      headerStyle: {
        backgroundColor: '#d9534f',
      },
      headerTintColor: '#fff',
      headerRight: () => (
        <View style={styles.buttons}>
          <TouchableOpacity onPress={navigation.getParam('editFun')} >
            <Image source={require('./assets/pen.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={navigation.getParam('delFun')} >
            <Image source={require('./assets/thrash.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>),
    };
  };

  constructor(props) {
    super(props);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDel = this.handleDel.bind(this);
    this.updateCallback = this.updateCallback.bind(this);
    const { navigation } = this.props;
    const word = navigation.getParam('key', '');
    this.data = navigation.getParam('data', {});
    this.state = {
      word,
      description: this.data.description,
      image: this.data.image,
      type: this.data.type,
    };
  }

  componentDidMount() {
    this.props.navigation.setParams({
      editFun: this.handleEdit,
      delFun: this.handleDel,
    });
    const { word } = this.state;
    this.updateCallback(word, this.data);
  }

  updateCallback(key, data, updateTitle = false) {
    const { word, description, image, type } = data;
    if (updateTitle) {
      this.props.navigation.setParams({ title: word.replace(/^(\S{1})/, l => l.toLocaleUpperCase()) });
    }
    if (image) {
      Image.getSize(image, (w, h) => {
        this.setState({
          description,
          type,
          image: {
            uri: image,
            aspectRatio: w / h,
          }
        });
      });
    } else {
      this.setState({ description, type });
    }
    this.props.navigation.getParam('update')(key, data);
  }

  handleEdit() {
    this.props.navigation.navigate('WordEdit', {
      action: "Modifier",
      key: this.state.word,
      edit: true,
      update: this.updateCallback,
    });
  }

  handleDel() {
    const { word } = this.state;
    const { navigation } = this.props;
    new Promise((res, rej) => Alert.alert(
      'Confirmer',
      'Supprimer le mot?',
      [
        { text: 'Oui', onPress: res},
        { text: 'Non' },
      ]))
    .then(() => {
      navigation.state.params.delete(word);
      navigation.goBack();
    });
  }

  render() {
    const {
      word,
      description,
      type,
      image
    } = this.state;
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          <View style={{
            ...styles.container,
            flexDirection: 'row',
            marginTop: 8}}>
            <Text style={styles.emph}>Type: </Text>
            <Text style={styles.text}>{Types.typeToString(type) || '-'}</Text>
          </View>
          <View style={styles.container}>
            <Text style={styles.emph}>Définition:</Text>
            <Text style={styles.text}>{description || '-'}</Text>
          </View>
          {image &&
            <View style={styles.imageContainer}>
              <Image
                resizeMode="contain"
                source={{uri: image.uri}}
                style={{...styles.image, aspectRatio: image.aspectRatio }} />
            </View>}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 5,
    paddingTop: 5,
    paddingHorizontal: 10,
    flex: 1,
  },
  emph: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
    textAlign: 'justify',
    color: '#909090',
    fontStyle: 'italic',
  },
  imageContainer: {
    flex: 1,
    marginVertical: 10,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: undefined,
    flex: 1,
    borderRadius: 4,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 16,
  },
  buttons: {
    flexDirection: 'row',
  }
});