const types = [
  'adj.',    // 1
  'adv.',    // 2
  'conj.',   // 4
  'n.f.',    // 8
  'n.m',     // 16
  'prep.',   // 32
  'pron.',   // 64
  'v.',      // 128
  'pluriel', // 256
];

import latinize from 'latinize';
import words from './assets/words'
import { AsyncStorage } from 'react-native';

import * as firebase from 'firebase';

function typeToString(type) {
  const result = [];
  for (i = 0; i < types.length; ++i) {
    if ((1 << i) & type) {
      result.push(types[i]);
    }
  }
  return result.join(', ');
}

function stringToType(str) {
  const tokens = str.split(', ');
  const result = 0;
  for (i = 0; i < tokens.length; ++i) {
    const idx = types.indexOf(tokens[i]);
    if (idx > -1) {
        result |= (1 << idx);
    }
  }
  return result;
}

function parseForSort(str) {
  if (!str) return '';
  const [part1, ...part2] = str.toLocaleLowerCase().trim().split(/\s|-|'/);
  var key = part1 + part2.join('');
  if (part1.length < 3 && part2.length > 0) {
    key = part2.join('');
  }
  return key;
}

function loadWordsFromJSON() {
  return AsyncStorage.multiSet(words.map(row => {
    const [ word, wordData ] = row;
    const data = {
      word,
      order: parseForSort(word),
      type: wordData.type,
    }
    if (wordData.description.length > 0) {
      data.description = wordData.description;
    }
    return [
      'w:' + latinize(word).replace(/\W|\'/gi, ''),
      JSON.stringify(data)]
  }));
}

function loadWordsFromFirebase() {
  return new Promise((res, rej) => {
    try {
      // Get a reference to the database service
      var storage = firebase.storage();
      const storageRef = storage.ref();
      const uid = firebase.auth().currentUser.uid;
      const wordsRef = storageRef.child(uid + '_words.json');
      wordsRef.getDownloadURL()
      .then((url) => {
        // This can be downloaded directly:
        var xhr = new XMLHttpRequest();
        const promise = new Promise((resolve) => {
          xhr.onload = (ev) => {
            resolve(xhr.response);
          }
        })
        xhr.responseType = 'text';
        xhr.open('GET', url);
        xhr.send();
        return promise;
      })
      .catch(rej)
      .then((data) => {
        const words = JSON.parse(data);
        return AsyncStorage.multiSet(words.map(row => {
          const [ key, _wordData ] = row;
          const wordData = JSON.parse(_wordData);
          const { word, type } = wordData;
          const data = {
            word,
            type,
            order: wordData.order,
            image: wordData.image,
            description: wordData.description,
          }
          return [
            'w:' + key,
            JSON.stringify(data)];
        }));
      })
      .then(res)
      .catch(rej);
    } catch (e) {
      rej(e);
    }
  });
}

function storeWordsToFirebase() {
  var storage = firebase.storage();
  const storageRef = storage.ref();

  const uid = firebase.auth().currentUser.uid;
  const wordsRef = storageRef.child(uid + '_words.json');

  const data = [];
  const that = this;
  return AsyncStorage.getAllKeys().then(keys => {
    const filteredKeys = keys.filter(k => k.startsWith('w:'));
    return AsyncStorage.multiGet(filteredKeys).then(result => {
      result.forEach(([k, v]) => {
        data.push([k.substring(2), v]);
      });
    });
  }).then(() => {
    const blob = new Blob([JSON.stringify(data)], {type : 'application/json'});
    return wordsRef.put(blob);
  });
}

export {
  loadWordsFromJSON,
  loadWordsFromFirebase,
  parseForSort,
  typeToString,
  storeWordsToFirebase,
  stringToType
};