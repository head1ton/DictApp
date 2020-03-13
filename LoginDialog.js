import React, { Component } from 'react';

import {
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

import * as firebase from 'firebase';

const PWD = '##########';

export default class LoginDialog extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: '',
		};
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit() {
		const { email } = this.state;
		const auth = firebase.auth();
		new Promise((res, rej) => {
			auth.signInWithEmailAndPassword(email, PWD)
			.then(res)
			.catch(function(error) {
			  // Handle Errors here.
			  var errorCode = error.code;
			  // In case user does not exists yet, create it.
			  if (errorCode === 'auth/user-not-found') {
			  	auth.createUserWithEmailAndPassword(email, PWD)
			  	.then(() => {
					res();
			  	})
			  	.catch(function(error) {
				  rej(error);
				});
			  } else {
			  	rej(error);
			  }
			});
		}).then(() => {
			this.props.onLogIn();
		}).catch((error) => {
			Alert.alert(
		      'Une erreur est survenue.',
		      error.message,
		      [
		        { text: 'Ok' },
	      	]);
		});
	}

	render() {
		return (
			<TouchableWithoutFeedback onPress={this.props.onCancel}>
				<View style={styles.container}>
					<View style={styles.subcontainer}>
						<TextInput
							autoFocus={true}
							style={styles.textInput}
							placeholder="Email"
							autoCompleteType="email"
							keyboardType="email-address"
							textContentType="emailAddress"
							returnKeyType="done"
							onChangeText={(txt) => this.setState({ email: txt })}
							onSubmitEditing={this.handleSubmit}
							value={this.state.email} />
						<TouchableOpacity onPress={this.handleSubmit}>
							<View style={styles.button}>
								<Text style={styles.buttonText}>OK</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
			</TouchableWithoutFeedback>);
	}
}

const styles = {
	container: {
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
	},
	subcontainer: {
		backgroundColor: 'white',
		flexDirection: 'row',
		borderColor: '#428bca',
		borderWidth: 1,
		width: '90%',
		padding: 0,
	},
	textInput: {
		flex: 1,
		fontSize: 24,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#F0F0F0',
		margin: 10,
	},
	button: {
		backgroundColor: '#428bca',
		padding: 11,
	},
	buttonText: {
		color: 'white',
		fontSize: 24,
	},
};