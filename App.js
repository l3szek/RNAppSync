/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { Platform, StyleSheet, Text, View, TextInput, Button, ScrollView} from 'react-native';

// imports from Amplify library
import { API, graphqlOperation, Auth } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react-native'

// import the query
import { listRestaurants } from './src/graphql/queries'
// import the mutation
import { createRestaurant } from './src/graphql/mutations'
// import the subscription
import { onCreateRestaurant } from './src/graphql/subscriptions'

import uuid from 'uuid/v4'
const CLIENTID = uuid()

// define some state to hold the data returned from the API
// 

class App extends Component {
  state = {
    name: '', description: '', city: '', restaurants: []
  }

  subscription = {}

  signOut = async () => {
    await Auth.signOut()
    this.props.onStateChange('signedOut', null);
  }

  async componentDidMount() {

    const user = await Auth.currentAuthenticatedUser()
    console.log('user:', user)
    console.log('username:', user.username)

    this.subscription = API.graphql(
      graphqlOperation(onCreateRestaurant)
    ).subscribe({
        next: eventData => {
          console.log('eventData', eventData)
          const restaurant = eventData.value.data.onCreateRestaurant
          if(CLIENTID === restaurant.clientId) return
          const restaurants = [...this.state.restaurants, restaurant]
          this.setState({ restaurants })
        }
    });

    try {
      const restaurantData = await API.graphql(graphqlOperation(listRestaurants))
      console.log('restaurantData:', restaurantData)
      this.setState({
        restaurants: restaurantData.data.listRestaurants.items
      })
    } catch (err) {
      console.log('error fetching restaurants...', err)
    }
  }
  createRestaurant = async() => {
    const { name, description, city  } = this.state
    const restaurant = {
      name, description, city, clientId: CLIENTID
    }
    
    const updatedRestaurantArray = [...this.state.restaurants, restaurant]
    this.setState({
      restaurants: updatedRestaurantArray,
      name: '', description: '', city: ''
      })
    try {
      await API.graphql(graphqlOperation(createRestaurant, {
        input: restaurant
      }))
      console.log('item created!')
    } catch (err) {
      console.log('error creating restaurant...', err)
    }
  }

  // remove the subscription in componentWillUnmount
componentWillUnmount() {
  this.subscription.unsubscribe()
}
  
  // change state then user types into input
  onChange = (key, value) => {
    this.setState({ [key]: value })
  }

  render() {
    return (
      <View>
        <TextInput
          onChangeText={v => this.onChange('name', v)}
          value={this.state.name}
          style={{ height: 50, margin: 5, marginTop:100, backgroundColor: "#ddd" }}
        />
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => this.onChange('description', v)}
          value={this.state.description}
        />
        <TextInput
          style={{ height: 50, margin: 5, backgroundColor: "#ddd" }}
          onChangeText={v => this.onChange('city', v)}
          value={this.state.city}
        />
        <Button onPress={this.createRestaurant} title='Create Restaurant' />
        <Button onPress={this.signOut} title='Sign out' />
      <ScrollView>
        {
          this.state.restaurants.map((restaurant, index) => (
            <View key={index}>
              <Text>{restaurant.name}</Text>
              <Text>{restaurant.description}</Text>
              <Text>{restaurant.city}</Text>
            </View>
          ))
          }
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default withAuthenticator(App, {
  // theming - here you can add custom styles etc
  //includeGreetings - if false, the top user greetings text will not be present
  includeGreetings: true
})