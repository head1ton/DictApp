import React, { Component } from 'react';

import {
  Alert,
  AsyncStorage,
  Image,
  PixelRatio,
  StyleSheet,
  Text,
  TextInput,
  View,
  SafeAreaView,
  SectionList,
  TouchableWithoutFeedback,
} from 'react-native';

import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

import latinize from 'latinize';

import ListItem from './ListItem';
import AddButton from './AddButton';
import SidePanel from './SidePanel';
import BottomPanel from './BottomPanel';
import LoginDialog from './LoginDialog';

import {
  parseForSort,
  loadWordsFromFirebase,
  loadWordsFromJSON,
  storeWordsToFirebase
} from './utils';

import * as firebase from 'firebase';

function getSection(obj) {
  if (!obj) return;
  const { word, order } = obj;
  return latinize((order ? order :
      parseForSort(word)).charAt(0).toLocaleUpperCase());
}

function Header({ title, onPress }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>{title}</Text>
    </View>
  );
}

export default class WordListScreen extends Component {
  static navigationOptions = {
    headerShown: false,
  };

  constructor(props) {
    super(props);
    this._button = React.createRef();
    this._offset = 0;
    this._scrollingDown = false;
    this.words = [];
    this.data = {};
    this.handleScrollEvent = this.handleScrollEvent.bind(this);
    this.handleAddWordEvent = this.handleAddWordEvent.bind(this);
    this.handleEditWord = this.handleEditWord.bind(this);
    this.handleEditWordEvent = this.handleEditWordEvent.bind(this);
    this.handleDeleteWordEvent = this.handleDeleteWordEvent.bind(this);
    this.handleDeleteWord = this.handleDeleteWord.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleSidePanel = this.handleSidePanel.bind(this);
    this.handleNewWord = this.handleNewWord.bind(this);
    this.loadWords = this.loadWords.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
    this.handleEditWord = this.handleEditWord.bind(this);
    this.handleImport = this.handleImport.bind(this);
    this.handleExport = this.handleExport.bind(this);
    this.state = {
      data: [],
      filter: '',
      cancelItems: [],
      showLoginScreen: false,
      loggedIn: false,
    };
    try {
      // Set the configuration for your app
      const firebaseConfig = {
        apiKey: "AIzaSyBrsN6ji2QRHqKTB8BmnrSPVd3uhsn0LU4",
        authDomain: "dictapp-1574864890341.firebaseapp.com",
        //databaseURL: "https://dictapp-1574864890341.firebaseio.com",
        //projectId: "dictapp-1574864890341",
        storageBucket: "dictapp-1574864890341.appspot.com",
        //messagingSenderId: "556760584897",
        //appId: "1:556760584897:web:85e86b8c202bbc3c6ffa40"
      };
      firebase.initializeApp(firebaseConfig);

      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.setState({ loggedIn: true });
        } else {
          this.setState({ loggedIn: false });
        }
      });
    } catch (e) {
      console.warn("Firebase init failed: ", e);
    }
  }

  handleScrollEvent(e) {
    const currentOffset = e.nativeEvent.contentOffset.y;
    const delta = currentOffset - this._offset;
    if ((delta > 0) && !this._scrollingDown && currentOffset > 0) {
      this._button.current.fadeOut();
      this._scrollingDown = true;
    } else if (delta < 0 && this._scrollingDown) {
      this._button.current.fadeIn();
      this._scrollingDown = false;
    }
    this._offset = currentOffset;
  }

  handleAddWordEvent() {
    this.props.navigation.navigate("WordEdit", {
      action: "Ajouter un mot",
      edit: false,
      update: this.handleNewWord,
    });
  }

  handleNewWord(key, wordData) {
    this.data[key] = wordData;
    const section = getSection(wordData);
    const data = this.state.data.slice(0);
    const index = data.findIndex(({ title }) => title === section);
    const { word, order } = wordData;
    const compareStr = order || word;

    if (index > -1) {
      const list = data[index].data;
      var insertIndex = list.findIndex(({ order: _order }) => {
        return compareStr.localeCompare(_order) <= 0;
      });
      if (insertIndex < 0) {
        insertIndex = list.length - 1;
      }
      list.splice(insertIndex, 0, { key, word, order });
    } else {
      const insertIndex = data.findIndex(({ title }) => {
        return section.localeCompare(title) <= 0;
      });
      const elem = {
        title: section,
        data: [{ key, word, order }],
      };
      if (insertIndex < 0) {
        data.push(elem);
      } else {
        data.splice(insertIndex, 0, elem);
      }
    }
    this.setState({ data });
  }

  handleEditWordEvent(key) {
    this.props.navigation.navigate('WordEdit', {
      action: "Modifier",
      key,
      edit: true,
      update: this.handleEditWord(key),
    });
  }

  handleEditWord(oldKey) {
    return (newKey, data) => {
      this.handleDeleteWord(oldKey, this.data[oldKey]);
      if (this.data[newKey]) {
        this.handleDeleteWord(newKey, this.data[newKey]);
      }
      this.handleNewWord(newKey, data);
    };
  }

  handleDeleteWord(key, data) {
    const sections = this.state.data.slice(0);

    // Remove old word
    const section = getSection(data);
    const sectionIndex = sections.findIndex(({ title }) =>
      title == section);
    if (sectionIndex < 0) return;
    const list = sections[sectionIndex].data;
    const rmIndex = list.findIndex(({ key: _key }) => _key === key);
    list.splice(rmIndex, 1);
    delete this.data[key];
    if (list.length == 0) {
      sections.splice(sectionIndex, 1);
    }
    this.setState({ data: sections });
  }

  handleDeleteWordEvent(word) {
    const data = this.data[word];
    this.handleDeleteWord(word, data);

    const {cancelItems} = this.state;

    const that = this;
    const clearCancelItem = () => {
      delete cancelItems[word];
      that.setState({ cancelItems });
    };

    const performRemoval = setTimeout(() => {
      const image = data.image;
      if (image) {
        FileSystem.deleteAsync(image);
      }
      AsyncStorage.removeItem(word);
      clearCancelItem();
    }, 2000);

    const cancelRemoval = () => {
      clearTimeout(performRemoval);
      clearCancelItem();
      that.handleNewWord(word, data);
    };

    cancelItems[word] = (
      <BottomPanel
        key={word}
        onPress={cancelRemoval}
        >'{data.word}' a été supprimé.</BottomPanel>);
    this.setState({ cancelItems });
  }

  handleFilterChange(text) {
    this.setState({ filter: text });
  }

  handleSidePanel() {
    this.setState({ sidePanel: true });
  }

  loadWords() {
    const that = this;
    AsyncStorage.getAllKeys().then(keys => {
      const filteredKeys = keys.filter(k => k.startsWith('w:'));
      that.words = filteredKeys.slice(0);
      that.data = {};
      AsyncStorage.multiGet(filteredKeys).then(result => {
        result.forEach(([k, v]) => {
          try {
            const parsed = JSON.parse(v);
            if (!parsed.word) return;
            that.data[k] = parsed;
          } catch (e) {
            console.warn("JSON error: ", e, ", at: ", k);
          }
        });
        that.updateDisplay();
      });
    });
  }

  updateDisplay() {
    const data = {};
    const append = (obj, at) => {
      if (!(at in data)) {
        data[at] = []
      }
      data[at].push(obj);
    };
    this.words.forEach(key => {
      const { word, order } = this.data[key];
      if (word.startsWith(this.state.filter)) {
        const wordData = {
          key,
          word,
          order,
        };
        const section = getSection(this.data[key]);
        append({ key, word, order: (order || word) }, section);
      }
    });
    
    const listData = Object.keys(data).map(k => {
      return {
        title: k,
        data: data[k].sort((a, b) => a.order.localeCompare(b.order, 'fr')),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    this.setState({ data: listData });
  }

  handleRemoveAll() {
    new Promise((res, rej) => {
      Alert.alert(
      'ATTENTION',
      'Voulez vous vraiment supprimer tous les mots?\nCette opération n\'est pas réversible!',
      [
        {
          text: 'Oui', onPress: res,
        },
        {
          text: 'Non', onPress: rej,
        },
      ], { cancelable: false });
    })
    .then(() => {
      this.words = [];
      this.data = {};
      this.setState({ data: [], filter: '' });
      return AsyncStorage.getAllKeys().then(allKeys => {
        const keys = allKeys.filter(k => k.startsWith('w:'));
        AsyncStorage.multiRemove(keys);
      });
    })
    .then(() => {
      Object.values(this.data).forEach((data) => {
        if (data.image) {
          FileSystem.deleteAsync(data.image);
        }
      })
      this.updateDisplay();
    });
  }

  handleImport() {
    //*
    if (firebase.auth().currentUser) {
      loadWordsFromFirebase()
        .then(this.loadWords)
        .catch((e) => {
          if (e.code === 'storage/object-not-found') {
            Alert.alert(
              'Rien à importer',
              'Aucun mot à importer',
              [{ text: 'Ok'}]);
          } else {
            console.error("ERROR: ", e);
          }
        })
    } else {
      this.setState({ showLoginScreen: true });
    }
  }

  handleExport() {
    if (firebase.auth().currentUser) {
      storeWordsToFirebase().catch((e) => {
      Alert.alert(
        'Une erreur est survenue',
        e,
        [
          {
            text: 'ok',
          },
        ], { cancelable: false });
      });
    } else {
      this.setState({ showLoginScreen: true });
    }
  }

  componentDidMount() {
    this.loadWords();
    this.updateDisplay();
  }

  render() {
    const { filter, data } = this.state;
    var sections = data;
    if (filter.length > 0) {
      const parsed = filter.trim().toLocaleLowerCase();
      const sectionLetter = parsed.charAt(0).toLocaleUpperCase();
      var section = data.find(s => s.title === sectionLetter);
      if (section && section.data.length > 0) {
        section = Object.assign({}, section);
        section.data = section.data.filter(({ order }) => order.startsWith(parsed));
        sections = [section];
      } else {
        sections = [{ title: sectionLetter, data: [] }];
      }
    }
    const { loggedIn } = this.state;
    return (
      <SafeAreaView style={styles.container}>
        <SectionList
          sections={sections}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <SidePanel
              onChange={this.handleFilterChange}
              onSidePanelShow={this.handleSidePanel}
              onImport={this.handleImport}
              onExport={this.handleExport}
              onRemoveAll={this.handleRemoveAll.bind(this)}
              onLogout={() => firebase.auth().signOut()}
            />}
          keyExtractor={(item, index) => item.key + index}
          renderItem={({ item: { word, key } }) => {
            const title = word.replace(/^(\S{1})/, l => l.toLocaleUpperCase());
            return (<ListItem
              title={title}
              onPress={() => {
                  this.props.navigation
                    .navigate('WordDetail', {
                      key,
                      title,
                      data: this.data[key],
                      update: this.handleEditWord(key),
                      delete: this.handleDeleteWordEvent});
                }}
              onSwipeLeft={() => this.handleDeleteWordEvent(key)}
              onSwipeRight={() => this.handleEditWordEvent(key)} />);
          }}
          renderSectionHeader={({ section: { title } }) => <Header title={title} />}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          onScroll={this.handleScrollEvent}
        />
        <AddButton
          ref={this._button}
          onPress={this.handleAddWordEvent}
        />
        <View style={styles.bottomPanel}>
          {Object.values(this.state.cancelItems)}
        </View>
        { this.state.showLoginScreen &&
          <LoginDialog
            onLogIn={() => {
              this.setState({ showLoginScreen: false }, this.handleImport);
            }}
            onCancel={() => {
              this.setState({ showLoginScreen: false });
            }}
          />
        }
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
  itemSeparator: {
    borderColor: '#5bc0de',
    borderStyle: 'solid',
    borderBottomWidth: 1
  },
  header: {
    fontSize: 16,
    color: 'white',
  },
  headerContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    backgroundColor: '#5bc0de',
  },
});
