import React, { Component } from 'react';
import {
  Alert,
  AsyncStorage,
  Button,
  Image,
  Keyboard,
  Picker,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';

import latinize from 'latinize';

import Checkbox from './Checkbox';
import { parseForSort } from './utils';

function ValidateButton(props) {
  var style = styles.validateButtonContainer;
  if (props.disabled) {
    style = {
      opacity: 0.1,
      ... style,
    };
  }
  return (
    <TouchableOpacity
      style={style}
      onPress={props.onPress}
      disabled={props.disabled}>
        <Image
          style={styles.validateButton}
          source={require('./assets/validate.png')} />
    </TouchableOpacity>);
}

const placeHolderImage = require('./assets/img_placeholder.png');

export default class WordEditScreen extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('action', '??'),
      headerStyle: {
        backgroundColor: '#d9534f',
      },
      headerTintColor: '#fff',
    };
  };

  constructor(props) {
    super(props);
    this._descInput = React.createRef();
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleValidate = this.handleValidate.bind(this);
    this.handlePickImage = this.handlePickImage.bind(this);
    this.handleRemoveImage = this.handleRemoveImage.bind(this);
    this.hasImagesPermission = Constants.platform.android;
    const { navigation } = this.props;
    const key = navigation.getParam('key', '');
    this.key = key;

    this.oldData = {};
    this.state = {
      key,
      order: undefined,
      description: '',
      type: 0,
      image: undefined,
    };
    if (key && key.length > 0) {
      AsyncStorage.getItem(key).then(result => {
        const { word, description, image: imageURI, type, order } = JSON.parse(result);
        this.oldData = {
          word,
          description,
          image: imageURI,
          type,
        };
        if (imageURI) {
          Image.getSize(imageURI, (w, h) => {
            this.setState({
              word,
              description,
              type,
              order,
              image: {
                uri: imageURI,
                aspectRatio: w / h,
              }
            });
          });
        } else {
          this.setState({ word, description, type, order });
        }
      });
    }
  }

  handlePickImage = async () => {
    await this.getPermissionAsync();
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.1,
      base64: false,
    });

    if (!result.cancelled) {
      this.setState({
        image: {
          uri: result.uri,
          aspectRatio: (result.width / result.height),
        }
      });
    }
  };

  getPermissionAsync = async () => {
    if (!this.hasImagesPermission && Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      this.hasImagesPermission = status == 'granted';
    }
  }

  handleRemoveImage() {
    if (this.state.image) {
      Alert.alert(
        'Confirmation',
        'Supprimer l\'image?',
        [
          {
            text: "Oui",
            onPress: () => this.setState({ image: null }),
          },
          {
            text: "Annuler",
            style: 'cancel'
          }
        ]);
    }
  }

  handleTypeChange(value) {
    return (enable) => {
      const { type } = this.state;
      if (enable) {
        this.setState({ type: type | value });
      } else {
        this.setState({ type: type & ~value });
      }
    }
  }

  handleValidate() {
    const { word: _word, description, type, order } = this.state;
    if (!_word || _word.length == 0) return;

    var updateTitle = false;
    const word = _word.trim().toLocaleLowerCase();
    const key = 'w:' + latinize(word).replace(/\W/gi, '');
    const data = {
      word,
      type,
    };
    data.order = parseForSort(order || word);
    
    if (description) {
      data.description = description;
    }
    if (this.state.image) {
      data.image = this.state.image.uri;
    }

    const edit = this.props.navigation.getParam('edit', false);
    const run = async () => {
      var stop = false;
      const result = await AsyncStorage.getItem(key);
      if ((result != null && !edit)
        || (result && edit && word !== this.oldData.word)) {
        await new Promise((res, rej) => {
          Alert.alert(
            'Ce mot existe déjà',
            'Voulez vous le remplacer?',
            [
              {
                text: 'Oui',
                onPress: res,
              },{
                text: 'Non',
                style: 'cancel',
                onPress: rej,
              }
            ])
        })
        .then(() => stop = false)
        .catch(() => stop = true);
        if (!stop && result.image) {
          FileSystem.deleteAsync(result.image);
        }
      }

      if (stop) {
        throw new Exception();
      }

      if (this.oldData.image && this.oldData.image != data.image) {
        await FileSystem.deleteAsync(this.oldData.image);
      }

      if (data.image) {
        const to = FileSystem.documentDirectory + key + '.png';
        await FileSystem.copyAsync({
          from: data.image,
          to,
        }).then(() => {
          data.image = to;
        });
      }

      if (edit && (word !== this.oldData.word)) {
        await AsyncStorage.removeItem(this.key);
        updateTitle = true;
      }

      try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error('Error loading word list!')
      }
      return key;
    }
    try {
      run().then(key => {
        const { navigation } = this.props;
        navigation.state.params.update(
          key,
          data,
          updateTitle
        );
        navigation.goBack();
      });
    } catch {}

  }

  render() {
    const { navigation } = this.props;
    const { type } = this.state;
    var img = null;
    if (this.state.image) {
      img = (<View style={styles.imageContainer}>
          <Image
          style={{ ...styles.image, aspectRatio: this.state.image.aspectRatio }}
          resizeMode="contain"
          source={{ uri: this.state.image.uri }} />
        </View>);
    }
    const orderPlaceholder = parseForSort(this.state.word);
    const desc = this.state.description || '';
    return (
      <SafeAreaView style={{flex: 1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView>
            <TextInput
              style={styles.textInput}
              onChangeText={(word) => this.setState({word})}
              onSubmitEditing={() => this._descInput.current.focus()}
              returnKeyType='next'
              placeholder='... mot'
              value={this.state.word} />
            <TextInput
              style={styles.textInput}
              onChangeText={(order) => this.setState({order})}
              returnKeyType='next'
              placeholder={orderPlaceholder}
              value={this.state.order} />
            <TextInput
              ref={this._descInput}
              style={styles.multilineTextInput}
              multiline={true}
              onChangeText={(description) => this.setState({description})}
              value={desc}
              placeholder='... description'
              numberOfLines={Math.min(3, desc.split(/\r\n|\r|\n/).length) || 1} />
            <View style={styles.container}>
              <View style={styles.subContainer}>
                  <Checkbox checked={(type & 1) != 0} style={{margin: 10}} label={'adj.'} onChange={this.handleTypeChange(1)} />
                  <Checkbox checked={(type & 2) != 0} style={{margin: 10}} label={'adv.'} onChange={this.handleTypeChange(2)} />
                  <Checkbox checked={(type & 4) != 0} style={{margin: 10}} label={'conj.'} onChange={this.handleTypeChange(4)} />
              </View>
              <View style={styles.subContainer}>
                <Checkbox checked={(type & 8) != 0} style={{margin: 10}} label={'n. f.'} onChange={this.handleTypeChange(8)} />
                <Checkbox checked={(type & 16) != 0} style={{margin: 10}} label={'n. m.'} onChange={this.handleTypeChange(16)} />
                <Checkbox checked={(type & 32) != 0} style={{margin: 10}} label={'prep.'} onChange={this.handleTypeChange(32)} />
              </View>
              <View style={styles.subContainer}>
                <Checkbox checked={(type & 64) != 0} style={{margin: 10}} label={'pron.'} onChange={this.handleTypeChange(64)} />
                <Checkbox checked={(type & 128) != 0} style={{margin: 10}} label={'v.'} onChange={this.handleTypeChange(128)} />
                <Checkbox checked={(type & 256) != 0} style={{margin: 10}} label={'pluriel'} onChange={this.handleTypeChange(256)} />
              </View>
            </View>
            <View style={{...styles.buttonsContainer, height: (this.state.image ? 100 : 50)}}>
              <Button
                style={styles.button}
                title="Choisir une image"
                onPress={this.handlePickImage} />
              {this.state.image && (
                <Button 
                  style={styles.button}
                  color="#FF0000"
                  title="Supprimer l'image"
                  onPress={this.handleRemoveImage} />
              )}
            </View>
            {img}
          </ScrollView>
          </TouchableWithoutFeedback>
        <ValidateButton
          onPress={this.handleValidate}
          disabled={this.state.word == ''} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 4,
    marginBottom: 0,
    marginHorizontal: 10,
    paddingVertical: 2,
    paddingHorizontal: 5,
    flex: 1,
    borderBottomWidth: 1,
    borderColor: 'black',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    height: 160,
    justifyContent: 'center',
  },
  subContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  emph: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#AFAFAF',
  },
  textInput: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 10,
    padding: 5,
    fontSize: 20,
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  multilineTextInput: {
    textAlignVertical: 'top',
    fontSize: 20,
    marginHorizontal: 10,
    marginTop: 10,
    padding: 5,
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  typePicker: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: 'black',
  },
  typeText: {
    fontSize: 16,
    color: '#b3cde0',
  },
  validateButtonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 32,
    right: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validateButton: {
    width: 64,
    height: 64,
    zIndex: 1,
  },
  imageContainer: {
    flex: 1,
    margin: 10,
    padding: 0,
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    height: undefined,
    zIndex: 0,
    borderRadius: 2,
    margin: 0,
    padding: 0,
  },
  helpText: {
    color: '#A0A0A0',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    marginHorizontal: 10,
    marginTop: 10,
    justifyContent: 'space-around',
  },
  button: {
    flex: 1,
  }
});